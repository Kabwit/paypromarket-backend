const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Paiement = sequelize.define('Paiement', {
  commande_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  montant: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  devise: {
    type: DataTypes.ENUM('CDF', 'USD'),
    defaultValue: 'CDF'
  },
  mode_paiement: {
    type: DataTypes.ENUM('mobile_money', 'paiement_livraison'),
    allowNull: false
  },
  operateur: {
    type: DataTypes.ENUM('vodacom', 'airtel', 'orange'),
    allowNull: true
    // Requis si mode_paiement = mobile_money
  },
  numero_telephone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reference_transaction: {
    type: DataTypes.STRING,
    unique: true
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'confirmé', 'échoué', 'remboursé'),
    defaultValue: 'en_attente'
  },
  date_confirmation: {
    type: DataTypes.DATE
  }
}, { timestamps: true });

module.exports = Paiement;