const express = require('express');
const router = express.Router();
const { auth, authVendeur, authClient } = require('../middleware/auth');
const {
  createCommande,
  getMesCommandes,
  getCommandesVendeur,
  getCommandeById,
  updateStatutCommande,
  annulerCommande
} = require('../controllers/commandeController');

// Client: créer une commande
router.post('/', authClient, createCommande);

// Client: mes commandes
router.get('/mes-commandes', authClient, getMesCommandes);

// Client: annuler une commande
router.put('/:id/annuler', authClient, annulerCommande);

// Vendeur: commandes reçues
router.get('/vendeur', authVendeur, getCommandesVendeur);

// Vendeur: mettre à jour le statut
router.put('/:id/statut', authVendeur, updateStatutCommande);

// Détail d'une commande (auth requise)
router.get('/:id', auth, getCommandeById);

module.exports = router;