const { Commande, Produit, Paiement, LigneCommande, Client } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/db');

// =============================================
// TABLEAU DE BORD VENDEUR
// =============================================
exports.getDashboard = async (req, res) => {
  try {
    const vendeur_id = req.user.id;
    const now = new Date();

    // Dates de référence
    const debutJour = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const debutSemaine = new Date(now);
    debutSemaine.setDate(now.getDate() - now.getDay());
    debutSemaine.setHours(0, 0, 0, 0);
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);

    // Chiffre d'affaires quotidien
    const caJournalier = await Commande.sum('montant_total', {
      where: {
        vendeur_id,
        statut: { [Op.notIn]: ['annulee', 'en_attente'] },
        createdAt: { [Op.gte]: debutJour }
      }
    }) || 0;

    // Chiffre d'affaires hebdomadaire
    const caHebdomadaire = await Commande.sum('montant_total', {
      where: {
        vendeur_id,
        statut: { [Op.notIn]: ['annulee', 'en_attente'] },
        createdAt: { [Op.gte]: debutSemaine }
      }
    }) || 0;

    // Chiffre d'affaires mensuel
    const caMensuel = await Commande.sum('montant_total', {
      where: {
        vendeur_id,
        statut: { [Op.notIn]: ['annulee', 'en_attente'] },
        createdAt: { [Op.gte]: debutMois }
      }
    }) || 0;

    // Nombre total de commandes
    const totalCommandes = await Commande.count({ where: { vendeur_id } });

    // Commandes par statut
    const commandesParStatut = await Commande.findAll({
      where: { vendeur_id },
      attributes: [
        'statut',
        [fn('COUNT', col('id')), 'count']
      ],
      group: ['statut'],
      raw: true
    });

    // Nombre de produits
    const totalProduits = await Produit.count({ where: { vendeur_id } });
    const produitsDisponibles = await Produit.count({ where: { vendeur_id, disponible: true } });
    const produitsRuptureStock = await Produit.count({ where: { vendeur_id, stock: 0 } });

    // Produits les plus vendus
    const produitsPopulaires = await LigneCommande.findAll({
      attributes: [
        'produit_id',
        [fn('SUM', col('quantite')), 'total_vendu'],
        [fn('SUM', col('sous_total')), 'chiffre_affaires']
      ],
      include: [{
        model: Produit,
        as: 'produit',
        where: { vendeur_id },
        attributes: ['id', 'nom', 'photos', 'prix_cdf', 'stock']
      }],
      group: ['produit_id', 'produit.id'],
      order: [[fn('SUM', col('quantite')), 'DESC']],
      limit: 10,
      raw: false
    });

    // Produits les plus vus
    const produitsLesPlusVus = await Produit.findAll({
      where: { vendeur_id },
      attributes: ['id', 'nom', 'vues', 'photos'],
      order: [['vues', 'DESC']],
      limit: 10
    });

    // Commandes récentes
    const commandesRecentes = await Commande.findAll({
      where: { vendeur_id },
      include: [{
        model: Client,
        as: 'client',
        attributes: ['id', 'nom', 'prenom', 'telephone']
      }],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Nombre de clients uniques
    const clientsUniques = await Commande.count({
      where: { vendeur_id },
      distinct: true,
      col: 'client_id'
    });

    res.status(200).json({
      chiffre_affaires: {
        journalier: parseFloat(caJournalier),
        hebdomadaire: parseFloat(caHebdomadaire),
        mensuel: parseFloat(caMensuel)
      },
      commandes: {
        total: totalCommandes,
        par_statut: commandesParStatut,
        recentes: commandesRecentes
      },
      produits: {
        total: totalProduits,
        disponibles: produitsDisponibles,
        rupture_stock: produitsRuptureStock,
        populaires: produitsPopulaires,
        les_plus_vus: produitsLesPlusVus
      },
      clients: {
        uniques: clientsUniques
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// STATISTIQUES DÉTAILLÉES PAR PÉRIODE
// =============================================
exports.getStatistiques = async (req, res) => {
  try {
    const vendeur_id = req.user.id;
    const { periode = '30', date_debut, date_fin } = req.query;

    let debut, fin;
    if (date_debut && date_fin) {
      debut = new Date(date_debut);
      fin = new Date(date_fin);
    } else {
      fin = new Date();
      debut = new Date();
      debut.setDate(fin.getDate() - parseInt(periode));
    }

    // Évolution du CA par jour
    const evolutionCA = await Commande.findAll({
      where: {
        vendeur_id,
        statut: { [Op.notIn]: ['annulée', 'en_attente'] },
        createdAt: { [Op.between]: [debut, fin] }
      },
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('SUM', col('montant_total')), 'chiffre_affaires'],
        [fn('COUNT', col('id')), 'nombre_commandes']
      ],
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
      raw: true
    });

    // Répartition par mode de paiement
    const parModePaiement = await Paiement.findAll({
      where: { statut: 'confirmé' },
      attributes: [
        'mode_paiement',
        [fn('COUNT', col('Paiement.id')), 'count'],
        [fn('SUM', col('montant')), 'total']
      ],
      include: [{
        model: Commande,
        as: 'commande',
        where: { vendeur_id },
        attributes: []
      }],
      group: ['mode_paiement'],
      raw: true
    });

    // Répartition par opérateur
    const parOperateur = await Paiement.findAll({
      where: { statut: 'confirmé', mode_paiement: 'mobile_money' },
      attributes: [
        'operateur',
        [fn('COUNT', col('Paiement.id')), 'count'],
        [fn('SUM', col('montant')), 'total']
      ],
      include: [{
        model: Commande,
        as: 'commande',
        where: { vendeur_id },
        attributes: []
      }],
      group: ['operateur'],
      raw: true
    });

    res.status(200).json({
      periode: { debut, fin },
      evolution_ca: evolutionCA,
      repartition_paiement: parModePaiement,
      repartition_operateur: parOperateur
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
