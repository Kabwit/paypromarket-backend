# 🌍 PayPro Market RDC - Liens d'Accès & Documentation

**Date**: 20 Mars 2026 | **Status**: ✅ Production Ready

---

## 📱 **PLATEFORME MOBILE (Flutter)**

### Architecture & Configuration
- **Version Flutter**: `^3.10.4`
- **Plateforme**: Android & iOS
- **Version App**: `1.0.0+1`
- **Localisation**: Français (FR)

### Accès API Mobile
```
Configuration dynamique via --dart-define:

╔═══════════════════════════════════════════════════════╗
║             COMMANDES DE LANCEMENT FLUTTER            ║
╚═══════════════════════════════════════════════════════╝

📱 ANDROID EMULATOR:
  flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000

📱 iOS SIMULATOR:
  flutter run --dart-define=API_BASE_URL=http://localhost:5000

📱 DEVICE (sur réseau):
  flutter run --dart-define=API_BASE_URL=http://192.168.1.100:5000

🏢 PRODUCTION:
  flutter run --dart-define=API_BASE_URL=https://api.paypromarket.cd:5000
```

### Repositories GitHub (Mobile)
- **Organisation**: Kabwit
- **Repo**: `paypromarket-mobile`
- **Branche Active**: `develop`
- **Dernière Version**: `1f50e1c` (🎨 Theme: 100% Green+White)
- **Git Clone**:
  ```bash
  git clone https://github.com/Kabwit/paypromarket-mobile.git
  cd mobile_frontend
  git checkout develop
  ```

---

## 🖥️ **PLATEFORME BACKEND (Node.js + Express)**

### Configuration Serveur
```
╔════════════════════════════════════════════════════════╗
║          BACKEND API - CONFIGURATION                   ║
╚════════════════════════════════════════════════════════╝

Serveur:     Node.js v22.12.0
Framework:   Express ^5.2.1
Port:        5000 (configuré dans .env)
Host:        0.0.0.0 (Tout interface réseau)
Database:    PostgreSQL (Port 5432)

🟢 URL Locale:    http://localhost:5000
🟢 URL Réseau:    http://192.168.1.X:5000
🌐 URL Production: https://api.paypromarket.cd
```

### Endpoints API Principaux
```
═══════════════════════════════════════════════════════
                   AUTHENTIFICATION
═══════════════════════════════════════════════════════

POST   /api/auth/vendeur/inscription      → Inscription vendeur
POST   /api/auth/vendeur/connexion        → Connexion vendeur
POST   /api/auth/client/inscription       → Inscription client
POST   /api/auth/client/connexion         → Connexion client
GET    /api/auth/profil                   → Mon profil auth

═══════════════════════════════════════════════════════
                   VENDEURS & BOUTIQUES
═══════════════════════════════════════════════════════

GET    /api/vendeurs/boutiques            → Lister boutiques
GET    /api/vendeurs/boutique/:slug       → Boutique par slug
GET    /api/vendeurs/profil               → Mon profil vendeur
POST   /api/vendeurs/logo                 → Upload logo
GET    /api/vendeurs/zones-livraison      → Mes zones
POST   /api/vendeurs/zones-livraison      → Créer zone

═══════════════════════════════════════════════════════
                   PRODUITS
═══════════════════════════════════════════════════════

GET    /api/produits                      → Tous les produits
POST   /api/produits                      → Créer produit
GET    /api/produits/:id                  → Détail produit
GET    /api/produits/slug/:slug           → Par slug
POST   /api/produits/:id/contenu-social   → Générer contenu social

═══════════════════════════════════════════════════════
                   COMMANDES
═══════════════════════════════════════════════════════

POST   /api/commandes                     → Créer commande
GET    /api/commandes/mes-commandes       → Mes commandes (client)
GET    /api/commandes/vendeur             → Commandes vendeur
GET    /api/commandes/:id                 → Détail commande
PUT    /api/commandes/:id/statut          → Mettre à jour statut
DELETE /api/commandes/:id/annuler         → Annuler commande

═══════════════════════════════════════════════════════
              PAIEMENTS & MOBILE MONEY (P2)
═══════════════════════════════════════════════════════

POST   /api/paiements/initier             → Initier paiement
GET    /api/paiements/operateurs          → Lister opérateurs
GET    /api/paiements/operateurs/:op      → Info opérateur
GET    /api/paiements/verifier/:ref       → Vérifier statut paiement
GET    /api/paiements/historique          → Historique paiements

═══════════════════════════════════════════════════════
           REVENDEURS & COMMISSIONS (P2)
═══════════════════════════════════════════════════════

POST   /api/revendeurs/inscription        → S'inscrire revendeur
GET    /api/revendeurs                    → Lister revendeurs
GET    /api/revendeurs/:id/public         → Profil public
GET    /api/revendeurs/:id/profil         → Mon profil revendeur
GET    /api/revendeurs/:id/commissions    → Mes commissions
GET    /api/revendeurs/:id/statistiques   → Mes stats
POST   /api/commissions/demander-versement → Demande versement
GET    /api/commissions/historique        → Historique versements

═══════════════════════════════════════════════════════
                   LIVRAISONS
═══════════════════════════════════════════════════════

GET    /api/livraisons/commande/:id       → Suivi livraison
PUT    /api/livraisons/:id/statut         → Mettre à jour livraison

═══════════════════════════════════════════════════════
                      AVIS
═══════════════════════════════════════════════════════

POST   /api/avis                          → Créer avis
GET    /api/avis/mes-avis                 → Mes avis
GET    /api/avis/vendeur/:id              → Avis du vendeur
GET    /api/avis/produit/:id              → Avis du produit
```

