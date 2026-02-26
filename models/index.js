const sequelize = require('../config/db');
const Client = require('./Client');
const Vendeur = require('./Vendeur');
const Produit = require('./Produit');
const Commande = require('./Commande');
const LigneCommande = require('./LigneCommande');
const Paiement = require('./Transaction'); // Fichier renommé logiquement
const Livraison = require('./Livraison');
const ZoneLivraison = require('./ZoneLivraison');
const Notification = require('./Notification');

// =============================================
// ASSOCIATIONS
// =============================================

// --- Vendeur <-> Produit ---
Vendeur.hasMany(Produit, { foreignKey: 'vendeur_id', as: 'produits' });
Produit.belongsTo(Vendeur, { foreignKey: 'vendeur_id', as: 'vendeur' });

// --- Vendeur <-> Commande ---
Vendeur.hasMany(Commande, { foreignKey: 'vendeur_id', as: 'commandes' });
Commande.belongsTo(Vendeur, { foreignKey: 'vendeur_id', as: 'vendeur' });

// --- Vendeur <-> ZoneLivraison ---
Vendeur.hasMany(ZoneLivraison, { foreignKey: 'vendeur_id', as: 'zones_livraison' });
ZoneLivraison.belongsTo(Vendeur, { foreignKey: 'vendeur_id', as: 'vendeur' });

// --- Client <-> Commande ---
Client.hasMany(Commande, { foreignKey: 'client_id', as: 'commandes' });
Commande.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

// --- Commande <-> LigneCommande ---
Commande.hasMany(LigneCommande, { foreignKey: 'commande_id', as: 'lignes' });
LigneCommande.belongsTo(Commande, { foreignKey: 'commande_id', as: 'commande' });

// --- Produit <-> LigneCommande ---
Produit.hasMany(LigneCommande, { foreignKey: 'produit_id', as: 'lignes_commande' });
LigneCommande.belongsTo(Produit, { foreignKey: 'produit_id', as: 'produit' });

// --- Commande <-> Paiement ---
Commande.hasOne(Paiement, { foreignKey: 'commande_id', as: 'paiement' });
Paiement.belongsTo(Commande, { foreignKey: 'commande_id', as: 'commande' });

// --- Commande <-> Livraison ---
Commande.hasOne(Livraison, { foreignKey: 'commande_id', as: 'livraison' });
Livraison.belongsTo(Commande, { foreignKey: 'commande_id', as: 'commande' });

module.exports = {
  sequelize,
  Client,
  Vendeur,
  Produit,
  Commande,
  LigneCommande,
  Paiement,
  Livraison,
  ZoneLivraison,
  Notification
};
