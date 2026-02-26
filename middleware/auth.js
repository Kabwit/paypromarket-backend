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

// Générer un token JWT
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

module.exports = { auth, authVendeur, authClient, generateToken, JWT_SECRET };
