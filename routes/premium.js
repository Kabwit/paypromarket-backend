const express = require('express');
const router = express.Router();
const { authVendeur, authAdmin } = require('../middleware/auth');
const {
  getMonPlan,
  souscrirePlan,
  annulerPlan,
  attribuerPlan,
  verifierStocksBas
} = require('../controllers/premiumController');

// Vendeur: voir mon plan
router.get('/mon-plan', authVendeur, getMonPlan);

// Vendeur: souscrire un plan
router.post('/souscrire', authVendeur, souscrirePlan);

// Vendeur: annuler plan premium
router.post('/annuler', authVendeur, annulerPlan);

// Vendeur: alertes stock
router.get('/stocks-bas', authVendeur, verifierStocksBas);

// Admin: attribuer un plan à un vendeur
router.post('/attribuer/:vendeurId', authAdmin, attribuerPlan);

module.exports = router;
