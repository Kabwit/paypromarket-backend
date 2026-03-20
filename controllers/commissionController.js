const { Commission, Revendeur, Commande, Produit } = require('../models');
const { Op } = require('sequelize');

// =============================================
// GET: MES COMMISSIONS (revendeur)
// =============================================
exports.getMessCommissions = async (req, res) => {
  try {
    const { statut, limit = 20, offset = 0, tri = 'date' } = req.query;
    const revendeurId = req.params.revendeurId;

    const where = { revendeur_id: revendeurId };
    if (statut) where.statut = statut;

    const order = tri === 'montant' ? [['montant_commission', 'DESC']]
      : [['createdAt', 'DESC']];

    const { count, rows } = await Commission.findAndCountAll({
      where,
      include: [
        {
          model: Commande,
          attributes: ['id', 'numero_commande', 'montant_total', 'date_commande', 'statut'],
          as: 'commande'
        },
        {
          model: Produit,
          attributes: ['id', 'nom', 'prix', 'image'],
          as: 'produit'
        },
        {
          model: Revendeur,
          attributes: ['id', 'nom'],
          as: 'revendeur'
        }
      ],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Résumé des commissions
    const resume = {
      total_commissions: count,
      montant_total: rows.reduce((sum, c) => sum + parseFloat(c.montant_commission || 0), 0),
      commissions_par_statut: {
        en_attente: rows.filter(c => c.statut === 'en_attente').length,
        confirmee: rows.filter(c => c.statut === 'confirmee').length,
        versee: rows.filter(c => c.statut === 'versee').length,
        rejetee: rows.filter(c => c.statut === 'rejetee').length
      }
    };

    res.json({
      success: true,
      resume,
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
// GET: DEMANDES DE VERSEMENT (revendeur)
// =============================================
exports.getDemandesVersement = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const revendeurId = req.params.revendeurId;

    // Commissions en attente de versement (statut = confirmee ou en_attente de versement)
    const { count, rows } = await Commission.findAndCountAll({
      where: {
        revendeur_id: revendeurId,
        statut: { [Op.in]: ['confirmee', 'en_attente'] }
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const revendeur = await Revendeur.findByPk(revendeurId);

    res.json({
      success: true,
      montant_total_en_attente: revendeur.commission_en_attente,
      commission_minimum: revendeur.commission_min || 5000,
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
// POST: DEMANDER VERSEMENT
// =============================================
exports.demanderVersement = async (req, res) => {
  try {
    const revendeurId = req.params.revendeurId;
    const revendeur = await Revendeur.findByPk(revendeurId);

    if (!revendeur) {
      return res.status(404).json({ error: 'Revendeur non trouvé' });
    }

    // Vérifier minimum
    if (revendeur.commission_en_attente < (revendeur.commission_min || 5000)) {
      return res.status(400).json({
        error: `Commission minimum non atteinte. Vous avez ${revendeur.commission_en_attente}. Minimum requis: ${revendeur.commission_min || 5000}`
      });
    }

    // Récupérer toutes les commissions confirmées non versées
    const commissionsAVerser = await Commission.findAll({
      where: {
        revendeur_id: revendeurId,
        statut: 'confirmee'
      }
    });

    if (commissionsAVerser.length === 0) {
      return res.status(400).json({ error: 'Aucune commission disponible pour versement' });
    }

    // Créer une demande de versement
    const montantTotal = commissionsAVerser.reduce((sum, c) => sum + parseFloat(c.montant_commission || 0), 0);

    const versementReference = `VERS_${revendeur.id}_${Date.now()}`;

    // Mettre à jour toutes les commissions à statut "versee"
    await Commission.update(
      {
        statut: 'versee',
        date_versement: new Date(),
        reference_versement: versementReference
      },
      {
        where: {
          id: { [Op.in]: commissionsAVerser.map(c => c.id) }
        }
      }
    );

    // Mettre à jour le revendeur
    await revendeur.update({
      commission_en_attente: 0,
      commission_totale: parseFloat(revendeur.commission_totale || 0) + montantTotal
    });

    res.json({
      success: true,
      message: 'Demande de versement créée',
      versement: {
        reference: versementReference,
        montant: montantTotal,
        nombre_commissions: commissionsAVerser.length,
        date_versement: new Date(),
        statut: 'en_cours'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// GET: HISTORIQUE DES VERSEMENTS
// =============================================
exports.getHistoriqueVersements = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const revendeurId = req.params.revendeurId;

    const versements = await Commission.findAll({
      where: {
        revendeur_id: revendeurId,
        statut: 'versee',
        reference_versement: { [Op.ne]: null }
      },
      order: [['date_versement', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Grouper par reference_versement
    const grouped = {};
    versements.forEach(v => {
      if (!grouped[v.reference_versement]) {
        grouped[v.reference_versement] = {
          reference: v.reference_versement,
          date: v.date_versement,
          commissions: []
        };
      }
      grouped[v.reference_versement].commissions.push(v);
    });

    const historiqueFormate = Object.values(grouped).map(g => ({
      reference: g.reference,
      date: g.date,
      montant_total: g.commissions.reduce((sum, c) => sum + parseFloat(c.montant_commission || 0), 0),
      nombre_commissions: g.commissions.length
    }));

    res.json({
      success: true,
      versements: historiqueFormate
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// ADMIN: METTRE À JOUR STATUT D'UNE COMMISSION
// =============================================
exports.updateStatutCommission = async (req, res) => {
  try {
    const { commissionId } = req.params;
    const { statut, notes } = req.body;

    const statutsValides = ['en_attente', 'confirmee', 'versee', 'rejetee'];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ error: `Statut invalide. Doit être: ${statutsValides.join(', ')}` });
    }

    const commission = await Commission.findByPk(commissionId, {
      include: [
        { model: Revendeur, as: 'revendeur' }
      ]
    });

    if (!commission) {
      return res.status(404).json({ error: 'Commission non trouvée' });
    }

    const ancienStatut = commission.statut;

    // Mettre à jour la commission
    await commission.update({
      statut,
      notes: notes || commission.notes
    });

    // Si changement vers "confirmee", mettre à jour les stats du revendeur
    if (ancienStatut === 'en_attente' && statut === 'confirmee') {
      const revendeur = commission.revendeur;
      await revendeur.update({
        commission_en_attente: Math.max(
          0,
          parseFloat(revendeur.commission_en_attente || 0) - parseFloat(commission.montant_commission || 0)
        )
      });
    }

    res.json({
      success: true,
      message: `Commission passée de ${ancienStatut} à ${statut}`,
      commission
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// GET: RÉSUMÉ COMMISSIONS (dashboard)
// =============================================
exports.getResume = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const revendeurId = req.params.revendeurId;

    // Dernières commissions
    const dernieres = await Commission.findAll({
      where: { revendeur_id: revendeurId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      include: [
        {
          model: Commande,
          attributes: ['numero_commande', 'montant_total'],
          as: 'commande'
        }
      ]
    });

    // Stats
    const stats = await Commission.findAll({
      where: { revendeur_id: revendeurId },
      attributes: [
        'statut',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
        [require('sequelize').fn('SUM', require('sequelize').col('montant_commission')), 'montant_total']
      ],
      group: ['statut']
    });

    const revendeur = await Revendeur.findByPk(revendeurId);

    res.json({
      success: true,
      profil: {
        nom: revendeur.nom,
        commission_percent: revendeur.commission_percent,
        commission_en_attente: revendeur.commission_en_attente,
        commission_totale: revendeur.commission_totale
      },
      stats_commissions: stats,
      dernières_commissions: dernieres
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// ADMIN: RÉCAPITULATIF DE TOUTES LES COMMISSIONS
// =============================================
exports.getAllCommissions = async (req, res) => {
  try {
    const { statut, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (statut) where.statut = statut;

    const { count, rows } = await Commission.findAndCountAll({
      where,
      include: [
        {
          model: Revendeur,
          attributes: ['id', 'nom', 'email'],
          as: 'revendeur'
        },
        {
          model: Commande,
          attributes: ['numero_commande', 'montant_total'],
          as: 'commande'
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      total: count,
      commissions: rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
