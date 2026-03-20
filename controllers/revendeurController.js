const { Revendeur, Commission, Commande, Produit } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const contentGeneratorService = require('../services/contentGeneratorService');

// =============================================
// REVENDEUR: S'INSCRIRE COMME REVENDEUR
// =============================================
exports.inscriptionRevendeur = async (req, res) => {
  try {
    const { nom, email, telephone, ville, bio } = req.body;

    // Vérifier email unique
    const existing = await Revendeur.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    // Générer lien de parrainage unique
    const lien_referal = `ref_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    const revendeur = await Revendeur.create({
      nom,
      email,
      telephone,
      ville: ville || 'Lubumbashi',
      bio,
      lien_referal,
      commission_percent: 5 // Default 5%
    });

    res.status(201).json({
      message: 'Inscription revendeur réussie',
      revendeur,
      referralLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?ref=${lien_referal}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// GET: MON PROFIL REVENDEUR
// =============================================
exports.getMonProfil = async (req, res) => {
  try {
    const revendeur = await Revendeur.findByPk(req.params.revendeurId);

    if (!revendeur) {
      return res.status(404).json({ error: 'Revendeur non trouvé' });
    }

    // Get statistics
    const commissions = await Commission.findAll({
      where: { revendeur_id: revendeur.id, statut: 'confirmee' }
    });

    const commissionsEnAttente = await Commission.findAll({
      where: { revendeur_id: revendeur.id, statut: 'en_attente' }
    });

    res.json({
      success: true,
      revendeur: {
        ...revendeur.toJSON(),
        stats: {
          commissionsConfirmees: commissions.length,
          montantConfirme: commissions.reduce((sum, c) => sum + parseFloat(c.montant_commission || 0), 0),
          commissionsEnAttente: commissionsEnAttente.length,
          montantEnAttente: commissionsEnAttente.reduce((sum, c) => sum + parseFloat(c.montant_commission || 0), 0),
          tauxConversion: revendeur.taux_conversion
        }
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// UPDATE: PROFIL REVENDEUR
// =============================================
exports.updateProfil = async (req, res) => {
  try {
    const { nom, bio, ville, phone_contact } = req.body;

    const revendeur = await Revendeur.findByPk(req.params.revendeurId);
    if (!revendeur) {
      return res.status(404).json({ error: 'Revendeur non trouvé' });
    }

    await revendeur.update({
      nom: nom || revendeur.nom,
      bio: bio || revendeur.bio,
      ville: ville || revendeur.ville,
      telephone: phone_contact || revendeur.telephone
    });

    res.json({
      success: true,
      message: 'Profil mis à jour',
      revendeur
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// GET: COMMISSIONS
// =============================================
exports.getCommissions = async (req, res) => {
  try {
    const { statut, limit = 20, offset = 0 } = req.query;

    const where = { revendeur_id: req.params.revendeurId };
    if (statut) where.statut = statut;

    const { count, rows } = await Commission.findAndCountAll({
      where,
      include: [
        {
          model: Commande,
          attributes: ['id', 'numero_commande', 'montant_total', 'statut'],
          as: 'commande'
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      commissions: rows,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// GET: STATISTIQUES REVENDEUR
// =============================================
exports.getStatistiques = async (req, res) => {
  try {
    const revendeur = await Revendeur.findByPk(req.params.revendeurId);
    if (!revendeur) {
      return res.status(404).json({ error: 'Revendeur non trouvé' });
    }

    const allCommissions = await Commission.findAll({
      where: { revendeur_id: revendeur.id }
    });

    const allCommandes = await Commande.findAll({
      where: { referrer_id: revendeur.id }
    });

    const stats = {
      vente_totale: revendeur.vente_totale,
      commission_totale: revendeur.commission_totale,
      commission_en_attente: revendeur.commission_en_attente,
      nombre_ventes: revendeur.nombre_ventes,
      taux_conversion: revendeur.taux_conversion,
      nombre_cliques: revendeur.cliques_totals,
      score_fiabilite: revendeur.score_fiabilite,
      note_moyenne: revendeur.note_moyenne
    };

    // Commissions par statut
    const commissionsParStatut = {};
    allCommissions.forEach(c => {
      commissionsParStatut[c.statut] = (commissionsParStatut[c.statut] || 0) + 1;
    });

    res.json({
      success: true,
      revendeur: revendeur.nom,
      statistiques: stats,
      commissions_par_statut: commissionsParStatut,
      total_commandes_via_referral: allCommandes.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// GET: CONTENU MARKETING (POUR PARTAGER)
// =============================================
exports.getContenuMarketing = async (req, res) => {
  try {
    const { produitId } = req.params;
    const revendeur = await Revendeur.findByPk(req.params.revendeurId);

    if (!revendeur) {
      return res.status(404).json({ error: 'Revendeur non trouvé' });
    }

    const product = await Produit.findByPk(produitId);
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Générer le contenu de marketing
    const contenuProduit = contentGeneratorService.generateProductContent(product, revendeur);

    // Générer un lien custom avec tracking
    const trackingLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/product/${product.slug}?ref=${revendeur.lien_referal}&utm_source=revendeur&utm_campaign=${revendeur.id}`;

    res.json({
      success: true,
      revendeur: revendeur.nom,
      contenu: contenuProduit,
      trackingLink,
      referralTemplate: contentGeneratorService.generateRevendeurTemplate(revendeur, product)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// GET: LISTES DE REVENDEURS (public)
// =============================================
exports.getRevendeurs = async (req, res) => {
  try {
    const { limit = 20, offset = 0, tri = 'vente_totale' } = req.query;

    const order = tri === 'nouveau' ? [['createdAt', 'DESC']]
      : tri === 'avis' ? [['note_moyenne', 'DESC']]
      : [['vente_totale', 'DESC']];

    const { count, rows } = await Revendeur.findAndCountAll({
      where: { statut: 'actif' },
      attributes: [
        'id', 'nom', 'bio', 'photo', 'commission_percent',
        'vente_totale', 'nombre_ventes', 'note_moyenne', 'nombre_avis',
        'score_fiabilite', 'date_inscription'
      ],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      revendeurs: rows,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// GET: DETAIL REVENDEUR (public)
// =============================================
exports.getRevendeurPublic = async (req, res) => {
  try {
    const revendeur = await Revendeur.findOne({
      where: {
        [Op.or]: [
          { id: req.params.revendeurId },
          { lien_referal: req.params.revendeurId }
        ]
      }
    });

    if (!revendeur || revendeur.statut === 'suspendu') {
      return res.status(404).json({ error: 'Revendeur non trouvé' });
    }

    // Incrémenter les cliques
    await revendeur.increment('cliques_totals');

    res.json({
      success: true,
      revendeur: {
        id: revendeur.id,
        nom: revendeur.nom,
        bio: revendeur.bio,
        photo: revendeur.photo,
        commission_percent: revendeur.commission_percent,
        vente_totale: revendeur.vente_totale,
        nombre_ventes: revendeur.nombre_ventes,
        note_moyenne: revendeur.note_moyenne,
        nombre_avis: revendeur.nombre_avis,
        referralLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?ref=${revendeur.lien_referal}`
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// ADMIN: METTRE À JOUR LA COMMISSION D'UN REVENDEUR
// =============================================
exports.updateCommissionRate = async (req, res) => {
  try {
    const { commission_percent } = req.body;

    if (commission_percent < 0 || commission_percent > 100) {
      return res.status(400).json({ error: 'Commission doit être entre 0 et 100' });
    }

    const revendeur = await Revendeur.findByPk(req.params.revendeurId);
    if (!revendeur) {
      return res.status(404).json({ error: 'Revendeur non trouvé' });
    }

    await revendeur.update({ commission_percent });

    res.json({
      success: true,
      message: `Commission mise à jour: ${commission_percent}%`,
      revendeur
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// ADMIN: SUSPENDRE/ACTIVER UN REVENDEUR
// =============================================
exports.toggleRevendeur = async (req, res) => {
  try {
    const revendeur = await Revendeur.findByPk(req.params.revendeurId);
    if (!revendeur) {
      return res.status(404).json({ error: 'Revendeur non trouvé' });
    }

    const newStatus = revendeur.statut === 'actif' ? 'inactif' : 'actif';
    await revendeur.update({ statut: newStatus });

    res.json({
      success: true,
      message: `Revendeur ${newStatus === 'actif' ? 'activé' : 'désactivé'}`,
      revendeur
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
