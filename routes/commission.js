const express = require('express');
const router = express.Router();
const {
  getMessCommissions,
  getDemandesVersement,
  demanderVersement,
  getHistoriqueVersements,
  updateStatutCommission,
  getResume,
  getAllCommissions
} = require('../controllers/commissionController');
const { auth, authAdmin } = require('../middleware/auth');

// =============================================
// REVENDEUR ROUTES
// =============================================

// GET: Mes commissions (revendeur)
router.get('/revendeur/:revendeurId/mes-commissions', auth, getMessCommissions);

// GET: Demandes de versement
router.get('/revendeur/:revendeurId/demandes-versement', auth, getDemandesVersement);

// POST: Demander versement
router.post('/revendeur/:revendeurId/demander-versement', auth, demanderVersement);

// GET: Historique des versements
router.get('/revendeur/:revendeurId/historique-versements', auth, getHistoriqueVersements);

// GET: Résumé commissions (dashboard)
router.get('/revendeur/:revendeurId/resume', auth, getResume);

// =============================================
// ADMIN ROUTES
// =============================================

// PUT: Mettre à jour statut d'une commission
router.put('/:commissionId/statut', auth, authAdmin, updateStatutCommission);

// GET: Voir toutes les commissions (admin)
router.get('/admin/all', auth, authAdmin, getAllCommissions);

module.exports = router;
