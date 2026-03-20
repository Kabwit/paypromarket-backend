const { Produit, Vendeur, Commande, Commission } = require('../models');
const socialSharingService = require('../services/socialSharingService');
const contentGeneratorService = require('../services/contentGeneratorService');

// =============================================
// PARTAGE DE PRODUIT
// =============================================
exports.getProductShareLinks = async (req, res) => {
  try {
    const { produitId } = req.params;
    const { platform } = req.query;

    const product = await Produit.findByPk(produitId, {
      include: [{ model: Vendeur, as: 'vendeur' }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Générer les liens de partage
    const shareLinks = socialSharingService.generateProductShareLink(
      product,
      product.vendeur,
      platform || 'direct'
    );

    // Générer aussi le contenu pour les réseaux
    const socialContent = contentGeneratorService.generateProductContent(product, product.vendeur);

    res.json({
      success: true,
      product: {
        id: product.id,
        nom: product.nom,
        prix: product.prix,
        slug: product.slug,
      },
      share_links: shareLinks,
      social_content: socialContent,
      tracking: {
        message: 'Tous les cliques via ces liens seront trackés',
        qr_code: shareLinks.tracking.qr_code_url,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// PARTAGE DE BOUTIQUE (VITRINE COMPLÈTE)
// =============================================
exports.getShopShareLinks = async (req, res) => {
  try {
    const { vendeurId } = req.params;

    const vendeur = await Vendeur.findByPk(vendeurId, {
      include: [{ model: Produit, as: 'produits', limit: 5 }]
    });

    if (!vendeur) {
      return res.status(404).json({ error: 'Vendeur non trouvé' });
    }

    const shopShareLinks = socialSharingService.generateShopShareLink(vendeur);

    res.json({
      success: true,
      shop: {
        name: vendeur.nom,
        products_count: vendeur.produits.length,
      },
      share_links: shopShareLinks,
      featured_products: vendeur.produits.map(p => ({
        id: p.id,
        nom: p.nom,
        prix: p.prix
      })),
      tracking: {
        qr_code: shopShareLinks.qr_code,
        monitor_url: `/api/vitrine/${vendeurId}/analytics`
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// GÉNÉRER CONTENU SOCIAL (Images/Templates)
// =============================================
exports.generateSocialPost = async (req, res) => {
  try {
    const { produitId } = req.params;
    const { platform = 'instagram' } = req.body;

    const product = await Produit.findByPk(produitId, {
      include: [{ model: Vendeur, as: 'vendeur' }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Générer le contenu social
    const socialContent = contentGeneratorService.generateProductContent(product, product.vendeur);
    
    // Générer l'image/template
    const socialImage = await socialSharingService.generateSocialImage(product, product.vendeur, platform);

    res.json({
      success: true,
      platform,
      content: socialContent[platform.toLowerCase()] || socialContent.instagram,
      image: socialImage,
      download_url: `/api/produits/${produitId}/social-image?platform=${platform}`,
      dimensions: socialImage.dimensions,
      ready_to_share: true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// ENREGISTRER UN PARTAGE (Analytics)
// =============================================
exports.recordProductShare = async (req, res) => {
  try {
    const { produitId } = req.params;
    const { platform, source } = req.body;

    const product = await Produit.findByPk(produitId);
    
    if (!product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Enregistrer le partage
    const share = await socialSharingService.recordShare(
      produitId,
      product.vendeur_id,
      source || 'direct',
      platform,
      req.ip
    );

    res.json({
      success: true,
      message: 'Partage enregistré pour analytics',
      share,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// ANALYTICS: D'OÙ VIENNENT LES VENTES (Attribution)
// =============================================
exports.getSalesAttribution = async (req, res) => {
  try {
    const { vendeurId } = req.params;
    const { startDate, endDate, limit = 10 } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Récupérer les commandes du vendeur par source
    const commandes = await Commande.findAll({
      where: {
        vendeur_id: vendeurId,
        createdAt: { [require('sequelize').Op.between]: [start, end] }
      },
      attributes: ['id', 'montant_total', 'utm_source', 'utm_campaign', 'canal_vente', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    // Grouper par source
    const attributionData = {
      total_orders: commandes.length,
      total_revenue: commandes.reduce((sum, c) => sum + (c.montant_total || 0), 0),
      by_source: {},
      by_channel: {},
      top_campaigns: {},
    };

    commandes.forEach(order => {
      const source = order.utm_source || 'direct';
      const channel = order.canal_vente || 'direct';
      const campaign = order.utm_campaign || 'other';

      // By Source
      if (!attributionData.by_source[source]) {
        attributionData.by_source[source] = { orders: 0, revenue: 0 };
      }
      attributionData.by_source[source].orders++;
      attributionData.by_source[source].revenue += order.montant_total || 0;

      // By Channel
      if (!attributionData.by_channel[channel]) {
        attributionData.by_channel[channel] = { orders: 0, revenue: 0 };
      }
      attributionData.by_channel[channel].orders++;
      attributionData.by_channel[channel].revenue += order.montant_total || 0;

      // Top Campaigns
      if (!attributionData.top_campaigns[campaign]) {
        attributionData.top_campaigns[campaign] = { orders: 0, revenue: 0 };
      }
      attributionData.top_campaigns[campaign].orders++;
      attributionData.top_campaigns[campaign].revenue += order.montant_total || 0;
    });

    // Calculer les pourcentages
    Object.keys(attributionData.by_source).forEach(source => {
      attributionData.by_source[source].percentage = 
        ((attributionData.by_source[source].orders / attributionData.total_orders) * 100).toFixed(2);
    });

    res.json({
      success: true,
      vendor_id: vendeurId,
      period: { start, end },
      attribution: attributionData,
      recommendations: generateRecommendations(attributionData),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// VOIR LES STATISTIQUES DE PARTAGE
// =============================================
exports.getShareAnalytics = async (req, res) => {
  try {
    const { vendeurId } = req.params;
    const { period = '30d' } = req.query;

    const analytics = await socialSharingService.getShareAnalytics(vendeurId, period);

    res.json({
      success: true,
      vendor_id: vendeurId,
      analytics,
      insights: [
        'Utilisez WhatsApp et Facebook pour les meilleurs résultats',
        'Les produits avec images attirent plus de cliques',
        'Relancer les partages le matin et soir pour plus de visibilité',
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// TEMPLATE DE PARTAGE POUR REVENDEURS
// =============================================
exports.getRevendeurShareTemplate = async (req, res) => {
  try {
    const { revendeurId } = req.params;

    const revendeur = require('../models').Revendeur.findByPk(revendeurId, {
      include: [{
        model: require('../models').Produit,
        as: 'produits_promus',
        limit: 3
      }]
    });

    const template = socialSharingService.generateRevendeurShareTemplate(revendeur);

    res.json({
      success: true,
      template,
      copy_paste_ready: true,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// HELPER FUNCTIONS
// =============================================

function generateRecommendations(attributionData) {
  const recommendations = [];

  // Trouver le meilleur canal
  const channels = Object.entries(attributionData.by_channel).sort((a, b) => b[1].revenue - a[1].revenue);
  if (channels.length > 0) {
    recommendations.push(`✅ Votre meilleur canal: ${channels[0][0]} (${channels[0][1].percentage || 20}%)`);
  }

  // Identifier les bons produits
  if (attributionData.total_revenue > 1000) {
    recommendations.push('💡 Continuez à partager! Vos ventes augmentent');
  } else {
    recommendations.push('📣 Augmentez vos partages sur WhatsApp et Facebook');
  }

  // Timing
  recommendations.push('⏰ Partagez le matin (7-9h) et le soir (19-21h)');
  
  return recommendations;
}

module.exports = exports;
