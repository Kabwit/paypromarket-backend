const { body, param, query, validationResult } = require('express-validator');

// Middleware qui vérifie les erreurs de validation
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Données invalides',
      details: errors.array().map(e => ({ champ: e.path, message: e.msg }))
    });
  }
  next();
};

// =============================================
// RÈGLES DE VALIDATION
// =============================================

// Auth - Inscription Vendeur
const inscriptionVendeurRules = [
  body('nom_boutique')
    .trim().notEmpty().withMessage('Le nom de la boutique est requis')
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('telephone')
    .trim().notEmpty().withMessage('Le téléphone est requis')
    .matches(/^(\+243|0)[0-9]{9,12}$/).withMessage('Numéro de téléphone invalide (format: +243... ou 0...)'),
  body('mot_de_passe')
    .notEmpty().withMessage('Le mot de passe est requis')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('email')
    .optional({ values: 'falsy' }).isEmail().withMessage('Email invalide'),
  body('ville')
    .optional().trim().isLength({ max: 100 }),
  body('categorie_boutique')
    .optional().trim().isIn(['alimentaire', 'electronique', 'mode', 'beaute', 'services', 'autre'])
    .withMessage('Catégorie invalide'),
  validate
];

// Auth - Inscription Client
const inscriptionClientRules = [
  body('nom')
    .trim().notEmpty().withMessage('Le nom est requis')
    .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('telephone')
    .trim().notEmpty().withMessage('Le téléphone est requis')
    .matches(/^(\+243|0)[0-9]{9,12}$/).withMessage('Numéro de téléphone invalide'),
  body('mot_de_passe')
    .notEmpty().withMessage('Le mot de passe est requis')
    .isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('email')
    .optional({ values: 'falsy' }).isEmail().withMessage('Email invalide'),
  validate
];

// Auth - Connexion
const connexionRules = [
  body('telephone')
    .trim().notEmpty().withMessage('Le téléphone est requis'),
  body('mot_de_passe')
    .notEmpty().withMessage('Le mot de passe est requis'),
  validate
];

// Produit - Création
const createProduitRules = [
  body('nom')
    .trim().notEmpty().withMessage('Le nom du produit est requis')
    .isLength({ min: 2, max: 200 }).withMessage('Le nom doit contenir entre 2 et 200 caractères'),
  body('prix_cdf')
    .notEmpty().withMessage('Le prix est requis')
    .isFloat({ min: 0 }).withMessage('Le prix doit être positif'),
  body('stock')
    .optional().isInt({ min: 0 }).withMessage('Le stock doit être un nombre positif'),
  body('categorie')
    .optional().trim(),
  body('pourcentage_promotion')
    .optional().isInt({ min: 0, max: 100 }).withMessage('Le pourcentage doit être entre 0 et 100'),
  validate
];

// Commande - Création
const createCommandeRules = [
  body('items')
    .isArray({ min: 1 }).withMessage('Au moins un article est requis'),
  body('items.*.produit_id')
    .isInt({ min: 1 }).withMessage('ID produit invalide'),
  body('items.*.quantite')
    .isInt({ min: 1 }).withMessage('La quantité doit être au moins 1'),
  body('mode_livraison')
    .optional().isIn(['retrait_boutique', 'livraison_locale', 'service_tiers'])
    .withMessage('Mode de livraison invalide'),
  validate
];

// Paiement - Initiation
const initierPaiementRules = [
  body('commande_id')
    .notEmpty().withMessage('L\'ID de commande est requis')
    .isInt({ min: 1 }).withMessage('ID de commande invalide'),
  body('mode_paiement')
    .notEmpty().withMessage('Le mode de paiement est requis')
    .isIn(['mobile_money', 'paiement_livraison']).withMessage('Mode de paiement invalide'),
  body('operateur')
    .if(body('mode_paiement').equals('mobile_money'))
    .notEmpty().withMessage('L\'opérateur est requis pour Mobile Money')
    .isIn(['vodacom', 'airtel', 'orange']).withMessage('Opérateur invalide'),
  body('numero_telephone')
    .if(body('mode_paiement').equals('mobile_money'))
    .notEmpty().withMessage('Le numéro de téléphone est requis')
    .matches(/^(\+243|0)[0-9]{9,12}$/).withMessage('Numéro invalide'),
  validate
];

// Avis
const createAvisRules = [
  body('commande_id')
    .notEmpty().withMessage('L\'ID de commande est requis')
    .isInt({ min: 1 }),
  body('note')
    .notEmpty().withMessage('La note est requise')
    .isInt({ min: 1, max: 5 }).withMessage('La note doit être entre 1 et 5'),
  body('commentaire')
    .optional().trim().isLength({ max: 1000 }),
  validate
];

// Signalement
const createSignalementRules = [
  body('type_cible')
    .notEmpty().isIn(['vendeur', 'produit']).withMessage('Type de cible invalide'),
  body('cible_id')
    .notEmpty().isInt({ min: 1 }),
  body('raison')
    .notEmpty().withMessage('La raison est requise'),
  body('description')
    .trim().notEmpty().withMessage('La description est requise')
    .isLength({ min: 10, max: 2000 }).withMessage('La description doit contenir entre 10 et 2000 caractères'),
  validate
];

// Chat
const envoyerMessageRules = [
  body('destinataire_type')
    .notEmpty().isIn(['client', 'vendeur']).withMessage('Type de destinataire invalide'),
  body('destinataire_id')
    .notEmpty().isInt({ min: 1 }).withMessage('ID destinataire invalide'),
  body('contenu')
    .trim().notEmpty().withMessage('Le contenu du message est requis')
    .isLength({ max: 5000 }).withMessage('Message trop long (max 5000 caractères)'),
  validate
];

module.exports = {
  validate,
  inscriptionVendeurRules,
  inscriptionClientRules,
  connexionRules,
  createProduitRules,
  createCommandeRules,
  initierPaiementRules,
  createAvisRules,
  createSignalementRules,
  envoyerMessageRules
};
