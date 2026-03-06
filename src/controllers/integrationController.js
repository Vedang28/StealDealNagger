const integrationService = require("../services/integrationService");
const crmSyncService = require("../services/crmSyncService");
const emailService = require("../services/emailService");

const getAll = async (req, res, next) => {
  try {
    const statusMap = await integrationService.getStatusMap(req.user.teamId);
    res.json({ success: true, data: statusMap });
  } catch (err) {
    next(err);
  }
};

const connect = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const integration = await integrationService.connect(
      req.user.teamId,
      provider,
      req.body,
    );
    res.status(201).json({ success: true, data: integration });
  } catch (err) {
    next(err);
  }
};

const disconnect = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const result = await integrationService.disconnect(
      req.user.teamId,
      provider,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getAuthUrl = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const baseUrl =
      process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri =
      req.query.redirect_uri ||
      `${baseUrl}/api/v1/integrations/${provider}/callback`;
    const result = integrationService.getAuthUrl(
      req.user.teamId,
      provider,
      redirectUri,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const handleCallback = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: { message: "Missing code or state parameter" },
      });
    }

    const baseUrl =
      process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${baseUrl}/api/v1/integrations/${provider}/callback`;
    const integration = await integrationService.handleCallback(
      provider,
      code,
      state,
      redirectUri,
    );

    // In a real app, redirect to the frontend with a success indicator
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(
      `${frontendUrl}/integrations?provider=${provider}&status=connected`,
    );
  } catch (err) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(
      `${frontendUrl}/integrations?provider=${req.params.provider}&status=error&message=${encodeURIComponent(err.message)}`,
    );
  }
};

const syncCRM = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const result = await crmSyncService.syncDeals(req.user.teamId, provider);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const triggerDigest = async (req, res, next) => {
  try {
    const result = await emailService.sendDigest(req.user.teamId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  connect,
  disconnect,
  getAuthUrl,
  handleCallback,
  syncCRM,
  triggerDigest,
};
