const express = require('express');
const router = express.Router();
const {
  getProductShareLinks,
  getShopShareLinks,
  generateSocialPost,
  recordProductShare,
  getSalesAttribution,
  getShareAnalytics,
  getRevendeurShareTemplate,
} = require('../controllers/sharingController');
const { auth, authVendeur } = require('../middleware/auth');
const { trackUTMParams } = require('../middleware/socialTracking');

// Appliquer le tracking UTM sur toutes les routes de partage
router.use(trackUTMParams);

// =============================================
// PUBLIC ROUTES (Pas d'auth requis)
// =============================================

// GET: Lien de partage d'un produit
// Exemple: GET /api/sharing/product/1/links?platform=whatsapp
router.get('/product/:produitId/links', getProductShareLinks);

// POST: Enregistrer un partage (pour analytics)
// Exemple: POST /api/sharing/product/1/record avec { platform: 'whatsapp', source: 'direct' }
router.post('/product/:produitId/record', recordProductShare);

// GET: Lien de partage d'une boutique complète
// Exemple: GET /api/sharing/shop/1/links
router.get('/shop/:vendeurId/links', getShopShareLinks);

// POST: Générer contenu social automatique
// Exemple: POST /api/sharing/product/1/social-post avec { platform: 'instagram' }
router.post('/product/:produitId/social-post', generateSocialPost);

// =============================================
// VENDEUR ROUTES (Require authentification vendeur)
// =============================================

// GET: Analytics de partage pour vendeur
// Exemple: GET /api/sharing/analytics/vendeur/1
router.get('/analytics/vendeur/:vendeurId', auth, getSalesAnalytics);

// GET: D'où viennent les ventes (Attribution Model)
// Exemple: GET /api/sharing/attribution/vendeur/1?startDate=2026-01-01&endDate=2026-03-31
router.get('/attribution/vendeur/:vendeurId', auth, getSalesAttribution);

// GET: Statistiques globales de partage
// Exemple: GET /api/sharing/stats/vendeur/1?period=30d
router.get('/stats/vendeur/:vendeurId', auth, getShareAnalytics);

// =============================================
// REVENDEUR ROUTES
// =============================================

// GET: Template de partage pour revendeur
// Exemple: GET /api/sharing/template/revendeur/5
router.get('/template/revendeur/:revendeurId', getRevendeurShareTemplate);

module.exports = router;

// =============================================
// ALTERNATIVE CONTROLLER (getSalesAnalytics)
// =============================================
async function getSalesAnalytics(req, res) {
  try {
    const { vendeurId } = req.params;
    const { period = '30d' } = req.query;

    // Utiliser le service de sharing pour obtenir les analytics
    const analytics = await require('../services/socialSharingService').getShareAnalytics(vendeurId, period);

    res.json({
      success: true,
      vendor_id: vendeurId,
      period,
      analytics,
      dashboard_url: `/api/dashboard/sharing?vendor_id=${vendeurId}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
