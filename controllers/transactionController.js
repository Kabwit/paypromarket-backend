const { Paiement, Commande, Notification } = require('../models');
const crypto = require('crypto');
const mobileMoneyService = require('../services/mobileMoneyService');

// =============================================
// INITIER UN PAIEMENT MOBILE MONEY (client)
// =============================================
exports.initierPaiement = async (req, res) => {
  try {
    const { commande_id, mode_paiement, operateur, numero_telephone } = req.body;

    // Vérifier la commande
    const commande = await Commande.findOne({
      where: { id: commande_id, client_id: req.user.id }
    });

    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (commande.statut === 'annulee') {
      return res.status(400).json({ error: 'Cette commande a été annulée' });
    }

    // Vérifier qu'il n'y a pas déjà un paiement confirmé (anti double-paiement)
    const paiementExistant = await Paiement.findOne({
      where: { commande_id, statut: 'confirmé' }
    });

    if (paiementExistant) {
      return res.status(400).json({ error: 'Cette commande est déjà payée' });
    }

    // Valider le mobile money
    if (mode_paiement === 'mobile_money') {
      if (!operateur || !numero_telephone) {
        return res.status(400).json({ error: 'Opérateur et numéro de téléphone requis pour Mobile Money' });
      }
    }

    // Générer une référence unique
    const reference_transaction = `PAY-${Date.now()}-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;

    const paiement = await Paiement.create({
      commande_id,
      montant: commande.montant_total,
      devise: commande.devise,
      mode_paiement,
      operateur: mode_paiement === 'mobile_money' ? operateur : null,
      numero_telephone: mode_paiement === 'mobile_money' ? numero_telephone : null,
      reference_transaction,
      statut: 'en_attente'
    });

    // Intégration Mobile Money réelle
    let paymentResponse = {};
    if (mode_paiement === 'mobile_money') {
      try {
        paymentResponse = await mobileMoneyService.initiatePayment({
          operateur,
          numero_telephone,
          montant: commande.montant_total,
          reference_transaction,
          devise: commande.devise
        });
      } catch (mmError) {
        // Si erreur Mobile Money, on retourne quand même un message utile
        paymentResponse = {
          success: false,
          error: mmError.message,
          message: `Erreur lors de l'initiation du paiement: ${mmError.message}`
        };
      }
    }

    res.status(201).json({
      message: 'Paiement initié',
      paiement,
      instructions: mode_paiement === 'mobile_money'
        ? paymentResponse.message || `Un push USSD sera envoyé au ${numero_telephone} via ${operateur}.`
        : 'Vous paierez à la livraison. Le livreur viendra avec le terminal de paiement.',
      mobileMoneyDetails: paymentResponse
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// GET PAYMENT OPERATORS (liste des opérateurs)
// =============================================
exports.getOperators = async (req, res) => {
  try {
    const operators = mobileMoneyService.listOperators();
    res.json({
      success: true,
      operators,
      message: 'Opérateurs Mobile Money disponibles'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// GET OPERATOR INFO (infos spécifiques)
// =============================================
exports.getOperatorInfo = async (req, res) => {
  try {
    const { operateur } = req.params;
    const operatorInfo = mobileMoneyService.getOperatorInfo(operateur);
    res.json({
      success: true,
      operator: operatorInfo
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// =============================================
// VERIFY PAYMENT STATUS
// =============================================
exports.verifyPaymentStatus = async (req, res) => {
  try {
    const { reference_transaction } = req.params;

    const paiement = await Paiement.findOne({
      where: { reference_transaction }
    });

    if (!paiement) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    // Vérifier le statut auprès du service Mobile Money
    let verificationResult = { status: paiement.statut };
    if (paiement.mode_paiement === 'mobile_money' && paiement.operateur) {
      try {
        verificationResult = await mobileMoneyService.verifyPaymentStatus(
          reference_transaction,
          paiement.operateur
        );
      } catch (mmError) {
        console.error('Error verifying status:', mmError);
      }
    }

    res.json({
      success: true,
      paiement,
      verification: verificationResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// CONFIRMER UN PAIEMENT (webhook / admin / simulation)
// =============================================
exports.confirmerPaiement = async (req, res) => {
  try {
    const { reference_transaction } = req.params;

    const paiement = await Paiement.findOne({
      where: { reference_transaction }
    });

    if (!paiement) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    if (paiement.statut === 'confirmé') {
      return res.status(400).json({ error: 'Ce paiement est déjà confirmé' });
    }

    await paiement.update({
      statut: 'confirmé',
      date_confirmation: new Date()
    });

    // Mettre à jour le statut de la commande
    const commande = await Commande.findByPk(paiement.commande_id);
    if (commande && commande.statut === 'en_attente') {
      await commande.update({ statut: 'confirmee' });
    }

    // Notifications (seulement si la commande existe)
    if (commande) {
      await Notification.create({
        destinataire_type: 'vendeur',
        destinataire_id: commande.vendeur_id,
        titre: 'Paiement reçu',
        message: `Paiement de ${paiement.montant} ${paiement.devise} reçu pour la commande ${commande.numero_commande}.`,
        type: 'paiement_reçu',
        donnees: { commande_id: commande.id, paiement_id: paiement.id }
      });

      await Notification.create({
        destinataire_type: 'client',
        destinataire_id: commande.client_id,
        titre: 'Paiement confirmé',
        message: `Votre paiement de ${paiement.montant} ${paiement.devise} a été confirmé.`,
        type: 'paiement_reçu',
        donnees: { commande_id: commande.id, paiement_id: paiement.id }
      });
    }

    res.status(200).json({
      message: 'Paiement confirmé',
      paiement
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// ÉCHEC DE PAIEMENT (webhook / simulation)
// =============================================
exports.echecPaiement = async (req, res) => {
  try {
    const { reference_transaction } = req.params;

    const paiement = await Paiement.findOne({
      where: { reference_transaction }
    });

    if (!paiement) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    await paiement.update({ statut: 'échoué' });

    // Notification client (seulement si la commande existe)
    const commande = await Commande.findByPk(paiement.commande_id);
    if (commande) {
      await Notification.create({
        destinataire_type: 'client',
        destinataire_id: commande.client_id,
        titre: 'Paiement échoué',
        message: `Votre paiement pour la commande ${commande.numero_commande} a échoué. Veuillez réessayer.`,
        type: 'paiement_échoué',
        donnees: { commande_id: commande.id, paiement_id: paiement.id }
      });
    }

    res.status(200).json({
      message: 'Paiement marqué comme échoué',
      paiement
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// OBTENIR LE PAIEMENT D'UNE COMMANDE
// =============================================
exports.getPaiementCommande = async (req, res) => {
  try {
    const paiement = await Paiement.findOne({
      where: { commande_id: req.params.commandeId },
      include: [
        { model: Commande, as: 'commande' }
      ]
    });

    if (!paiement) {
      return res.status(404).json({ error: 'Aucun paiement trouvé pour cette commande' });
    }

    res.status(200).json(paiement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// HISTORIQUE PAIEMENTS VENDEUR
// =============================================
exports.getHistoriquePaiements = async (req, res) => {
  try {
    const { page = 1, limit = 20, statut } = req.query;
    const offset = (page - 1) * limit;

    const whereCommande = { vendeur_id: req.user.id };
    const wherePaiement = {};
    if (statut) wherePaiement.statut = statut;

    const { rows: paiements, count: total } = await Paiement.findAndCountAll({
      where: wherePaiement,
      include: [{
        model: Commande,
        as: 'commande',
        where: whereCommande,
        attributes: ['id', 'numero_commande', 'montant_total', 'devise', 'statut']
      }],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      paiements,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};