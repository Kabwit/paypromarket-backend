const { Commande, LigneCommande, Produit, Vendeur, Client, Paiement, Livraison, Notification, HistoriqueStatut } = require('../models');
const crypto = require('crypto');
const sequelize = require('../config/db');
const { sendPushToUser } = require('../utils/pushNotification');
const { applyUTMToOrder } = require('../middleware/socialTracking');

// =============================================
// CRÉER UNE COMMANDE (client connecté)
// =============================================
exports.createCommande = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      vendeur_id, items, devise, mode_livraison,
      adresse_livraison, telephone_livraison, notes
    } = req.body;

    // items = [{ produit_id, quantite }]
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'La commande doit contenir au moins un produit' });
    }

    // Vérifier que le vendeur existe
    const vendeur = await Vendeur.findByPk(vendeur_id);
    if (!vendeur) {
      return res.status(404).json({ error: 'Vendeur non trouvé' });
    }

    // Générer numéro de commande unique
    const numero_commande = `CMD-${Date.now()}-${crypto.randomUUID().substring(0, 6).toUpperCase()}`;

    // Calculer le montant total et vérifier les stocks
    let montant_total = 0;
    const lignesData = [];

    for (const item of items) {
      const produit = await Produit.findOne({
        where: { id: item.produit_id, vendeur_id, disponible: true }
      });

      if (!produit) {
        await transaction.rollback();
        return res.status(400).json({ error: `Produit ID ${item.produit_id} non disponible` });
      }

      if (produit.stock < item.quantite) {
        await transaction.rollback();
        return res.status(400).json({
          error: `Stock insuffisant pour "${produit.nom}". Disponible: ${produit.stock}`
        });
      }

      const prix = devise === 'USD' && produit.prix_usd ? produit.prix_usd : produit.prix_cdf;
      let prixFinal = prix;

      // Appliquer la promotion
      if (produit.promotion && produit.pourcentage_promotion > 0) {
        prixFinal = prix * (1 - produit.pourcentage_promotion / 100);
      }

      const sous_total = prixFinal * item.quantite;
      montant_total += sous_total;

      lignesData.push({
        produit_id: produit.id,
        quantite: item.quantite,
        prix_unitaire: prixFinal,
        devise: devise || 'CDF',
        sous_total
      });

      // Décrémenter le stock
      await produit.update(
        { stock: produit.stock - item.quantite },
        { transaction }
      );

      // Notification rupture de stock
      const nouveauStock = produit.stock - item.quantite;
      if (nouveauStock <= 0) {
        await Notification.create({
          destinataire_type: 'vendeur',
          destinataire_id: vendeur_id,
          titre: 'Rupture de stock',
          message: `Le produit "${produit.nom}" est en rupture de stock.`,
          type: 'rupture_stock',
          donnees: { produit_id: produit.id }
        }, { transaction });
      } else if (nouveauStock <= (produit.stock_minimum || 5)) {
        await Notification.create({
          destinataire_type: 'vendeur',
          destinataire_id: vendeur_id,
          titre: 'Stock bas',
          message: `Le produit "${produit.nom}" a un stock bas (${nouveauStock} restant${nouveauStock > 1 ? 's' : ''}).`,
          type: 'rupture_stock',
          donnees: { produit_id: produit.id, stock_restant: nouveauStock }
        }, { transaction });
      }
    }

    // Créer la commande avec UTM tracking
    const commandeData = {
      numero_commande,
      client_id: req.user.id,
      vendeur_id,
      montant_total,
      devise: devise || 'CDF',
      statut: 'en_attente',
      mode_livraison: mode_livraison || 'retrait_boutique',
      adresse_livraison,
      telephone_livraison,
      notes
    };

    // Appliquer les paramètres UTM/Tracking depuis le middleware socialTracking
    const commandeWithTracking = applyUTMToOrder(commandeData, req.utmData);

    const commande = await Commande.create(commandeWithTracking, { transaction });

    // Créer les lignes de commande
    for (const ligne of lignesData) {
      await LigneCommande.create({
        commande_id: commande.id,
        ...ligne
      }, { transaction });
    }

    // Créer la livraison
    await Livraison.create({
      commande_id: commande.id,
      statut: 'en_attente',
      mode: mode_livraison || 'retrait_boutique',
      adresse: adresse_livraison,
      ville: vendeur.ville
    }, { transaction });

    // Notification au vendeur
    await Notification.create({
      destinataire_type: 'vendeur',
      destinataire_id: vendeur_id,
      titre: 'Nouvelle commande',
      message: `Nouvelle commande ${numero_commande} reçue.`,
      type: 'nouvelle_commande',
      donnees: { commande_id: commande.id }
    }, { transaction });

    await transaction.commit();

    // Recharger avec les associations
    const commandeComplete = await Commande.findByPk(commande.id, {
      include: [
        { model: LigneCommande, as: 'lignes', include: [{ model: Produit, as: 'produit' }] },
        { model: Vendeur, as: 'vendeur', attributes: ['id', 'nom_boutique', 'telephone'] }
      ]
    });

    res.status(201).json({
      message: 'Commande créée avec succès',
      commande: commandeComplete
    });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// OBTENIR MES COMMANDES (client connecté)
