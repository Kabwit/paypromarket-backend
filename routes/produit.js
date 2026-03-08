const express = require('express');
const router = express.Router();
const { authVendeur } = require('../middleware/auth');
const { uploadPhotos } = require('../middleware/upload');
const { optimizeImages } = require('../middleware/imageOptimizer');
const { createProduitRules } = require('../middleware/validation');
const {
  createProduit,
  updateProduit,
  deleteProduit,
  getMesProduits,
  getProduitBySlug,
  getProduitById,
  searchProduits,
  deletePhoto
} = require('../controllers/produitController');

// Routes publiques
router.get('/recherche', searchProduits);
router.get('/slug/:slug', getProduitBySlug);
router.get('/:id', getProduitById);

// Routes protégées (vendeur connecté)
router.get('/', authVendeur, getMesProduits);
router.post('/', authVendeur, uploadPhotos, optimizeImages, createProduitRules, createProduit);
router.put('/:id', authVendeur, uploadPhotos, optimizeImages, updateProduit);
router.delete('/:id', authVendeur, deleteProduit);
router.delete('/:id/photo', authVendeur, deletePhoto);

module.exports = router;