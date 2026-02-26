const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LigneCommande = sequelize.define('LigneCommande', {
  commande_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  produit_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 }
  },
  prix_unitaire: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  devise: {
    type: DataTypes.ENUM('CDF', 'USD'),
    defaultValue: 'CDF'
  },
  sous_total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  }
}, { timestamps: true });

module.exports = LigneCommande;
