const express = require('express');
const router = express.Router();
const { authVendeur } = require('../middleware/auth');
const { uploadLogo } = require('../middleware/upload');
const { optimizeImages } = require('../middleware/imageOptimizer');
const {
  getMonProfil,
  updateProfil,
  uploadLogo: uploadLogoCtrl,
  updateTheme,
  getBoutiqueBySlug,
  getBoutiques,
  addZoneLivraison,
  getZonesLivraison,
  updateZoneLivraison,
  deleteZoneLivraison
} = require('../controllers/vendeurController');

// Routes publiques
router.get('/boutiques', getBoutiques);
router.get('/boutique/:slug', getBoutiqueBySlug);

// Routes protégées (vendeur connecté)
router.get('/profil', authVendeur, getMonProfil);
router.put('/profil', authVendeur, updateProfil);
router.post('/logo', authVendeur, uploadLogo, optimizeImages, uploadLogoCtrl);
router.put('/theme', authVendeur, updateTheme);

// Zones de livraison
router.post('/zones-livraison', authVendeur, addZoneLivraison);
router.get('/zones-livraison', authVendeur, getZonesLivraison);
router.put('/zones-livraison/:zoneId', authVendeur, updateZoneLivraison);
router.delete('/zones-livraison/:zoneId', authVendeur, deleteZoneLivraison);

module.exports = router;