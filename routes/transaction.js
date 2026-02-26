const express = require('express');
const router = express.Router();
const { auth, authClient, authVendeur } = require('../middleware/auth');
const {
  initierPaiement,
  confirmerPaiement,
  echecPaiement,
  getPaiementCommande,
  getHistoriquePaiements
} = require('../controllers/transactionController');

// Client: initier un paiement
router.post('/initier', authClient, initierPaiement);

// Webhook / simulation: confirmer un paiement
router.post('/confirmer/:reference_transaction', confirmerPaiement);

// Webhook / simulation: échec de paiement
router.post('/echec/:reference_transaction', echecPaiement);

// Voir le paiement d'une commande
router.get('/commande/:commandeId', auth, getPaiementCommande);

// Vendeur: historique des paiements
router.get('/historique', authVendeur, getHistoriquePaiements);

module.exports = router;