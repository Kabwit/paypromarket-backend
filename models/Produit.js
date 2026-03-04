const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Produit = sequelize.define('Produit', {
  vendeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  prix_cdf: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  prix_usd: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  categorie: {
    type: DataTypes.STRING
  },
  promotion: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  pourcentage_promotion: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0, max: 100 }
  },
  delai_preparation: {
    type: DataTypes.STRING,
    defaultValue: '24h'
    // Valeurs: '1h', '24h', '48h', '72h'
  },
  photos: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  disponible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  vues: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  mis_en_avant: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  stock_minimum: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  unite: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  note_moyenne: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: null
  },
  nombre_avis: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, { timestamps: true });

module.exports = Produit;