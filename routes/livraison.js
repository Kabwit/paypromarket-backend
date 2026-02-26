const express = require('express');
const router = express.Router();
const { auth, authVendeur } = require('../middleware/auth');
const {
  getSuiviLivraison,
  updateLivraison,
  getLivraisonsVendeur
} = require('../controllers/livraisonController');

// Suivi de livraison (auth requise)
router.get('/commande/:commandeId', auth, getSuiviLivraison);

// Vendeur: liste des livraisons
router.get('/vendeur', authVendeur, getLivraisonsVendeur);

// Vendeur: mettre à jour une livraison
router.put('/commande/:commandeId', authVendeur, updateLivraison);

module.exports = router;
