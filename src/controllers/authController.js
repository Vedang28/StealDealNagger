const authService = require("../services/authService");
const integrationService = require("../services/integrationService");
const config = require("../config");

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ─── HubSpot OAuth ──────────────────────────────────────────────────────────

const hubspotAuth = async (req, res, next) => {
  try {
    const baseUrl =
      process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${baseUrl}/api/v1/auth/hubspot/callback`;
    const { url } = integrationService.getAuthUrl(
      req.user.teamId,
      "hubspot",
      redirectUri,
    );
    res.redirect(url);
  } catch (err) {
    next(err);
  }
};

const hubspotCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: { message: "Missing code or state parameter" },
      });
    }

    const baseUrl =
      process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${baseUrl}/api/v1/auth/hubspot/callback`;
    await integrationService.handleCallback(
      "hubspot",
      code,
      state,
      redirectUri,
    );

    res.redirect(
      `${config.frontendUrl}/integrations?provider=hubspot&status=connected`,
    );
  } catch (err) {
    res.redirect(
      `${config.frontendUrl}/integrations?provider=hubspot&status=error&message=${encodeURIComponent(err.message)}`,
    );
  }
};

// ─── Slack OAuth ────────────────────────────────────────────────────────────

const slackAuth = async (req, res, next) => {
  try {
    const baseUrl =
      process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${baseUrl}/api/v1/auth/slack/callback`;
    const { url } = integrationService.getAuthUrl(
      req.user.teamId,
      "slack",
      redirectUri,
    );
    res.redirect(url);
  } catch (err) {
    next(err);
  }
};

const slackCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: { message: "Missing code or state parameter" },
      });
    }

    const baseUrl =
      process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${baseUrl}/api/v1/auth/slack/callback`;
    await integrationService.handleCallback("slack", code, state, redirectUri);

    res.redirect(
      `${config.frontendUrl}/integrations?provider=slack&status=connected`,
    );
  } catch (err) {
    res.redirect(
      `${config.frontendUrl}/integrations?provider=slack&status=error&message=${encodeURIComponent(err.message)}`,
    );
  }
};

// ─── Generic OAuth initiation for any supported provider ────────────────────

const initiateOAuth = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const baseUrl =
      process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${baseUrl}/api/v1/integrations/${provider}/callback`;
    const { url } = integrationService.getAuthUrl(
      req.user.teamId,
      provider,
      redirectUri,
    );
    res.redirect(url);
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    const result = await authService.refreshAccessToken(token);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  hubspotAuth,
  hubspotCallback,
  slackAuth,
  slackCallback,
  initiateOAuth,
};