### Repositories GitHub (Backend)
- **Organisation**: Kabwit
- **Repo**: `paypromarket-backend`
- **Branche Active**: `develop`
- **Dernière Version**: `983ca22` (🔧 Fix: Syntax error + axios)
- **Git Clone**:
  ```bash
  git clone https://github.com/Kabwit/paypromarket-backend.git
  cd paypromarket-backend
  git checkout develop
  npm install
  cp .env.example .env
  npm start
  ```

---

## 🛠️ **PANEL ADMIN (Web Interface)**

### Accès Admin
```
╔════════════════════════════════════════════════════════╗
║              PANEL ADMINISTRATEUR                      ║
╚════════════════════════════════════════════════════════╝

🔗 URL Locale:      http://localhost:5000/admin
🔗 URL Réseau:      http://192.168.1.X:5000/admin
🌐 URL Production:  https://api.paypromarket.cd/admin

API Routes Admin:
  GET    /api/admin                       → Statistiques globales
  GET    /api/admin/users                 → Gestion utilisateurs
  PUT    /api/admin/users/:id/role        → Modifier rôle
  POST   /api/admin/verify-vendor/:id     → Vérifier vendeur
  GET    /api/admin/analytics             → Données analytiques
```

### Authentification Admin
- **Type**: JWT Bearer Token
- **Durée Session**: 12 heures
- **Roles**: `super_admin`, `admin`, `moderateur`
- **Header**: `Authorization: Bearer <token>`

---

## 📊 **DASHBOARD VENDEUR**

```
╔════════════════════════════════════════════════════════╗
║           DASHBOARD VENDEUR - ENDPOINTS                ║
╚════════════════════════════════════════════════════════╝

GET    /api/dashboard                    → Vue d'ensemble
  ├─ Ventes du jour/mois/année
  ├─ Commandes récentes
  ├─ Produits populaires
  ├─ Revenus & commissions
  └─ Statistiques globales

GET    /api/dashboard/stock-bas          → Produits sous-stock
GET    /api/dashboard/avis-recents       → Avis récents
GET    /api/dashboard/taux-conversion    → Performance vendeur
```

---

## 🗄️ **BASE DE DONNÉES**

### Configuration PostgreSQL
```
╔════════════════════════════════════════════════════════╗
║        BASE DE DONNÉES - CONFIGURATION                 ║
╚════════════════════════════════════════════════════════╝

Serveur:        localhost
Port:           5432
Base de données: paypromarket_rdc
Utilisateur:    postgres
Mot de passe:   **** (dans .env)

Accessible via:
  psql -h localhost -U postgres -d paypromarket_rdc
```

