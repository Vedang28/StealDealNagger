const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Create a notification record in the DB.
 * Deduplicates: skips if the same deal+user+type notification already
 * exists within the last 24 hours (prevents re-alerting on every cron tick).
 */
const createNotification = async ({ dealId, userId, type, channel, message, suggestedAction }) => {
  const dedupeWindow = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recent = await prisma.notification.findFirst({
    where: {
      dealId,
      userId,
      type,
      createdAt: { gte: dedupeWindow },
    },
  });

  if (recent) {
    return null; // Already notified within dedupe window
  }

  const notification = await prisma.notification.create({
    data: {
      dealId,
      userId,
      type,
      channel: channel || 'slack',
      status: 'pending',
      message,
      suggestedAction,
    },
  });

  return notification;
};

/**
 * List notifications scoped to a team, with optional filters.
 * Scoping happens via the deal → teamId relation.
 */
const getNotifications = async (teamId, query = {}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where = {
    deal: { teamId },
  };

  if (query.status) where.status = query.status;
  if (query.type) where.type = query.type;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: {
        deal: { select: { id: true, name: true, stage: true, stalenessStatus: true, amount: true } },
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Mark a single notification as read (delivered + openedAt timestamp).
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { status: 'delivered', openedAt: new Date() },
  });
};

/**
 * Mark all pending notifications as read for a given user.
 */
const markAllAsRead = async (userId) => {
  const result = await prisma.notification.updateMany({
    where: { userId, status: 'pending' },
    data: { status: 'delivered', openedAt: new Date() },
  });

  return { updated: result.count };
};

module.exports = { createNotification, getNotifications, markAsRead, markAllAsRead };
