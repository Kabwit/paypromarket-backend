const express = require('express');
const router = express.Router();
const { auth, authAdmin } = require('../middleware/auth');
const {
  creerSignalement,
  getMesSignalements,
  getAllSignalements,
  traiterSignalement
} = require('../controllers/signalementController');

// Client/Vendeur: créer un signalement
router.post('/', auth, creerSignalement);

// Client/Vendeur: mes signalements
router.get('/mes-signalements', auth, getMesSignalements);

// Admin: tous les signalements
router.get('/', authAdmin, getAllSignalements);

// Admin: traiter un signalement
router.put('/:id/traiter', authAdmin, traiterSignalement);

module.exports = router;
