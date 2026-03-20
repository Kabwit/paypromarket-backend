/**
 * Social Content Generator Service
 * Generates marketing content optimized for social media sharing
 */

class ContentGeneratorService {
  /**
   * Generate optimized content for product sharing on social media
   */
  generateProductContent(product, vendeur) {
    const {
      nom,
      description,
      prix_cdf,
      prix_usd,
      categorie,
      note_moyenne,
      numero_commande
    } = product;

    const vendeurName = vendeur?.nom_boutique || 'Notre boutique';

    // Template content for different platforms
    const content = {
      instagram: {
        caption: this._generateInstagramCaption(nom, description, vendeur),
        hashtags: this._generateHashtags(categorie, nom),
        emojis: true
      },
      tiktok: {
        caption: this._generateTiktokCaption(nom, description, prix_cdf),
        hashtags: this._generateHashtags(categorie, nom, true),
        trending: true
      },
      facebook: {
        title: `🛍️ ${nom} - ${vendeurName}`,
        description: this._generateFacebookDescription(nom, description, prix_cdf, note_moyenne),
        callToAction: 'COMMANDER MAINTENANT'
      },
      whatsapp: {
        message: this._generateWhatsappMessage(nom, prix_cdf, vendeurName)
      },
      telegram: {
        text: this._generateTelegramMessage(nom, description, prix_cdf, vendeurName)
      }
    };

    return {
      product: {
        name: nom,
        category: categorie,
        vendor: vendeurName
      },
      content,
      shareLinks: this._generateShareLinks(product, vendeur)
    };
  }

  /**
   * Generate Instagram-optimized caption
   */
  _generateInstagramCaption(productName, description, vendeur) {
    const callouts = [
      '✨ Découvrez',
      '🎉 Nouveau produit',
      '💎 Exclusif',
      '🔥 Tendance',
      '⭐ Coup de cœur'
    ];

    const cta = [
      'Cliquez le lien en bio 👆',
      'Lien en bio pour commander 💬',
      'Disponible en boutique 🏪',
      'À découvrir maintenant 🚀'
    ];

    const callout = callouts[Math.floor(Math.random() * callouts.length)];
    const ctaText = cta[Math.floor(Math.random() * cta.length)];

    return `${callout}! ${productName}

${description || 'Un produit de qualité'}

${ctaText}

#PayProMarket #Shopping #RDC`;
  }

  /**
   * Generate TikTok-optimized caption
   */
  _generateTiktokCaption(productName, description, price) {
    return `ATTENTION! 👀 ${productName} à ${price || 'prix spécial'}! 🔥

Le produit que vous attendiez! 

#FYP #Discover #Shopping #PayProMarket #Viral #TikTok`;
  }

  /**
   * Generate Facebook description
   */
  _generateFacebookDescription(productName, description, price, rating) {
    const ratingStars = rating ? '⭐'.repeat(Math.round(rating)) : '';
    return `${ratingStars}

${productName}

${description || 'Un excellent produit de qualité'}

Prix: ${price || 'Nous contacter'} CDF

Commandez maintenant sur PayPro Market!`;
  }

  /**
   * Generate WhatsApp message
   */
  _generateWhatsappMessage(productName, price, vendeur) {
    return `👋 Bonjour! 

Je vous propose: *${productName}*
💰 Prix: ${price} CDF

À ${vendeur}
Intéressé? 📱 Cliquez le lien pour plus de détails!`;
  }

  /**
   * Generate Telegram message
   */
  _generateTelegramMessage(productName, description, price, vendeur) {
    return `<b>${productName}</b>

${description || ''}

💵 <b>Prix:</b> ${price} CDF
🏪 <b>Vendeur:</b> ${vendeur}

Commandez maintenant: https://paypromarket.com`;
  }

