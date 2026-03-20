const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Revendeur = sequelize.define('Revendeur', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  bio: {
    type: DataTypes.TEXT
  },
  telephone: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  ville: {
    type: DataTypes.STRING,
    defaultValue: 'Lubumbashi'
  },
  commission_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 5.0,
    validate: { min: 0, max: 100 }
  },
  commission_min: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 100
  },
  lien_referal: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  qr_code_url: {
    type: DataTypes.STRING
  },
  photo: {
    type: DataTypes.STRING
  },
  statut: {
    type: DataTypes.ENUM('actif', 'inactif', 'suspendu'),
    defaultValue: 'actif'
  },
  vente_totale: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  commission_totale: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  commission_en_attente: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  nombre_ventes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  nombre_produits_promus: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  score_fiabilite: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0
  },
  note_moyenne: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0
  },
  nombre_avis: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  date_inscription: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  date_derniere_vente: {
    type: DataTypes.DATE
  },
  taux_conversion: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  cliques_totals: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['telephone'] },
    { fields: ['lien_referal'] },
    { fields: ['statut'] }
  ]
});

module.exports = Revendeur;
