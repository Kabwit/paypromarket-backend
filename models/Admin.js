const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Admin = sequelize.define('Admin', {
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  mot_de_passe: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'admin', 'moderateur'),
    defaultValue: 'admin'
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  derniere_connexion: {
    type: DataTypes.DATE,
    defaultValue: null
  }
}, { timestamps: true });

module.exports = Admin;
