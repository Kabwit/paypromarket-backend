const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getMesNotifications,
  marquerCommeLue,
  marquerToutesCommeLues,
  supprimerNotification
} = require('../controllers/notificationController');

// Toutes les routes nécessitent une authentification
router.get('/', auth, getMesNotifications);
router.put('/lire-tout', auth, marquerToutesCommeLues);
router.put('/:id/lire', auth, marquerCommeLue);
router.delete('/:id', auth, supprimerNotification);

module.exports = router;
