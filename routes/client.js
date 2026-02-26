const express = require('express');
const router = express.Router();
const { authClient } = require('../middleware/auth');
const {
  getMonProfil,
  updateProfil,
  changerMotDePasse,
  getHistoriqueAchats,
  getFacture
} = require('../controllers/clientController');

// Profil client
router.get('/profil', authClient, getMonProfil);
router.put('/profil', authClient, updateProfil);
router.put('/mot-de-passe', authClient, changerMotDePasse);

// Historique et factures
router.get('/historique', authClient, getHistoriqueAchats);
router.get('/facture/:commandeId', authClient, getFacture);

module.exports = router;
