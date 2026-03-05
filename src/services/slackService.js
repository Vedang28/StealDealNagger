const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../config/logger");

/**
 * Slack Service — sends Block Kit messages via the Slack API
 * when a deal notification is created and the team has Slack connected.
 */

const SLACK_API = "https://slack.com/api";

// ─── Block Kit Message Builders ──────────────────────────────────────────────

/**
 * Build a nudge message for a deal owner (warning status).
 */
const buildNudgeMessage = (deal, notification) => {
  return {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `:warning: Deal Needs Attention`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Deal:*\n${deal.name}` },
          { type: "mrkdwn", text: `*Stage:*\n${deal.stage}` },
          {
            type: "mrkdwn",
            text: `*Amount:*\n$${Number(deal.amount).toLocaleString()}`,
          },
          {
            type: "mrkdwn",
            text: `*Days Inactive:*\n${deal.daysStale} days`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            notification.message ||
            "This deal has been inactive and needs your attention.",
        },
      },
      ...(notification.suggestedAction
        ? [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `:bulb: *Suggested Action:* ${notification.suggestedAction}`,
              },
            },
          ]
        : []),
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Snooze 3 Days", emoji: true },
            action_id: "snooze_3d",
            value: JSON.stringify({ dealId: deal.id, days: 3 }),
          },
          {
            type: "button",
            text: { type: "plain_text", text: "Snooze 7 Days", emoji: true },
            action_id: "snooze_7d",
            value: JSON.stringify({ dealId: deal.id, days: 7 }),
          },
          {
            type: "button",
            text: { type: "plain_text", text: "View Deal", emoji: true },
            style: "primary",
            action_id: "view_deal",
            url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/deals/${deal.id}`,
          },
        ],
      },
      { type: "divider" },
    ],
  };
};

/**
 * Build an escalation message for managers (stale/critical status).
 */
const buildEscalationMessage = (deal, notification, ownerName) => {
  const status = deal.stalenessStatus;
  const emoji = status === "critical" ? ":rotating_light:" : ":red_circle:";

  return {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${emoji} ${status === "critical" ? "CRITICAL" : "Stale"} Deal Escalation`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Deal:*\n${deal.name}` },
          { type: "mrkdwn", text: `*Owner:*\n${ownerName || "Unassigned"}` },
          { type: "mrkdwn", text: `*Stage:*\n${deal.stage}` },
          {
            type: "mrkdwn",
            text: `*Amount:*\n$${Number(deal.amount).toLocaleString()}`,
          },
          {
            type: "mrkdwn",
            text: `*Days Inactive:*\n${deal.daysStale} days`,
          },
          { type: "mrkdwn", text: `*Status:*\n${status.toUpperCase()}` },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            notification.message ||
            "This deal requires immediate management attention.",
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View Deal", emoji: true },
            style: "primary",
            action_id: "view_deal",
            url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/deals/${deal.id}`,
          },
        ],
      },
      { type: "divider" },
    ],
  };
};

// ─── Slack API Methods ──────────────────────────────────────────────────────

/**
 * Send a message to a Slack user via DM.
 */
const sendDM = async (slackBotToken, slackUserId, message) => {
  if (!slackBotToken || !slackUserId) {
    logger.warn(
      `Cannot send Slack DM: missing ${!slackBotToken ? "bot token" : "user ID"}`,
    );
    return null;
  }

  try {
    // Open a DM channel with the user
    const openRes = await fetch(`${SLACK_API}/conversations.open`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${slackBotToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ users: slackUserId }),
    });

    const openData = await openRes.json();
    if (!openData.ok) {
      logger.error(`Slack conversations.open failed: ${openData.error}`);
      return null;
    }

    const channelId = openData.channel.id;

    // Send the message
    const msgRes = await fetch(`${SLACK_API}/chat.postMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${slackBotToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: channelId,
        blocks: message.blocks,
        text: "Deal notification from Stale Deal Nagger",
      }),
    });

    const msgData = await msgRes.json();
    if (!msgData.ok) {
      logger.error(`Slack chat.postMessage failed: ${msgData.error}`);
      return null;
    }

    logger.info(`Slack DM sent to ${slackUserId}`);
    return msgData;
  } catch (err) {
    logger.error(`Slack API error: ${err.message}`);
    return null;
  }
};

// ─── Dispatch Notifications via Slack ───────────────────────────────────────

/**
 * Attempt to send a notification via Slack.
 * Looks up the team's Slack integration for the bot token,
 * and the user's slackUserId for DM targeting.
 */
const dispatchNotification = async (notification) => {
  try {
    // Get the deal with team info
    const deal = await prisma.deal.findUnique({
      where: { id: notification.dealId },
      include: {
        owner: { select: { id: true, name: true, slackUserId: true } },
      },
    });

    if (!deal) {
      logger.warn(`Deal ${notification.dealId} not found for Slack dispatch`);
      return null;
    }

    // Get Slack integration for the team
    const slackIntegration = await prisma.integration.findUnique({
      where: { teamId_provider: { teamId: deal.teamId, provider: "slack" } },
    });

    if (!slackIntegration || slackIntegration.status !== "active") {
      logger.debug(
        `Slack not connected for team ${deal.teamId}, skipping dispatch`,
      );
      return null;
    }

    const botToken = slackIntegration.accessToken;

    // Get the target user's Slack ID
    const user = await prisma.user.findUnique({
      where: { id: notification.userId },
      select: { slackUserId: true, name: true },
    });

    if (!user?.slackUserId) {
      logger.debug(
        `User ${notification.userId} has no Slack ID, skipping dispatch`,
      );
      return null;
    }

    // Build the appropriate message
    let message;
    if (notification.type === "escalation") {
      message = buildEscalationMessage(deal, notification, deal.owner?.name);
    } else {
      message = buildNudgeMessage(deal, notification);
    }

    // Send via Slack
    const result = await sendDM(botToken, user.slackUserId, message);

    // Update notification status
    if (result) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: "sent", sentAt: new Date() },
      });
    } else {
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: "failed",
          errorMessage: "Slack delivery failed",
        },
      });
    }

    return result;
  } catch (err) {
    logger.error(`Slack dispatch error: ${err.message}`);

    // Mark notification as failed
    try {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: "failed", errorMessage: err.message },
      });
    } catch {
      // ignore update error
    }

    return null;
  }
};

// ─── Handle Slack Interaction (button clicks) ───────────────────────────────

/**
 * Handle Slack interactive payload (snooze buttons, etc.)
 */
const handleInteraction = async (payload) => {
  if (!payload || !payload.actions || !payload.actions[0]) {
    return { text: "Invalid interaction payload" };
  }

  const action = payload.actions[0];

  if (action.action_id.startsWith("snooze_")) {
    const { dealId, days } = JSON.parse(action.value);
    const snoozedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await prisma.deal.update({
      where: { id: dealId },
      data: {
        snoozedUntil,
        snoozeReason: `Snoozed via Slack for ${days} days`,
        stalenessStatus: "healthy",
      },
    });

    return {
      text: `:sleeping: Deal snoozed for ${days} days until ${snoozedUntil.toLocaleDateString()}`,
    };
  }

  return { text: "Action processed" };
};

module.exports = {
  buildNudgeMessage,
  buildEscalationMessage,
  sendDM,
  dispatchNotification,
  handleInteraction,
};
