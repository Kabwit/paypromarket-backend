const crypto = require('crypto');

class SocialSharingService {
  /**
   * Génère un lien unique pour partager un produit
   * Format: {FRONTEND_URL}/product/{slug}?ref={share_token}&utm_source={source}&utm_campaign={campaign}
   */
  generateProductShareLink(product, vendeur, source = 'direct') {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareToken = this._generateShareToken(product.id, vendeur.id);
    
    return {
      product_id: product.id,
      product_slug: product.slug,
      product_name: product.nom,
      share_token: shareToken,
      
      links: {
        direct: `${frontendUrl}/product/${product.slug}?share=${shareToken}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(this._generateWhatsAppMessage(product, vendeur, shareToken, frontendUrl))}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${frontendUrl}/product/${product.slug}?share=${shareToken}`)}`,
        instagram: this._generateInstagramShareLink(product, vendeur),
        tiktok: this._generateTikTokShareLink(product, vendeur),
        telegram: `https://t.me/share/url?url=${encodeURIComponent(`${frontendUrl}/product/${product.slug}?share=${shareToken}`)}&text=${encodeURIComponent(product.nom)}`,
        email: this._generateEmailShareLink(product, vendeur, shareToken, frontendUrl),
      },
      
      utm_params: {
        source: source,
        medium: 'social',
        campaign: `product_${product.id}_${Date.now()}`,
        content: `${vendeur.nom}_${product.nom}`,
      },
      
