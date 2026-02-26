# 📖 PayPro Market RDC — Documentation API Complète

> **Version** : 1.0.0  
> **Base URL** : `http://localhost:5000`  
> **Dernière mise à jour** : Juin 2025

---

## Table des matières

1. [Présentation du projet](#1-présent
ation-du-projet)
2. [Architecture technique](#2-architecture-technique)
3. [Installation & Configuration](#3-installation--configuration)
4. [Authentification & Sécurité](#4-authentification--sécurité)
5. [Endpoints API](#5-endpoints-api)
   - [5.1 Authentification](#51-authentification-apiauth)
   - [5.2 Vendeurs](#52-vendeurs-apivendeurs)
   - [5.3 Produits](#53-produits-apiproduits)
   - [5.4 Commandes](#54-commandes-apicommandes)
   - [5.5 Paiements](#55-paiements-apipaiements)
   - [5.6 Livraisons](#56-livraisons-apilivraisons)
   - [5.7 Dashboard](#57-dashboard-apidashboard)
   - [5.8 Clients](#58-clients-apiclients)
   - [5.9 Notifications](#59-notifications-apinotifications)
6. [Modèles de données](#6-modèles-de-données)
7. [Codes d'erreur](#7-codes-derreur)
8. [Flux métier](#8-flux-métier)

---

## 1. Présentation du projet

**PayPro Market RDC** est une marketplace digitale conçue pour les vendeurs de la République Démocratique du Congo. La plateforme permet aux vendeurs de créer leur boutique en ligne, gérer leurs produits, recevoir des commandes et être payés via Mobile Money (Vodacom M-Pesa, Airtel Money, Orange Money).

### Fonctionnalités principales

| Module | Description |
|--------|-------------|
| **Gestion des vendeurs** | Inscription, profil boutique, logo, zones de livraison |
| **Catalogue produits** | CRUD complet, photos multiples, promotions, recherche |
| **Commandes** | Panier → commande → confirmation → livraison |
| **Paiements** | Mobile Money (Vodacom, Airtel, Orange) ou paiement à la livraison |
| **Livraisons** | Suivi en temps réel, zones personnalisées, livreur assigné |
| **Dashboard** | Chiffre d'affaires, statistiques, produits populaires |
| **Notifications** | Alertes automatiques pour vendeurs et clients |

---

## 2. Architecture technique

### Stack technologique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| **Runtime** | Node.js | 18+ |
| **Framework** | Express | 5.x |
| **Base de données** | PostgreSQL | 15+ |
| **ORM** | Sequelize | 6.x |
| **Authentification** | JWT (jsonwebtoken) | — |
| **Hashing** | bcryptjs | — |
| **Upload fichiers** | Multer | — |
| **Sécurité** | Helmet, express-rate-limit, CORS | — |

### Structure du projet

```
paypromarket-backend/
├── config/
│   └── db.js                 # Configuration Sequelize & PostgreSQL
├── controllers/
│   ├── authController.js     # Inscription & connexion
│   ├── vendeurController.js  # Gestion vendeurs & boutiques
│   ├── produitController.js  # CRUD produits
│   ├── commandeController.js # Gestion commandes
│   ├── transactionController.js # Paiements Mobile Money
│   ├── livraisonController.js   # Suivi livraisons
│   ├── dashboardController.js   # Statistiques vendeur
│   ├── clientController.js      # Profil & historique client
│   └── notificationController.js # Notifications
├── middleware/
│   ├── auth.js               # JWT verification & role guards
│   └── upload.js             # Multer config (logos & photos)
├── models/
│   ├── index.js              # Associations entre modèles
│   ├── Vendeur.js
│   ├── Client.js
│   ├── Produit.js
│   ├── Commande.js
│   ├── LigneCommande.js
│   ├── Transaction.js        # (exporté comme "Paiement")
│   ├── Livraison.js
│   ├── ZoneLivraison.js
│   └── Notification.js
├── routes/
│   ├── auth.js
│   ├── vendeur.js
│   ├── produit.js
│   ├── commande.js
│   ├── transaction.js
│   ├── livraison.js
│   ├── dashboard.js
│   ├── client.js
│   └── notification.js
├── uploads/                  # Fichiers uploadés (auto-créé)
│   ├── logos/
│   ├── produits/
│   └── autres/
├── server.js                 # Point d'entrée principal
├── package.json
├── .env
└── .env.example
```

---

## 3. Installation & Configuration

### Prérequis

- Node.js 18+
- PostgreSQL 15+
- npm ou yarn

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/Kabwit/paypromarket-backend.git
cd paypromarket-backend

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs
```

### Variables d'environnement (.env)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DB_NAME` | Nom de la base de données | `paypromarket_rdc` |
| `DB_USER` | Utilisateur PostgreSQL | `postgres` |
| `DB_PASS` | Mot de passe PostgreSQL | `votre_mot_de_passe` |
| `DB_HOST` | Hôte de la BDD | `localhost` |
| `DB_PORT` | Port PostgreSQL | `5432` |
| `PORT` | Port du serveur API | `5000` |
| `JWT_SECRET` | Clé secrète JWT | `votre_cle_secrete_complexe` |

### Démarrage

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

Le serveur démarre sur `http://localhost:5000` et synchronise automatiquement la base de données.

---

## 4. Authentification & Sécurité

### JWT (JSON Web Token)

L'API utilise des **JWT** pour l'authentification. Chaque token expire après **7 jours**.

**Header requis :**
```
Authorization: Bearer <votre_token_jwt>
```

**Payload du token :**
```json
{
  "id": 1,
  "role": "vendeur",    // ou "client"
  "email": "user@example.com"
}
```

### Niveaux d'accès (Middleware)

| Middleware | Description | Erreur si non autorisé |
|------------|-------------|----------------------|
| `auth` | Tout utilisateur authentifié (vendeur ou client) | 401 |
| `authVendeur` | Uniquement les vendeurs | 403 |
| `authClient` | Uniquement les clients | 403 |

### Mesures de sécurité

| Mécanisme | Configuration |
|-----------|---------------|
| **Rate Limiting** | 200 requêtes / 15 minutes par IP |
| **Helmet** | Headers de sécurité HTTP |
| **CORS** | Activé (toutes origines en dev) |
| **bcrypt** | Hashing des mots de passe (salt rounds: 10) |
| **Multer** | Validation des types de fichiers (images uniquement) |

---

## 5. Endpoints API

> **38 endpoints au total** répartis en 9 catégories

---

### 5.1 Authentification (`/api/auth`)

#### `POST /api/auth/vendeur/inscription`

Créer un nouveau compte vendeur (boutique).

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `nom_boutique` | string | ✅ | Nom de la boutique |
| `type_boutique` | enum | ✅ | `détaillant` ou `grossiste` |
| `telephone` | string | ✅ | Numéro unique |
| `email` | string | ✅ | Email unique (validé) |
| `mot_de_passe` | string | ✅ | Mot de passe |
| `ville` | string | ✅ | Ville du vendeur |
| `categorie_boutique` | enum | ❌ | `alimentaire`, `cosmétique`, `vêtements`, `artisanat`, `électronique`, `services`, `autre` (défaut: `autre`) |
| `description` | text | ❌ | Description de la boutique |

**Réponse 201 :**
```json
{
  "message": "Boutique créée avec succès",
  "vendeur": { "id": 1, "nom_boutique": "Ma Boutique", "slug": "ma-boutique", ... },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "lien_boutique": "/boutique/ma-boutique"
}
```

---

#### `POST /api/auth/vendeur/connexion`

Connexion d'un vendeur existant.

| Paramètre | Type | Requis |
|-----------|------|--------|
| `email` | string | ✅ |
| `mot_de_passe` | string | ✅ |

**Réponse 200 :**
```json
{
  "message": "Connexion réussie",
  "vendeur": { ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

#### `POST /api/auth/client/inscription`

Créer un nouveau compte client.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `nom` | string | ✅ | Nom du client |
| `prenom` | string | ❌ | Prénom |
| `telephone` | string | ✅ | Numéro unique |
| `email` | string | ❌ | Email unique si fourni |
| `mot_de_passe` | string | ✅ | Mot de passe |
| `ville` | string | ❌ | Défaut: `Lubumbashi` |
| `adresse` | string | ❌ | Adresse physique |

**Réponse 201 :**
```json
{
  "message": "Compte client créé avec succès",
  "client": { "id": 1, "nom": "Kabwit", ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

#### `POST /api/auth/client/connexion`

Connexion d'un client existant (par téléphone).

| Paramètre | Type | Requis |
|-----------|------|--------|
| `telephone` | string | ✅ |
| `mot_de_passe` | string | ✅ |

**Réponse 200 :**
```json
{
  "message": "Connexion réussie",
  "client": { ... },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

#### `GET /api/auth/profil`

🔒 **Auth requise** : `auth` (vendeur ou client)

Récupérer le profil de l'utilisateur connecté.

**Réponse 200 :**
```json
{
  "role": "vendeur",
  "profil": { ... }
}
```

---

### 5.2 Vendeurs (`/api/vendeurs`)

#### `GET /api/vendeurs/boutiques` — 🌐 Public

Lister toutes les boutiques actives avec filtres et pagination.

| Query Param | Type | Description |
|-------------|------|-------------|
| `ville` | string | Filtrer par ville |
| `categorie` | string | Filtrer par catégorie de boutique |
| `type` | string | Filtrer par type (`détaillant`/`grossiste`) |
| `search` | string | Recherche dans le nom de boutique |
| `page` | int | Page (défaut: 1) |
| `limit` | int | Résultats par page (défaut: 20) |

**Réponse 200 :**
```json
{
  "boutiques": [ { "id": 1, "nom_boutique": "...", ... } ],
  "pagination": { "page": 1, "limit": 20, "total": 42, "pages": 3 }
}
```

---

#### `GET /api/vendeurs/boutique/:slug` — 🌐 Public

Voir une boutique spécifique avec ses produits disponibles.

**Réponse 200 :** Objet vendeur + tableau `produits` imbriqué.

---

#### `GET /api/vendeurs/profil`

🔒 **Auth** : `authVendeur`

**Réponse 200 :** Profil vendeur avec zones de livraison.

---

#### `PUT /api/vendeurs/profil`

🔒 **Auth** : `authVendeur`

| Paramètre | Type | Description |
|-----------|------|-------------|
| `nom_boutique` | string | Nouveau nom |
| `description` | text | Description |
| `ville` | string | Ville |
| `categorie_boutique` | enum | Catégorie |
| `adresse` | string | Adresse |
| `mode_livraison` | JSON | Modes de livraison supportés |

---

#### `POST /api/vendeurs/logo`

🔒 **Auth** : `authVendeur` | **Content-Type** : `multipart/form-data`

| Champ | Type | Contraintes |
|-------|------|-------------|
| `logo` | file | Image uniquement (jpeg/jpg/png/gif/webp), max 5 MB |

---

#### `POST /api/vendeurs/zones-livraison`

🔒 **Auth** : `authVendeur`

| Paramètre | Type | Requis |
|-----------|------|--------|
| `nom_zone` | string | ✅ |
| `ville` | string | ✅ |
| `delai_heures` | int | ❌ (défaut: 24) |
| `frais_livraison_cdf` | decimal | ❌ (défaut: 0) |
| `frais_livraison_usd` | decimal | ❌ (défaut: 0) |
| `actif` | boolean | ❌ (défaut: true) |

---

#### `GET /api/vendeurs/zones-livraison`

🔒 **Auth** : `authVendeur` — Liste des zones du vendeur.

#### `PUT /api/vendeurs/zones-livraison/:zoneId`

🔒 **Auth** : `authVendeur` — Modifier une zone.

#### `DELETE /api/vendeurs/zones-livraison/:zoneId`

🔒 **Auth** : `authVendeur` — Supprimer une zone.

---

### 5.3 Produits (`/api/produits`)

#### `GET /api/produits/recherche` — 🌐 Public

Recherche publique de produits avec filtres avancés.

| Query Param | Type | Description |
|-------------|------|-------------|
| `q` | string | Recherche dans nom et description |
| `ville` | string | Filtrer par ville du vendeur |
| `categorie` | string | Catégorie de produit |
| `prix_min` | float | Prix minimum (CDF) |
| `prix_max` | float | Prix maximum (CDF) |
| `promotion` | `true` | Uniquement les produits en promotion |
| `page` | int | Page (défaut: 1) |
| `limit` | int | Résultats par page (défaut: 20) |

**Tri :** Mis en avant → Plus vus → Plus récents

---

#### `GET /api/produits/slug/:slug` — 🌐 Public

Voir un produit par son slug unique. **Incrémente automatiquement le compteur de vues.**

**Réponse 200 :** Objet produit + vendeur (id, nom_boutique, slug, ville, telephone, logo, type_boutique).

---

#### `GET /api/produits/:id` — 🌐 Public

Voir un produit par son ID. Ne modifie pas le compteur de vues.

---

#### `GET /api/produits/`

🔒 **Auth** : `authVendeur` — Lister ses propres produits avec pagination.

| Query Param | Type | Description |
|-------------|------|-------------|
| `page` | int | Défaut: 1 |
| `limit` | int | Défaut: 20 |
| `categorie` | string | Filtrer |
| `disponible` | `true`/`false` | Filtrer disponibilité |

---

#### `POST /api/produits/`

🔒 **Auth** : `authVendeur` | **Content-Type** : `multipart/form-data`

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `nom` | string | ✅ | Nom du produit |
| `description` | text | ❌ | Description détaillée |
| `prix_cdf` | decimal | ✅ | Prix en Francs Congolais |
| `prix_usd` | decimal | ❌ | Prix en Dollars US |
| `stock` | int | ❌ | Quantité en stock (défaut: 0) |
| `categorie` | string | ❌ | Catégorie |
| `promotion` | boolean | ❌ | En promotion ? (défaut: false) |
| `pourcentage_promotion` | int | ❌ | Pourcentage de réduction (0-100) |
| `delai_preparation` | string | ❌ | `1h`, `24h`, `48h`, `72h` (défaut: `24h`) |
| `disponible` | boolean | ❌ | Disponible à l'achat (défaut: true) |
| `photos` | files | ❌ | Max 5 images, 5 MB chacune |

---

#### `PUT /api/produits/:id`

🔒 **Auth** : `authVendeur` | **Content-Type** : `multipart/form-data`

Mêmes champs que `POST` + `mis_en_avant` (boolean). Les nouvelles photos sont **ajoutées** aux existantes.

---

#### `DELETE /api/produits/:id`

🔒 **Auth** : `authVendeur` — Supprimer un produit (doit appartenir au vendeur).

---

#### `DELETE /api/produits/:id/photo`

🔒 **Auth** : `authVendeur`

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `photoUrl` | string | ✅ | URL de la photo à supprimer |

---

### 5.4 Commandes (`/api/commandes`)

#### `POST /api/commandes/`

🔒 **Auth** : `authClient`

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `vendeur_id` | int | ✅ | ID du vendeur |
| `items` | array | ✅ | `[{ produit_id: int, quantite: int }]` (min 1) |
| `devise` | enum | ❌ | `CDF` ou `USD` (défaut: `CDF`) |
| `mode_livraison` | enum | ❌ | `retrait_boutique`, `livraison_locale`, `service_tiers` (défaut: `retrait_boutique`) |
| `adresse_livraison` | string | ❌ | Adresse de livraison |
| `telephone_livraison` | string | ❌ | Téléphone pour la livraison |
| `notes` | text | ❌ | Notes supplémentaires |

**Effets de bord :**
- Décrémente le stock de chaque produit
- Crée un enregistrement Livraison
- Envoie une notification au vendeur
- Alerte rupture de stock si stock = 0
- **Transaction SQL** : tout-ou-rien

---

#### `GET /api/commandes/mes-commandes`

🔒 **Auth** : `authClient` — Historique des commandes du client avec pagination et filtre par statut.

---

#### `PUT /api/commandes/:id/annuler`

🔒 **Auth** : `authClient`

Annuler une commande. Uniquement possible si statut = `en_attente` ou `confirmée`. Restaure le stock.

---

#### `GET /api/commandes/vendeur`

🔒 **Auth** : `authVendeur` — Lister les commandes reçues avec pagination et filtre par statut.

---

#### `PUT /api/commandes/:id/statut`

🔒 **Auth** : `authVendeur`

| Paramètre | Type | Requis |
|-----------|------|--------|
| `statut` | string | ✅ |

**Transitions de statut autorisées :**

```
en_attente → confirmée, annulée
confirmée → préparation, annulée
préparation → en_cours, annulée
en_cours → livrée
livrée → (aucune)
annulée → (aucune)
```

---

#### `GET /api/commandes/:id`

🔒 **Auth** : `auth` — Détail complet d'une commande (client ou vendeur propriétaire uniquement).

---

### 5.5 Paiements (`/api/paiements`)

#### `POST /api/paiements/initier`

🔒 **Auth** : `authClient`

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `commande_id` | int | ✅ | ID de la commande |
| `mode_paiement` | enum | ✅ | `mobile_money` ou `paiement_livraison` |
| `operateur` | enum | Conditionnel | `vodacom`, `airtel`, `orange` (requis si mobile_money) |
| `numero_telephone` | string | Conditionnel | Requis si mobile_money |

---

#### `POST /api/paiements/confirmer/:reference_transaction`

🌐 **Public** (webhook/simulation)

Confirme un paiement. Met à jour le statut de la commande à `confirmée` si elle était `en_attente`. Notifie vendeur et client.

---

#### `POST /api/paiements/echec/:reference_transaction`

🌐 **Public** (webhook/simulation)

Marque un paiement comme échoué. Notifie le client.

---

#### `GET /api/paiements/commande/:commandeId`

🔒 **Auth** : `auth` — Voir le paiement associé à une commande.

---

#### `GET /api/paiements/historique`

🔒 **Auth** : `authVendeur` — Historique des paiements reçus avec pagination et filtre par statut.

---

### 5.6 Livraisons (`/api/livraisons`)

#### `GET /api/livraisons/commande/:commandeId`

🔒 **Auth** : `auth` — Suivi de la livraison d'une commande.

---

#### `GET /api/livraisons/vendeur`

🔒 **Auth** : `authVendeur` — Liste des livraisons avec filtre par statut.

---

#### `PUT /api/livraisons/commande/:commandeId`

🔒 **Auth** : `authVendeur`

| Paramètre | Type | Description |
|-----------|------|-------------|
| `statut` | enum | `en_attente`, `préparation`, `expédiée`, `en_cours`, `livrée`, `échec` |
| `livreur_nom` | string | Nom du livreur assigné |
| `livreur_telephone` | string | Téléphone du livreur |
| `notes` | text | Notes de livraison |
| `delai_estime_heures` | int | Délai estimé |
| `zone` | string | Zone de livraison |
| `frais_livraison` | decimal | Montant des frais |
| `devise_frais` | enum | `CDF` ou `USD` |

**Dates automatiques :** `date_expedition` (quand expédiée/en_cours), `date_livraison` (quand livrée).

---

### 5.7 Dashboard (`/api/dashboard`)

#### `GET /api/dashboard/`

🔒 **Auth** : `authVendeur`

**Réponse 200 :**
```json
{
  "chiffre_affaires": {
    "journalier": 150000.00,
    "hebdomadaire": 750000.00,
    "mensuel": 3200000.00
  },
  "commandes": {
    "total": 156,
    "par_statut": [
      { "statut": "livrée", "count": 120 },
      { "statut": "en_attente", "count": 15 }
    ],
    "recentes": [ "...top 10..." ]
  },
  "produits": {
    "total": 48,
    "disponibles": 42,
    "rupture_stock": 6,
    "populaires": [ "...top 10..." ],
    "les_plus_vus": [ "...top 10..." ]
  },
  "clients": {
    "uniques": 89
  }
}
```

---

#### `GET /api/dashboard/statistiques`

🔒 **Auth** : `authVendeur`

| Query Param | Type | Description |
|-------------|------|-------------|
| `periode` | int | Nombre de jours (défaut: 30) |
| `date_debut` | string | Date de début (remplace `periode`) |
| `date_fin` | string | Date de fin (remplace `periode`) |

**Réponse :** Évolution du CA par jour, répartition par mode de paiement et par opérateur.

---

### 5.8 Clients (`/api/clients`)

#### `GET /api/clients/profil`

🔒 **Auth** : `authClient` — Profil du client connecté.

---

#### `PUT /api/clients/profil`

🔒 **Auth** : `authClient`

| Paramètre | Type |
|-----------|------|
| `nom` | string |
| `prenom` | string |
| `ville` | string |
| `adresse` | string |
| `email` | string |

---

#### `PUT /api/clients/mot-de-passe`

🔒 **Auth** : `authClient`

| Paramètre | Type | Requis |
|-----------|------|--------|
| `ancien_mot_de_passe` | string | ✅ |
| `nouveau_mot_de_passe` | string | ✅ |

---

#### `GET /api/clients/historique`

🔒 **Auth** : `authClient` — Historique complet des commandes avec produits, vendeur et paiement.

---

#### `GET /api/clients/facture/:commandeId`

🔒 **Auth** : `authClient` — Générer une facture détaillée pour une commande.

**Réponse 200 :**
```json
{
  "facture": {
    "numero": "CMD-2025-000001",
    "date": "2025-06-15T10:30:00Z",
    "client": { ... },
    "vendeur": { ... },
    "lignes": [
      { "produit": { "nom": "Produit X" }, "quantite": 2, "prix_unitaire": 15000, "sous_total": 30000 }
    ],
    "montant_total": 30000,
    "devise": "CDF",
    "paiement": { ... },
    "statut": "livrée"
  }
}
```

---

### 5.9 Notifications (`/api/notifications`)

#### `GET /api/notifications/`

🔒 **Auth** : `auth`

| Query Param | Type | Description |
|-------------|------|-------------|
| `page` | int | Défaut: 1 |
| `limit` | int | Défaut: 30 |
| `lu` | `true`/`false` | Filtrer lues/non lues |

**Réponse :** Inclut le compteur `non_lues`.

---

#### `PUT /api/notifications/lire-tout`

🔒 **Auth** : `auth` — Marquer toutes les notifications comme lues.

---

#### `PUT /api/notifications/:id/lire`

🔒 **Auth** : `auth` — Marquer une notification spécifique comme lue.

---

#### `DELETE /api/notifications/:id`

🔒 **Auth** : `auth` — Supprimer une notification.

---

## 6. Modèles de données

### Relations entre modèles

```
Vendeur (1) ──── (N) Produit
Vendeur (1) ──── (N) Commande
Vendeur (1) ──── (N) ZoneLivraison
Client  (1) ──── (N) Commande
Commande (1) ──── (N) LigneCommande
Commande (1) ──── (1) Paiement
Commande (1) ──── (1) Livraison
Produit  (1) ──── (N) LigneCommande
```

### Enums et valeurs possibles

| Champ | Valeurs |
|-------|---------|
| `type_boutique` | `détaillant`, `grossiste` |
| `categorie_boutique` | `alimentaire`, `cosmétique`, `vêtements`, `artisanat`, `électronique`, `services`, `autre` |
| `devise` | `CDF`, `USD` |
| `statut_commande` | `en_attente`, `confirmée`, `préparation`, `en_cours`, `livrée`, `annulée` |
| `mode_paiement` | `mobile_money`, `paiement_livraison` |
| `operateur` | `vodacom`, `airtel`, `orange` |
| `statut_paiement` | `en_attente`, `confirmé`, `échoué` |
| `statut_livraison` | `en_attente`, `préparation`, `expédiée`, `en_cours`, `livrée`, `échec` |
| `mode_livraison` | `retrait_boutique`, `livraison_locale`, `service_tiers` |
| `type_notification` | `nouvelle_commande`, `statut_commande`, `paiement_recu`, `paiement_echoue`, `livraison_update`, `rupture_stock`, `nouveau_client`, `promotion`, `systeme`, `autre` |

---

## 7. Codes d'erreur

| Code HTTP | Signification | Exemple |
|-----------|---------------|---------|
| `200` | Succès | Opération réussie |
| `201` | Créé | Ressource créée avec succès |
| `400` | Requête invalide | Champs manquants, doublons |
| `401` | Non authentifié | Token manquant ou invalide |
| `403` | Interdit | Rôle insuffisant / Compte désactivé |
| `404` | Non trouvé | Ressource inexistante |
| `429` | Trop de requêtes | Rate limit atteint |
| `500` | Erreur serveur | Erreur interne |

**Format d'erreur standard :**
```json
{
  "error": "Description de l'erreur"
}
```

---

## 8. Flux métier

### Flux d'une commande complète

```
1. Client s'inscrit          → POST /api/auth/client/inscription
2. Client cherche produits   → GET /api/produits/recherche?q=...
3. Client voit un produit    → GET /api/produits/slug/mon-produit
4. Client passe commande     → POST /api/commandes/
   ├── Stock décrémenté
   ├── Livraison créée
   └── Notification vendeur ✉️

5. Client initie le paiement → POST /api/paiements/initier
   └── Référence de transaction générée

6. Paiement confirmé (webhook) → POST /api/paiements/confirmer/:ref
   ├── Commande → "confirmée"
   └── Notifications ✉️

7. Vendeur prépare la commande → PUT /api/commandes/:id/statut { "statut": "préparation" }
8. Vendeur expédie            → PUT /api/commandes/:id/statut { "statut": "en_cours" }
9. Livraison mise à jour      → PUT /api/livraisons/commande/:id
10. Commande livrée           → PUT /api/commandes/:id/statut { "statut": "livrée" }
11. Client télécharge facture → GET /api/clients/facture/:id
```

### Flux Mobile Money

```
Client initie → Référence PAY-xxx générée → Webhook confirme/échoue → Statut mis à jour
```

---

> 📝 **Note** : Pour tester tous ces endpoints facilement, utilisez le fichier Postman fourni dans `docs/PayProMarket_RDC.postman_collection.json`.
