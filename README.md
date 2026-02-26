# PayPro Market RDC - Backend API

API backend pour **PayPro Market**, une plateforme de commerce digital permettant aux vendeurs détaillants et grossistes en RDC de créer leurs mini-boutiques en ligne, gérer leurs produits, recevoir des paiements Mobile Money et suivre leurs livraisons.

## Technologies

- **Node.js** + **Express 5**
- **PostgreSQL** + **Sequelize ORM**
- **JWT** pour l'authentification
- **Multer** pour l'upload de fichiers
- **Helmet** / **Rate Limiting** pour la sécurité

## Prérequis

- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/) v14+

## Installation

```bash
# Cloner le repo
git clone https://github.com/VOTRE_USERNAME/paypromarket-backend.git
cd paypromarket-backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Modifier le fichier .env avec vos informations

# Lancer le serveur
npm start

# Lancer en mode développement (auto-reload)
npm run dev
```

## Variables d'environnement

Créer un fichier `.env` à la racine (voir `.env.example`) :

| Variable     | Description                      | Exemple              |
|-------------|----------------------------------|----------------------|
| DB_NAME     | Nom de la base de données        | paypromarket_rdc     |
| DB_USER     | Utilisateur PostgreSQL           | postgres             |
| DB_PASS     | Mot de passe PostgreSQL          | votre_mot_de_passe   |
| DB_HOST     | Hôte de la base de données       | localhost            |
| DB_PORT     | Port PostgreSQL                  | 5432                 |
| PORT        | Port du serveur                  | 5000                 |
| JWT_SECRET  | Clé secrète pour les tokens JWT  | votre_clé_secrète    |

## Structure du projet

```
paypromarket-backend/
├── server.js                 # Point d'entrée
├── config/
│   └── db.js                 # Configuration Sequelize / PostgreSQL
├── middleware/
│   ├── auth.js               # Authentification JWT
│   └── upload.js             # Upload de fichiers (Multer)
├── models/
│   ├── index.js              # Associations entre modèles
│   ├── Client.js
│   ├── Vendeur.js
│   ├── Produit.js
│   ├── Commande.js
│   ├── LigneCommande.js
│   ├── Transaction.js        # Paiements
│   ├── Livraison.js
│   ├── ZoneLivraison.js
│   └── Notification.js
├── controllers/
│   ├── authController.js
│   ├── vendeurController.js
│   ├── produitController.js
│   ├── commandeController.js
│   ├── transactionController.js
│   ├── livraisonController.js
│   ├── dashboardController.js
│   ├── clientController.js
│   └── notificationController.js
└── routes/
    ├── auth.js
    ├── vendeur.js
    ├── produit.js
    ├── commande.js
    ├── transaction.js
    ├── livraison.js
    ├── dashboard.js
    ├── client.js
    └── notification.js
```

## Endpoints API

### Authentification (`/api/auth`)
| Méthode | Route                       | Description               |
|---------|-----------------------------|---------------------------|
| POST    | `/vendeur/inscription`      | Inscription vendeur       |
| POST    | `/vendeur/connexion`        | Connexion vendeur         |
| POST    | `/client/inscription`       | Inscription client        |
| POST    | `/client/connexion`         | Connexion client          |
| GET     | `/profil`                   | Profil utilisateur (auth) |

### Vendeurs (`/api/vendeurs`)
| Méthode | Route                       | Description                    |
|---------|-----------------------------|--------------------------------|
| GET     | `/boutiques`                | Lister les boutiques (public)  |
| GET     | `/boutique/:slug`           | Voir une boutique (public)     |
| GET     | `/profil`                   | Mon profil vendeur (auth)      |
| PUT     | `/profil`                   | Modifier mon profil (auth)     |
| POST    | `/logo`                     | Uploader le logo (auth)        |
| POST    | `/zones-livraison`          | Ajouter une zone (auth)        |
| GET     | `/zones-livraison`          | Mes zones de livraison (auth)  |
| PUT     | `/zones-livraison/:zoneId`  | Modifier une zone (auth)       |
| DELETE  | `/zones-livraison/:zoneId`  | Supprimer une zone (auth)      |

### Produits (`/api/produits`)
| Méthode | Route             | Description                          |
|---------|-------------------|--------------------------------------|
| GET     | `/recherche`      | Rechercher des produits (public)     |
| GET     | `/slug/:slug`     | Voir un produit par slug (public)    |
| GET     | `/:id`            | Voir un produit par ID (public)      |
| GET     | `/`               | Mes produits (vendeur auth)          |
| POST    | `/`               | Créer un produit (vendeur auth)      |
| PUT     | `/:id`            | Modifier un produit (vendeur auth)   |
| DELETE  | `/:id`            | Supprimer un produit (vendeur auth)  |
| DELETE  | `/:id/photo`      | Supprimer une photo (vendeur auth)   |

### Commandes (`/api/commandes`)
| Méthode | Route                | Description                            |
|---------|----------------------|----------------------------------------|
| POST    | `/`                  | Créer une commande (client auth)       |
| GET     | `/mes-commandes`     | Mes commandes (client auth)            |
| PUT     | `/:id/annuler`       | Annuler une commande (client auth)     |
| GET     | `/vendeur`           | Commandes reçues (vendeur auth)        |
| PUT     | `/:id/statut`        | Changer le statut (vendeur auth)       |
| GET     | `/:id`               | Détail d'une commande (auth)           |

### Paiements (`/api/paiements`)
| Méthode | Route                                 | Description                     |
|---------|---------------------------------------|---------------------------------|
| POST    | `/initier`                            | Initier un paiement (client)    |
| POST    | `/confirmer/:reference_transaction`   | Confirmer un paiement (webhook) |
| POST    | `/echec/:reference_transaction`       | Échec de paiement (webhook)     |
| GET     | `/commande/:commandeId`              | Paiement d'une commande (auth)  |
| GET     | `/historique`                         | Historique paiements (vendeur)  |

### Livraisons (`/api/livraisons`)
| Méthode | Route                      | Description                         |
|---------|----------------------------|-------------------------------------|
| GET     | `/commande/:commandeId`   | Suivi de livraison (auth)           |
| GET     | `/vendeur`                 | Mes livraisons (vendeur auth)       |
| PUT     | `/commande/:commandeId`   | Mettre à jour livraison (vendeur)   |

### Dashboard (`/api/dashboard`)
| Méthode | Route            | Description                        |
|---------|------------------|------------------------------------|
| GET     | `/`              | Tableau de bord (vendeur auth)     |
| GET     | `/statistiques`  | Statistiques détaillées (vendeur)  |

### Clients (`/api/clients`)
| Méthode | Route                    | Description                      |
|---------|--------------------------|----------------------------------|
| GET     | `/profil`                | Mon profil (client auth)         |
| PUT     | `/profil`                | Modifier mon profil (client)     |
| PUT     | `/mot-de-passe`          | Changer mot de passe (client)    |
| GET     | `/historique`            | Historique d'achats (client)     |
| GET     | `/facture/:commandeId`   | Facture d'une commande (client)  |

### Notifications (`/api/notifications`)
| Méthode | Route           | Description                       |
|---------|-----------------|-----------------------------------|
| GET     | `/`             | Mes notifications (auth)          |
| PUT     | `/lire-tout`    | Tout marquer comme lu (auth)      |
| PUT     | `/:id/lire`     | Marquer une comme lue (auth)      |
| DELETE  | `/:id`          | Supprimer une notification (auth) |

## Licence

ISC
