const { Message, Client, Vendeur, Produit, Notification } = require('../models');
const { Op } = require('sequelize');

// =============================================
// ENVOYER UN MESSAGE
// =============================================
exports.envoyerMessage = async (req, res) => {
  try {
    const { destinataire_type, destinataire_id, contenu, type_message, produit_id } = req.body;

    if (!contenu || !destinataire_type || !destinataire_id) {
      return res.status(400).json({ error: 'Contenu, destinataire_type et destinataire_id sont requis' });
    }

    if (!['client', 'vendeur'].includes(destinataire_type)) {
      return res.status(400).json({ error: 'destinataire_type doit être "client" ou "vendeur"' });
    }

    // Déterminer l'expéditeur
    const expediteur_type = req.user.role;
    const expediteur_id = req.user.id;

    // Vérifier que le destinataire existe
    if (destinataire_type === 'client') {
      const client = await Client.findByPk(destinataire_id);
      if (!client) return res.status(404).json({ error: 'Client destinataire non trouvé' });
    } else {
      const vendeur = await Vendeur.findByPk(destinataire_id);
      if (!vendeur) return res.status(404).json({ error: 'Vendeur destinataire non trouvé' });
    }

    // Générer l'ID de conversation (toujours dans le même ordre)
    let conversation_id;
    if (expediteur_type === 'client') {
      conversation_id = `client_${expediteur_id}_vendeur_${destinataire_id}`;
    } else if (expediteur_type === 'vendeur' && destinataire_type === 'client') {
      conversation_id = `client_${destinataire_id}_vendeur_${expediteur_id}`;
    } else {
      // vendeur à vendeur (cas rare mais supporté)
      const ids = [expediteur_id, destinataire_id].sort((a, b) => a - b);
      conversation_id = `vendeur_${ids[0]}_vendeur_${ids[1]}`;
    }

    const message = await Message.create({
      conversation_id,
      expediteur_type,
      expediteur_id,
      destinataire_type,
      destinataire_id,
      contenu,
      type_message: type_message || 'texte',
      produit_id: produit_id || null
    });

    // Créer une notification pour le destinataire
    const expediteurNom = expediteur_type === 'client'
      ? (await Client.findByPk(expediteur_id))?.nom || 'Un client'
      : (await Vendeur.findByPk(expediteur_id))?.nom_boutique || 'Un vendeur';

    await Notification.create({
      destinataire_type,
      destinataire_id,
      titre: 'Nouveau message',
      message: `${expediteurNom}: ${contenu.substring(0, 50)}${contenu.length > 50 ? '...' : ''}`,
      type: 'nouveau_message',
      donnees: { conversation_id, message_id: message.id }
    });

    // Émettre via Socket.io si disponible
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${destinataire_type}_${destinataire_id}`).emit('nouveau_message', {
        message: message.toJSON(),
        expediteur_nom: expediteurNom
      });
    }

    res.status(201).json({ message: 'Message envoyé', data: message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// OBTENIR LES CONVERSATIONS
// =============================================
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role;

    // Trouver toutes les conversations de cet utilisateur
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { expediteur_type: userType, expediteur_id: userId },
          { destinataire_type: userType, destinataire_id: userId }
        ]
      },
      attributes: ['conversation_id'],
      group: ['conversation_id'],
      raw: true
    });

    const conversationIds = messages.map(m => m.conversation_id);

    // Pour chaque conversation, obtenir le dernier message et les infos de l'interlocuteur
    const conversations = [];
    for (const convId of conversationIds) {
      const lastMessage = await Message.findOne({
        where: { conversation_id: convId },
        order: [['createdAt', 'DESC']]
      });

      // Compter les non-lus
      const nonLus = await Message.count({
        where: {
          conversation_id: convId,
          destinataire_type: userType,
          destinataire_id: userId,
          lu: false
        }
      });

      // Identifier l'interlocuteur
      let interlocuteur_type, interlocuteur_id;
      if (lastMessage.expediteur_type === userType && lastMessage.expediteur_id === userId) {
        interlocuteur_type = lastMessage.destinataire_type;
        interlocuteur_id = lastMessage.destinataire_id;
      } else {
        interlocuteur_type = lastMessage.expediteur_type;
        interlocuteur_id = lastMessage.expediteur_id;
      }

      // Obtenir les infos de l'interlocuteur
      let interlocuteur;
      if (interlocuteur_type === 'client') {
        interlocuteur = await Client.findByPk(interlocuteur_id, {
          attributes: ['id', 'nom', 'prenom', 'telephone']
        });
      } else {
        interlocuteur = await Vendeur.findByPk(interlocuteur_id, {
          attributes: ['id', 'nom_boutique', 'logo', 'telephone', 'verifie']
        });
      }

      conversations.push({
        conversation_id: convId,
        interlocuteur_type,
        interlocuteur: interlocuteur ? interlocuteur.toJSON() : null,
        dernier_message: lastMessage.toJSON(),
        non_lus: nonLus
      });
    }

    // Trier par dernier message (plus récent en premier)
    conversations.sort((a, b) =>
      new Date(b.dernier_message.createdAt) - new Date(a.dernier_message.createdAt)
    );

    res.status(200).json({ conversations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// OBTENIR LES MESSAGES D'UNE CONVERSATION
// =============================================
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const userId = req.user.id;
    const userType = req.user.role;

    // Vérifier que l'utilisateur fait partie de cette conversation
    const check = await Message.findOne({
      where: {
        conversation_id: conversationId,
        [Op.or]: [
          { expediteur_type: userType, expediteur_id: userId },
          { destinataire_type: userType, destinataire_id: userId }
        ]
      }
    });

    if (!check) {
      return res.status(403).json({ error: 'Accès non autorisé à cette conversation' });
    }

    const { count, rows } = await Message.findAndCountAll({
      where: { conversation_id: conversationId },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Marquer comme lus les messages reçus
    await Message.update(
      { lu: true, date_lecture: new Date() },
      {
        where: {
          conversation_id: conversationId,
          destinataire_type: userType,
          destinataire_id: userId,
          lu: false
        }
      }
    );

    res.status(200).json({
      messages: rows.reverse(), // Chronologique
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// DÉMARRER UNE CONVERSATION (depuis un produit)
// =============================================
exports.demarrerConversation = async (req, res) => {
  try {
    const { vendeur_id, message, produit_id } = req.body;

    if (!vendeur_id || !message) {
      return res.status(400).json({ error: 'vendeur_id et message sont requis' });
    }

    const vendeur = await Vendeur.findByPk(vendeur_id);
    if (!vendeur) return res.status(404).json({ error: 'Vendeur non trouvé' });

    const userId = req.user.id;
    const userType = req.user.role;

    let conversation_id;
    if (userType === 'client') {
      conversation_id = `client_${userId}_vendeur_${vendeur_id}`;
    } else {
      conversation_id = `client_${vendeur_id}_vendeur_${userId}`;
    }

    // Si un produit est référencé, envoyer d'abord un message produit
    if (produit_id) {
      const produit = await Produit.findByPk(produit_id);
      if (produit) {
        await Message.create({
          conversation_id,
          expediteur_type: userType,
          expediteur_id: userId,
          destinataire_type: 'vendeur',
          destinataire_id: vendeur_id,
          contenu: `Intéressé par: ${produit.nom} (${produit.prix_cdf} CDF)`,
          type_message: 'produit',
          produit_id
        });
      }
    }

    // Envoyer le message texte
    const newMessage = await Message.create({
      conversation_id,
      expediteur_type: userType,
      expediteur_id: userId,
      destinataire_type: 'vendeur',
      destinataire_id: vendeur_id,
      contenu: message,
      type_message: 'texte'
    });

    // Notification
    const expediteurNom = userType === 'client'
      ? (await Client.findByPk(userId))?.nom || 'Un client'
      : (await Vendeur.findByPk(userId))?.nom_boutique || 'Un vendeur';

    await Notification.create({
      destinataire_type: 'vendeur',
      destinataire_id: vendeur_id,
      titre: 'Nouveau message',
      message: `${expediteurNom}: ${message.substring(0, 50)}`,
      type: 'nouveau_message',
      donnees: { conversation_id, message_id: newMessage.id }
    });

    // Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`user_vendeur_${vendeur_id}`).emit('nouveau_message', {
        message: newMessage.toJSON(),
        expediteur_nom: expediteurNom
      });
    }

    res.status(201).json({
      conversation_id,
      message: newMessage
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