      tracking: {
        create_at: new Date(),
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 jours
        qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${frontendUrl}/product/${product.slug}?share=${shareToken}`)}`
      }
    };
  }

  /**
   * Génère un lien unique pour partager toute la boutique (vitrine)
   */
  generateShopShareLink(vendeur) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareToken = this._generateShareToken(vendeur.id, vendeur.id, 'shop');
    
    return {
      vendeur_id: vendeur.id,
      vendeur_name: vendeur.nom,
      shop_token: shareToken,
      
      links: {
        direct: `${frontendUrl}/shop/${vendeur.slug || vendeur.id}?share=${shareToken}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`Découvre ma boutique ${vendeur.nom} sur PayPro Market 🛍️\n${frontendUrl}/shop/${vendeur.slug}?share=${shareToken}`)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${frontendUrl}/shop/${vendeur.slug}?share=${shareToken}`)}`,
        instagram: `Visite ma boutique ${vendeur.nom} sur PayPro Market 🏪\n${frontendUrl}/shop/${vendeur.slug}?share=${shareToken}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(`${frontendUrl}/shop/${vendeur.slug}?share=${shareToken}`)}&text=${encodeURIComponent(`Boutique: ${vendeur.nom}`)}`,
      },
      
      qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${frontendUrl}/shop/${vendeur.slug}?share=${shareToken}`)}`,
      created_at: new Date(),
    };
  }

  /**
   * Génère un lien d'affiliation pour revendeurs
   */
  generateAffiliateLink(revendeur, product = null) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    if (product) {
      return {
        product_link: `${frontendUrl}/product/${product.slug}?ref=${revendeur.lien_referal}&utm_source=affiliate&utm_medium=referral&utm_campaign=${revendeur.id}`,
        qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${frontendUrl}/product/${product.slug}?ref=${revendeur.lien_referal}`)}`
      };
    }
    
    // Lien général pour les produits du revendeur
    return {
      affiliate_link: `${frontendUrl}?ref=${revendeur.lien_referal}&utm_source=affiliate&utm_medium=referral`,
      qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${frontendUrl}?ref=${revendeur.lien_referal}`)}`
    };
  }

  /**
   * Génère une image prête pour les réseaux sociaux
   * (intégration avec génération d'images nécessaire)
   */
  async generateSocialImage(product, vendeur, platform = 'instagram') {
    // Placeholder - implémenter avec library comme canvas ou sharp
    return {
      platform,
      product_name: product.nom,
      vendor_name: vendeur.nom,
      price: product.prix,
      image_url: `/api/produits/${product.id}/social-image/${platform}`,
      dimensions: this._getPlatformDimensions(platform),
      formats: {
        instagram: '1081x1350px (feed) or 1080x1920px (story)',
        facebook: '1200x628px',
        tiktok: '1080x1920px',
        whatsapp: '1440x1440px',
      }
    };
  }

  /**
   * Enregistre un partage (analytics)
   */
  async recordShare(produitId, vendeaurId, source, platform, ipAddress = null) {
    return {
      produit_id: produitId,
      vendeur_id: vendeaurId,
      source,           // 'direct', 'affiliate', 'vendor'
      platform,         // 'whatsapp', 'facebook', 'instagram', etc
      ip_address: ipAddress,
      timestamp: new Date(),
      utm_trace: {
        utm_source: source,
        utm_medium: platform,
        utm_campaign: `share_${produitId}_${Date.now()}`
      }
    };
  }

  /**
   * Obtient les statistiques de partage et performance
   */
  async getShareAnalytics(vendeurId, period = '30d') {
    const startDate = this._getPeriodStartDate(period);
    
    return {
      vendor_id: vendeurId,
      period,
      timeframe: {
        start: startDate,
        end: new Date(),
      },
      metrics: {
        total_shares: 0,        // À récupérer de la DB
        shares_by_platform: {
          whatsapp: 0,
          facebook: 0,
          instagram: 0,
          tiktok: 0,
          direct: 0,
          other: 0,
        },
        shares_by_product: [],  // Top produits partagés
        conversion_rate: 0,     // Shares → Orders
        revenue_from_shares: 0, // Revenue provenant des partages
      }
    };
  }

  /**
   * Récupère les détails du tracking pour une commande
   */
  getOrderTrackingSource(commande) {
    return {
      commande_id: commande.id,
      source: commande.utm_source || 'direct',
      medium: commande.utm_medium || 'organic',
      campaign: commande.utm_campaign,
      referrer: commande.lien_referal_utilise,
      canal: commande.canal_vente || 'direct',
      shared_by_date: commande.shared_by_date,
      attribution: this._getAttributionModel(commande),
    };
  }

  /**
   * Génère un rapport d'attribution (d'où viennent les ventes)
   */
  async generateAttributionReport(vendeurId, startDate, endDate) {
    return {
      vendor_id: vendeurId,
      period: { start: startDate, end: endDate },
      channels: {
        direct: {
          orders: 0,
          revenue: 0,
          percentage: 0,
          description: 'Clients ayant trouvé directement'
        },
        whatsapp: {
          orders: 0,
          revenue: 0,
          percentage: 0,
          description: 'Partagé via WhatsApp'
        },
        facebook: {
          orders: 0,
          revenue: 0,
          percentage: 0,
          description: 'Partagé via Facebook'
        },
        instagram: {
          orders: 0,
          revenue: 0,
          percentage: 0,
          description: 'Partagé via Instagram'
        },
        tiktok: {
          orders: 0,
          revenue: 0,
          percentage: 0,
          description: 'Partagé via TikTok'
        },
        referral: {
          orders: 0,
          revenue: 0,
          percentage: 0,
          description: 'Provenant d\'un revendeur'
        },
        search: {
          orders: 0,
          revenue: 0,
          percentage: 0,
          description: 'Trouvé via recherche'
        }
      }
    };
  }

  /**
   * Génère un template de partage pour revendeur
   */
  generateRevendeurShareTemplate(revendeur, products = []) {
    return {
      revendeur_id: revendeur.id,
      revendeur_name: revendeur.nom,
      affiliate_link: revendeur.lien_referal,
      
      templates: {
        whatsapp: {
          title: 'Template WhatsApp',
          message: `Coucou! 👋\n\nDécouvre mes produits sur PayPro Market 🛍️\n${products.map(p => `• ${p.nom} - ${p.prix}$`).join('\n')}\n\nClique ici: ${process.env.FRONTEND_URL}?ref=${revendeur.lien_referal}`,
          call_to_action: 'Commander maintenant'
        },
        facebook: {
          title: 'Template Facebook',
          message: `Besoin de ${products[0]?.nom || 'qualité'}? 🎯\n\nJe te propose les meilleurs produits avec livraison rapide!\n\n`,
          call_to_action: 'Voir mon catalogue'
        },
        instagram: {
          title: 'Template Instagram Story',
          caption: `Swipe up pour découvrir mes produits! 📱\n💚 Qualité garantie\n⚡ Livraison rapide\n✨ Meilleur prix`,
          hashtags: '#PayProMarket #Local #Shopping #RDC'
        },
        telegram: {
          title: 'Template Telegram',
          message: `🛍️ Bienvenue sur ma boutique\n\nDécouvre une sélection de produits de qualité avec livraison à domicile.\n\nRefClick ici pour explorer: https://t.me/share/url?url=${process.env.FRONTEND_URL}?ref=${revendeur.lien_referal}`
        }
      },

      performance_tracking: {
        link: revendeur.lien_referal,
        monitor_at: `${process.env.FRONTEND_URL}/dashboard/revendeur/${revendeur.id}`,
        metrics: ['Total cliques', 'Conversions', 'Revenu', 'Commission']
      }
    };
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  _generateShareToken(entityId, vendeurId, type = 'product') {
    const data = `${entityId}-${vendeurId}-${type}-${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  _generateWhatsAppMessage(product, vendeur, shareToken, frontendUrl) {
    return `👋 Découvre: *${product.nom}*

💚 ${vendeur.nom}
💰 Prix: ${product.prix}$ 
📦 Livraison rapide

Clique ici pour commander:
${frontendUrl}/product/${product.slug}?share=${shareToken}

Envoyé via PayPro Market 🚀`;
  }

  _generateInstagramShareLink(product, vendeur) {
    return `Visite PayPro Market!\n\n${product.nom}\nPrix: ${product.prix}$\nVendeur: ${vendeur.nom}\n\nLien en bio! 🔗`;
  }

  _generateTikTokShareLink(product, vendeur) {
    return `Disponible sur PayPro Market 🎯\n\n${product.nom} - ${product.prix}$\nPar: ${vendeur.nom}\n\n#PayProMarket #Shopping #RDC`;
  }

  _generateEmailShareLink(product, vendeur, shareToken, frontendUrl) {
    const subject = `${vendeur.nom} te partage: ${product.nom}`;
    const body = `Découvre ce produit sur PayPro Market:\n\n${product.nom}\nPrix: ${product.prix}$\n\n${frontendUrl}/product/${product.slug}?share=${shareToken}`;
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  _getPlatformDimensions(platform) {
    const dimensions = {
      instagram: { feed: '1081x1350', story: '1080x1920' },
      facebook: '1200x628',
      tiktok: '1080x1920',
      whatsapp: '1440x1440',
      pinterest: '1000x1500',
    };
    return dimensions[platform] || '1080x1080';
  }

  _getPeriodStartDate(period) {
    const now = new Date();
    const map = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    const days = map[period] || 30;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  _getAttributionModel(commande) {
    const source = commande.utm_source || 'direct';
    const models = {
      direct: 'Accès direct à l\'application',
      whatsapp: 'Partagé via WhatsApp',
      facebook: 'Découvert sur Facebook',
      instagram: 'Découvert sur Instagram',
      tiktok: 'Découvert sur TikTok',
      affiliate: 'Partagé par un revendeur',
      search: 'Trouvé via recherche',
      referral: 'Recommandation client',
    };
    return models[source] || 'Autre';
  }
}

module.exports = new SocialSharingService();
