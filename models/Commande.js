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
    type: DataTypes.ENUM('en_attente', 'confirmée', 'préparation', 'en_cours', 'livrée', 'annulée'),
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