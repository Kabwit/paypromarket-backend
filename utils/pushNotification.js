const admin = require('firebase-admin');
const logger = require('../middleware/logger');
const path = require('path');
const fs = require('fs');

// Initialiser Firebase Admin SDK avec le fichier de service account
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');

let firebaseInitialized = false;

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
    logger.info('Firebase Admin SDK initialisé');
  } catch (err) {
    logger.warn('Impossible d\'initialiser Firebase Admin SDK', { error: err.message });
  }
} else {
  logger.warn('Fichier firebase-service-account.json non trouvé. Push notifications désactivées.');
}

/**
 * Envoyer une notification push via FCM
 * @param {string} fcmToken - Token FCM du destinataire
 * @param {string} title - Titre de la notification
 * @param {string} body - Corps de la notification
 * @param {object} data - Données supplémentaires (optionnel)
 */
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!firebaseInitialized || !fcmToken) return false;

  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: 'high',
        notification: {
          channelId: 'paypromarket_channel',
          sound: 'default'
        }
      }
    };

    const response = await admin.messaging().send(message);
    logger.info('Push notification envoyée', { messageId: response, title });
    return true;
  } catch (err) {
    logger.error('Erreur envoi push notification', { error: err.message, token: fcmToken?.substring(0, 10) + '...' });
    return false;
  }
};

/**
 * Envoyer une notification push à un utilisateur (client ou vendeur)
 */
const sendPushToUser = async (userModel, userId, title, body, data = {}) => {
  try {
    const user = await userModel.findByPk(userId, { attributes: ['fcm_token'] });
    if (user?.fcm_token) {
      return await sendPushNotification(user.fcm_token, title, body, data);
    }
  } catch (err) {
    logger.error('Erreur récupération FCM token', { error: err.message });
  }
  return false;
};

module.exports = { sendPushNotification, sendPushToUser, firebaseInitialized };
