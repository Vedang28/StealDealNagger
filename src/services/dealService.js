const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");

const createDeal = async (teamId, data) => {
  // Check for duplicate CRM deal
  const existing = await prisma.deal.findUnique({
    where: {
      teamId_crmDealId_crmSource: {
        teamId,
        crmDealId: data.crmDealId,
        crmSource: data.crmSource,
      },
    },
  });

  if (existing) {
    throw new AppError("Deal already exists from this CRM source", 409);
  }

  const deal = await prisma.deal.create({
    data: {
      teamId,
      crmDealId: data.crmDealId,
      crmSource: data.crmSource,
      name: data.name,
      stage: data.stage,
      amount: data.amount || 0,
      currency: data.currency || "USD",
      contactName: data.contactName || null,
      contactEmail: data.contactEmail || null,
      ownerId: data.ownerId || null,
      lastActivityAt: data.lastActivityAt || new Date(),
      metadata: data.metadata || {},
    },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  return deal;
};

const listDeals = async (teamId, query) => {
  const { status, stage, ownerId, search, sortBy, sortOrder } = query;
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where = { teamId, isActive: true };

  if (status) where.stalenessStatus = status;
  if (stage) where.stage = stage;
  if (ownerId) where.ownerId = ownerId;
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const [deals, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.deal.count({ where }),
  ]);

  return {
    deals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getDealById = async (teamId, dealId) => {
  const deal = await prisma.deal.findFirst({
    where: { id: dealId, teamId, isActive: true },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      activities: {
        orderBy: { performedAt: "desc" },
        take: 10,
      },
      notifications: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!deal) {
    throw new AppError("Deal not found", 404);
  }

  return deal;
};

const updateDeal = async (teamId, dealId, data) => {
  const existing = await prisma.deal.findFirst({
    where: { id: dealId, teamId, isActive: true },
  });

  if (!existing) {
    throw new AppError("Deal not found", 404);
  }

  const deal = await prisma.deal.update({
    where: { id: dealId },
    data,
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  return deal;
};

const snoozeDeal = async (teamId, dealId, { snoozedUntil, snoozeReason }) => {
  const existing = await prisma.deal.findFirst({
    where: { id: dealId, teamId, isActive: true },
  });

  if (!existing) {
    throw new AppError("Deal not found", 404);
  }

  const deal = await prisma.deal.update({
    where: { id: dealId },
    data: {
      snoozedUntil: new Date(snoozedUntil),
      snoozeReason,
      stalenessStatus: "healthy",
    },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  return deal;
};

const unsnoozeDeal = async (teamId, dealId) => {
  const existing = await prisma.deal.findFirst({
    where: { id: dealId, teamId, isActive: true },
  });

  if (!existing) {
    throw new AppError("Deal not found", 404);
  }

  const deal = await prisma.deal.update({
    where: { id: dealId },
    data: {
      snoozedUntil: null,
      snoozeReason: null,
    },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  return deal;
};

const deleteDeal = async (teamId, dealId) => {
  const existing = await prisma.deal.findFirst({
    where: { id: dealId, teamId, isActive: true },
  });

  if (!existing) {
    throw new AppError("Deal not found", 404);
  }

  // Soft delete
  await prisma.deal.update({
    where: { id: dealId },
    data: { isActive: false },
  });

  return { message: "Deal deleted successfully" };
};

const getDealStats = async (teamId) => {
  const [statusCounts, totalRevenue, staleRevenue] = await Promise.all([
    prisma.deal.groupBy({
      by: ["stalenessStatus"],
      where: { teamId, isActive: true },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.deal.aggregate({
      where: { teamId, isActive: true },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.deal.aggregate({
      where: {
        teamId,
        isActive: true,
        stalenessStatus: { in: ["stale", "critical"] },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  const byStatus = {};
  for (const row of statusCounts) {
    byStatus[row.stalenessStatus] = {
      count: row._count.id,
      revenue: row._sum.amount || 0,
    };
  }

  return {
    totalDeals: totalRevenue._count.id,
    totalRevenue: totalRevenue._sum.amount || 0,
    staleDeals: staleRevenue._count.id,
    staleRevenue: staleRevenue._sum.amount || 0,
    byStatus,
  };
};

module.exports = {
  createDeal,
  listDeals,
  getDealById,
  updateDeal,
  snoozeDeal,
  unsnoozeDeal,
  deleteDeal,
  getDealStats,
};
