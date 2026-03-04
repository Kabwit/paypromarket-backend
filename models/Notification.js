const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notification = sequelize.define('Notification', {
  destinataire_type: {
    type: DataTypes.ENUM('vendeur', 'client', 'admin'),
    allowNull: false
  },
  destinataire_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  titre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM(
      'nouvelle_commande',
      'commande_confirmée',
      'commande_expédiée',
      'commande_livrée',
      'commande_annulée',
      'paiement_reçu',
      'paiement_échoué',
      'rupture_stock',
      'nouveau_message',
      'système'
    ),
    allowNull: false
  },
  lu: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  donnees: {
    type: DataTypes.JSON,
    defaultValue: null
    // Données supplémentaires (ex: commande_id, produit_id, etc.)
  }
}, { timestamps: true });

module.exports = Notification;
