const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Signalement = sequelize.define('Signalement', {
  type_cible: {
    type: DataTypes.ENUM('vendeur', 'produit'),
    allowNull: false
  },
  cible_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  signaleur_type: {
    type: DataTypes.ENUM('client', 'vendeur'),
    allowNull: false
  },
  signaleur_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  raison: {
    type: DataTypes.ENUM(
      'produit_contrefait',
      'arnaque',
      'contenu_inapproprie',
      'prix_abusif',
      'non_livraison',
      'harcelement',
      'autre'
    ),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  preuves: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  statut: {
    type: DataTypes.ENUM('ouvert', 'en_examen', 'résolu', 'classé'),
    defaultValue: 'ouvert'
  },
  resolution: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  traite_par: {
    type: DataTypes.INTEGER,
    defaultValue: null
  },
  date_resolution: {
    type: DataTypes.DATE,
    defaultValue: null
  }
}, { timestamps: true });

module.exports = Signalement;
