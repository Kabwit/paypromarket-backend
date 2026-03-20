/**
 * Middleware: Capture & Store UTM Parameters for Social Tracking
 * Intercept requests avec utm_source, utm_campaign, etc et les associe à la session
 */

const trackUTMParams = (req, res, next) => {
  // Récupérer les paramètres UTM de la requête
  const utmParams = {
    utm_source: req.query.utm_source || req.body.utm_source || null,
    utm_medium: req.query.utm_medium || req.body.utm_medium || null,
    utm_campaign: req.query.utm_campaign || req.body.utm_campaign || null,
    utm_content: req.query.utm_content || req.body.utm_content || null,
    ref: req.query.ref || req.query.share || null,  // référral ou share token
  };

  // Stocker dans la session/context request pour utilisation ultérieure
  req.utmData = utmParams;

  // Optionnel: Enregistrer le referer
  const referer = req.get('referer');
  if (referer) {
    if (referer.includes('facebook.com')) req.utmData.utm_source = 'facebook';
    else if (referer.includes('instagram.com')) req.utmData.utm_source = 'instagram';
    else if (referer.includes('whatsapp')) req.utmData.utm_source = 'whatsapp';
    else if (referer.includes('t.me')) req.utmData.utm_source = 'telegram';
    else if (referer.includes('tiktok.com')) req.utmData.utm_source = 'tiktok';
    else if (referer.includes('twitter.com')) req.utmData.utm_source = 'twitter';
  }

  // Déterminer le canal de vente (pour la colonne canal_vente dans Commande)
  req.utmData.canal_vente = determineChannel(req.utmData);

  // Logger pour analytics (optionnel)
  if (utmParams.utm_source || utmParams.ref) {
    console.log(`[UTM TRACKED] Source: ${utmParams.utm_source}, Medium: ${utmParams.utm_medium}, Ref: ${utmParams.ref}`);
  }

  next();
};

/**
 * Déterminer le canal de vente basé sur les UTM params
 */
function determineChannel(utmData) {
  if (utmData.ref) return 'referral';
  
  const source = utmData.utm_source?.toLowerCase() || '';
  
  if (source === 'facebook') return 'social';
  if (source === 'instagram') return 'social';
  if (source === 'whatsapp') return 'social';
  if (source === 'tiktok') return 'social';
  if (source === 'telegram') return 'social';
  if (source === 'affiliate') return 'revendeur';
  if (source === 'search') return 'search';
  if (utmData.utm_medium === 'organic') return 'social';
  if (utmData.utm_medium === 'referral') return 'referral';
  if (utmData.utm_medium === 'cpc' || utmData.utm_medium === 'cpm') return 'ads';
  
  return 'direct';
}

/**
 * Applique les UTM params à une commande lors de sa création
 */
const applyUTMToOrder = (orderData, utmData) => {
  if (!utmData) return orderData;
  
  return {
    ...orderData,
    utm_source: utmData.utm_source,
    utm_campaign: utmData.utm_campaign,
    utm_medium: utmData.utm_medium,
    canal_vente: utmData.canal_vente,
    lien_referal_utilise: utmData.ref || null,
    shared_by_date: utmData.utm_source ? new Date() : null,
  };
};

module.exports = {
  trackUTMParams,
  applyUTMToOrder,
  determineChannel,
};
