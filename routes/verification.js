const express = require('express');
const router = express.Router();
const { authVendeur, authAdmin } = require('../middleware/auth');
const { uploadVerification } = require('../middleware/upload');
const {
  soumettreVerification,
  getMesVerifications,
  getAllVerifications,
  approuverVerification,
  rejeterVerification
} = require('../controllers/verificationController');

// Vendeur: soumettre une vérification
router.post('/', authVendeur, uploadVerification, soumettreVerification);

// Vendeur: mes vérifications
router.get('/mes-verifications', authVendeur, getMesVerifications);

// Admin: toutes les vérifications
router.get('/', authAdmin, getAllVerifications);

// Admin: approuver
router.put('/:id/approuver', authAdmin, approuverVerification);

// Admin: rejeter
router.put('/:id/rejeter', authAdmin, rejeterVerification);

module.exports = router;
