const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Verification = sequelize.define('Verification', {
  vendeur_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  type_document: {
    type: DataTypes.ENUM('carte_identite', 'passeport', 'permis_conduire', 'rccm', 'id_nat'),
    allowNull: false
  },
  numero_document: {
    type: DataTypes.STRING,
    allowNull: false
  },
  image_document: {
    type: DataTypes.STRING,
    allowNull: false
  },
  selfie_url: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'approuvé', 'rejeté'),
    defaultValue: 'en_attente'
  },
  motif_rejet: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  verifie_par: {
    type: DataTypes.INTEGER,
    defaultValue: null
  },
  date_verification: {
    type: DataTypes.DATE,
    defaultValue: null
  }
}, { timestamps: true });

module.exports = Verification;
