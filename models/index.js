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
const Admin = require('./Admin');
const Verification = require('./Verification');
const Avis = require('./Avis');
const Signalement = require('./Signalement');
const Message = require('./Message');
const HistoriqueStatut = require('./HistoriqueStatut');
const Revendeur = require('./Revendeur');
const Commission = require('./Commission');

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

// --- Vendeur <-> Verification ---
Vendeur.hasMany(Verification, { foreignKey: 'vendeur_id', as: 'verifications' });
Verification.belongsTo(Vendeur, { foreignKey: 'vendeur_id', as: 'vendeur' });

// --- Avis ---
Commande.hasOne(Avis, { foreignKey: 'commande_id', as: 'avis' });
Avis.belongsTo(Commande, { foreignKey: 'commande_id', as: 'commande' });
Client.hasMany(Avis, { foreignKey: 'client_id', as: 'avis' });
Avis.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });
Vendeur.hasMany(Avis, { foreignKey: 'vendeur_id', as: 'avis' });
Avis.belongsTo(Vendeur, { foreignKey: 'vendeur_id', as: 'vendeur' });
Produit.hasMany(Avis, { foreignKey: 'produit_id', as: 'avis' });
Avis.belongsTo(Produit, { foreignKey: 'produit_id', as: 'produit' });

// --- Historique Statut ---
Commande.hasMany(HistoriqueStatut, { foreignKey: 'commande_id', as: 'historique_statuts' });
HistoriqueStatut.belongsTo(Commande, { foreignKey: 'commande_id', as: 'commande' });

// --- Signalement ---
Vendeur.hasMany(Signalement, { foreignKey: 'cible_id', as: 'signalements_recus', constraints: false, scope: { type_cible: 'vendeur' } });

// --- Message (Chat) ---
// Pas de FK contrainte car expediteur/destinataire est polymorphique (client ou vendeur)

// --- REVENDEUR & COMMISSION (P2 Features) ---
// Revendeur <-> Commission
Revendeur.hasMany(Commission, { foreignKey: 'revendeur_id', as: 'commissions' });
Commission.belongsTo(Revendeur, { foreignKey: 'revendeur_id', as: 'revendeur' });

// Commande <-> Commission
Commande.hasMany(Commission, { foreignKey: 'commande_id', as: 'commissions' });
Commission.belongsTo(Commande, { foreignKey: 'commande_id', as: 'commande' });

// Produit <-> Commission
Produit.hasMany(Commission, { foreignKey: 'produit_id', as: 'commissions' });
Commission.belongsTo(Produit, { foreignKey: 'produit_id', as: 'produit' });

// Revendeur <-> Commande (via referrer)
Commande.belongsTo(Revendeur, { foreignKey: 'referrer_id', as: 'revendeur_referrer' });
Revendeur.hasMany(Commande, { foreignKey: 'referrer_id', as: 'ordres_referrals' });

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
  Notification,
  Admin,
  Verification,
  Avis,
  Signalement,
  Message,
  HistoriqueStatut,
  Revendeur,
  Commission
};
