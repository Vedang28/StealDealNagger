const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const integrationController = require("../controllers/integrationController");

// OAuth callback does NOT require auth (browser redirect from provider)
router.get("/:provider/callback", integrationController.handleCallback);

// All other routes require authentication
router.use(authenticate);

router.get("/", integrationController.getAll);
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

module.exports = router;
