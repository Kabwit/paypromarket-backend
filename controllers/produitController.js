const { Produit, Vendeur, Notification } = require('../models');
const { Op } = require('sequelize');
const slugify = require('slugify');

// =============================================
// CRÉER UN PRODUIT (vendeur connecté)
// =============================================
exports.createProduit = async (req, res) => {
  try {
    const {
      nom, description, prix_cdf, prix_usd, stock,
      categorie, promotion, pourcentage_promotion,
      delai_preparation, disponible, stock_minimum, unite
    } = req.body;

    // Vérifier la limite de produits du plan
    const vendeur = await Vendeur.findByPk(req.user.id);
    if (!vendeur) return res.status(404).json({ error: 'Vendeur non trouvé' });

    const nbProduits = await Produit.count({ where: { vendeur_id: req.user.id } });
    if (nbProduits >= (vendeur.limite_produits || 20)) {
      return res.status(403).json({
        error: `Limite de produits atteinte (${vendeur.limite_produits || 20}). Passez à un plan supérieur.`,
        plan_actuel: vendeur.plan,
        produits: nbProduits,
        limite: vendeur.limite_produits || 20
      });
    }

    // Générer le slug
    let slug = slugify(nom, { lower: true, strict: true });
    const slugExiste = await Produit.findOne({ where: { slug } });
    if (slugExiste) {
      slug = `${slug}-${Date.now()}`;
    }

    // Gérer les photos uploadées
    let photos = [];
    if (req.files && req.files.length > 0) {
      photos = req.files.map(f => `/uploads/produits/${f.filename}`);
    }

    const produit = await Produit.create({
      vendeur_id: req.user.id,
      nom,
      slug,
      description,
      prix_cdf,
      prix_usd,
      stock: stock || 0,
      stock_minimum: stock_minimum || 5,
      unite: unite || null,
      categorie,
      promotion: promotion || false,
      pourcentage_promotion: pourcentage_promotion || 0,
      delai_preparation: delai_preparation || '24h',
      photos,
      disponible: disponible !== undefined ? disponible : true
    });

    res.status(201).json({
      message: 'Produit créé avec succès',
      produit,
      lien_produit: `/produit/${produit.slug}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// MODIFIER UN PRODUIT (vendeur propriétaire)
// =============================================
exports.updateProduit = async (req, res) => {
  try {
    const produit = await Produit.findOne({
      where: { id: req.params.id, vendeur_id: req.user.id }
    });

    if (!produit) {
      return res.status(404).json({ error: 'Produit non trouvé ou non autorisé' });
    }

    const champsAutorisés = [
      'nom', 'description', 'prix_cdf', 'prix_usd', 'stock',
      'categorie', 'promotion', 'pourcentage_promotion',
      'delai_preparation', 'disponible', 'mis_en_avant'
    ];

    const updates = {};
    champsAutorisés.forEach(champ => {
      if (req.body[champ] !== undefined) {
        updates[champ] = req.body[champ];
      }
    });

    // Si nouvelles photos uploadées
    if (req.files && req.files.length > 0) {
      const nouvellesPhotos = req.files.map(f => `/uploads/produits/${f.filename}`);
      updates.photos = [...(produit.photos || []), ...nouvellesPhotos];
    }

    await produit.update(updates);

    res.status(200).json({
      message: 'Produit mis à jour',
      produit
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// SUPPRIMER UN PRODUIT (vendeur propriétaire)
// =============================================
exports.deleteProduit = async (req, res) => {
  try {
    const produit = await Produit.findOne({
      where: { id: req.params.id, vendeur_id: req.user.id }
    });

    if (!produit) {
      return res.status(404).json({ error: 'Produit non trouvé ou non autorisé' });
    }

    await produit.destroy();
    res.status(200).json({ message: 'Produit supprimé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// OBTENIR MES PRODUITS (vendeur connecté)
// =============================================
exports.getMesProduits = async (req, res) => {
  try {
    const { page = 1, limit = 20, categorie, disponible } = req.query;
    const where = { vendeur_id: req.user.id };

    if (categorie) where.categorie = categorie;
    if (disponible !== undefined) where.disponible = disponible === 'true';

    const offset = (page - 1) * limit;

    const { rows: produits, count: total } = await Produit.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['mis_en_avant', 'DESC'], ['createdAt', 'DESC']]
    });

    res.status(200).json({
      produits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// OBTENIR UN PRODUIT PAR SLUG (public)
// =============================================
exports.getProduitBySlug = async (req, res) => {
  try {
    const produit = await Produit.findOne({
      where: { slug: req.params.slug },
      include: [
        {
          model: Vendeur,
          as: 'vendeur',
          attributes: ['id', 'nom_boutique', 'slug', 'ville', 'telephone', 'logo', 'type_boutique']
        }
      ]
    });

    if (!produit) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Incrémenter les vues
    await produit.increment('vues');

    res.status(200).json(produit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// OBTENIR UN PRODUIT PAR ID (public)
// =============================================
exports.getProduitById = async (req, res) => {
  try {
    const produit = await Produit.findByPk(req.params.id, {
      include: [
        {
          model: Vendeur,
          as: 'vendeur',
          attributes: ['id', 'nom_boutique', 'slug', 'ville', 'telephone', 'logo', 'type_boutique']
        }
      ]
    });

    if (!produit) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    res.status(200).json(produit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// RECHERCHER DES PRODUITS (public)
// =============================================
exports.searchProduits = async (req, res) => {
  try {
    const { q, ville, categorie, prix_min, prix_max, promotion, page = 1, limit = 20 } = req.query;

    const where = { disponible: true };

    if (q) {
      where[Op.or] = [
        { nom: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } }
      ];
    }
    if (categorie) where.categorie = categorie;
    if (promotion === 'true') where.promotion = true;
    if (prix_min) where.prix_cdf = { ...where.prix_cdf, [Op.gte]: parseFloat(prix_min) };
    if (prix_max) where.prix_cdf = { ...where.prix_cdf, [Op.lte]: parseFloat(prix_max) };

    const includeWhere = {};
    if (ville) includeWhere.ville = ville;

    const offset = (page - 1) * limit;

    const { rows: produits, count: total } = await Produit.findAndCountAll({
      where,
      include: [
        {
          model: Vendeur,
          as: 'vendeur',
          attributes: ['id', 'nom_boutique', 'slug', 'ville', 'logo'],
          where: Object.keys(includeWhere).length > 0 ? includeWhere : undefined
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['mis_en_avant', 'DESC'], ['vues', 'DESC'], ['createdAt', 'DESC']]
    });

    res.status(200).json({
      produits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// SUPPRIMER UNE PHOTO D'UN PRODUIT
// =============================================
exports.deletePhoto = async (req, res) => {
  try {
    const produit = await Produit.findOne({
      where: { id: req.params.id, vendeur_id: req.user.id }
    });

    if (!produit) {
      return res.status(404).json({ error: 'Produit non trouvé ou non autorisé' });
    }

    const { photoUrl } = req.body;
    const photos = (produit.photos || []).filter(p => p !== photoUrl);
    await produit.update({ photos });

    res.status(200).json({ message: 'Photo supprimée', photos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};