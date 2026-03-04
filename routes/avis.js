const express = require('express');
const router = express.Router();
const { auth, authVendeur, authClient } = require('../middleware/auth');
const {
  creerAvis,
  repondreAvis,
  getAvisVendeur,
  getMesAvis
} = require('../controllers/avisController');

// Public: avis d'un vendeur
router.get('/vendeur/:vendeurId', getAvisVendeur);

// Client: laisser un avis
router.post('/', authClient, creerAvis);

// Vendeur: répondre à un avis
router.put('/:id/repondre', authVendeur, repondreAvis);

// Vendeur: mes avis reçus
router.get('/mes-avis', authVendeur, getMesAvis);

module.exports = router;
