const { Client, Commande, Vendeur, LigneCommande, Produit, Paiement } = require('../models');
const bcrypt = require('bcryptjs');

// =============================================
// OBTENIR MON PROFIL (client connecté)
// =============================================
exports.getMonProfil = async (req, res) => {
  try {
    const client = await Client.findByPk(req.user.id, {
      attributes: { exclude: ['mot_de_passe'] }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    res.status(200).json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// METTRE À JOUR MON PROFIL
// =============================================
exports.updateProfil = async (req, res) => {
  try {
    const client = await Client.findByPk(req.user.id);
    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    const champsAutorisés = ['nom', 'prenom', 'ville', 'adresse', 'email'];
    const updates = {};
    champsAutorisés.forEach(champ => {
      if (req.body[champ] !== undefined) {
        updates[champ] = req.body[champ];
      }
    });

    await client.update(updates);

    const clientResponse = client.toJSON();
    delete clientResponse.mot_de_passe;

    res.status(200).json({
      message: 'Profil mis à jour',
      client: clientResponse
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// CHANGER MON MOT DE PASSE
// =============================================
exports.changerMotDePasse = async (req, res) => {
  try {
    const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;

    const client = await Client.findByPk(req.user.id);
    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    // Vérifier l'ancien mot de passe
    const passwordValide = await bcrypt.compare(ancien_mot_de_passe, client.mot_de_passe);
    if (!passwordValide) {
      return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, salt);
    await client.update({ mot_de_passe: hashedPassword });

    res.status(200).json({ message: 'Mot de passe mis à jour' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// HISTORIQUE DES ACHATS
// =============================================
exports.getHistoriqueAchats = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { rows: commandes, count: total } = await Commande.findAndCountAll({
      where: { client_id: req.user.id },
      include: [
        {
          model: LigneCommande,
          as: 'lignes',
          include: [{ model: Produit, as: 'produit', attributes: ['id', 'nom', 'photos', 'slug'] }]
        },
        { model: Vendeur, as: 'vendeur', attributes: ['id', 'nom_boutique', 'slug', 'telephone'] },
        { model: Paiement, as: 'paiement', attributes: ['id', 'statut', 'mode_paiement', 'reference_transaction'] }
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
// FACTURE D'UNE COMMANDE
// =============================================
exports.getFacture = async (req, res) => {
  try {
    const commande = await Commande.findOne({
      where: { id: req.params.commandeId, client_id: req.user.id },
      include: [
        {
          model: LigneCommande,
          as: 'lignes',
          include: [{ model: Produit, as: 'produit', attributes: ['id', 'nom', 'prix_cdf', 'prix_usd'] }]
        },
        { model: Vendeur, as: 'vendeur', attributes: ['id', 'nom_boutique', 'telephone', 'ville', 'adresse'] },
        { model: Client, as: 'client', attributes: { exclude: ['mot_de_passe'] } },
        { model: Paiement, as: 'paiement' }
      ]
    });

    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    res.status(200).json({
      facture: {
        numero: commande.numero_commande,
        date: commande.createdAt,
        client: commande.client,
        vendeur: commande.vendeur,
        lignes: commande.lignes,
        montant_total: commande.montant_total,
        devise: commande.devise,
        paiement: commande.paiement,
        statut: commande.statut
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
