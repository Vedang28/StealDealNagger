const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const integrationController = require("../controllers/integrationController");
const authController = require("../controllers/authController");

// OAuth callback does NOT require auth (browser redirect from provider)
router.get("/:provider/callback", integrationController.handleCallback);

// All other routes require authentication
router.use(authenticate);

router.get("/", integrationController.getAll);

// Provider-specific OAuth initiation — redirects browser to consent screen
router.get("/:provider/auth", authorize("admin"), authController.initiateOAuth);

router.get(
  "/:provider/auth-url",
  authorize("admin"),
  integrationController.getAuthUrl,
);
router.post(
  "/:provider/connect",
  authorize("admin"),
  integrationController.connect,
);
router.delete(
  "/:provider",
  authorize("admin"),
  integrationController.disconnect,
);

// CRM sync trigger
router.post(
  "/:provider/sync",
  authorize("admin", "manager"),
  integrationController.syncCRM,
);

// Manual digest trigger
router.post(
  "/email/digest",
  authorize("admin"),
  integrationController.triggerDigest,
);

module.exports = router;
