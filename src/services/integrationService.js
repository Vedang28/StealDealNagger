const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");

const SUPPORTED_PROVIDERS = [
  "hubspot",
  "salesforce",
  "pipedrive",
  "slack",
  "sheets",
];

// ── OAuth Configuration per provider ────────────────────────────────────────
// In production, these would come from environment variables.
// For now we scaffold the full URL-generation + callback logic.
const OAUTH_CONFIG = {
  hubspot: {
    authorizeUrl: "https://app.hubspot.com/oauth/authorize",
    tokenUrl: "https://api.hubapi.com/oauth/v1/token",
    scopes: ["crm.objects.deals.read", "crm.objects.contacts.read"],
    clientId: process.env.HUBSPOT_CLIENT_ID || "",
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET || "",
  },
  salesforce: {
    authorizeUrl: "https://login.salesforce.com/services/oauth2/authorize",
    tokenUrl: "https://login.salesforce.com/services/oauth2/token",
    scopes: ["api", "refresh_token"],
    clientId: process.env.SALESFORCE_CLIENT_ID || "",
    clientSecret: process.env.SALESFORCE_CLIENT_SECRET || "",
  },
  pipedrive: {
    authorizeUrl: "https://oauth.pipedrive.com/oauth/authorize",
    tokenUrl: "https://oauth.pipedrive.com/oauth/token",
    scopes: ["deals:read", "activities:read"],
    clientId: process.env.PIPEDRIVE_CLIENT_ID || "",
    clientSecret: process.env.PIPEDRIVE_CLIENT_SECRET || "",
  },
  slack: {
    authorizeUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    scopes: ["chat:write", "users:read"],
    clientId: process.env.SLACK_CLIENT_ID || "",
    clientSecret: process.env.SLACK_CLIENT_SECRET || "",
  },
  sheets: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  },
};

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
    orderBy: { provider: "asc" },
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
      connected: !!(found && found.status === "active"),
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

  const category = ["hubspot", "salesforce", "pipedrive"].includes(provider)
    ? "crm"
    : "notification";

  const integration = await prisma.integration.upsert({
    where: { teamId_provider: { teamId, provider } },
    update: { status: "active", config: config || {}, updatedAt: new Date() },
    create: {
      teamId,
      provider,
      category,
      status: "active",
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
    throw new AppError("Integration not found", 404);
  }

  await prisma.integration.update({
    where: { teamId_provider: { teamId, provider } },
    data: {
      status: "inactive",
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
    },
  });

  return { message: `${provider} disconnected successfully` };
};

/**
 * Generate an OAuth authorization URL for a provider.
 * The state parameter encodes teamId so the callback can associate the grant.
 */
const getAuthUrl = (teamId, provider, redirectUri) => {
  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    throw new AppError(`Unsupported provider: ${provider}`, 400);
  }

  const config = OAUTH_CONFIG[provider];
  if (!config) {
    throw new AppError(`OAuth not configured for ${provider}`, 400);
  }

  if (!config.clientId) {
    throw new AppError(
      `OAuth client ID not set for ${provider}. Set the ${provider.toUpperCase()}_CLIENT_ID environment variable.`,
      400,
    );
  }

  // Encode team context into state so the callback can map it back
  const state = Buffer.from(JSON.stringify({ teamId, provider })).toString(
    "base64url",
  );

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    state,
  });

  // Some providers need additional params
  if (provider === "sheets") {
    params.set("access_type", "offline");
    params.set("prompt", "consent");
  }

  return { url: `${config.authorizeUrl}?${params.toString()}`, state };
};

/**
 * Handle the OAuth callback — exchange the authorization code for tokens
 * and store them in the integration record.
 */
const handleCallback = async (provider, code, state, redirectUri) => {
  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    throw new AppError(`Unsupported provider: ${provider}`, 400);
  }

  // Decode state to get teamId
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(state, "base64url").toString());
  } catch {
    throw new AppError("Invalid OAuth state parameter", 400);
  }

  const { teamId } = parsed;
  if (!teamId) {
    throw new AppError("Missing teamId in OAuth state", 400);
  }

  const oauthConfig = OAUTH_CONFIG[provider];
  if (!oauthConfig || !oauthConfig.clientId) {
    throw new AppError(`OAuth not configured for ${provider}`, 400);
  }

  // Exchange authorization code for tokens
  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: oauthConfig.clientId,
    client_secret: oauthConfig.clientSecret,
    redirect_uri: redirectUri,
    code,
  });

  const tokenRes = await fetch(oauthConfig.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody.toString(),
  });

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text();
    throw new AppError(`OAuth token exchange failed: ${errBody}`, 502);
  }

  const tokens = await tokenRes.json();

  const category = ["hubspot", "salesforce", "pipedrive"].includes(provider)
    ? "crm"
    : "notification";

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  const integration = await prisma.integration.upsert({
    where: { teamId_provider: { teamId, provider } },
    update: {
      status: "active",
      accessToken: tokens.access_token || null,
      refreshToken: tokens.refresh_token || null,
      tokenExpiresAt: expiresAt,
      lastSyncAt: new Date(),
      updatedAt: new Date(),
    },
    create: {
      teamId,
      provider,
      category,
      status: "active",
      accessToken: tokens.access_token || null,
      refreshToken: tokens.refresh_token || null,
      tokenExpiresAt: expiresAt,
      lastSyncAt: new Date(),
      config: {},
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

module.exports = {
  getAll,
  getStatusMap,
  connect,
  disconnect,
  getAuthUrl,
  handleCallback,
};
