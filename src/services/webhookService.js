const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../config/logger");
const activityService = require("../services/activityService");

/**
 * Webhook Service — receives and processes real-time updates from CRM providers.
 * Validates payloads and routes to appropriate handlers.
 */

// ─── HubSpot Webhook Handler ────────────────────────────────────────────────

/**
 * Process HubSpot webhook events.
 * HubSpot sends an array of subscription events.
 */
const handleHubSpotWebhook = async (events) => {
  let processed = 0;
  let skipped = 0;

  for (const event of events) {
    try {
      const {
        subscriptionType,
        objectId,
        propertyName,
        propertyValue,
        portalId,
      } = event;

      // Find the deal by HubSpot ID
      const deal = await prisma.deal.findFirst({
        where: {
          crmDealId: String(objectId),
          crmSource: "hubspot",
        },
      });

      if (!deal) {
        skipped++;
        continue;
      }

      if (subscriptionType === "deal.propertyChange") {
        // Map HubSpot stage to our stages
        const stageMap = {
          appointmentscheduled: "discovery",
          qualifiedtobuy: "discovery",
          presentationscheduled: "proposal",
          decisionmakerboughtin: "negotiation",
          contractsent: "negotiation",
          closedwon: "closing",
          closedlost: "closing",
        };

        const updateData = {};
        if (propertyName === "dealstage") {
          updateData.stage =
            stageMap[propertyValue?.toLowerCase()] || deal.stage;
        } else if (propertyName === "amount") {
          updateData.amount = parseFloat(propertyValue) || deal.amount;
        } else if (propertyName === "dealname") {
          updateData.name = propertyValue || deal.name;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.deal.update({
            where: { id: deal.id },
            data: {
              ...updateData,
              lastActivityAt: new Date(),
              metadata: {
                ...(typeof deal.metadata === "object" ? deal.metadata : {}),
                lastWebhookAt: new Date().toISOString(),
              },
            },
          });

          await activityService.logActivity({
            dealId: deal.id,
            type: "stage_change",
            description: `Updated via HubSpot webhook: ${propertyName} → ${propertyValue}`,
            crmActivityId: `webhook-${event.eventId || Date.now()}`,
          });

          processed++;
        }
      } else if (
        subscriptionType === "deal.creation" ||
        subscriptionType === "deal.deletion"
      ) {
        // Handle deal creation/deletion events
        if (subscriptionType === "deal.deletion" && deal) {
          await prisma.deal.update({
            where: { id: deal.id },
            data: { isActive: false },
          });
          processed++;
        }
      }
    } catch (err) {
      logger.error(`Webhook event processing error: ${err.message}`);
      skipped++;
    }
  }

  return { processed, skipped, total: events.length };
};

// ─── Generic Webhook Router ─────────────────────────────────────────────────

/**
 * Route incoming webhook to the appropriate provider handler.
 */
const processWebhook = async (provider, payload) => {
  switch (provider) {
    case "hubspot":
      // HubSpot sends an array of events
      const events = Array.isArray(payload) ? payload : [payload];
      return handleHubSpotWebhook(events);

    case "salesforce":
    case "pipedrive":
      logger.info(`${provider} webhook received (not yet implemented)`);
      return {
        processed: 0,
        skipped: 0,
        total: 0,
        message: `${provider} webhook processing not yet implemented`,
      };

    default:
      throw new AppError(`Unsupported webhook provider: ${provider}`, 400);
  }
};

/**
 * Validate a HubSpot webhook signature.
 * In production, this should verify the X-HubSpot-Signature header.
 */
const validateSignature = (provider, headers, body) => {
  // For development, we accept all webhooks.
  // In production, implement proper signature verification:
  // - HubSpot: X-HubSpot-Signature v2 (HMAC SHA-256)
  // - Salesforce: X-Salesforce-Signature
  // - Pipedrive: verify webhook secret
  if (process.env.NODE_ENV === "production") {
    logger.warn(
      `Webhook signature validation not yet implemented for ${provider} in production`,
    );
  }
  return true;
};

module.exports = {
  processWebhook,
  validateSignature,
  handleHubSpotWebhook,
};
