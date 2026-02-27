const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'paypromarket_secret_key_rdc_2026';

// Middleware d'authentification générique
const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token d\'authentification requis' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};

// Middleware pour vendeurs uniquement
const authVendeur = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== 'vendeur') {
      return res.status(403).json({ error: 'Accès réservé aux vendeurs' });
    }
    next();
  });
};

// Middleware pour clients uniquement
const authClient = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== 'client') {
      return res.status(403).json({ error: 'Accès réservé aux clients' });
    }
    next();
  });
};

// Middleware pour admin uniquement
const authAdmin = (req, res, next) => {
  auth(req, res, () => {
    if (!['super_admin', 'admin', 'moderateur'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }
    next();
  });
};

// Middleware pour super admin uniquement
const authSuperAdmin = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Accès réservé au super administrateur' });
    }
    next();
  });
};

// Générer un token JWT
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Générer un token JWT admin (durée 12h)
const generateAdminToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
};

module.exports = { auth, authVendeur, authClient, authAdmin, authSuperAdmin, generateToken, generateAdminToken, JWT_SECRET };
