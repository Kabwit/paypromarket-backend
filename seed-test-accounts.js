// =============================================
// Script de création des comptes de test
// Vendeur Premium + Client avec toutes les fonctionnalités
// Usage: node seed-test-accounts.js
// =============================================

const bcrypt = require('bcryptjs');
const slugify = require('slugify');
const sequelize = require('./config/db');
const { Vendeur, Client, Produit, Notification } = require('./models');

const MOT_DE_PASSE = 'Test1234!';

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB OK');

    // Sync tables si besoin
    await sequelize.sync({ alter: true });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(MOT_DE_PASSE, salt);

    // =============================================
    // 1. VENDEUR TEST — Premium, vérifié, avec produits
    // =============================================
    const vendeurData = {
      nom_boutique: 'TestShop Premium',
      slug: 'testshop-premium',
      type_boutique: 'détaillant',
      description: 'Boutique de test avec accès complet à toutes les fonctionnalités. Vendeur vérifié, premium business.',
      telephone: '+243900000001',
      email: 'vendeur@test.com',
      mot_de_passe: hash,
      ville: 'Lubumbashi',
      categorie_boutique: 'electronique',
      actif: true,
      verifie: true,
      date_verification: new Date(),
      score_fiabilite: 95.50,
      note_moyenne: 4.75,
      nombre_avis: 42,
      nombre_ventes: 156,
      premium: true,
      plan: 'business',
      date_expiration_premium: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 an
      limite_produits: 1000,
      mode_livraison: ['retrait_boutique', 'livraison_locale', 'service_tiers'],
      adresse: '123 Avenue Mobutu, Lubumbashi',
    };

    let vendeur = await Vendeur.findOne({ where: { email: 'vendeur@test.com' } });
    if (vendeur) {
      await vendeur.update(vendeurData);
      console.log('🔄 Vendeur test mis à jour (id=' + vendeur.id + ')');
    } else {
      vendeur = await Vendeur.create(vendeurData);
      console.log('✅ Vendeur test créé (id=' + vendeur.id + ')');
    }

    // Créer des produits de test pour le vendeur
    const produitsTest = [
      {
        nom: 'iPhone 15 Pro Max',
        slug: 'iphone-15-pro-max-test',
        description: 'Dernier iPhone Apple, 256Go, état neuf sous emballage.',
        prix_cdf: 2500000,
        categorie: 'electronique',
        sous_categorie: 'smartphones',
        stock: 15,
        vendeur_id: vendeur.id,
        disponible: true,
        promotion: true,
        pourcentage_promotion: 10,
        ville: 'Lubumbashi',
        etat: 'neuf',
        vues: 342,
      },
      {
        nom: 'Samsung Galaxy S24 Ultra',
        slug: 'samsung-s24-ultra-test',
        description: 'Samsung Galaxy S24 Ultra 512Go, couleur noir.',
        prix_cdf: 1800000,
        categorie: 'electronique',
        sous_categorie: 'smartphones',
        stock: 8,
        vendeur_id: vendeur.id,
        disponible: true,
        ville: 'Lubumbashi',
        etat: 'neuf',
        vues: 128,
      },
      {
        nom: 'MacBook Air M3',
        slug: 'macbook-air-m3-test',
        description: 'MacBook Air avec puce M3, 8Go RAM, 256Go SSD.',
        prix_cdf: 3200000,
        categorie: 'electronique',
        sous_categorie: 'ordinateurs',
        stock: 5,
        vendeur_id: vendeur.id,
        disponible: true,
        promotion: true,
        pourcentage_promotion: 15,
        ville: 'Lubumbashi',
        etat: 'neuf',
        vues: 95,
      },
      {
        nom: 'Écouteurs AirPods Pro',
        slug: 'airpods-pro-test',
        description: 'Apple AirPods Pro 2ème génération avec boîtier MagSafe.',
        prix_cdf: 350000,
        categorie: 'electronique',
        sous_categorie: 'accessoires',
        stock: 25,
        vendeur_id: vendeur.id,
        disponible: true,
        ville: 'Lubumbashi',
        etat: 'neuf',
        vues: 210,
      },
      {
        nom: 'T-shirt Wax Congolais',
        slug: 't-shirt-wax-congolais-test',
        description: 'T-shirt en tissu wax fait main, taille M/L/XL.',
        prix_cdf: 25000,
        categorie: 'mode',
        sous_categorie: 'vetements',
        stock: 50,
        vendeur_id: vendeur.id,
        disponible: true,
        ville: 'Lubumbashi',
        etat: 'neuf',
        vues: 67,
      },
    ];

    for (const p of produitsTest) {
      const existe = await Produit.findOne({ where: { slug: p.slug } });
      if (!existe) {
        await Produit.create(p);
        console.log(`  📦 Produit créé: ${p.nom}`);
      } else {
        await existe.update(p);
        console.log(`  🔄 Produit mis à jour: ${p.nom}`);
      }
    }

    // =============================================
    // 2. CLIENT TEST — avec adresse, ville, historique
    // =============================================
    const clientData = {
      nom: 'Kabwit',
      prenom: 'Testeur',
      telephone: '+243900000002',
      email: 'client@test.com',
      mot_de_passe: hash,
      ville: 'Lubumbashi',
      adresse: '456 Avenue Kasavubu, Lubumbashi',
      actif: true,
    };

    let client = await Client.findOne({ where: { email: 'client@test.com' } });
    if (client) {
      await client.update(clientData);
      console.log('🔄 Client test mis à jour (id=' + client.id + ')');
    } else {
      client = await Client.create(clientData);
      console.log('✅ Client test créé (id=' + client.id + ')');
    }

    // Notifications de bienvenue
    if (Notification) {
      await Notification.bulkCreate([
        {
          destinataire_type: 'vendeur',
          destinataire_id: vendeur.id,
          titre: 'Bienvenue sur PayPro Market !',
          message: 'Votre boutique TestShop Premium est prête. Commencez à vendre !',
          type: 'système',
        },
        {
          destinataire_type: 'vendeur',
          destinataire_id: vendeur.id,
          titre: 'Vérification approuvée',
          message: 'Votre compte vendeur a été vérifié avec succès.',
          type: 'commande_confirmée',
        },
        {
          destinataire_type: 'vendeur',
          destinataire_id: vendeur.id,
          titre: 'Plan Business activé',
          message: 'Vous bénéficiez du plan Business jusqu\'au 2027.',
          type: 'paiement_reçu',
        },
        {
          destinataire_type: 'client',
          destinataire_id: client.id,
          titre: 'Bienvenue Testeur !',
          message: 'Découvrez les meilleures offres sur PayPro Market RDC.',
          type: 'système',
        },
        {
          destinataire_type: 'client',
          destinataire_id: client.id,
          titre: 'Offre spéciale',
          message: '-10% sur les iPhones chez TestShop Premium !',
          type: 'nouveau_message',
        },
      ]);
      console.log('🔔 Notifications de test créées');
    }

    // =============================================
    // RÉCAPITULATIF
    // =============================================
    console.log('\n' + '='.repeat(50));
    console.log('  COMPTES DE TEST CRÉÉS AVEC SUCCÈS');
    console.log('='.repeat(50));
    console.log('');
    console.log('🏪 VENDEUR TEST (Premium Business, vérifié)');
    console.log('   Email    : vendeur@test.com');
    console.log('   Tél      : +243900000001');
    console.log('   Mot de passe : Test1234!');
    console.log('   Boutique : TestShop Premium');
    console.log('   Slug     : testshop-premium');
    console.log('   Plan     : Business (expire dans 1 an)');
    console.log('   Produits : 5 produits de test');
    console.log('');
    console.log('👤 CLIENT TEST');
    console.log('   Email    : client@test.com');
    console.log('   Tél      : +243900000002');
    console.log('   Mot de passe : Test1234!');
    console.log('   Nom      : Testeur Kabwit');
    console.log('   Ville    : Lubumbashi');
    console.log('');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    console.error(err);
    process.exit(1);
  }
}

seed();
