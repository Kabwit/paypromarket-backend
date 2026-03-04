const { Vendeur, Produit, Notification } = require('../models');
const { Op } = require('sequelize');

// =============================================
// PLANS PREMIUM
// =============================================
const PLANS = {
  gratuit: { limite_produits: 20, prix: 0 },
  premium: { limite_produits: 100, prix: 10 },   // 10 USD/mois
  business: { limite_produits: 500, prix: 25 }    // 25 USD/mois
};

// =============================================
// VENDEUR: VOIR MON PLAN
// =============================================
exports.getMonPlan = async (req, res) => {
  try {
    const vendeur = await Vendeur.findByPk(req.user.id, {
      attributes: ['id', 'plan', 'premium', 'date_expiration_premium', 'limite_produits']
    });
    if (!vendeur) return res.status(404).json({ error: 'Vendeur non trouvé' });

    const nbProduits = await Produit.count({ where: { vendeur_id: req.user.id } });
    const planInfo = PLANS[vendeur.plan] || PLANS.gratuit;

    // Vérifier expiration
    if (vendeur.premium && vendeur.date_expiration_premium && new Date(vendeur.date_expiration_premium) < new Date()) {
      await vendeur.update({ premium: false, plan: 'gratuit', limite_produits: PLANS.gratuit.limite_produits });
      return res.json({
        plan: 'gratuit',
        premium: false,
        expire: true,
        message: 'Votre plan premium a expiré',
        limite_produits: PLANS.gratuit.limite_produits,
        produits_utilises: nbProduits,
        plans_disponibles: PLANS
      });
    }

    res.json({
      plan: vendeur.plan,
      premium: vendeur.premium,
      date_expiration: vendeur.date_expiration_premium,
      limite_produits: vendeur.limite_produits,
      produits_utilises: nbProduits,
      produits_restants: vendeur.limite_produits - nbProduits,
      plans_disponibles: PLANS
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// VENDEUR: SOUSCRIRE UN PLAN
// =============================================
exports.souscrirePlan = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ error: 'Plan invalide', plans_disponibles: Object.keys(PLANS) });
    }
    if (plan === 'gratuit') {
      return res.status(400).json({ error: 'Utilisez /annuler pour revenir au plan gratuit' });
    }

    const vendeur = await Vendeur.findByPk(req.user.id);
    if (!vendeur) return res.status(404).json({ error: 'Vendeur non trouvé' });

    // Calculer la date d'expiration (30 jours)
    const dateExpiration = new Date();
    dateExpiration.setDate(dateExpiration.getDate() + 30);

    await vendeur.update({
      plan,
      premium: true,
      date_expiration_premium: dateExpiration,
      limite_produits: PLANS[plan].limite_produits
    });

    // Notification
    await Notification.create({
      destinataire_type: 'vendeur',
      destinataire_id: vendeur.id,
      titre: 'Plan premium activé',
      message: `Votre plan ${plan} a été activé. Vous pouvez maintenant publier jusqu'à ${PLANS[plan].limite_produits} produits.`,
      type: 'système',
      donnees: { plan, expire: dateExpiration }
    });

    res.json({
      message: `Plan ${plan} activé avec succès`,
      plan,
      limite_produits: PLANS[plan].limite_produits,
      date_expiration: dateExpiration
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// VENDEUR: ANNULER PLAN PREMIUM
// =============================================
exports.annulerPlan = async (req, res) => {
  try {
    const vendeur = await Vendeur.findByPk(req.user.id);
    if (!vendeur) return res.status(404).json({ error: 'Vendeur non trouvé' });

    if (vendeur.plan === 'gratuit') {
      return res.status(400).json({ error: 'Vous êtes déjà sur le plan gratuit' });
    }

    // Vérifier si le nombre de produits dépasse la limite gratuite
    const nbProduits = await Produit.count({ where: { vendeur_id: req.user.id } });
    if (nbProduits > PLANS.gratuit.limite_produits) {
      return res.status(400).json({
        error: `Vous avez ${nbProduits} produits. Le plan gratuit est limité à ${PLANS.gratuit.limite_produits}. Supprimez des produits d'abord.`
      });
    }

    await vendeur.update({
      plan: 'gratuit',
      premium: false,
      date_expiration_premium: null,
      limite_produits: PLANS.gratuit.limite_produits
    });

    res.json({ message: 'Plan annulé, retour au plan gratuit', plan: 'gratuit' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// ADMIN: ATTRIBUER UN PLAN À UN VENDEUR
// =============================================
exports.attribuerPlan = async (req, res) => {
  try {
    const { plan, duree_jours } = req.body;
    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ error: 'Plan invalide' });
    }

    const vendeur = await Vendeur.findByPk(req.params.vendeurId);
    if (!vendeur) return res.status(404).json({ error: 'Vendeur non trouvé' });

    const dateExpiration = new Date();
    dateExpiration.setDate(dateExpiration.getDate() + (duree_jours || 30));

    await vendeur.update({
      plan,
      premium: plan !== 'gratuit',
      date_expiration_premium: plan !== 'gratuit' ? dateExpiration : null,
      limite_produits: PLANS[plan].limite_produits
    });

    await Notification.create({
      destinataire_type: 'vendeur',
      destinataire_id: vendeur.id,
      titre: 'Plan mis à jour',
      message: `Votre plan a été mis à jour en ${plan} par l'administration.`,
      type: 'système',
      donnees: { plan, expire: dateExpiration }
    });

    res.json({ message: `Plan ${plan} attribué à ${vendeur.nom_boutique}`, vendeur_id: vendeur.id, plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// ALERTES STOCK
// =============================================
exports.verifierStocksBas = async (req, res) => {
  try {
    const vendeur_id = req.user.id;

    const produitsStockBas = await Produit.findAll({
      where: {
        vendeur_id,
        disponible: true,
        stock: { [Op.lte]: require('sequelize').col('stock_minimum') }
      },
      attributes: ['id', 'nom', 'stock', 'stock_minimum', 'unite'],
      order: [['stock', 'ASC']]
    });

    const produitsRupture = produitsStockBas.filter(p => p.stock <= 0);
    const produitsAlerte = produitsStockBas.filter(p => p.stock > 0);

    res.json({
      alerte: produitsStockBas.length > 0,
      rupture: produitsRupture,
      stock_bas: produitsAlerte,
      total_alertes: produitsStockBas.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
