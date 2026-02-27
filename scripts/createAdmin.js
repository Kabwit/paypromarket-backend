/**
 * Script de création du premier compte Super Admin
 * 
 * Usage: node scripts/createAdmin.js
 * 
 * Ceci crée un compte super_admin avec les identifiants par défaut.
 * ⚠️ CHANGEZ LE MOT DE PASSE après la première connexion !
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, Admin } = require('../models');

async function createSuperAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion DB réussie');

    // Synchroniser le modèle Admin
    await Admin.sync({ alter: true });
    console.log('✅ Table Admin synchronisée');

    // Vérifier si un super admin existe déjà
    const existing = await Admin.findOne({ where: { role: 'super_admin' } });
    if (existing) {
      console.log(`⚠️  Un super admin existe déjà: ${existing.email}`);
      console.log('   Utilisez ces identifiants pour vous connecter.');
      process.exit(0);
    }

    // Créer le super admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin2026', salt);

    const admin = await Admin.create({
      nom: 'Super Admin',
      email: 'admin@paypromarket.com',
      mot_de_passe: hashedPassword,
      role: 'super_admin',
      actif: true
    });

    console.log('\n🎉 Super Admin créé avec succès !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   📧 Email:        admin@paypromarket.com`);
    console.log(`   🔑 Mot de passe: admin2026`);
    console.log(`   👤 Rôle:         super_admin`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🌐 Accédez au panneau admin: http://localhost:5000/admin');
    console.log('⚠️  CHANGEZ votre mot de passe après la première connexion !\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
}

createSuperAdmin();
