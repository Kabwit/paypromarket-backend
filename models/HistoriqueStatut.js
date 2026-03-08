const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const HistoriqueStatut = sequelize.define('HistoriqueStatut', {
  commande_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ancien_statut: {
    type: DataTypes.STRING,
    allowNull: true
  },
  nouveau_statut: {
    type: DataTypes.STRING,
    allowNull: false
  },
  modifie_par_type: {
    type: DataTypes.ENUM('vendeur', 'client', 'admin', 'system'),
    allowNull: false
  },
  modifie_par_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  commentaire: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['commande_id'] }
  ]
});

module.exports = HistoriqueStatut;
