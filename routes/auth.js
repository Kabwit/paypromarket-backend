const express = require('express');
const router = express.Router();
const {
  inscriptionVendeur,
  connexionVendeur,
  inscriptionClient,
  connexionClient,
  getProfil
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { inscriptionVendeurRules, inscriptionClientRules, connexionRules } = require('../middleware/validation');

// Routes vendeur
router.post('/vendeur/inscription', inscriptionVendeurRules, inscriptionVendeur);
router.post('/vendeur/connexion', connexionRules, connexionVendeur);

// Routes client
router.post('/client/inscription', inscriptionClientRules, inscriptionClient);
router.post('/client/connexion', connexionRules, connexionClient);

// Profil (authentifié)
router.get('/profil', auth, getProfil);

// Enregistrer le token FCM pour les notifications push
router.put('/fcm-token', auth, async (req, res) => {
  try {
    const { fcm_token } = req.body;
    if (!fcm_token) {
      return res.status(400).json({ error: 'Token FCM requis' });
    }

    const { Client, Vendeur } = require('../models');
    const Model = req.user.role === 'vendeur' ? Vendeur : Client;
    await Model.update({ fcm_token }, { where: { id: req.user.id } });

    res.json({ message: 'Token FCM enregistré' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
