const prisma = require("../config/prisma");
const jwt = require("jsonwebtoken");
const { AppError } = require("../middleware/errorHandler");
const { encrypt } = require("../config/encryptionUtils");
const config = require("../config");

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
    scopes: ["chat:write", "incoming-webhook", "users:read"],
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

  const providerConfig = OAUTH_CONFIG[provider];
  if (!providerConfig) {
    throw new AppError(`OAuth not configured for ${provider}`, 400);
  }

  if (!providerConfig.clientId) {
    throw new AppError(
      `OAuth client ID not set for ${provider}. Set the ${provider.toUpperCase()}_CLIENT_ID environment variable.`,
      400,
    );
  }

  // Sign team context into state with JWT to prevent CSRF / tampering
  const state = jwt.sign({ teamId, provider }, config.jwt.secret, {
    expiresIn: "15m",
  });

  const params = new URLSearchParams({
    client_id: providerConfig.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: providerConfig.scopes.join(" "),
    state,
  });

  // Some providers need additional params
  if (provider === "sheets") {
    params.set("access_type", "offline");
    params.set("prompt", "consent");
  }

  return { url: `${providerConfig.authorizeUrl}?${params.toString()}`, state };
};

/**
 * Handle the OAuth callback — exchange the authorization code for tokens
 * and store them in the integration record.
 */
const handleCallback = async (provider, code, state, redirectUri) => {
  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    throw new AppError(`Unsupported provider: ${provider}`, 400);
  }

  // Verify JWT state to get teamId (prevents CSRF and tampering)
  let parsed;
  try {
    parsed = jwt.verify(state, config.jwt.secret);
  } catch {
    throw new AppError("Invalid or expired OAuth state parameter", 400);
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

  // Slack returns { ok, access_token, team, incoming_webhook, ... }
  if (provider === "slack" && tokens.ok === false) {
    throw new AppError(`Slack OAuth failed: ${tokens.error}`, 502);
  }

  const category = ["hubspot", "salesforce", "pipedrive"].includes(provider)
    ? "crm"
    : "notification";

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  // Encrypt tokens before database storage (AES-256-GCM)
  const encryptedAccessToken = encrypt(tokens.access_token);
  const encryptedRefreshToken = encrypt(tokens.refresh_token);

  // Extract Slack-specific fields
  let webhookUrl = null;
  let providerConfig = {};
  let grantedScope = tokens.scope || oauthConfig.scopes.join(" ");

  if (provider === "slack") {
    webhookUrl = tokens.incoming_webhook?.url || null;
    providerConfig = {
      slackTeamId: tokens.team?.id || null,
      slackTeamName: tokens.team?.name || null,
      botUserId: tokens.bot_user_id || null,
    };
  }

  const integration = await prisma.integration.upsert({
    where: { teamId_provider: { teamId, provider } },
    update: {
      status: "active",
      accessToken: encryptedAccessToken || null,
      refreshToken: encryptedRefreshToken || null,
      tokenExpiresAt: expiresAt,
      webhookUrl,
      scope: grantedScope,
      config: providerConfig,
      lastSyncAt: new Date(),
      updatedAt: new Date(),
    },
    create: {
      teamId,
      provider,
      category,
      status: "active",
      accessToken: encryptedAccessToken || null,
      refreshToken: encryptedRefreshToken || null,
      tokenExpiresAt: expiresAt,
      webhookUrl,
      scope: grantedScope,
      config: providerConfig,
      lastSyncAt: new Date(),
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
