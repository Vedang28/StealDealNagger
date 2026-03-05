const express = require("express");
const webhookService = require("../services/webhookService");
const slackService = require("../services/slackService");
const logger = require("../config/logger");

const router = express.Router();

// POST /api/v1/webhooks/:provider — Receive CRM webhook events
// Note: Unauthenticated — relies on signature validation
router.post("/:provider", async (req, res) => {
  try {
    const { provider } = req.params;

    // Validate webhook signature
    const isValid = webhookService.validateSignature(
      provider,
      req.headers,
      req.body,
    );

    if (!isValid) {
      logger.warn(`Invalid webhook signature from ${provider}`);
      return res.status(401).json({ error: "Invalid signature" });
    }

    const result = await webhookService.processWebhook(provider, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    logger.error(`Webhook error: ${err.message}`);
    // Always return 200 to avoid webhook retries from the provider
    res.status(200).json({ success: false, error: err.message });
  }
});

// POST /api/v1/webhooks/slack/interact — Slack interactive components
// Slack sends application/x-www-form-urlencoded with a 'payload' field
router.post(
  "/slack/interact",
  express.urlencoded({ extended: true }),
  async (req, res) => {
    try {
      const payload = JSON.parse(req.body.payload || "{}");
      const result = await slackService.handleInteraction(payload);
      res.status(200).json(result);
    } catch (err) {
      logger.error(`Slack interaction error: ${err.message}`);
      res.status(200).json({ text: "Error processing interaction" });
    }
  },
);

module.exports = router;
