const express = require('express');
const router = express.Router();
const { authVendeur } = require('../middleware/auth');
const { uploadPhotos } = require('../middleware/upload');
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
router.post('/', authVendeur, uploadPhotos, createProduit);
router.put('/:id', authVendeur, uploadPhotos, updateProduit);
router.delete('/:id', authVendeur, deleteProduit);
router.delete('/:id/photo', authVendeur, deletePhoto);

module.exports = router;