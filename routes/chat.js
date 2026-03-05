const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { auth } = require('../middleware/auth');
const { envoyerMessageRules } = require('../middleware/validation');

// Toutes les routes nécessitent une authentification
router.use(auth);

// Obtenir la liste des conversations
router.get('/conversations', chatController.getConversations);

// Obtenir les messages d'une conversation
router.get('/conversations/:conversationId', chatController.getMessages);

// Envoyer un message
router.post('/envoyer', envoyerMessageRules, chatController.envoyerMessage);

// Démarrer une conversation (depuis un produit)
router.post('/demarrer', chatController.demarrerConversation);

module.exports = router;
