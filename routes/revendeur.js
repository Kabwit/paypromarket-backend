const express = require('express');
const router = express.Router();
const {
  inscriptionRevendeur,
  getMonProfil,
  updateProfil,
  getCommissions,
  getStatistiques,
  getContenuMarketing,
  getRevendeurs,
  getRevendeurPublic,
  updateCommissionRate,
  toggleRevendeur
} = require('../controllers/revendeurController');
const { auth, authAdmin } = require('../middleware/auth');

// =============================================
// PUBLIC ROUTES
// =============================================

// POST: S'inscrire comme revendeur
router.post('/inscription', inscriptionRevendeur);

// GET: Lister tous les revendeurs (publique)
router.get('/', getRevendeurs);

// GET: Détails public d'un revendeur (par ID ou lien_referal)
router.get('/:revendeurId/public', getRevendeurPublic);

// =============================================
// REVENDEUR AUTHENTICATED ROUTES (require revendeur login)
// =============================================

// GET: Mon profil (revendeur)
router.get('/:revendeurId/profil', auth, getMonProfil);

// PUT: Mettre à jour mon profil
router.put('/:revendeurId/profil', auth, updateProfil);

// GET: Mes commissions
router.get('/:revendeurId/commissions', auth, getCommissions);

// GET: Mes statistiques
router.get('/:revendeurId/statistiques', auth, getStatistiques);

// GET: Contenu marketing pour partager un produit
router.get('/:revendeurId/produit/:produitId/contenu', auth, getContenuMarketing);

// =============================================
// ADMIN ROUTES (require admin)
// =============================================

// PUT: Mettre à jour le taux de commission d'un revendeur
router.put('/:revendeurId/commission', auth, authAdmin, updateCommissionRate);

// PUT: Activer/Désactiver un revendeur
router.put('/:revendeurId/toggle', auth, authAdmin, toggleRevendeur);

module.exports = router;
