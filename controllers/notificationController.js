const { Notification } = require('../models');

// =============================================
// OBTENIR MES NOTIFICATIONS
// =============================================
exports.getMesNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 30, lu } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      destinataire_type: req.user.role,
      destinataire_id: req.user.id
    };

    if (lu !== undefined) {
      where.lu = lu === 'true';
    }

    const { rows: notifications, count: total } = await Notification.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    // Compter les non lues
    const nonLues = await Notification.count({
      where: {
        destinataire_type: req.user.role,
        destinataire_id: req.user.id,
        lu: false
      }
    });

    res.status(200).json({
      notifications,
      non_lues: nonLues,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// MARQUER UNE NOTIFICATION COMME LUE
// =============================================
exports.marquerCommeLue = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        destinataire_type: req.user.role,
        destinataire_id: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    await notification.update({ lu: true });
    res.status(200).json({ message: 'Notification marquée comme lue' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// MARQUER TOUTES COMME LUES
// =============================================
exports.marquerToutesCommeLues = async (req, res) => {
  try {
    await Notification.update(
      { lu: true },
      {
        where: {
          destinataire_type: req.user.role,
          destinataire_id: req.user.id,
          lu: false
        }
      }
    );

    res.status(200).json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =============================================
// SUPPRIMER UNE NOTIFICATION
// =============================================
exports.supprimerNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        destinataire_type: req.user.role,
        destinataire_id: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    await notification.destroy();
    res.status(200).json({ message: 'Notification supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
