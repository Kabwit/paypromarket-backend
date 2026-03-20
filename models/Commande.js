const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Commande = sequelize.define('Commande', {
  numero_commande: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  vendeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  montant_total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  devise: {
    type: DataTypes.ENUM('CDF', 'USD'),
    defaultValue: 'CDF'
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'confirmee', 'preparation', 'en_cours', 'livree', 'annulee'),
    defaultValue: 'en_attente'
  },
  mode_livraison: {
    type: DataTypes.ENUM('retrait_boutique', 'livraison_locale', 'service_tiers'),
    defaultValue: 'retrait_boutique'
  },
  adresse_livraison: {
    type: DataTypes.STRING
  },
  telephone_livraison: {
    type: DataTypes.STRING
  },
  notes: {
    type: DataTypes.TEXT
  },
  date_livraison_estimee: {
    type: DataTypes.DATE
  },
  // Social Tracking Fields
  utm_source: {
    type: DataTypes.STRING,
    comment: 'Source du trafic (facebook, instagram, google, direct, etc.)'
  },
  utm_campaign: {
    type: DataTypes.STRING,
    comment: 'Campagne marketing'
  },
  utm_medium: {
    type: DataTypes.STRING,
    comment: 'Moyen (cpc, organic, referral, etc.)'
  },
  referrer_id: {
    type: DataTypes.INTEGER,
    comment: 'ID du revendeur qui a partagé ce produit',
    references: { model: 'Revendeurs', key: 'id' }
  },
  lien_referal_utilise: {
    type: DataTypes.STRING,
    comment: 'Lien de parrainage utilisé'
  },
  shared_by_date: {
    type: DataTypes.DATE,
    comment: 'Date du partage sur réseaux sociaux'
  },
  canal_vente: {
    type: DataTypes.ENUM('direct', 'revendeur', 'referral', 'social', 'search'),
    defaultValue: 'direct'
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['client_id'] },
    { fields: ['vendeur_id'] },
    { fields: ['statut'] },
    { fields: ['numero_commande'], unique: true }
  ]
});

module.exports = Commande;