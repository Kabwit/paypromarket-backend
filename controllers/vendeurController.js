const { Vendeur, Produit, Commande, ZoneLivraison } = require('../models');
const { Op } = require('sequelize');

// =============================================
// OBTENIR LE PROFIL VENDEUR (connecté)
// =============================================
exports.getMonProfil = async (req, res) => {
  try {
    const vendeur = await Vendeur.findByPk(req.user.id, {
      attributes: { exclude: ['mot_de_passe'] },
      include: [
        { model: ZoneLivraison, as: 'zones_livraison' }
      ]
    });

    if (!vendeur) {
      return res.status(404).json({ error: 'Vendeur non trouvé' });
    }

    res.status(200).json(vendeur);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// METTRE À JOUR LE PROFIL VENDEUR
// =============================================
exports.updateProfil = async (req, res) => {
  try {
    const vendeur = await Vendeur.findByPk(req.user.id);
    if (!vendeur) {
      return res.status(404).json({ error: 'Vendeur non trouvé' });
    }

    const champsAutorisés = [
      'nom_boutique', 'description', 'ville', 'langue',
      'categorie_boutique', 'adresse', 'mode_livraison', 'theme'
    ];

    const updates = {};
    champsAutorisés.forEach(champ => {
      if (req.body[champ] !== undefined) {
        updates[champ] = req.body[champ];
      }
    });

    await vendeur.update(updates);

    const vendeurResponse = vendeur.toJSON();
    delete vendeurResponse.mot_de_passe;

    res.status(200).json({
      message: 'Profil mis à jour',
      vendeur: vendeurResponse
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// UPLOAD LOGO BOUTIQUE
// =============================================
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier envoyé' });
    }

    const vendeur = await Vendeur.findByPk(req.user.id);
    if (!vendeur) {
      return res.status(404).json({ error: 'Vendeur non trouvé' });
    }

    const logoUrl = `/uploads/logos/${req.file.filename}`;
    await vendeur.update({ logo: logoUrl });

    res.status(200).json({
      message: 'Logo mis à jour',
      logo: logoUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// OBTENIR UNE BOUTIQUE PAR SLUG (public)
// =============================================
exports.getBoutiqueBySlug = async (req, res) => {
  try {
    const vendeur = await Vendeur.findOne({
      where: { slug: req.params.slug, actif: true },
      attributes: { exclude: ['mot_de_passe'] },
      include: [
        {
          model: Produit,
          as: 'produits',
          where: { disponible: true },
          required: false,
          order: [['mis_en_avant', 'DESC'], ['createdAt', 'DESC']]
        }
      ]
    });

    if (!vendeur) {
      return res.status(404).json({ error: 'Boutique non trouvée' });
    }

    res.status(200).json(vendeur);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// LISTER TOUTES LES BOUTIQUES (public)
// =============================================
exports.getBoutiques = async (req, res) => {
  try {
    const { ville, categorie, type, page = 1, limit = 20, search } = req.query;

    const where = { actif: true };
    if (ville) where.ville = ville;
    if (categorie) where.categorie_boutique = categorie;
    if (type) where.type_boutique = type;
    if (search) {
      where.nom_boutique = { [Op.iLike]: `%${search}%` };
    }

    const offset = (page - 1) * limit;

    const { rows: boutiques, count: total } = await Vendeur.findAndCountAll({
      where,
      attributes: { exclude: ['mot_de_passe'] },
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      boutiques,
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
// METTRE À JOUR LE THÈME DE LA BOUTIQUE
// =============================================
exports.updateTheme = async (req, res) => {
  try {
    const vendeur = await Vendeur.findByPk(req.user.id);
    if (!vendeur) {
      return res.status(404).json({ error: 'Vendeur non trouvé' });
    }

    const currentTheme = vendeur.theme || {};
    const newTheme = { ...currentTheme, ...req.body };

    // Valider les valeurs autorisées
    const policesAutorisees = ['Inter', 'Poppins', 'Roboto', 'Montserrat', 'Playfair Display'];
    const affichagesAutorisés = ['grille', 'liste', 'grande_grille'];
    const stylesHero = ['gradient', 'image', 'minimal'];

    if (newTheme.police && !policesAutorisees.includes(newTheme.police)) {
      newTheme.police = 'Inter';
    }
    if (newTheme.affichage_produits && !affichagesAutorisés.includes(newTheme.affichage_produits)) {
      newTheme.affichage_produits = 'grille';
    }
    if (newTheme.style_hero && !stylesHero.includes(newTheme.style_hero)) {
      newTheme.style_hero = 'gradient';
    }
    if (newTheme.colonnes_produits) {
      newTheme.colonnes_produits = Math.max(1, Math.min(4, parseInt(newTheme.colonnes_produits) || 2));
    }
    if (newTheme.arrondi_cartes !== undefined) {
      newTheme.arrondi_cartes = Math.max(0, Math.min(30, parseInt(newTheme.arrondi_cartes) || 12));
    }

    await vendeur.update({ theme: newTheme });

    res.status(200).json({
      message: 'Thème mis à jour',
      theme: newTheme
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// GÉRER LES ZONES DE LIVRAISON
// =============================================
exports.addZoneLivraison = async (req, res) => {
  try {
    const zone = await ZoneLivraison.create({
      ...req.body,
      vendeur_id: req.user.id
    });
    res.status(201).json(zone);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getZonesLivraison = async (req, res) => {
  try {
    const zones = await ZoneLivraison.findAll({
      where: { vendeur_id: req.user.id }
    });
    res.status(200).json(zones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateZoneLivraison = async (req, res) => {
  try {
    const zone = await ZoneLivraison.findOne({
      where: { id: req.params.zoneId, vendeur_id: req.user.id }
    });

    if (!zone) {
      return res.status(404).json({ error: 'Zone non trouvée' });
    }

    await zone.update(req.body);
    res.status(200).json(zone);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteZoneLivraison = async (req, res) => {
  try {
    const zone = await ZoneLivraison.findOne({
      where: { id: req.params.zoneId, vendeur_id: req.user.id }
    });

    if (!zone) {
      return res.status(404).json({ error: 'Zone non trouvée' });
    }

    await zone.destroy();
    res.status(200).json({ message: 'Zone de livraison supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};