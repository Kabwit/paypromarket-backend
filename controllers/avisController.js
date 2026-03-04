const { Avis, Commande, Produit, Vendeur, Client, Notification } = require('../models');
const { Op, fn, col } = require('sequelize');

// =============================================
// CLIENT: LAISSER UN AVIS (après commande livrée)
// =============================================
exports.creerAvis = async (req, res) => {
  try {
    const { commande_id, note, commentaire, produit_id } = req.body;

    if (!commande_id || !note) {
      return res.status(400).json({ error: 'commande_id et note sont requis' });
    }
    if (note < 1 || note > 5) {
      return res.status(400).json({ error: 'La note doit être entre 1 et 5' });
    }

    // Vérifier que la commande appartient au client et est livrée
    const commande = await Commande.findOne({
      where: { id: commande_id, client_id: req.user.id }
    });

    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    if (commande.statut !== 'livrée') {
      return res.status(400).json({ error: 'Vous ne pouvez laisser un avis que sur une commande livrée' });
    }

    // Un seul avis par commande
    const avisExistant = await Avis.findOne({ where: { commande_id } });
    if (avisExistant) {
      return res.status(400).json({ error: 'Vous avez déjà laissé un avis pour cette commande' });
    }

    const avis = await Avis.create({
      commande_id,
      produit_id: produit_id || null,
      client_id: req.user.id,
      vendeur_id: commande.vendeur_id,
      note,
      commentaire: commentaire || null
    });

    // Mettre à jour les stats du vendeur
    await mettreAJourStatsVendeur(commande.vendeur_id);

    // Mettre à jour les stats du produit si spécifié
    if (produit_id) {
      await mettreAJourStatsProduit(produit_id);
    }

    // Notification vendeur
    await Notification.create({
      destinataire_type: 'vendeur',
      destinataire_id: commande.vendeur_id,
      titre: 'Nouvel avis reçu',
      message: `Un client a laissé un avis de ${note}/5 sur votre commande #${commande.numero_commande}.`,
      type: 'système',
      donnees: { avis_id: avis.id, commande_id }
    });

    res.status(201).json({ message: 'Avis enregistré', avis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// VENDEUR: RÉPONDRE À UN AVIS
// =============================================
exports.repondreAvis = async (req, res) => {
  try {
    const avis = await Avis.findOne({
      where: { id: req.params.id, vendeur_id: req.user.id }
    });

    if (!avis) {
      return res.status(404).json({ error: 'Avis non trouvé' });
    }
    if (avis.reponse_vendeur) {
      return res.status(400).json({ error: 'Vous avez déjà répondu à cet avis' });
    }

    await avis.update({
      reponse_vendeur: req.body.reponse,
      date_reponse: new Date()
    });

    // Notification client
    await Notification.create({
      destinataire_type: 'client',
      destinataire_id: avis.client_id,
      titre: 'Réponse du vendeur',
      message: 'Le vendeur a répondu à votre avis.',
      type: 'système',
      donnees: { avis_id: avis.id }
    });

    res.json({ message: 'Réponse enregistrée', avis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// PUBLIC: AVIS D'UN VENDEUR
// =============================================
exports.getAvisVendeur = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const vendeur_id = req.params.vendeurId;

    const { rows: avis, count: total } = await Avis.findAndCountAll({
      where: { vendeur_id },
      include: [
        { model: Client, as: 'client', attributes: ['nom', 'prenom'] },
        { model: Produit, as: 'produit', attributes: ['nom', 'photos'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    // Calculer les stats
    const stats = await Avis.findAll({
      where: { vendeur_id },
      attributes: [
        [fn('AVG', col('note')), 'note_moyenne'],
        [fn('COUNT', col('id')), 'total_avis'],
        [fn('COUNT', col('note')), 'total']
      ],
      raw: true
    });

    const distribution = await Avis.findAll({
      where: { vendeur_id },
      attributes: ['note', [fn('COUNT', col('id')), 'count']],
      group: ['note'],
      raw: true
    });

    res.json({
      avis,
      stats: {
        note_moyenne: parseFloat(stats[0]?.note_moyenne) || 0,
        total_avis: parseInt(stats[0]?.total_avis) || 0,
        distribution: distribution.reduce((acc, d) => { acc[d.note] = parseInt(d.count); return acc; }, {})
      },
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// VENDEUR: MES AVIS REÇUS
// =============================================
exports.getMesAvis = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const { rows: avis, count: total } = await Avis.findAndCountAll({
      where: { vendeur_id: req.user.id },
      include: [
        { model: Client, as: 'client', attributes: ['nom', 'prenom'] },
        { model: Commande, as: 'commande', attributes: ['numero_commande'] },
        { model: Produit, as: 'produit', attributes: ['nom'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    res.json({
      avis,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// HELPERS: Mettre à jour stats
// =============================================
async function mettreAJourStatsVendeur(vendeurId) {
  const result = await Avis.findAll({
    where: { vendeur_id: vendeurId },
    attributes: [
      [fn('AVG', col('note')), 'note_moyenne'],
      [fn('COUNT', col('id')), 'nombre_avis']
    ],
    raw: true
  });

  const noteMoyenne = parseFloat(result[0]?.note_moyenne) || null;
  const nombreAvis = parseInt(result[0]?.nombre_avis) || 0;

  await Vendeur.update(
    { note_moyenne: noteMoyenne, nombre_avis: nombreAvis },
    { where: { id: vendeurId } }
  );

  // Recalculer le score de fiabilité
  await calculerScoreFiabilite(vendeurId);
}

async function mettreAJourStatsProduit(produitId) {
  const result = await Avis.findAll({
    where: { produit_id: produitId },
    attributes: [
      [fn('AVG', col('note')), 'note_moyenne'],
      [fn('COUNT', col('id')), 'nombre_avis']
    ],
    raw: true
  });

  await Produit.update(
    {
      note_moyenne: parseFloat(result[0]?.note_moyenne) || null,
      nombre_avis: parseInt(result[0]?.nombre_avis) || 0
    },
    { where: { id: produitId } }
  );
}

// =============================================
// SCORE DE FIABILITÉ
// =============================================
async function calculerScoreFiabilite(vendeurId) {
  const vendeur = await Vendeur.findByPk(vendeurId);
  if (!vendeur) return;

  // 1. Note moyenne (0-5) → 0-30 points
  const noteMoyenne = parseFloat(vendeur.note_moyenne) || 0;
  const scoreNote = (noteMoyenne / 5) * 30;

  // 2. Commandes réussies vs annulées → 0-30 points
  const totalCommandes = await require('../models').Commande.count({ where: { vendeur_id: vendeurId } });
  const commandesLivrees = await require('../models').Commande.count({ where: { vendeur_id: vendeurId, statut: 'livrée' } });
  const commandesAnnulees = await require('../models').Commande.count({ where: { vendeur_id: vendeurId, statut: 'annulée' } });
  const tauxReussite = totalCommandes > 0 ? (commandesLivrees / totalCommandes) : 0;
  const scoreCommandes = tauxReussite * 30;

  // 3. Vérification → 0-15 points
  const scoreVerif = vendeur.verifie ? 15 : 0;

  // 4. Nombre d'avis (volume) → 0-10 points
  const nombreAvis = vendeur.nombre_avis || 0;
  const scoreVolume = Math.min(10, (nombreAvis / 50) * 10);

  // 5. Signalements → pénalité 0-15 points
  const signalements = await require('../models').Signalement.count({
    where: { type_cible: 'vendeur', cible_id: vendeurId, statut: { [require('sequelize').Op.ne]: 'classé' } }
  });
  const penaliteSignalements = Math.min(15, signalements * 5);

  // 6. Ancienneté → 0-10 points
  const joursDepuisCreation = Math.floor((Date.now() - new Date(vendeur.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const scoreAnciennete = Math.min(10, (joursDepuisCreation / 180) * 10);

  const scoreFinal = Math.max(0, Math.min(100,
    scoreNote + scoreCommandes + scoreVerif + scoreVolume + scoreAnciennete - penaliteSignalements
  ));

  await Vendeur.update(
    { score_fiabilite: Math.round(scoreFinal * 100) / 100, nombre_ventes: commandesLivrees },
    { where: { id: vendeurId } }
  );

  // Suspension automatique si trop de signalements
  if (signalements >= 5 && vendeur.actif) {
    await Vendeur.update({ actif: false }, { where: { id: vendeurId } });
    await require('../models').Notification.create({
      destinataire_type: 'vendeur',
      destinataire_id: vendeurId,
      titre: 'Compte suspendu',
      message: 'Votre compte a été suspendu suite à de nombreux signalements. Contactez le support.',
      type: 'système',
      donnees: { raison: 'signalements_multiples' }
    });
  }

  return scoreFinal;
}

// Export pour utilisation externe
exports.calculerScoreFiabilite = calculerScoreFiabilite;
exports.mettreAJourStatsVendeur = mettreAJourStatsVendeur;
