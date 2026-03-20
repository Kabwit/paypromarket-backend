const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Commission = sequelize.define('Commission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  revendeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Revendeurs', key: 'id' }
  },
  commande_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Commandes', key: 'id' }
  },
  produit_id: {
    type: DataTypes.INTEGER,
    references: { model: 'Produits', key: 'id' }
  },
  montant_vente: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  pourcentage_commission: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 5
  },
  montant_commission: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  commission_min_appliquee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'confirmee', 'versee', 'rejetee'),
    defaultValue: 'en_attente'
  },
  date_confirmation: {
    type: DataTypes.DATE
  },
  date_versement: {
    type: DataTypes.DATE
  },
  reference_versement: {
    type: DataTypes.STRING
  },
  notes: {
    type: DataTypes.TEXT
  },
  devise: {
    type: DataTypes.ENUM('CDF', 'USD'),
    defaultValue: 'CDF'
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['revendeur_id'] },
    { fields: ['commande_id'] },
    { fields: ['statut'] },
    { fields: ['date_confirmation'] },
    { fields: ['date_versement'] }
  ]
});

module.exports = Commission;
