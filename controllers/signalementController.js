const { Signalement, Vendeur, Produit, Client, Notification, Admin } = require('../models');
const { Op } = require('sequelize');
const { calculerScoreFiabilite } = require('./avisController');

// =============================================
// CLIENT/VENDEUR: CRÉER UN SIGNALEMENT
// =============================================
exports.creerSignalement = async (req, res) => {
  try {
    const { type_cible, cible_id, raison, description, preuves } = req.body;

    if (!type_cible || !cible_id || !raison) {
      return res.status(400).json({ error: 'type_cible, cible_id et raison sont requis' });
    }

    const raisonsValides = ['produit_contrefait', 'arnaque', 'contenu_inapproprie', 'prix_abusif', 'non_livraison', 'harcelement', 'autre'];
    if (!raisonsValides.includes(raison)) {
      return res.status(400).json({ error: 'Raison invalide', raisons_valides: raisonsValides });
    }

    // Vérifier que la cible existe
    if (type_cible === 'vendeur') {
      const vendeur = await Vendeur.findByPk(cible_id);
      if (!vendeur) return res.status(404).json({ error: 'Vendeur non trouvé' });
    } else if (type_cible === 'produit') {
      const produit = await Produit.findByPk(cible_id);
      if (!produit) return res.status(404).json({ error: 'Produit non trouvé' });
    } else {
      return res.status(400).json({ error: 'type_cible doit être vendeur ou produit' });
    }

    // Vérifier doublon
    const signaleurType = req.user.role || (req.user.nom_boutique ? 'vendeur' : 'client');
    const existant = await Signalement.findOne({
      where: {
        type_cible, cible_id,
        signaleur_type: signaleurType,
        signaleur_id: req.user.id,
        statut: { [Op.in]: ['ouvert', 'en_examen'] }
      }
    });
    if (existant) {
      return res.status(400).json({ error: 'Vous avez déjà un signalement en cours pour cette cible' });
    }

    const signalement = await Signalement.create({
      type_cible,
      cible_id,
      signaleur_type: signaleurType,
      signaleur_id: req.user.id,
      raison,
      description: description || null,
      preuves: preuves || null
    });

    // Notifier les admins
    const admins = await Admin.findAll();
    for (const admin of admins) {
      await Notification.create({
        destinataire_type: 'admin',
        destinataire_id: admin.id,
        titre: 'Nouveau signalement',
        message: `Un ${signaleurType} a signalé un ${type_cible} (raison: ${raison}).`,
        type: 'système',
        donnees: { signalement_id: signalement.id }
      });
    }

    res.status(201).json({ message: 'Signalement enregistré', signalement });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// USER: MES SIGNALEMENTS
// =============================================
exports.getMesSignalements = async (req, res) => {
  try {
    const signaleurType = req.user.nom_boutique ? 'vendeur' : 'client';

    const signalements = await Signalement.findAll({
      where: { signaleur_type: signaleurType, signaleur_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json(signalements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// ADMIN: TOUS LES SIGNALEMENTS
// =============================================
exports.getAllSignalements = async (req, res) => {
  try {
    const { page = 1, limit = 20, statut, type_cible } = req.query;
    const where = {};

    if (statut) where.statut = statut;
    if (type_cible) where.type_cible = type_cible;

    const { rows: signalements, count: total } = await Signalement.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    // Enrichir avec les détails de la cible
    const enrichis = await Promise.all(signalements.map(async (s) => {
      const plain = s.toJSON();
      if (s.type_cible === 'vendeur') {
        plain.cible = await Vendeur.findByPk(s.cible_id, { attributes: ['id', 'nom', 'nom_boutique', 'email', 'verifie', 'score_fiabilite'] });
      } else if (s.type_cible === 'produit') {
        plain.cible = await Produit.findByPk(s.cible_id, {
          attributes: ['id', 'nom', 'prix', 'photos'],
          include: [{ model: Vendeur, as: 'vendeur', attributes: ['id', 'nom_boutique'] }]
        });
      }
      return plain;
    }));

    res.json({
      signalements: enrichis,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// ADMIN: TRAITER UN SIGNALEMENT
// =============================================
exports.traiterSignalement = async (req, res) => {
  try {
    const { statut, resolution } = req.body;
    const signa = await Signalement.findByPk(req.params.id);

    if (!signa) {
      return res.status(404).json({ error: 'Signalement non trouvé' });
    }

    const statutsValides = ['en_examen', 'résolu', 'classé'];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ error: 'Statut invalide', statuts_valides: statutsValides });
    }

    await signa.update({
      statut,
      resolution: resolution || signa.resolution,
      traite_par: req.user.id,
      date_resolution: ['résolu', 'classé'].includes(statut) ? new Date() : null
    });

    // Si résolu et cible est vendeur → recalculer le score
    if (statut === 'résolu' && signa.type_cible === 'vendeur') {
      await calculerScoreFiabilite(signa.cible_id);
    }

    // Notification au signaleur
    await Notification.create({
      destinataire_type: signa.signaleur_type,
      destinataire_id: signa.signaleur_id,
      titre: 'Signalement mis à jour',
      message: `Votre signalement a été mis à jour: ${statut}.`,
      type: 'système',
      donnees: { signalement_id: signa.id }
    });

    res.json({ message: 'Signalement traité', signalement: signa });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
