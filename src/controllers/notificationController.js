const notificationService = require('../services/notificationService');

const list = async (req, res, next) => {
  try {
    const result = await notificationService.getNotifications(req.user.teamId, req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const markRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.userId);
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { list, markRead, markAllRead };
