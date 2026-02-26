const bcrypt = require('bcryptjs');
const slugify = require('slugify');
const { Vendeur, Client } = require('../models');
const { generateToken } = require('../middleware/auth');

// =============================================
// INSCRIPTION VENDEUR
// =============================================
exports.inscriptionVendeur = async (req, res) => {
  try {
    const { nom_boutique, type_boutique, telephone, email, mot_de_passe, ville, categorie_boutique, description } = req.body;

    // Vérifier si le vendeur existe déjà
    const vendeurExiste = await Vendeur.findOne({ where: { email } });
    if (vendeurExiste) {
      return res.status(400).json({ error: 'Un compte vendeur avec cet email existe déjà' });
    }

    const telephoneExiste = await Vendeur.findOne({ where: { telephone } });
    if (telephoneExiste) {
      return res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé' });
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(mot_de_passe, salt);

    // Générer le slug unique pour la boutique
    let slug = slugify(nom_boutique, { lower: true, strict: true });
    const slugExiste = await Vendeur.findOne({ where: { slug } });
    if (slugExiste) {
      slug = `${slug}-${Date.now()}`;
    }

    // Créer le vendeur
    const vendeur = await Vendeur.create({
      nom_boutique,
      slug,
      type_boutique,
      telephone,
      email,
      mot_de_passe: hashedPassword,
      ville,
      categorie_boutique: categorie_boutique || 'autre',
      description
    });

    // Générer le token
    const token = generateToken({ id: vendeur.id, role: 'vendeur', email: vendeur.email });

    // Répondre sans le mot de passe
    const vendeurResponse = vendeur.toJSON();
    delete vendeurResponse.mot_de_passe;

    res.status(201).json({
      message: 'Boutique créée avec succès',
      vendeur: vendeurResponse,
      token,
      lien_boutique: `/boutique/${vendeur.slug}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// CONNEXION VENDEUR
// =============================================
exports.connexionVendeur = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    // Trouver le vendeur
    const vendeur = await Vendeur.findOne({ where: { email } });
    if (!vendeur) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    if (!vendeur.actif) {
      return res.status(403).json({ error: 'Ce compte a été désactivé' });
    }

    // Vérifier le mot de passe
    const passwordValide = await bcrypt.compare(mot_de_passe, vendeur.mot_de_passe);
    if (!passwordValide) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer le token
    const token = generateToken({ id: vendeur.id, role: 'vendeur', email: vendeur.email });

    const vendeurResponse = vendeur.toJSON();
    delete vendeurResponse.mot_de_passe;

    res.status(200).json({
      message: 'Connexion réussie',
      vendeur: vendeurResponse,
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// INSCRIPTION CLIENT
// =============================================
exports.inscriptionClient = async (req, res) => {
  try {
    const { nom, prenom, telephone, email, mot_de_passe, ville, adresse } = req.body;

    // Vérifier si le client existe déjà
    const telephoneExiste = await Client.findOne({ where: { telephone } });
    if (telephoneExiste) {
      return res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé' });
    }

    if (email) {
      const emailExiste = await Client.findOne({ where: { email } });
      if (emailExiste) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(mot_de_passe, salt);

    // Créer le client
    const client = await Client.create({
      nom,
      prenom,
      telephone,
      email,
      mot_de_passe: hashedPassword,
      ville: ville || 'Lubumbashi',
      adresse
    });

    // Générer le token
    const token = generateToken({ id: client.id, role: 'client', telephone: client.telephone });

    const clientResponse = client.toJSON();
    delete clientResponse.mot_de_passe;

    res.status(201).json({
      message: 'Compte client créé avec succès',
      client: clientResponse,
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// CONNEXION CLIENT
// =============================================
exports.connexionClient = async (req, res) => {
  try {
    const { telephone, mot_de_passe } = req.body;

    // Trouver le client par téléphone
    const client = await Client.findOne({ where: { telephone } });
    if (!client) {
      return res.status(401).json({ error: 'Téléphone ou mot de passe incorrect' });
    }

    if (!client.actif) {
      return res.status(403).json({ error: 'Ce compte a été désactivé' });
    }

    // Vérifier le mot de passe
    const passwordValide = await bcrypt.compare(mot_de_passe, client.mot_de_passe);
    if (!passwordValide) {
      return res.status(401).json({ error: 'Téléphone ou mot de passe incorrect' });
    }

    // Générer le token
    const token = generateToken({ id: client.id, role: 'client', telephone: client.telephone });

    const clientResponse = client.toJSON();
    delete clientResponse.mot_de_passe;

    res.status(200).json({
      message: 'Connexion réussie',
      client: clientResponse,
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// PROFIL (vendeur ou client connecté)
// =============================================
exports.getProfil = async (req, res) => {
  try {
    const { id, role } = req.user;

    let user;
    if (role === 'vendeur') {
      user = await Vendeur.findByPk(id, {
        attributes: { exclude: ['mot_de_passe'] }
      });
    } else {
      user = await Client.findByPk(id, {
        attributes: { exclude: ['mot_de_passe'] }
      });
    }

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.status(200).json({ role, profil: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
