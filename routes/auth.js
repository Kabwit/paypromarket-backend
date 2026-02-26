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

// Routes vendeur
router.post('/vendeur/inscription', inscriptionVendeur);
router.post('/vendeur/connexion', connexionVendeur);

// Routes client
router.post('/client/inscription', inscriptionClient);
router.post('/client/connexion', connexionClient);

// Profil (authentifié)
router.get('/profil', auth, getProfil);

module.exports = router;
