const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Avis = sequelize.define('Avis', {
  commande_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true // Un seul avis par commande
  },
  produit_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  vendeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  note: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }
  },
  commentaire: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  reponse_vendeur: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  date_reponse: {
    type: DataTypes.DATE,
    defaultValue: null
  }
}, { timestamps: true });

module.exports = Avis;
