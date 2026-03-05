const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Message = sequelize.define('Message', {
  conversation_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Format: client_{clientId}_vendeur_{vendeurId}'
  },
  expediteur_type: {
    type: DataTypes.ENUM('client', 'vendeur'),
    allowNull: false
  },
  expediteur_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  destinataire_type: {
    type: DataTypes.ENUM('client', 'vendeur'),
    allowNull: false
  },
  destinataire_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  contenu: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type_message: {
    type: DataTypes.ENUM('texte', 'image', 'produit'),
    defaultValue: 'texte'
  },
  produit_id: {
    type: DataTypes.INTEGER,
    defaultValue: null,
    comment: 'Lien vers un produit partagé dans le chat'
  },
  lu: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  date_lecture: {
    type: DataTypes.DATE,
    defaultValue: null
  }
}, { timestamps: true });

module.exports = Message;
