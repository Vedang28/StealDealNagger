const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

const SUPPORTED_PROVIDERS = ['hubspot', 'salesforce', 'pipedrive', 'slack', 'sheets'];

const getAll = async (teamId) => {
  const integrations = await prisma.integration.findMany({
    where: { teamId },
    select: {
      id: true,
      provider: true,
      category: true,
      status: true,
      lastSyncAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { provider: 'asc' },
  });

  return integrations;
};

/**
 * Returns a map of all providers → { connected, lastSyncAt, status }
 * so the frontend can render all cards even for providers not yet connected.
 */
const getStatusMap = async (teamId) => {
  const integrations = await prisma.integration.findMany({
    where: { teamId },
    select: { provider: true, status: true, lastSyncAt: true, category: true },
  });

  const map = {};
  for (const provider of SUPPORTED_PROVIDERS) {
    const found = integrations.find((i) => i.provider === provider);
    map[provider] = {
      connected: !!(found && found.status === 'active'),
      status: found?.status || null,
      lastSyncAt: found?.lastSyncAt || null,
      category: found?.category || null,
    };
  }

  return map;
};

const connect = async (teamId, provider, config = {}) => {
  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    throw new AppError(`Unsupported provider: ${provider}`, 400);
  }

  const category = ['hubspot', 'salesforce', 'pipedrive'].includes(provider)
    ? 'crm'
    : 'notification';

  const integration = await prisma.integration.upsert({
    where: { teamId_provider: { teamId, provider } },
    update: { status: 'active', config: config || {}, updatedAt: new Date() },
    create: {
      teamId,
      provider,
      category,
      status: 'active',
      config: config || {},
    },
    select: {
      id: true,
      provider: true,
      category: true,
      status: true,
      lastSyncAt: true,
    },
  });

  return integration;
};

const disconnect = async (teamId, provider) => {
  const integration = await prisma.integration.findUnique({
    where: { teamId_provider: { teamId, provider } },
  });

  if (!integration) {
    throw new AppError('Integration not found', 404);
  }

  await prisma.integration.update({
    where: { teamId_provider: { teamId, provider } },
    data: {
      status: 'inactive',
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
    },
  });

  return { message: `${provider} disconnected successfully` };
};

module.exports = { getAll, getStatusMap, connect, disconnect };
