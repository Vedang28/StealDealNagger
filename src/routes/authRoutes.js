const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate, authorize } = require("../middleware/auth");
const {
  registerSchema,
  loginSchema,
  validate,
} = require("../validators/authValidator");

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", authController.refreshToken);

// ─── OAuth callbacks (no auth — browser redirect from provider) ─────────────
router.get("/hubspot/callback", authController.hubspotCallback);
router.get("/slack/callback", authController.slackCallback);

// ─── OAuth initiation (requires authentication) ─────────────────────────────
router.get(
  "/hubspot",
  authenticate,
  authorize("admin"),
  authController.hubspotAuth,
);
router.get(
  "/slack",
  authenticate,
  authorize("admin"),
  authController.slackAuth,
);

module.exports = router;
