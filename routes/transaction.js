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

const { initierPaiementRules } = require('../middleware/validation');

// Client: initier un paiement
router.post('/initier', authClient, initierPaiementRules, initierPaiement);

// Webhook / simulation: confirmer un paiement (protégé par clé webhook)
router.post('/confirmer/:reference_transaction', (req, res, next) => {
  const webhookKey = process.env.WEBHOOK_SECRET || 'paypromarket_webhook_2026';
  const providedKey = req.headers['x-webhook-secret'] || req.query.webhook_secret;
  if (providedKey !== webhookKey) {
    return res.status(401).json({ error: 'Clé webhook invalide' });
  }
  next();
}, confirmerPaiement);

// Webhook / simulation: échec de paiement (protégé par clé webhook)
router.post('/echec/:reference_transaction', (req, res, next) => {
  const webhookKey = process.env.WEBHOOK_SECRET || 'paypromarket_webhook_2026';
  const providedKey = req.headers['x-webhook-secret'] || req.query.webhook_secret;
  if (providedKey !== webhookKey) {
    return res.status(401).json({ error: 'Clé webhook invalide' });
  }
  next();
}, echecPaiement);

// Voir le paiement d'une commande
router.get('/commande/:commandeId', auth, getPaiementCommande);

// Vendeur: historique des paiements
router.get('/historique', authVendeur, getHistoriquePaiements);

module.exports = router;