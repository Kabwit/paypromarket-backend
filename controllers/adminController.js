const bcrypt = require('bcryptjs');
const { Op, fn, col, literal } = require('sequelize');
const { Admin, Vendeur, Client, Produit, Commande, LigneCommande, Paiement, Livraison, Notification } = require('../models');
const { generateAdminToken } = require('../middleware/auth');
const sequelize = require('../config/db');

// =============================================
// AUTHENTIFICATION ADMIN
// =============================================

// Connexion admin
exports.loginAdmin = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    if (!admin.actif) {
      return res.status(403).json({ error: 'Ce compte admin a été désactivé' });
    }

    const passwordValide = await bcrypt.compare(mot_de_passe, admin.mot_de_passe);
    if (!passwordValide) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Mettre à jour la dernière connexion
    await admin.update({ derniere_connexion: new Date() });

    const token = generateAdminToken({ id: admin.id, role: admin.role, email: admin.email });

    const adminResponse = admin.toJSON();
    delete adminResponse.mot_de_passe;

    res.json({ message: 'Connexion admin réussie', admin: adminResponse, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Profil admin
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.user.id, {
      attributes: { exclude: ['mot_de_passe'] }
    });
    if (!admin) return res.status(404).json({ error: 'Admin non trouvé' });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// DASHBOARD GLOBAL
// =============================================

exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const debutJour = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const debutSemaine = new Date(now);
    debutSemaine.setDate(now.getDate() - now.getDay());
    debutSemaine.setHours(0, 0, 0, 0);
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);

    // Compteurs globaux
    const [
      totalVendeurs,
      vendeursActifs,
      totalClients,
      clientsActifs,
      totalProduits,
      produitsDisponibles,
      totalCommandes,
      commandesAujourdhui,
      commandesSemaine,
      commandesMois
    ] = await Promise.all([
      Vendeur.count(),
      Vendeur.count({ where: { actif: true } }),
      Client.count(),
      Client.count({ where: { actif: true } }),
      Produit.count(),
      Produit.count({ where: { disponible: true } }),
      Commande.count(),
      Commande.count({ where: { createdAt: { [Op.gte]: debutJour } } }),
      Commande.count({ where: { createdAt: { [Op.gte]: debutSemaine } } }),
      Commande.count({ where: { createdAt: { [Op.gte]: debutMois } } })
    ]);

    // Chiffre d'affaires
    const [caJournalier, caHebdomadaire, caMensuel, caTotal] = await Promise.all([
      Commande.sum('montant_total', {
        where: { statut: { [Op.notIn]: ['annulée', 'en_attente'] }, createdAt: { [Op.gte]: debutJour } }
      }),
      Commande.sum('montant_total', {
        where: { statut: { [Op.notIn]: ['annulée', 'en_attente'] }, createdAt: { [Op.gte]: debutSemaine } }
      }),
      Commande.sum('montant_total', {
        where: { statut: { [Op.notIn]: ['annulée', 'en_attente'] }, createdAt: { [Op.gte]: debutMois } }
      }),
      Commande.sum('montant_total', {
        where: { statut: { [Op.notIn]: ['annulée', 'en_attente'] } }
      })
    ]);

    // Commandes par statut
    const commandesParStatut = await Commande.findAll({
      attributes: ['statut', [fn('COUNT', col('id')), 'count']],
      group: ['statut'],
      raw: true
    });

    // Dernières commandes
    const dernieresCommandes = await Commande.findAll({
      include: [
        { model: Client, as: 'client', attributes: ['nom', 'prenom', 'telephone'] },
        { model: Vendeur, as: 'vendeur', attributes: ['nom_boutique'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Nouveaux inscrits aujourd'hui
    const nouveauxVendeursAujourdhui = await Vendeur.count({ where: { createdAt: { [Op.gte]: debutJour } } });
    const nouveauxClientsAujourdhui = await Client.count({ where: { createdAt: { [Op.gte]: debutJour } } });

    res.json({
      utilisateurs: {
        vendeurs: { total: totalVendeurs, actifs: vendeursActifs, nouveaux_aujourdhui: nouveauxVendeursAujourdhui },
        clients: { total: totalClients, actifs: clientsActifs, nouveaux_aujourdhui: nouveauxClientsAujourdhui }
      },
      produits: { total: totalProduits, disponibles: produitsDisponibles },
      commandes: {
        total: totalCommandes,
        aujourdhui: commandesAujourdhui,
        semaine: commandesSemaine,
        mois: commandesMois,
        par_statut: commandesParStatut
      },
      chiffre_affaires: {
        journalier: caJournalier || 0,
        hebdomadaire: caHebdomadaire || 0,
        mensuel: caMensuel || 0,
        total: caTotal || 0
      },
      dernieres_commandes: dernieresCommandes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// GESTION DES VENDEURS
// =============================================

exports.getAllVendeurs = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, actif, ville } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { nom_boutique: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { telephone: { [Op.like]: `%${search}%` } }
      ];
    }
    if (actif !== undefined) where.actif = actif === 'true';
    if (ville) where.ville = ville;

    const { rows: vendeurs, count: total } = await Vendeur.findAndCountAll({
      where,
      attributes: { exclude: ['mot_de_passe'] },
      include: [
        { model: Produit, as: 'produits', attributes: ['id'] },
        { model: Commande, as: 'commandes', attributes: ['id', 'montant_total', 'statut'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.json({
      vendeurs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getVendeurDetail = async (req, res) => {
  try {
    const vendeur = await Vendeur.findByPk(req.params.id, {
      attributes: { exclude: ['mot_de_passe'] },
      include: [
        { model: Produit, as: 'produits' },
        {
          model: Commande, as: 'commandes',
          include: [
            { model: Client, as: 'client', attributes: ['nom', 'prenom', 'telephone'] },
            { model: Paiement, as: 'paiement' }
          ]
        }
      ]
    });
    if (!vendeur) return res.status(404).json({ error: 'Vendeur non trouvé' });

    // Stats du vendeur
    const caTotal = await Commande.sum('montant_total', {
      where: { vendeur_id: vendeur.id, statut: { [Op.notIn]: ['annulée'] } }
    });

    res.json({ vendeur, stats: { chiffre_affaires_total: caTotal || 0 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleVendeurActif = async (req, res) => {
  try {
    const vendeur = await Vendeur.findByPk(req.params.id);
    if (!vendeur) return res.status(404).json({ error: 'Vendeur non trouvé' });

    await vendeur.update({ actif: !vendeur.actif });

    res.json({
      message: vendeur.actif ? 'Vendeur activé' : 'Vendeur désactivé',
      actif: vendeur.actif
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteVendeur = async (req, res) => {
  try {
    const vendeur = await Vendeur.findByPk(req.params.id);
    if (!vendeur) return res.status(404).json({ error: 'Vendeur non trouvé' });

    // Vérifier commandes en cours
    const commandesEnCours = await Commande.count({
      where: { vendeur_id: vendeur.id, statut: { [Op.notIn]: ['livrée', 'annulée'] } }
    });
    if (commandesEnCours > 0) {
      return res.status(400).json({ error: `Impossible: ${commandesEnCours} commande(s) en cours` });
    }

    await vendeur.destroy();
    res.json({ message: 'Vendeur supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// GESTION DES CLIENTS
// =============================================

exports.getAllClients = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, actif, ville } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { nom: { [Op.iLike]: `%${search}%` } },
        { prenom: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { telephone: { [Op.like]: `%${search}%` } }
      ];
    }
    if (actif !== undefined) where.actif = actif === 'true';
    if (ville) where.ville = ville;

    const { rows: clients, count: total } = await Client.findAndCountAll({
      where,
      attributes: { exclude: ['mot_de_passe'] },
      include: [
        { model: Commande, as: 'commandes', attributes: ['id', 'montant_total', 'statut'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.json({
      clients,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getClientDetail = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      attributes: { exclude: ['mot_de_passe'] },
      include: [
        {
          model: Commande, as: 'commandes',
          include: [
            { model: Vendeur, as: 'vendeur', attributes: ['nom_boutique'] },
            { model: Paiement, as: 'paiement' }
          ]
        }
      ]
    });
    if (!client) return res.status(404).json({ error: 'Client non trouvé' });

    const totalDepenses = await Commande.sum('montant_total', {
      where: { client_id: client.id, statut: { [Op.notIn]: ['annulée'] } }
    });

    res.json({ client, stats: { total_depenses: totalDepenses || 0 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleClientActif = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client non trouvé' });

    await client.update({ actif: !client.actif });

    res.json({
      message: client.actif ? 'Client activé' : 'Client désactivé',
      actif: client.actif
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client non trouvé' });

    const commandesEnCours = await Commande.count({
      where: { client_id: client.id, statut: { [Op.notIn]: ['livrée', 'annulée'] } }
    });
    if (commandesEnCours > 0) {
      return res.status(400).json({ error: `Impossible: ${commandesEnCours} commande(s) en cours` });
    }

    await client.destroy();
    res.json({ message: 'Client supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// GESTION DES PRODUITS
// =============================================

exports.getAllProduits = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, categorie, disponible } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { nom: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (categorie) where.categorie = categorie;
    if (disponible !== undefined) where.disponible = disponible === 'true';

    const { rows: produits, count: total } = await Produit.findAndCountAll({
      where,
      include: [
        { model: Vendeur, as: 'vendeur', attributes: ['id', 'nom_boutique', 'ville', 'actif'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.json({
      produits,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleProduitDisponible = async (req, res) => {
  try {
    const produit = await Produit.findByPk(req.params.id);
    if (!produit) return res.status(404).json({ error: 'Produit non trouvé' });

    await produit.update({ disponible: !produit.disponible });

    res.json({
      message: produit.disponible ? 'Produit rendu disponible' : 'Produit masqué',
      disponible: produit.disponible
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteProduit = async (req, res) => {
  try {
    const produit = await Produit.findByPk(req.params.id);
    if (!produit) return res.status(404).json({ error: 'Produit non trouvé' });

    await produit.destroy();
    res.json({ message: 'Produit supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// GESTION DES COMMANDES
// =============================================

exports.getAllCommandes = async (req, res) => {
  try {
    const { page = 1, limit = 20, statut, date_debut, date_fin } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (statut) where.statut = statut;
    if (date_debut || date_fin) {
      where.createdAt = {};
      if (date_debut) where.createdAt[Op.gte] = new Date(date_debut);
      if (date_fin) where.createdAt[Op.lte] = new Date(date_fin + 'T23:59:59');
    }

    const { rows: commandes, count: total } = await Commande.findAndCountAll({
      where,
      include: [
        { model: Client, as: 'client', attributes: ['nom', 'prenom', 'telephone', 'email'] },
        { model: Vendeur, as: 'vendeur', attributes: ['nom_boutique', 'telephone'] },
        { model: LigneCommande, as: 'lignes', include: [{ model: Produit, as: 'produit', attributes: ['nom', 'prix_cdf'] }] },
        { model: Paiement, as: 'paiement' },
        { model: Livraison, as: 'livraison' }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.json({
      commandes,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCommandeStatut = async (req, res) => {
  try {
    const { statut } = req.body;
    const commande = await Commande.findByPk(req.params.id);
    if (!commande) return res.status(404).json({ error: 'Commande non trouvée' });

    await commande.update({ statut });
    res.json({ message: `Statut mis à jour: ${statut}`, commande });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// GESTION DES PAIEMENTS
// =============================================

exports.getAllPaiements = async (req, res) => {
  try {
    const { page = 1, limit = 20, statut, methode } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (statut) where.statut = statut;
    if (methode) where.methode_paiement = methode;

    const { rows: paiements, count: total } = await Paiement.findAndCountAll({
      where,
      include: [
        {
          model: Commande, as: 'commande',
          include: [
            { model: Client, as: 'client', attributes: ['nom', 'prenom', 'telephone'] },
            { model: Vendeur, as: 'vendeur', attributes: ['nom_boutique'] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.json({
      paiements,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// GESTION DES ADMINS (super_admin uniquement)
// =============================================

exports.createAdmin = async (req, res) => {
  try {
    const { nom, email, mot_de_passe, role } = req.body;

    if (!nom || !email || !mot_de_passe) {
      return res.status(400).json({ error: 'Nom, email et mot de passe requis' });
    }

    const existe = await Admin.findOne({ where: { email } });
    if (existe) return res.status(400).json({ error: 'Cet email est déjà utilisé' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(mot_de_passe, salt);

    const admin = await Admin.create({
      nom,
      email,
      mot_de_passe: hashedPassword,
      role: role || 'admin'
    });

    const adminResponse = admin.toJSON();
    delete adminResponse.mot_de_passe;

    res.status(201).json({ message: 'Admin créé avec succès', admin: adminResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.findAll({
      attributes: { exclude: ['mot_de_passe'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    const admin = await Admin.findByPk(req.params.id);
    if (!admin) return res.status(404).json({ error: 'Admin non trouvé' });

    await admin.destroy();
    res.json({ message: 'Admin supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// NOTIFICATIONS ADMIN
// =============================================

exports.sendNotification = async (req, res) => {
  try {
    const { titre, message, destinataire_type, destinataire_id } = req.body;

    if (!destinataire_type || !['vendeur', 'client'].includes(destinataire_type)) {
      return res.status(400).json({ error: 'destinataire_type doit être vendeur ou client' });
    }
    if (!destinataire_id) {
      return res.status(400).json({ error: 'destinataire_id est requis' });
    }

    const notification = await Notification.create({
      titre,
      message,
      type: 'système',
      destinataire_type,
      destinataire_id
    });

    res.status(201).json({ message: 'Notification envoyée', notification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
