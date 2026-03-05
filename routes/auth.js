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

module.exports = router;
