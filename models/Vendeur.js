const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Vendeur = sequelize.define('Vendeur', {
  nom_boutique: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  type_boutique: {
    type: DataTypes.STRING,
    defaultValue: 'détaillant'
  },
  logo: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  description: {
    type: DataTypes.TEXT
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    validate: { isEmail: true }
  },
  mot_de_passe: {
    type: DataTypes.STRING,
    allowNull: false
  },
  ville: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  categorie_boutique: {
    type: DataTypes.STRING,
    defaultValue: 'autre'
  },
  langue: {
    type: DataTypes.STRING,
    defaultValue: 'fr'
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  adresse: {
    type: DataTypes.STRING
  },
  mode_livraison: {
    type: DataTypes.JSON,
    defaultValue: ['retrait_boutique']
    // Valeurs possibles: retrait_boutique, livraison_locale, service_tiers
  },
  theme: {
    type: DataTypes.JSON,
    defaultValue: {
      couleur_primaire: '#1B5E20',
      couleur_accent: '#FF9800',
      couleur_fond: '#FAFAFA',
      couleur_texte: '#1A1A1A',
      banniere_url: null,
      affichage_produits: 'grille',  // grille | liste | grande_grille
      colonnes_produits: 2,          // 1, 2, 3, 4
      arrondi_cartes: 12,            // 0-30
      police: 'Inter',               // Inter, Poppins, Roboto, Montserrat, Playfair Display
      style_hero: 'gradient',        // gradient | image | minimal
      afficher_partage: true,
      afficher_recherche: true,
      afficher_categories: true
    }
  },
  // === VÉRIFICATION ===
  verifie: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  date_verification: {
    type: DataTypes.DATE,
    defaultValue: null
  },
  // === SCORE FIABILITÉ ===
  score_fiabilite: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: null
  },
  note_moyenne: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: null
  },
  nombre_avis: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  nombre_ventes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // === PREMIUM ===
  premium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  plan: {
    type: DataTypes.ENUM('gratuit', 'premium', 'business'),
    defaultValue: 'gratuit'
  },
  date_expiration_premium: {
    type: DataTypes.DATE,
    defaultValue: null
  },
  limite_produits: {
    type: DataTypes.INTEGER,
    defaultValue: 20
  }
}, { timestamps: true });

module.exports = Vendeur;