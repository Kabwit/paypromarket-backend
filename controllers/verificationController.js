const { Verification, Vendeur, Notification } = require('../models');
const { Op } = require('sequelize');

// =============================================
// VENDEUR: SOUMETTRE UNE DEMANDE DE VÉRIFICATION
// =============================================
exports.soumettreVerification = async (req, res) => {
  try {
    const vendeur = await Vendeur.findByPk(req.user.id);
    if (!vendeur) {
      return res.status(404).json({ error: 'Vendeur non trouvé' });
    }

    if (vendeur.verifie) {
      return res.status(400).json({ error: 'Votre compte est déjà vérifié' });
    }

    // Vérifier s'il y a déjà une demande en attente
    const demandeExistante = await Verification.findOne({
      where: { vendeur_id: req.user.id, statut: 'en_attente' }
    });
    if (demandeExistante) {
      return res.status(400).json({ error: 'Vous avez déjà une demande de vérification en attente' });
    }

    const { type_document, numero_document } = req.body;
    if (!type_document || !numero_document) {
      return res.status(400).json({ error: 'Type de document et numéro sont requis' });
    }

    // Récupérer les fichiers uploadés via multer fields
    const documentFile = req.files && req.files.document && req.files.document[0];
    const selfieFile = req.files && req.files.selfie && req.files.selfie[0];

    if (!documentFile) {
      return res.status(400).json({ error: 'L\'image du document est requise' });
    }

    const image_document = `/uploads/verifications/${documentFile.filename}`;
    const selfie_url = selfieFile ? `/uploads/verifications/${selfieFile.filename}` : null;

    const verification = await Verification.create({
      vendeur_id: req.user.id,
      type_document,
      numero_document,
      image_document,
      selfie_url
    });

    res.status(201).json({
      message: 'Demande de vérification soumise. Elle sera examinée sous 24-48h.',
      verification
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// VENDEUR: VOIR MES DEMANDES DE VÉRIFICATION
// =============================================
exports.getMesVerifications = async (req, res) => {
  try {
    const verifications = await Verification.findAll({
      where: { vendeur_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(verifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// ADMIN: LISTER LES DEMANDES DE VÉRIFICATION
// =============================================
exports.getAllVerifications = async (req, res) => {
  try {
    const { statut, page = 1, limit = 20 } = req.query;
    const where = {};
    if (statut) where.statut = statut;

    const { rows: verifications, count: total } = await Verification.findAndCountAll({
      where,
      include: [{ model: Vendeur, as: 'vendeur', attributes: ['id', 'nom_boutique', 'telephone', 'email', 'ville', 'type_boutique'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    res.json({
      verifications,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// ADMIN: APPROUVER UNE VÉRIFICATION
// =============================================
exports.approuverVerification = async (req, res) => {
  try {
    const verification = await Verification.findByPk(req.params.id, {
      include: [{ model: Vendeur, as: 'vendeur' }]
    });

    if (!verification) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }
    if (verification.statut !== 'en_attente') {
      return res.status(400).json({ error: 'Cette demande a déjà été traitée' });
    }

    await verification.update({
      statut: 'approuvé',
      verifie_par: req.user.id,
      date_verification: new Date()
    });

    await Vendeur.update(
      { verifie: true, date_verification: new Date() },
      { where: { id: verification.vendeur_id } }
    );

    // Notification vendeur
    await Notification.create({
      destinataire_type: 'vendeur',
      destinataire_id: verification.vendeur_id,
      titre: 'Compte vérifié ✅',
      message: 'Félicitations ! Votre compte a été vérifié. Vous bénéficiez maintenant du badge "Vendeur Vérifié".',
      type: 'système',
      donnees: { verification_id: verification.id }
    });

    res.json({ message: 'Vérification approuvée', verification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// ADMIN: REJETER UNE VÉRIFICATION
// =============================================
exports.rejeterVerification = async (req, res) => {
  try {
    const { motif_rejet } = req.body;
    const verification = await Verification.findByPk(req.params.id);

    if (!verification) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }
    if (verification.statut !== 'en_attente') {
      return res.status(400).json({ error: 'Cette demande a déjà été traitée' });
    }

    await verification.update({
      statut: 'rejeté',
      motif_rejet: motif_rejet || 'Document non conforme',
      verifie_par: req.user.id,
      date_verification: new Date()
    });

    await Notification.create({
      destinataire_type: 'vendeur',
      destinataire_id: verification.vendeur_id,
      titre: 'Vérification refusée',
      message: `Votre demande de vérification a été refusée. Motif : ${motif_rejet || 'Document non conforme'}. Vous pouvez soumettre une nouvelle demande.`,
      type: 'système',
      donnees: { verification_id: verification.id }
    });

    res.json({ message: 'Vérification rejetée', verification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