// =============================================
exports.getMesCommandes = async (req, res) => {
  try {
    const { page = 1, limit = 20, statut } = req.query;
    const where = { client_id: req.user.id };
    if (statut) where.statut = statut;

    const offset = (page - 1) * limit;

    const { rows: commandes, count: total } = await Commande.findAndCountAll({
      where,
      include: [
        { model: LigneCommande, as: 'lignes', include: [{ model: Produit, as: 'produit', attributes: ['id', 'nom', 'photos'] }] },
        { model: Vendeur, as: 'vendeur', attributes: ['id', 'nom_boutique', 'slug', 'telephone'] },
        { model: Paiement, as: 'paiement' },
        { model: Livraison, as: 'livraison' }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      commandes,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// OBTENIR LES COMMANDES DU VENDEUR
// =============================================
exports.getCommandesVendeur = async (req, res) => {
  try {
    const { page = 1, limit = 20, statut } = req.query;
    const where = { vendeur_id: req.user.id };
    if (statut) where.statut = statut;

    const offset = (page - 1) * limit;

    const { rows: commandes, count: total } = await Commande.findAndCountAll({
      where,
      include: [
        { model: LigneCommande, as: 'lignes', include: [{ model: Produit, as: 'produit', attributes: ['id', 'nom', 'photos'] }] },
        { model: Client, as: 'client', attributes: ['id', 'nom', 'prenom', 'telephone'] },
        { model: Paiement, as: 'paiement' },
        { model: Livraison, as: 'livraison' }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      commandes,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// OBTENIR LE DÉTAIL D'UNE COMMANDE
// =============================================
exports.getCommandeById = async (req, res) => {
  try {
    const commande = await Commande.findByPk(req.params.id, {
      include: [
        { model: LigneCommande, as: 'lignes', include: [{ model: Produit, as: 'produit' }] },
        { model: Client, as: 'client', attributes: { exclude: ['mot_de_passe'] } },
        { model: Vendeur, as: 'vendeur', attributes: { exclude: ['mot_de_passe'] } },
        { model: Paiement, as: 'paiement' },
        { model: Livraison, as: 'livraison' }
      ]
    });

    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    // Vérifier que l'utilisateur a accès à cette commande
    if (req.user.role === 'client' && commande.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    if (req.user.role === 'vendeur' && commande.vendeur_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    res.status(200).json(commande);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// METTRE À JOUR LE STATUT DE COMMANDE (vendeur)
// =============================================
exports.updateStatutCommande = async (req, res) => {
  try {
    const { statut } = req.body;
    const commande = await Commande.findOne({
      where: { id: req.params.id, vendeur_id: req.user.id }
    });

    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    // Valider la transition de statut
    const transitionsValides = {
      'en_attente': ['confirmee', 'annulee'],
      'confirmee': ['preparation', 'annulee'],
      'preparation': ['en_cours', 'annulee'],
      'en_cours': ['livree'],
      'livree': [],
      'annulee': []
    };

    if (!transitionsValides[commande.statut]?.includes(statut)) {
      return res.status(400).json({
        error: `Transition de "${commande.statut}" vers "${statut}" non autorisée`
      });
    }

    const ancienStatut = commande.statut;
    await commande.update({ statut });

    // Enregistrer l'historique du changement de statut
    await HistoriqueStatut.create({
      commande_id: commande.id,
      ancien_statut: ancienStatut,
      nouveau_statut: statut,
      modifie_par_type: 'vendeur',
      modifie_par_id: req.user.id
    });

    // Mettre à jour le statut de livraison selon la commande
    const mapLivraison = {
      'confirmee': 'en_attente',
      'preparation': 'preparation',
      'en_cours': 'en_cours',
      'livree': 'livree',
      'annulee': 'echec'
    };

    if (mapLivraison[statut]) {
      const livraison = await Livraison.findOne({ where: { commande_id: commande.id } });
      if (livraison) {
        const updateData = { statut: mapLivraison[statut] };
        if (statut === 'en_cours') updateData.date_expedition = new Date();
        if (statut === 'livrée') updateData.date_livraison = new Date();
        await livraison.update(updateData);
      }
    }

    // Si annulée, rétablir le stock
    if (statut === 'annulee') {
      const lignes = await LigneCommande.findAll({ where: { commande_id: commande.id } });
      for (const ligne of lignes) {
        await Produit.increment('stock', { by: ligne.quantite, where: { id: ligne.produit_id } });
      }
    }

    // Notification au client
    const typeNotif = statut === 'annulee' ? 'commande_annulee' :
                      statut === 'en_cours' ? 'commande_expediee' :
                      statut === 'livree' ? 'commande_livree' : 'commande_confirmee';

    await Notification.create({
      destinataire_type: 'client',
      destinataire_id: commande.client_id,
      titre: `Commande ${statut}`,
      message: `Votre commande ${commande.numero_commande} est maintenant "${statut}".`,
      type: typeNotif,
      donnees: { commande_id: commande.id }
    });

    // Push notification au client
    sendPushToUser(Client, commande.client_id,
      `Commande ${statut}`,
      `Votre commande ${commande.numero_commande} est maintenant "${statut}".`,
      { commande_id: String(commande.id), type: typeNotif }
    );

    res.status(200).json({
      message: `Statut mis à jour: ${statut}`,
      commande
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// ANNULER UNE COMMANDE (client)
// =============================================
exports.annulerCommande = async (req, res) => {
  try {
    const commande = await Commande.findOne({
      where: { id: req.params.id, client_id: req.user.id }
    });

    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (!['en_attente', 'confirmee'].includes(commande.statut)) {
      return res.status(400).json({ error: 'Cette commande ne peut plus être annulée' });
    }

    const ancienStatut = commande.statut;
    await commande.update({ statut: 'annulee' });

    // Enregistrer l'historique du changement de statut
    await HistoriqueStatut.create({
      commande_id: commande.id,
      ancien_statut: ancienStatut,
      nouveau_statut: 'annulee',
      modifie_par_type: 'client',
      modifie_par_id: req.user.id
    });

    // Rétablir le stock
    const lignes = await LigneCommande.findAll({ where: { commande_id: commande.id } });
    for (const ligne of lignes) {
      await Produit.increment('stock', { by: ligne.quantite, where: { id: ligne.produit_id } });
    }

    // Notification au vendeur
    await Notification.create({
      destinataire_type: 'vendeur',
      destinataire_id: commande.vendeur_id,
      titre: 'Commande annulée',
      message: `La commande ${commande.numero_commande} a été annulée par le client.`,
      type: 'commande_annulée',
      donnees: { commande_id: commande.id }
    });

    // Push notification au vendeur
    sendPushToUser(Vendeur, commande.vendeur_id,
      'Commande annulée',
      `La commande ${commande.numero_commande} a été annulée par le client.`,
      { commande_id: String(commande.id), type: 'commande_annulée' }
    );

    res.status(200).json({ message: 'Commande annulée', commande });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};