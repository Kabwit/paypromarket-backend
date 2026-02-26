const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ZoneLivraison = sequelize.define('ZoneLivraison', {
  vendeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  nom_zone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ville: {
    type: DataTypes.STRING,
    allowNull: false
  },
  delai_heures: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 24
  },
  frais_livraison_cdf: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  frais_livraison_usd: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, { timestamps: true });

module.exports = ZoneLivraison;
