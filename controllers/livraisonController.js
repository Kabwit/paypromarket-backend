const { Livraison, Commande, Client, Vendeur, Notification } = require('../models');

// =============================================
// OBTENIR LE SUIVI DE LIVRAISON D'UNE COMMANDE
// =============================================
exports.getSuiviLivraison = async (req, res) => {
  try {
    const livraison = await Livraison.findOne({
      where: { commande_id: req.params.commandeId },
      include: [{
        model: Commande,
        as: 'commande',
        attributes: ['id', 'numero_commande', 'statut', 'mode_livraison']
      }]
    });

    if (!livraison) {
      return res.status(404).json({ error: 'Livraison non trouvée' });
    }

    res.status(200).json(livraison);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// METTRE À JOUR LA LIVRAISON (vendeur)
// =============================================
exports.updateLivraison = async (req, res) => {
  try {
    const livraison = await Livraison.findOne({
      where: { commande_id: req.params.commandeId },
      include: [{
        model: Commande,
        as: 'commande',
        where: { vendeur_id: req.user.id }
      }]
    });

    if (!livraison) {
      return res.status(404).json({ error: 'Livraison non trouvée' });
    }

    const champsAutorisés = [
      'statut', 'livreur_nom', 'livreur_telephone',
      'notes', 'delai_estime_heures', 'zone', 'frais_livraison', 'devise_frais'
    ];

    const updates = {};
    champsAutorisés.forEach(champ => {
      if (req.body[champ] !== undefined) {
        updates[champ] = req.body[champ];
      }
    });

    // Dates automatiques selon le statut
    if (req.body.statut === 'expédiée' || req.body.statut === 'en_cours') {
      updates.date_expedition = new Date();
    }
    if (req.body.statut === 'livrée') {
      updates.date_livraison = new Date();
    }

    await livraison.update(updates);

    // Notification au client
    if (req.body.statut) {
      const commande = livraison.commande;
      const messages = {
        'préparation': 'Votre commande est en cours de préparation.',
        'expédiée': 'Votre commande a été expédiée.',
        'en_cours': 'Votre commande est en cours de livraison.',
        'livrée': 'Votre commande a été livrée avec succès !',
        'échec': 'La livraison de votre commande a rencontré un problème.'
      };

      if (messages[req.body.statut]) {
        await Notification.create({
          destinataire_type: 'client',
          destinataire_id: commande.client_id,
          titre: `Livraison - ${req.body.statut}`,
          message: messages[req.body.statut],
          type: req.body.statut === 'livrée' ? 'commande_livrée' : 'commande_expédiée',
          donnees: { commande_id: commande.id }
        });
      }
    }

    res.status(200).json({
      message: 'Livraison mise à jour',
      livraison
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// LISTER LES LIVRAISONS DU VENDEUR
// =============================================
exports.getLivraisonsVendeur = async (req, res) => {
  try {
    const { statut, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const whereLivraison = {};
    if (statut) whereLivraison.statut = statut;

    const { rows: livraisons, count: total } = await Livraison.findAndCountAll({
      where: whereLivraison,
      include: [{
        model: Commande,
        as: 'commande',
        where: { vendeur_id: req.user.id },
        include: [{
          model: Client,
          as: 'client',
          attributes: ['id', 'nom', 'prenom', 'telephone']
        }]
      }],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      livraisons,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
