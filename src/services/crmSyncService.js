const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../config/logger");
const config = require("../config");

/**
 * CRM Sync Service — handles fetching deals and activities from connected CRM providers.
 * Currently supports HubSpot with scaffolding for Salesforce and Pipedrive.
 */

// ─── Token refresh ───────────────────────────────────────────────────────────

/**
 * Check if an integration's access token is expired and refresh it if needed.
 * Returns the current (or refreshed) access token.
 */
const ensureValidToken = async (integration) => {
  if (!integration.accessToken) {
    throw new AppError(
      `No access token for ${integration.provider}. Please reconnect.`,
      401,
    );
  }

  // If token expires within 5 minutes, refresh it
  if (
    integration.tokenExpiresAt &&
    new Date(integration.tokenExpiresAt) < new Date(Date.now() + 5 * 60 * 1000)
  ) {
    if (!integration.refreshToken) {
      throw new AppError(
        `Token expired for ${integration.provider} and no refresh token available. Please reconnect.`,
        401,
      );
    }

    const refreshed = await refreshToken(integration);
    return refreshed.accessToken;
  }

  return integration.accessToken;
};

/**
 * Refresh an OAuth token using the refresh token.
 */
const refreshToken = async (integration) => {
  const OAUTH_CONFIG = {
    hubspot: {
      tokenUrl: "https://api.hubapi.com/oauth/v1/token",
      clientId: process.env.HUBSPOT_CLIENT_ID || "",
      clientSecret: process.env.HUBSPOT_CLIENT_SECRET || "",
    },
    salesforce: {
      tokenUrl: "https://login.salesforce.com/services/oauth2/token",
      clientId: process.env.SALESFORCE_CLIENT_ID || "",
      clientSecret: process.env.SALESFORCE_CLIENT_SECRET || "",
    },
    pipedrive: {
      tokenUrl: "https://oauth.pipedrive.com/oauth/token",
      clientId: process.env.PIPEDRIVE_CLIENT_ID || "",
      clientSecret: process.env.PIPEDRIVE_CLIENT_SECRET || "",
    },
  };

  const config = OAUTH_CONFIG[integration.provider];
  if (!config) {
    throw new AppError(
      `Token refresh not supported for ${integration.provider}`,
      400,
    );
  }

  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: integration.refreshToken,
    });

    const res = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const errBody = await res.text();
      logger.error(
        `Token refresh failed for ${integration.provider}: ${errBody}`,
      );
      // Mark integration as expired
      await prisma.integration.update({
        where: { id: integration.id },
        data: { status: "expired" },
      });
      throw new AppError(
        `Token refresh failed for ${integration.provider}. Please reconnect.`,
        401,
      );
    }

    const tokens = await res.json();
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    const updated = await prisma.integration.update({
      where: { id: integration.id },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || integration.refreshToken,
        tokenExpiresAt: expiresAt,
        status: "active",
      },
    });

    logger.info(`Token refreshed for ${integration.provider}`);
    return updated;
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error(`Token refresh error: ${err.message}`);
    throw new AppError(`Failed to refresh token: ${err.message}`, 500);
  }
};

// ─── HubSpot Sync ─────────────────────────────────────────────────────────────

/**
 * Sync deals from HubSpot CRM.
 */
const syncHubSpotDeals = async (teamId, accessToken) => {
  const HUBSPOT_API = "https://api.hubapi.com";
  let url = `${HUBSPOT_API}/crm/v3/objects/deals?limit=100&properties=dealname,dealstage,amount,closedate,pipeline`;
  let allDeals = [];
  let hasMore = true;

  try {
    while (hasMore) {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const err = await res.text();
        throw new AppError(`HubSpot API error: ${err}`, 502);
      }

      const data = await res.json();
      allDeals = allDeals.concat(data.results || []);

      if (data.paging?.next?.link) {
        url = data.paging.next.link;
      } else {
        hasMore = false;
      }
    }

    // Map HubSpot stage names to our stages
    const stageMap = {
      appointmentscheduled: "discovery",
      qualifiedtobuy: "discovery",
      presentationscheduled: "proposal",
      decisionmakerboughtin: "negotiation",
      contractsent: "negotiation",
      closedwon: "closing",
      closedlost: "closing",
    };

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const hubDeal of allDeals) {
      const props = hubDeal.properties;
      const stage = stageMap[props.dealstage?.toLowerCase()] || "discovery";

      try {
        const existing = await prisma.deal.findUnique({
          where: {
            teamId_crmDealId_crmSource: {
              teamId,
              crmDealId: hubDeal.id,
              crmSource: "hubspot",
            },
          },
        });

        if (existing) {
          await prisma.deal.update({
            where: { id: existing.id },
            data: {
              name: props.dealname || existing.name,
              stage,
              amount: parseFloat(props.amount) || existing.amount,
              metadata: {
                hubspotId: hubDeal.id,
                lastSynced: new Date().toISOString(),
              },
            },
          });
          updated++;
        } else {
          await prisma.deal.create({
            data: {
              teamId,
              crmDealId: hubDeal.id,
              crmSource: "hubspot",
              name: props.dealname || "Untitled Deal",
              stage,
              amount: parseFloat(props.amount) || 0,
              lastActivityAt: new Date(),
              metadata: {
                hubspotId: hubDeal.id,
                lastSynced: new Date().toISOString(),
              },
            },
          });
          imported++;
        }
      } catch (err) {
        logger.warn(
          `Failed to sync HubSpot deal ${hubDeal.id}: ${err.message}`,
        );
        skipped++;
      }
    }

    return { total: allDeals.length, imported, updated, skipped };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(`HubSpot sync failed: ${err.message}`, 502);
  }
};

// ─── Generic Sync Entry Point ────────────────────────────────────────────────

/**
 * Sync deals from a connected CRM provider.
 */
const syncDeals = async (teamId, provider) => {
  const integration = await prisma.integration.findUnique({
    where: { teamId_provider: { teamId, provider } },
  });

  if (!integration || integration.status !== "active") {
    throw new AppError(
      `${provider} is not connected. Please connect first.`,
      400,
    );
  }

  const accessToken = await ensureValidToken(integration);

  let result;
  switch (provider) {
    case "hubspot":
      result = await syncHubSpotDeals(teamId, accessToken);
      break;
    case "salesforce":
    case "pipedrive":
      // Scaffold — not yet implemented
      throw new AppError(
        `${provider} sync is not yet implemented. Coming soon!`,
        501,
      );
    default:
      throw new AppError(`Unsupported CRM provider: ${provider}`, 400);
  }

  // Update last sync timestamp
  await prisma.integration.update({
    where: { teamId_provider: { teamId, provider } },
    data: { lastSyncAt: new Date() },
  });

  logger.info(`CRM sync complete for ${provider}: ${JSON.stringify(result)}`);
  return result;
};

module.exports = {
  ensureValidToken,
  refreshToken,
  syncDeals,
  syncHubSpotDeals,
};
