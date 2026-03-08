const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Client = sequelize.define('Client', {
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  prenom: {
    type: DataTypes.STRING,
    allowNull: true
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: { isEmail: true }
  },
  mot_de_passe: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ville: {
    type: DataTypes.STRING,
    defaultValue: 'Lubumbashi'
  },
  adresse: {
    type: DataTypes.STRING
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  fcm_token: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, { timestamps: true });

module.exports = Client;