### Modèles de Données (18 Tables)
```
Core Models:
  • Client           - Utilisateurs clients
  • Vendeur          - Marchands/Boutiques
  • Admin            - Administrateurs
  
Products:
  • Produit          - Catalogue produits
  • LigneCommande    - Détails commandes

Orders:
  • Commande         - Commandes clients
  • HistoriqueStatut - Historique statut
  • Livraison        - Suivi livraisons
  
Payments (P2):
  • Transaction      - Paiements
  • Revendeur        - Système d'affiliés
  • Commission       - Commissions payables

Engagement:
  • Avis             - Avis clients
  • Notification     - Notifications
  • Message          - Chat/Messagerie
  • Signalement      - Anti-arnaque
  
Admin:
  • Verification     - Vérification vendeur
  • ZoneLivraison    - Zones de service
```

---

## 🎨 **COULEURS THÈME (v2.0)**

### Palette Professionnelle
```
╔════════════════════════════════════════════════════════╗
║            IDENTITÉ VISUELLE - COULEURS                ║
╚════════════════════════════════════════════════════════╝

🟢 Primaire (Dark Green):       #1B5E20  [RGB: 27, 94, 32]
🟢 Primaire Clair (Med Green):  #2E7D32  [RGB: 46, 125, 50]
🟢 Primaire Foncé (Very Dark):  #0D3A1A  [RGB: 13, 58, 26]

⚪ Arrière-plan (Off-white):    #F8FAF8  [RGB: 248, 250, 248]
⚪ Surface (Pure white):        #FFFFFF  [RGB: 255, 255, 255]

🟢 Placeholder (Light Green):   #E8F5E9  [RGB: 232, 245, 233]
🟢 Divider (Pale Green):        #C8E6C9  [RGB: 200, 230, 201]
🟢 Status (Medium Green):       #81C784  [RGB: 129, 199, 132]

⚫ Texte Primaire:              #212121  [RGB: 33, 33, 33]
⚫ Texte Secondaire:            #757575  [RGB: 117, 117, 117]

🔴 Erreur:                      #D32F2F  [RGB: 211, 47, 47]
🟢 Succès:                      #388E3C  [RGB: 56, 142, 60]
🟠 Avertissement:               #F57F17  [RGB: 245, 127, 23]
🔵 Info:                        #1565C0  [RGB: 21, 101, 192]
```

---

## 🔐 **AUTHENTIFICATION & SÉCURITÉ**

### Mécanismes Sécurité
```
╔════════════════════════════════════════════════════════╗
║         SÉCURITÉ - PROTOCOLES & STANDARDS              ║
╚════════════════════════════════════════════════════════╝

✓ JWT (JSON Web Tokens)
  ├─ Secret: paypromarket_rdc_secret_jwt_2026_secure_key
  ├─ Durée Client: 7 jours
  ├─ Durée Admin: 12 heures
  └─ Algorithm: HS256

✓ Password Security
  ├─ Hashing: bcryptjs ^3.0.3
  ├─ Salt Rounds: 10
  └─ Comparaison: salted+hashed

✓ Rate Limiting
  ├─ Global: 200 req/15 min par IP
  ├─ Auth: 10 login attempts/15 min
  └─ Middleware: express-rate-limit

✓ CORS
  ├─ Domaines Autorisés: À configurer
  └─ Méthodes: GET, POST, PUT, DELETE

✓ Helmet.js
  ├─ CSP (Content Security Policy)
  ├─ HSTS (HTTP Strict Transport)
  ├─ X-Frame-Options
  └─ X-Content-Type-Options

✓ Compression
  ├─ gzip compression activée
  └─ Performance optimisée
```

### Tokens JWT
```
FORMAT: Authorization: Bearer <token>

PAYLOAD EXEMPLE:
{
  "id": 1,
  "email": "user@example.com",
  "role": "vendeur|client|admin|super_admin",
  "iat": 1234567890,
  "exp": 1234567890
}

RÔLES DISPONIBLES:
  • super_admin    - Accès total
  • admin          - Gestion modérateur
  • moderateur     - Gestion abus
  • vendeur        - Merchant
  • client         - Buyer
```

---

## 📲 **PUSH NOTIFICATIONS (Firebase)**

