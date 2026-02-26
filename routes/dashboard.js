const express = require('express');
const router = express.Router();
const { authVendeur } = require('../middleware/auth');
const { getDashboard, getStatistiques } = require('../controllers/dashboardController');

// Tableau de bord principal
router.get('/', authVendeur, getDashboard);

// Statistiques détaillées
router.get('/statistiques', authVendeur, getStatistiques);

module.exports = router;
