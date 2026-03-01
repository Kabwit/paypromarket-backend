const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Vendeur = sequelize.define('Vendeur', {
  nom_boutique: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  type_boutique: {
    type: DataTypes.STRING,
    defaultValue: 'détaillant'
  },
  logo: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  description: {
    type: DataTypes.TEXT
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    validate: { isEmail: true }
  },
  mot_de_passe: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ville: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  categorie_boutique: {
    type: DataTypes.STRING,
    defaultValue: 'autre'
  },
  langue: {
    type: DataTypes.STRING,
    defaultValue: 'fr'
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  adresse: {
    type: DataTypes.STRING
  },
  mode_livraison: {
    type: DataTypes.JSON,
    defaultValue: ['retrait_boutique']
    // Valeurs possibles: retrait_boutique, livraison_locale, service_tiers
  }
}, { timestamps: true });

module.exports = Vendeur;