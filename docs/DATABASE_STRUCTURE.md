# 🗄️ PayPro Market RDC — Structure de la Base de Données

> **SGBD** : PostgreSQL 15+  
> **ORM** : Sequelize 6.x  
> **Base de données** : `paypromarket_rdc`  
> **Dernière mise à jour** : Février 2026

---

## Table des matières

1. [Schéma global (ERD)](#1-schéma-global-erd)
2. [Tables détaillées](#2-tables-détaillées)
   - [Vendeurs](#21-vendeurs)
   - [Clients](#22-clients)
   - [Produits](#23-produits)
   - [Commandes](#24-commandes)
   - [LigneCommandes](#25-lignecommandes)
   - [Paiements](#26-paiements)
   - [Livraisons](#27-livraisons)
   - [ZoneLivraisons](#28-zonelivraisons)
   - [Notifications](#29-notifications)
3. [Relations et clés étrangères](#3-relations-et-clés-étrangères)
4. [Enums et valeurs possibles](#4-enums-et-valeurs-possibles)
5. [Index et contraintes](#5-index-et-contraintes)
6. [Diagramme des flux de données](#6-diagramme-des-flux-de-données)

---

## 1. Schéma global (ERD)

```
┌──────────────┐       ┌──────────────┐
│   Vendeurs   │       │   Clients    │
│──────────────│       │──────────────│
│ id (PK)      │       │ id (PK)      │
│ nom_boutique │       │ nom          │
│ slug         │       │ prenom       │
│ type_boutique│       │ telephone    │
│ email        │       │ email        │
│ telephone    │       │ mot_de_passe │
│ mot_de_passe │       │ ville        │
│ ville        │       │ adresse      │
│ ...          │       │ actif        │
└──────┬───────┘       └──────┬───────┘
       │                      │
       │ 1:N                  │ 1:N
       ▼                      ▼
┌──────────────┐       ┌──────────────┐
│   Produits   │       │  Commandes   │◄────── Vendeur (vendeur_id)
│──────────────│       │──────────────│
│ id (PK)      │       │ id (PK)      │
│ vendeur_id   │──┐    │ numero_cmd   │
│ nom          │  │    │ client_id    │
│ slug         │  │    │ vendeur_id   │
│ prix_cdf     │  │    │ montant_total│
│ prix_usd     │  │    │ devise       │
│ stock        │  │    │ statut       │
│ photos       │  │    │ mode_livrais.│
│ ...          │  │    └──────┬───────┘
└──────┬───────┘  │           │
       │          │           │ 1:N          1:1              1:1
       │          │           ▼               ▼                ▼
       │          │    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
       │          │    │LigneCommandes│ │  Paiements   │ │  Livraisons  │
       │          │    │──────────────│ │──────────────│ │──────────────│
       │          └───►│ commande_id  │ │ commande_id  │ │ commande_id  │
       └──────────────►│ produit_id   │ │ montant      │ │ statut       │
                       │ quantite     │ │ mode_paiement│ │ livreur_nom  │
                       │ prix_unitaire│ │ operateur    │ │ frais_livrais│
                       │ sous_total   │ │ reference    │ │ dates        │
                       └──────────────┘ └──────────────┘ └──────────────┘

┌──────────────┐       ┌──────────────┐
│ZoneLivraisons│       │Notifications │
│──────────────│       │──────────────│
│ id (PK)      │       │ id (PK)      │
│ vendeur_id   │       │ dest_type    │ ← 'vendeur' ou 'client'
│ nom_zone     │       │ dest_id      │ ← ID polymorphique
│ ville        │       │ titre        │
│ frais_cdf    │       │ message      │
│ frais_usd    │       │ type         │
│ delai_heures │       │ lu           │
│ actif        │       │ donnees(JSON)│
└──────────────┘       └──────────────┘
```

---

## 2. Tables détaillées

### 2.1 Vendeurs

> Table : `Vendeurs` | Modèle : `Vendeur` | Fichier : `models/Vendeur.js`

| Colonne | Type | Null | Défaut | Contraintes | Description |
|---------|------|------|--------|-------------|-------------|
| `id` | INTEGER | ❌ | Auto | **PK**, Auto-increment | Identifiant unique |
| `nom_boutique` | VARCHAR(255) | ❌ | — | — | Nom de la boutique |
| `slug` | VARCHAR(255) | ❌ | — | **UNIQUE** | URL-friendly (auto-généré) |
| `type_boutique` | ENUM | ❌ | — | — | `'détaillant'` \| `'grossiste'` |
| `logo` | VARCHAR(255) | ✅ | `null` | — | Chemin vers le fichier logo |
| `description` | TEXT | ✅ | — | — | Description de la boutique |
| `telephone` | VARCHAR(255) | ❌ | — | **UNIQUE** | Numéro de téléphone |
| `email` | VARCHAR(255) | ❌ | — | **UNIQUE**, isEmail | Adresse email |
| `mot_de_passe` | VARCHAR(255) | ❌ | — | — | Hash bcrypt |
| `ville` | VARCHAR(255) | ❌ | — | — | Ville du vendeur |
| `categorie_boutique` | ENUM | ✅ | `'autre'` | — | Catégorie de la boutique |
| `langue` | VARCHAR(255) | ✅ | `'fr'` | — | Langue préférée |
| `actif` | BOOLEAN | ✅ | `true` | — | Compte actif/désactivé |
| `adresse` | VARCHAR(255) | ✅ | — | — | Adresse physique |
| `mode_livraison` | JSON | ✅ | `['retrait_boutique']` | — | Modes de livraison supportés |
| `createdAt` | TIMESTAMP | ❌ | Auto | — | Date de création |
| `updatedAt` | TIMESTAMP | ❌ | Auto | — | Dernière modification |

---

### 2.2 Clients

> Table : `Clients` | Modèle : `Client` | Fichier : `models/Client.js`

| Colonne | Type | Null | Défaut | Contraintes | Description |
|---------|------|------|--------|-------------|-------------|
| `id` | INTEGER | ❌ | Auto | **PK**, Auto-increment | Identifiant unique |
| `nom` | VARCHAR(255) | ❌ | — | — | Nom du client |
| `prenom` | VARCHAR(255) | ✅ | — | — | Prénom |
| `telephone` | VARCHAR(255) | ❌ | — | **UNIQUE** | Numéro de téléphone |
| `email` | VARCHAR(255) | ✅ | — | **UNIQUE**, isEmail | Email (optionnel) |
| `mot_de_passe` | VARCHAR(255) | ❌ | — | — | Hash bcrypt |
| `ville` | VARCHAR(255) | ✅ | `'Lubumbashi'` | — | Ville du client |
| `adresse` | VARCHAR(255) | ✅ | — | — | Adresse physique |
| `actif` | BOOLEAN | ✅ | `true` | — | Compte actif/désactivé |
| `createdAt` | TIMESTAMP | ❌ | Auto | — | Date de création |
| `updatedAt` | TIMESTAMP | ❌ | Auto | — | Dernière modification |

---

### 2.3 Produits

> Table : `Produits` | Modèle : `Produit` | Fichier : `models/Produit.js`

| Colonne | Type | Null | Défaut | Contraintes | Description |
|---------|------|------|--------|-------------|-------------|
| `id` | INTEGER | ❌ | Auto | **PK**, Auto-increment | Identifiant unique |
| `vendeur_id` | INTEGER | ❌ | — | **FK** → `Vendeurs.id` | Vendeur propriétaire |
| `nom` | VARCHAR(255) | ❌ | — | — | Nom du produit |
| `slug` | VARCHAR(255) | ❌ | — | **UNIQUE** | Lien unique SEO-friendly |
| `description` | TEXT | ✅ | — | — | Description détaillée |
| `prix_cdf` | DECIMAL(12,2) | ❌ | — | — | Prix en Francs Congolais |
| `prix_usd` | DECIMAL(10,2) | ✅ | — | — | Prix en Dollars US |
| `stock` | INTEGER | ❌ | `0` | — | Quantité en stock |
| `categorie` | VARCHAR(255) | ✅ | — | — | Catégorie libre |
| `promotion` | BOOLEAN | ✅ | `false` | — | En promotion ? |
| `pourcentage_promotion` | INTEGER | ✅ | `0` | min: 0, max: 100 | % de réduction |
| `delai_preparation` | VARCHAR(255) | ✅ | `'24h'` | — | Délai de préparation |
| `photos` | JSON | ✅ | `[]` | — | Tableau d'URLs de photos |
| `disponible` | BOOLEAN | ✅ | `true` | — | Disponible à la vente ? |
| `vues` | INTEGER | ✅ | `0` | — | Compteur de vues |
| `mis_en_avant` | BOOLEAN | ✅ | `false` | — | Produit mis en avant |
| `createdAt` | TIMESTAMP | ❌ | Auto | — | Date de création |
| `updatedAt` | TIMESTAMP | ❌ | Auto | — | Dernière modification |

---

### 2.4 Commandes

> Table : `Commandes` | Modèle : `Commande` | Fichier : `models/Commande.js`

| Colonne | Type | Null | Défaut | Contraintes | Description |
|---------|------|------|--------|-------------|-------------|
| `id` | INTEGER | ❌ | Auto | **PK**, Auto-increment | Identifiant unique |
| `numero_commande` | VARCHAR(255) | ❌ | — | **UNIQUE** | N° commande (ex: CMD-xxx) |
| `client_id` | INTEGER | ❌ | — | **FK** → `Clients.id` | Client qui commande |
| `vendeur_id` | INTEGER | ❌ | — | **FK** → `Vendeurs.id` | Vendeur concerné |
| `montant_total` | DECIMAL(12,2) | ❌ | — | — | Total de la commande |
| `devise` | ENUM | ✅ | `'CDF'` | — | `'CDF'` \| `'USD'` |
| `statut` | ENUM | ✅ | `'en_attente'` | — | Statut de la commande |
| `mode_livraison` | ENUM | ✅ | `'retrait_boutique'` | — | Mode de livraison choisi |
| `adresse_livraison` | VARCHAR(255) | ✅ | — | — | Adresse de livraison |
| `telephone_livraison` | VARCHAR(255) | ✅ | — | — | Téléphone livraison |
| `notes` | TEXT | ✅ | — | — | Notes du client |
| `date_livraison_estimee` | DATE | ✅ | — | — | Date estimée de livraison |
| `createdAt` | TIMESTAMP | ❌ | Auto | — | Date de création |
| `updatedAt` | TIMESTAMP | ❌ | Auto | — | Dernière modification |

**Cycle de vie du statut :**
```
en_attente → confirmée → préparation → en_cours → livrée
     ↓           ↓            ↓
   annulée    annulée     annulée
```

---

### 2.5 LigneCommandes

> Table : `LigneCommandes` | Modèle : `LigneCommande` | Fichier : `models/LigneCommande.js`

| Colonne | Type | Null | Défaut | Contraintes | Description |
|---------|------|------|--------|-------------|-------------|
| `id` | INTEGER | ❌ | Auto | **PK**, Auto-increment | Identifiant unique |
| `commande_id` | INTEGER | ❌ | — | **FK** → `Commandes.id` | Commande parente |
| `produit_id` | INTEGER | ❌ | — | **FK** → `Produits.id` | Produit commandé |
| `quantite` | INTEGER | ❌ | — | min: 1 | Quantité commandée |
| `prix_unitaire` | DECIMAL(12,2) | ❌ | — | — | Prix à l'unité au moment de la commande |
| `devise` | ENUM | ✅ | `'CDF'` | — | `'CDF'` \| `'USD'` |
| `sous_total` | DECIMAL(12,2) | ❌ | — | — | quantité × prix_unitaire |
| `createdAt` | TIMESTAMP | ❌ | Auto | — | Date de création |
| `updatedAt` | TIMESTAMP | ❌ | Auto | — | Dernière modification |

---

### 2.6 Paiements

> Table : `Paiements` | Modèle : `Paiement` | Fichier : `models/Transaction.js`

⚠️ Le fichier s'appelle `Transaction.js` mais le modèle Sequelize exporte sous le nom **`Paiement`**.

| Colonne | Type | Null | Défaut | Contraintes | Description |
|---------|------|------|--------|-------------|-------------|
| `id` | INTEGER | ❌ | Auto | **PK**, Auto-increment | Identifiant unique |
| `commande_id` | INTEGER | ❌ | — | **FK** → `Commandes.id` | Commande associée |
| `montant` | DECIMAL(12,2) | ❌ | — | — | Montant du paiement |
| `devise` | ENUM | ✅ | `'CDF'` | — | `'CDF'` \| `'USD'` |
| `mode_paiement` | ENUM | ❌ | — | — | `'mobile_money'` \| `'paiement_livraison'` |
| `operateur` | ENUM | ✅ | — | — | `'vodacom'` \| `'airtel'` \| `'orange'` |
| `numero_telephone` | VARCHAR(255) | ✅ | — | — | N° pour Mobile Money |
| `reference_transaction` | VARCHAR(255) | ✅ | — | **UNIQUE** | Référence (PAY-xxx) |
| `statut` | ENUM | ✅ | `'en_attente'` | — | Statut du paiement |
| `date_confirmation` | TIMESTAMP | ✅ | — | — | Date de confirmation |
| `createdAt` | TIMESTAMP | ❌ | Auto | — | Date de création |
| `updatedAt` | TIMESTAMP | ❌ | Auto | — | Dernière modification |

**Statuts possibles :** `en_attente` → `confirmé` / `échoué` / `remboursé`

---

### 2.7 Livraisons

> Table : `Livraisons` | Modèle : `Livraison` | Fichier : `models/Livraison.js`

| Colonne | Type | Null | Défaut | Contraintes | Description |
|---------|------|------|--------|-------------|-------------|
| `id` | INTEGER | ❌ | Auto | **PK**, Auto-increment | Identifiant unique |
| `commande_id` | INTEGER | ❌ | — | **FK** → `Commandes.id`, **UNIQUE** | 1 livraison par commande |
| `statut` | ENUM | ✅ | `'en_attente'` | — | Statut de la livraison |
| `mode` | ENUM | ❌ | — | — | Mode de livraison |
| `adresse` | VARCHAR(255) | ✅ | — | — | Adresse de livraison |
| `ville` | VARCHAR(255) | ✅ | — | — | Ville de livraison |
| `zone` | VARCHAR(255) | ✅ | — | — | Zone spécifique |
| `frais_livraison` | DECIMAL(10,2) | ✅ | `0` | — | Frais de livraison |
| `devise_frais` | ENUM | ✅ | `'CDF'` | — | `'CDF'` \| `'USD'` |
| `delai_estime_heures` | INTEGER | ✅ | — | — | Délai estimé en heures |
| `livreur_nom` | VARCHAR(255) | ✅ | — | — | Nom du livreur |
| `livreur_telephone` | VARCHAR(255) | ✅ | — | — | Téléphone du livreur |
| `notes` | TEXT | ✅ | — | — | Notes de livraison |
| `date_expedition` | TIMESTAMP | ✅ | — | — | Date d'expédition (auto) |
| `date_livraison` | TIMESTAMP | ✅ | — | — | Date de livraison (auto) |
| `createdAt` | TIMESTAMP | ❌ | Auto | — | Date de création |
| `updatedAt` | TIMESTAMP | ❌ | Auto | — | Dernière modification |

**Statuts possibles :** `en_attente` → `préparation` → `expédiée` → `en_cours` → `livrée` / `échec`

---

### 2.8 ZoneLivraisons

> Table : `ZoneLivraisons` | Modèle : `ZoneLivraison` | Fichier : `models/ZoneLivraison.js`

| Colonne | Type | Null | Défaut | Contraintes | Description |
|---------|------|------|--------|-------------|-------------|
| `id` | INTEGER | ❌ | Auto | **PK**, Auto-increment | Identifiant unique |
| `vendeur_id` | INTEGER | ❌ | — | **FK** → `Vendeurs.id` | Vendeur propriétaire |
| `nom_zone` | VARCHAR(255) | ❌ | — | — | Nom de la zone (ex: Gombe) |
| `ville` | VARCHAR(255) | ❌ | — | — | Ville couverte |
| `delai_heures` | INTEGER | ❌ | `24` | — | Temps de livraison en heures |
| `frais_livraison_cdf` | DECIMAL(10,2) | ✅ | `0` | — | Frais en Francs Congolais |
| `frais_livraison_usd` | DECIMAL(10,2) | ✅ | `0` | — | Frais en Dollars US |
| `actif` | BOOLEAN | ✅ | `true` | — | Zone active ? |
| `createdAt` | TIMESTAMP | ❌ | Auto | — | Date de création |
| `updatedAt` | TIMESTAMP | ❌ | Auto | — | Dernière modification |

---

### 2.9 Notifications

> Table : `Notifications` | Modèle : `Notification` | Fichier : `models/Notification.js`

| Colonne | Type | Null | Défaut | Contraintes | Description |
|---------|------|------|--------|-------------|-------------|
| `id` | INTEGER | ❌ | Auto | **PK**, Auto-increment | Identifiant unique |
| `destinataire_type` | ENUM | ❌ | — | — | `'vendeur'` \| `'client'` |
| `destinataire_id` | INTEGER | ❌ | — | — | ID du destinataire (polymorphique) |
| `titre` | VARCHAR(255) | ❌ | — | — | Titre de la notification |
| `message` | TEXT | ❌ | — | — | Contenu du message |
| `type` | ENUM | ❌ | — | — | Type de notification (voir enums) |
| `lu` | BOOLEAN | ✅ | `false` | — | Notification lue ? |
| `donnees` | JSON | ✅ | `null` | — | Données supplémentaires |
| `createdAt` | TIMESTAMP | ❌ | Auto | — | Date de création |
| `updatedAt` | TIMESTAMP | ❌ | Auto | — | Dernière modification |

> ⚠️ **Modèle polymorphique** : Pas de FK Sequelize — utilise `destinataire_type` + `destinataire_id` pour pointer vers `Vendeurs` ou `Clients`.

---

## 3. Relations et clés étrangères

```sql
-- Vendeur ↔ Produit (1:N)
Produits.vendeur_id        → Vendeurs.id

-- Client ↔ Commande (1:N)
Commandes.client_id        → Clients.id

-- Vendeur ↔ Commande (1:N)
Commandes.vendeur_id       → Vendeurs.id

-- Commande ↔ LigneCommande (1:N)
LigneCommandes.commande_id → Commandes.id

-- Produit ↔ LigneCommande (1:N)
LigneCommandes.produit_id  → Produits.id

-- Commande ↔ Paiement (1:1)
Paiements.commande_id      → Commandes.id

-- Commande ↔ Livraison (1:1)
Livraisons.commande_id     → Commandes.id  (UNIQUE)

-- Vendeur ↔ ZoneLivraison (1:N)
ZoneLivraisons.vendeur_id  → Vendeurs.id
```

### Tableau des associations Sequelize

| Source | Relation | Cible | FK | Alias |
|--------|----------|-------|-----|-------|
| Vendeur | `hasMany` | Produit | `vendeur_id` | `produits` |
| Produit | `belongsTo` | Vendeur | `vendeur_id` | `vendeur` |
| Vendeur | `hasMany` | Commande | `vendeur_id` | `commandes` |
| Commande | `belongsTo` | Vendeur | `vendeur_id` | `vendeur` |
| Vendeur | `hasMany` | ZoneLivraison | `vendeur_id` | `zones_livraison` |
| ZoneLivraison | `belongsTo` | Vendeur | `vendeur_id` | `vendeur` |
| Client | `hasMany` | Commande | `client_id` | `commandes` |
| Commande | `belongsTo` | Client | `client_id` | `client` |
| Commande | `hasMany` | LigneCommande | `commande_id` | `lignes` |
| LigneCommande | `belongsTo` | Commande | `commande_id` | `commande` |
| Produit | `hasMany` | LigneCommande | `produit_id` | `lignes_commande` |
| LigneCommande | `belongsTo` | Produit | `produit_id` | `produit` |
| Commande | `hasOne` | Paiement | `commande_id` | `paiement` |
| Paiement | `belongsTo` | Commande | `commande_id` | `commande` |
| Commande | `hasOne` | Livraison | `commande_id` | `livraison` |
| Livraison | `belongsTo` | Commande | `commande_id` | `commande` |

---

## 4. Enums et valeurs possibles

### `type_boutique` (Vendeurs)
| Valeur | Description |
|--------|-------------|
| `détaillant` | Vente au détail |
| `grossiste` | Vente en gros |

### `categorie_boutique` (Vendeurs)
| Valeur | Description |
|--------|-------------|
| `alimentaire` | Produits alimentaires |
| `cosmétique` | Cosmétiques et beauté |
| `vêtements` | Habits et mode |
| `artisanat` | Produits artisanaux |
| `électronique` | Appareils électroniques |
| `services` | Services divers |
| `autre` | Autre catégorie |

### `devise`
| Valeur | Description |
|--------|-------------|
| `CDF` | Franc Congolais |
| `USD` | Dollar Américain |

### `statut` (Commandes)
| Valeur | Description | Transition suivante possible |
|--------|-------------|----------------------------|
| `en_attente` | Commande créée | → `confirmée`, `annulée` |
| `confirmée` | Paiement confirmé | → `préparation`, `annulée` |
| `préparation` | En cours de préparation | → `en_cours`, `annulée` |
| `en_cours` | En cours de livraison | → `livrée` |
| `livrée` | Commande livrée | — (état final) |
| `annulée` | Commande annulée | — (état final) |

### `mode_paiement` (Paiements)
| Valeur | Description |
|--------|-------------|
| `mobile_money` | Paiement par Mobile Money |
| `paiement_livraison` | Paiement à la livraison (cash) |

### `operateur` (Paiements)
| Valeur | Description |
|--------|-------------|
| `vodacom` | Vodacom M-Pesa |
| `airtel` | Airtel Money |
| `orange` | Orange Money |

### `statut` (Paiements)
| Valeur | Description |
|--------|-------------|
| `en_attente` | Paiement initié |
| `confirmé` | Paiement reçu et confirmé |
| `échoué` | Paiement échoué |
| `remboursé` | Paiement remboursé |

### `statut` (Livraisons)
| Valeur | Description |
|--------|-------------|
| `en_attente` | En attente de traitement |
| `préparation` | Colis en préparation |
| `expédiée` | Colis expédié |
| `en_cours` | En cours de livraison |
| `livrée` | Livraison effectuée |
| `échec` | Livraison échouée |

### `mode` (Livraisons)
| Valeur | Description |
|--------|-------------|
| `retrait_boutique` | Retrait en boutique par le client |
| `livraison_locale` | Livraison dans la ville |
| `service_tiers` | Service de livraison externe |

### `type` (Notifications)
| Valeur | Description |
|--------|-------------|
| `nouvelle_commande` | Nouvelle commande reçue |
| `commande_confirmée` | Commande confirmée |
| `commande_expédiée` | Commande expédiée |
| `commande_livrée` | Commande livrée |
| `commande_annulée` | Commande annulée |
| `paiement_reçu` | Paiement confirmé |
| `paiement_échoué` | Paiement échoué |
| `rupture_stock` | Produit en rupture de stock |
| `nouveau_message` | Nouveau message reçu |
| `système` | Notification système |

---

## 5. Index et contraintes

### Colonnes avec contrainte UNIQUE

| Table | Colonne | Description |
|-------|---------|-------------|
| `Vendeurs` | `slug` | URL unique de la boutique |
| `Vendeurs` | `email` | Un email par vendeur |
| `Vendeurs` | `telephone` | Un téléphone par vendeur |
| `Clients` | `telephone` | Un téléphone par client |
| `Clients` | `email` | Un email par client (si renseigné) |
| `Produits` | `slug` | URL unique du produit |
| `Commandes` | `numero_commande` | N° de commande unique |
| `Paiements` | `reference_transaction` | Référence unique |
| `Livraisons` | `commande_id` | 1 seule livraison par commande |

### Validations Sequelize

| Table | Colonne | Validation |
|-------|---------|------------|
| `Vendeurs` | `email` | `isEmail: true` |
| `Clients` | `email` | `isEmail: true` |
| `Produits` | `pourcentage_promotion` | `min: 0, max: 100` |
| `LigneCommandes` | `quantite` | `min: 1` |

---

## 6. Diagramme des flux de données

### Flux d'achat complet

```
Client                    Système                     Vendeur
  │                         │                           │
  │── Inscription ─────────►│                           │
  │◄── Token JWT ──────────│                           │
  │                         │                           │
  │── Recherche produits ──►│                           │
  │◄── Liste produits ─────│                           │
  │                         │                           │
  │── Créer commande ─────►│                           │
  │                         │── Stock décrémenté ──────►│
  │                         │── Notification ──────────►│ 🔔
  │                         │── Livraison créée         │
  │◄── Commande créée ─────│                           │
  │                         │                           │
  │── Initier paiement ───►│                           │
  │◄── Référence PAY-xxx ──│                           │
  │                         │                           │
  │     [Mobile Money]      │                           │
  │                         │── Paiement confirmé       │
  │◄── Notification ───────│── Notification ──────────►│ 🔔
  │                         │── Commande → confirmée    │
  │                         │                           │
  │                         │          │── Statut → préparation ──►│
  │◄── Notification ───────│◄─────────│                           │
  │                         │          │── Statut → en_cours ─────►│
  │◄── Notification ───────│◄─────────│── Livraison mise à jour   │
  │                         │          │── Statut → livrée ───────►│
  │◄── Notification ───────│◄─────────│                           │
  │                         │                           │
  │── Voir facture ────────►│                           │
  │◄── Facture PDF ────────│                           │
```

### Gestion du stock

```
Créer commande  → stock -= quantite
Annuler commande → stock += quantite (restauration)
Stock = 0        → Notification "rupture_stock" au vendeur
```

---

> 📖 Cette documentation est synchronisée avec les modèles Sequelize du projet.  
> Toute modification des modèles doit être reflétée ici.
