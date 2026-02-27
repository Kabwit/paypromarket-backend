const express = require('express');
const router = express.Router();
const { authAdmin, authSuperAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// =============================================
// AUTH ADMIN (pas besoin d'être authentifié)
// =============================================
router.post('/login', adminController.loginAdmin);

// =============================================
// ROUTES PROTÉGÉES (admin authentifié)
// =============================================

// Profil admin
router.get('/profile', authAdmin, adminController.getAdminProfile);

// Dashboard global
router.get('/dashboard', authAdmin, adminController.getDashboardStats);

// --- VENDEURS ---
router.get('/vendeurs', authAdmin, adminController.getAllVendeurs);
router.get('/vendeurs/:id', authAdmin, adminController.getVendeurDetail);
router.patch('/vendeurs/:id/toggle', authAdmin, adminController.toggleVendeurActif);
router.delete('/vendeurs/:id', authAdmin, adminController.deleteVendeur);

// --- CLIENTS ---
router.get('/clients', authAdmin, adminController.getAllClients);
router.get('/clients/:id', authAdmin, adminController.getClientDetail);
router.patch('/clients/:id/toggle', authAdmin, adminController.toggleClientActif);
router.delete('/clients/:id', authAdmin, adminController.deleteClient);

// --- PRODUITS ---
router.get('/produits', authAdmin, adminController.getAllProduits);
router.patch('/produits/:id/toggle', authAdmin, adminController.toggleProduitDisponible);
router.delete('/produits/:id', authAdmin, adminController.deleteProduit);

// --- COMMANDES ---
router.get('/commandes', authAdmin, adminController.getAllCommandes);
router.patch('/commandes/:id/statut', authAdmin, adminController.updateCommandeStatut);

// --- PAIEMENTS ---
router.get('/paiements', authAdmin, adminController.getAllPaiements);

// --- NOTIFICATIONS ---
router.post('/notifications', authAdmin, adminController.sendNotification);

// =============================================
// ROUTES SUPER ADMIN (gestion des admins)
// =============================================
router.post('/admins', authSuperAdmin, adminController.createAdmin);
router.get('/admins', authSuperAdmin, adminController.getAllAdmins);
router.delete('/admins/:id', authSuperAdmin, adminController.deleteAdmin);

module.exports = router;
