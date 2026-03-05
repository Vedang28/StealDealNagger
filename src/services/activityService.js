const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");

/**
 * Log an activity record for a deal.
 * Called automatically on deal mutations and manually for notes.
 */
const logActivity = async ({
  dealId,
  type,
  description,
  performedBy = null,
  performedAt = null,
}) => {
  const activity = await prisma.activity.create({
    data: {
      dealId,
      type,
      description,
      performedBy,
      performedAt: performedAt || new Date(),
    },
  });

  // Update the deal's lastActivityAt to keep staleness calculations current
  await prisma.deal.update({
    where: { id: dealId },
    data: { lastActivityAt: new Date() },
  });

  return activity;
};

/**
 * Get paginated activities for a deal.
 */
const getActivities = async (dealId, query = {}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where = { dealId };
  if (query.type) where.type = query.type;

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: { performedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.activity.count({ where }),
  ]);

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Create a manual note activity on a deal.
 */
const createNote = async (dealId, userId, description) => {
  return logActivity({
    dealId,
    type: "note",
    description,
    performedBy: userId,
  });
};

module.exports = {
  logActivity,
  getActivities,
  createNote,
};
