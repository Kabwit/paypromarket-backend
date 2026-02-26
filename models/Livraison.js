const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Livraison = sequelize.define('Livraison', {
  commande_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'préparation', 'expédiée', 'en_cours', 'livrée', 'échec'),
    defaultValue: 'en_attente'
  },
  mode: {
    type: DataTypes.ENUM('retrait_boutique', 'livraison_locale', 'service_tiers'),
    allowNull: false
  },
  adresse: {
    type: DataTypes.STRING
  },
  ville: {
    type: DataTypes.STRING
  },
  zone: {
    type: DataTypes.STRING
  },
  frais_livraison: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  devise_frais: {
    type: DataTypes.ENUM('CDF', 'USD'),
    defaultValue: 'CDF'
  },
  delai_estime_heures: {
    type: DataTypes.INTEGER
  },
  livreur_nom: {
    type: DataTypes.STRING
  },
  livreur_telephone: {
    type: DataTypes.STRING
  },
  notes: {
    type: DataTypes.TEXT
  },
  date_expedition: {
    type: DataTypes.DATE
  },
  date_livraison: {
    type: DataTypes.DATE
  }
}, { timestamps: true });

module.exports = Livraison;
