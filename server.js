const express = require('express');
require('dotenv').config();
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const logger = require('./middleware/logger');

const app = express();

// Importer les models (avec associations)
const { sequelize } = require('./models');

// =============================================
// SÉCURITÉ & MIDDLEWARES
// =============================================
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https://www.gstatic.com", "https://fonts.googleapis.com", "https://fonts.gstatic.com", "ws:", "wss:"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"],
      frameSrc: ["'self'", "blob:"],
      scriptSrcAttr: ["'unsafe-inline'"],
      upgradeInsecureRequests: null,
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
}));
app.use(cors());
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim(), { type: 'http' }) }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (protection anti-abus)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // max 200 requêtes par IP
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});
app.use('/api/', limiter);

// Rate limiting strict pour l'authentification (anti brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives de connexion, réessayez dans 15 minutes.' }
});
app.use('/api/auth', authLimiter);

// Servir les fichiers uploadés
const uploadDirs = ['uploads', 'uploads/logos', 'uploads/produits', 'uploads/autres', 'uploads/verifications'];
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

// Administration (panel admin)
app.use('/api/admin', require('./routes/admin'));

// Vérifications (identité vendeur)
app.use('/api/verifications', require('./routes/verification'));

// Avis & Notations
app.use('/api/avis', require('./routes/avis'));

// Signalements (anti-arnaque)
app.use('/api/signalements', require('./routes/signalement'));

// Premium & Gestion stock
app.use('/api/premium', require('./routes/premium'));

// Chat / Messagerie
app.use('/api/chat', require('./routes/chat'));

// =============================================
// PANNEAU ADMIN (interface web)
// =============================================
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// =============================================
// APPLICATION WEB (Client/Vendeur)
// =============================================
app.use('/app', express.static(path.join(__dirname, 'webapp')));
app.get('/app/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'webapp', 'index.html'));
});

// =============================================
// BOUTIQUE PUBLIQUE (page vitrine partageable)
// =============================================
app.get('/boutique/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'webapp', 'boutique.html'));
});

// =============================================
// ROUTE D'ACCUEIL
// =============================================
app.get('/', (req, res) => {
  res.json({
    message: 'PayPro Market RDC - API Backend',
    version: '1.0.0',
    admin_panel: '/admin',
    app: '/app',
    boutique: '/boutique/:slug',
    documentation: {
      auth: '/api/auth',
      vendeurs: '/api/vendeurs',
      produits: '/api/produits',
      commandes: '/api/commandes',
      paiements: '/api/paiements',
      livraisons: '/api/livraisons',
      dashboard: '/api/dashboard',
      clients: '/api/clients',
      notifications: '/api/notifications',
      admin: '/api/admin',
      verifications: '/api/verifications',
      avis: '/api/avis',
      signalements: '/api/signalements',
      chat: '/api/chat',
      premium: '/api/premium'
    }
  });
});

// =============================================
// GESTION DES ERREURS
// =============================================
app.use((err, req, res, next) => {
  logger.error('Erreur serveur', { error: err.message, stack: err.stack, url: req.originalUrl });
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
    logger.info('Base de données synchronisée');

    // Créer serveur HTTP + Socket.io
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: { origin: '*', methods: ['GET', 'POST'] }
    });

    // Rendre io accessible aux controllers
    app.set('io', io);

    // Socket.io - Gestion des connexions
    io.on('connection', (socket) => {
      logger.info('Socket connecté', { socketId: socket.id });

      // L'utilisateur se joint à sa room personnelle
      socket.on('join', ({ type, id }) => {
        const room = `user_${type}_${id}`;
        socket.join(room);
        logger.info('Utilisateur a rejoint une room', { type, id, room });
      });

      // Écouter la saisie en cours
      socket.on('typing', ({ conversation_id, user_type, user_id }) => {
        socket.to(conversation_id).emit('user_typing', { user_type, user_id });
      });

      // Rejoindre une conversation
      socket.on('join_conversation', (conversation_id) => {
        socket.join(conversation_id);
      });

      socket.on('disconnect', () => {
        logger.info('Socket déconnecté', { socketId: socket.id });
      });
    });

    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`Serveur PayPro Market démarré sur le port ${PORT}`);
      logger.info(`Local: http://localhost:${PORT}`);
      logger.info('Socket.io activé');
    });
  })
  .catch(err => {
    logger.error('Erreur de synchronisation DB', { error: err.message });
  });