### Configuration Firebase
```
Status: ⚠️ OPTIONNEL (Configuré pour production)

Services Actifs:
  ✓ Firebase Analytics
  ✓ Firebase Messaging (Push)
  ✓ Firebase Crashlytics
  ✓ Firebase Remote Config

Configuration Requise:
  1. Placer google-services.json (Android)
  2. Placer GoogleService-Info.plist (iOS)
  3. Configurer firebase-service-account.json (Backend)
  
Voir: /firebase_setup.md pour instructions complètes
```

---

## 📦 **DÉPENDANCES VERSIONS**

### Backend Dependencies
```json
{
  "axios": "^1.13.6",
  "bcryptjs": "^3.0.3",
  "express": "^5.2.1",
  "jsonwebtoken": "^9.0.3",
  "sequelize": "^6.35.1",
  "pg": "^8.19.0",
  "firebase-admin": "^13.7.0",
  "socket.io": "^4.8.1",
  "multer": "^2.0.2",
  "helmet": "^8.1.0",
  "cors": "^2.8.6",
  "morgan": "^1.10.1"
}
```

### Mobile Dependencies
```yaml
flutter_sdk: ^3.10.4
provider: ^6.1.0
http: ^1.2.0
firebase_core: latest
firebase_messaging: latest
shared_preferences: ^2.3.0
image_picker: ^1.1.0
cached_network_image: ^3.3.0
```

---

## 🚀 **DÉPLOIEMENT**

### Environnements
```
╔════════════════════════════════════════════════════════╗
║           ENVIRONNEMENTS DISPONIBLES                   ║
╚════════════════════════════════════════════════════════╝

LOCAL (Développement):
  Backend:  http://localhost:5000
  Admin:    http://localhost:5000/admin
  DB:       localhost:5432
  
STAGING (Test):
  Backend:  https://staging-api.paypromarket.cd
  Admin:    https://staging-api.paypromarket.cd/admin
  
PRODUCTION:
  Backend:  https://api.paypromarket.cd
  Admin:    https://api.paypromarket.cd/admin
```

### Variables d'Environnement (.env)
```bash
# DATABASE
DB_NAME=paypromarket_rdc
DB_USER=postgres
DB_PASS=*****
DB_HOST=localhost
DB_PORT=5432

# SERVER
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=paypromarket_rdc_secret_jwt_2026_secure_key
WEBHOOK_SECRET=paypromarket_webhook_2026

# FIREBASE (optionnel pour production)
FIREBASE_PROJECT_ID=****
FIREBASE_PRIVATE_KEY=****
FIREBASE_CLIENT_EMAIL=****

# FRONTEND
FRONTEND_URL=http://localhost:5000
API_BASE_URL=http://localhost:5000
```

---

## 📞 **SUPPORT & DOCUMENTATION**

### Ressources
- **Postman Collection**: À générer depuis `/api/openapi`
- **Swagger UI**: À implémenter
- **API Docs**: Chaque endpoint documenté en JSDoc
- **Mobile Docs**: `/mobile_frontend/README.md`
- **Backend Docs**: `/paypromarket-backend/README.md`

### Contacts
```
👨‍💻 Développeur: Kabwit (GitHub)
📧 Support: support@paypromarket.cd
🐛 Bug Reports: GitHub Issues
📋 Features: GitHub Discussions
```

---

## ✅ **CHECKLIST ACCÈS**

```
╔════════════════════════════════════════════════════════╗
║            VÉRIFICATION DE DÉPLOIEMENT                 ║
╚════════════════════════════════════════════════════════╝

Backend:
  ☑ Server démarrage: npm start
  ☑ Port 5000 accessible
  ☑ Database PostgreSQL connectée
  ☑ JWT secret configuré
  ☑ CORS activé pour mobile
  ☑ Push notifications (optionnel)

Mobile:
  ☑ Flutter SDK 3.10.4+
  ☑ API_BASE_URL configurée
  ☑ Thème vert+blanc appliqué
  ☑ Firebase initialized
  ☑ FCM listeners actifs

Admin:
  ☑ Panel accessible /admin
  ☑ Authentication fonctionnelle
  ☑ Permissions par rôle

Database:
  ☑ 18 tables créées
  ☑ Associations configurées
  ☑ Indexes de performance
  ☑ Timestamp tracking actif
```

---

**Last Updated**: 20 Mar 2026 | **Version**: 2.0.0 | **Status**: ✅ Production Ready
