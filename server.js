const express = require('express');
require('dotenv').config();
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();

// Importer les models (avec associations)
const { sequelize } = require('./models');

// =============================================
// SÉCURITÉ & MIDDLEWARES
// =============================================
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (protection anti-abus)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // max 200 requêtes par IP
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});
app.use('/api/', limiter);

// Servir les fichiers uploadés
const uploadDirs = ['uploads', 'uploads/logos', 'uploads/produits', 'uploads/autres'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =============================================
// ROUTES API
// =============================================

// Authentification (inscription, connexion)
app.use('/api/auth', require('./routes/auth'));

// Vendeurs (profil, boutiques, zones de livraison)
app.use('/api/vendeurs', require('./routes/vendeur'));

// Produits (CRUD, recherche, lien unique)
app.use('/api/produits', require('./routes/produit'));

// Commandes (création, suivi, gestion)
app.use('/api/commandes', require('./routes/commande'));

// Paiements (Mobile Money, confirmation)
app.use('/api/paiements', require('./routes/transaction'));

// Livraisons (suivi, mise à jour)
app.use('/api/livraisons', require('./routes/livraison'));

// Tableau de bord vendeur
app.use('/api/dashboard', require('./routes/dashboard'));

// Clients (profil, historique, factures)
app.use('/api/clients', require('./routes/client'));

// Notifications
app.use('/api/notifications', require('./routes/notification'));

// =============================================
// ROUTE D'ACCUEIL
// =============================================
app.get('/', (req, res) => {
  res.json({
    message: 'PayPro Market RDC - API Backend',
    version: '1.0.0',
    documentation: {
      auth: '/api/auth',
      vendeurs: '/api/vendeurs',
      produits: '/api/produits',
      commandes: '/api/commandes',
      paiements: '/api/paiements',
      livraisons: '/api/livraisons',
      dashboard: '/api/dashboard',
      clients: '/api/clients',
      notifications: '/api/notifications'
    }
  });
});

// =============================================
// GESTION DES ERREURS
// =============================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur interne du serveur'
  });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// =============================================
// LANCEMENT SERVEUR + SYNC DB
// =============================================
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true })
  .then(() => {
    console.log('✅ Base de données synchronisée');
    app.listen(PORT, () => {
      console.log(`🚀 Serveur PayPro Market démarré sur le port ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Erreur de synchronisation DB:', err.message);
  });