  /**
   * Generate relevant hashtags
   */
  _generateHashtags(category, productName, isTiktok = false) {
    const genericTags = [
      '#PayProMarket',
      '#Shopping',
      '#RDC',
      '#OnlineShopping',
      '#Ecommerce'
    ];

    const categoryTags = {
      'Electro': ['#Electronique', '#Tech', '#Gadget', '#Innovation'],
      'Mode': ['#Fashion', '#Style', '#Vetements', '#Tendance'],
      'Maison': ['#Deco', '#Interieur', '#Maison', '#DIY'],
      'Beaute': ['#Beauty', '#Soin', '#Cosmétique', '#Beaute'],
      'Sports': ['#Sports', '#Fitness', '#Sante', '#Active'],
      'Alimentaire': ['#Food', '#Cuisine', '#Gourmand', '#Alimentation'],
      'Enfants': ['#Enfants', '#Jouets', '#Bebe', '#Kids']
    };

    let tags = genericTags;
    if (categoryTags[category]) {
      tags = [...tags, ...categoryTags[category]];
    }

    // Add trending TikTok tags
    if (isTiktok) {
      tags = [...tags, '#FYP', '#ForYou', '#Viral', '#Trending', '#Explore'];
    }

    return tags.slice(0, isTiktok ? 15 : 10);
  }

  /**
   * Generate share links for different platforms
   */
  _generateShareLinks(product, vendeur) {
    const {
      id,
      slug,
      nom,
      description
    } = product;

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const productUrl = `${baseUrl}/product/${slug || id}`;

    const shareText = encodeURIComponent(`Regarde: ${nom}`);
    const description_ = encodeURIComponent(description || 'Un super produit sur PayPro Market!');

    return {
      instagram: `https://instagram.com`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${shareText}`,
      twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(productUrl)}`,
      whatsapp: `https://wa.me/?text=${shareText}%20${encodeURIComponent(productUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${shareText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`,
      email: `mailto:?subject=${shareText}&body=${description_}%20${encodeURIComponent(productUrl)}`
    };
  }

  /**
   * Generate QR code content for revendeur
   */
  generateReferralQRContent(revendeur) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const referralUrl = `${baseUrl}?ref=${revendeur.lien_referal}`;

    return {
      url: referralUrl,
      text: `Code de parrainage: ${revendeur.lien_referal}`,
      commission: `${revendeur.commission_percent}% de commission`,
      vendeur: revendeur.nom
    };
  }

  /**
   * Generate campaign performance report
   */
  generateCampaignReport(commandes, utm_campaign) {
    const campaignCommandes = commandes.filter(c => c.utm_campaign === utm_campaign);

    if (campaignCommandes.length === 0) {
      return {
        campaign: utm_campaign,
        message: 'Aucune commande pour cette campagne'
      };
    }

    const totalVentes = campaignCommandes.reduce((sum, c) => sum + (c.montant_total || 0), 0);
    const conversionRate = (campaignCommandes.length / (commandes.length || 1)) * 100;

    return {
      campaign: utm_campaign,
      numberOfOrders: campaignCommandes.length,
      totalRevenue: totalVentes,
      averageOrderValue: totalVentes / campaignCommandes.length,
      conversionRate: conversionRate.toFixed(2),
      topSources: this._getTopSources(campaignCommandes),
      topMedias: this._getTopMedias(campaignCommandes)
    };
  }

  _getTopSources(commandes) {
    const sources = {};
    commandes.forEach(c => {
      const source = c.utm_source || 'direct';
      sources[source] = (sources[source] || 0) + 1;
    });
    return Object.entries(sources)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source, count]) => ({ source, count }));
  }

  _getTopMedias(commandes) {
    const medias = {};
    commandes.forEach(c => {
      const media = c.utm_medium || 'unknown';
      medias[media] = (medias[media] || 0) + 1;
    });
    return Object.entries(medias)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([media, count]) => ({ media, count }));
  }

  /**
   * Generate social share template for revendeur
   */
  generateRevendeurTemplate(revendeur, product) {
    return {
      instagram: {
        caption: `Gagnez ${revendeur.commission_percent}% avec PayPro Market! 💰

Je vous recommande: ${product.nom}

Via mon lien de parrainage, vous obtenez une chance de gagner avec nous!
Rejoignez plus de ${revendeur.nombre_ventes} vendeurs heureux! 🚀

Lien en bio 👆

#Entrepreneur #Ecommerce #Revenu #PayProMarket`,
        hashtags: ['#Opportunity', '#BusinessOnline', '#SideHustle']
      },
      facebook: {
        title: `Devenez Revendeur PayPro Market - ${revendeur.commission_percent}% de commission!`,
        description: `${revendeur.nom} gagne avec PayPro Market. Distribuez ${product.nom} et gagnez ${revendeur.commission_percent}% sur chaque vente!`
      }
    };
  }
}

module.exports = new ContentGeneratorService();
