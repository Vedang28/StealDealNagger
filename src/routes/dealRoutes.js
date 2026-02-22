const express = require("express");
const router = express.Router();
const dealController = require("../controllers/dealController");
const { authenticate } = require("../middleware/auth");
const {
  createDealSchema,
  updateDealSchema,
  listDealsQuerySchema,
  snoozeDealSchema,
  validate,
  validateQuery,
} = require("../validators/dealValidator");

// All deal routes require authentication
router.use(authenticate);

// Deal CRUD
router.post("/", validate(createDealSchema), dealController.create);
router.get("/", validateQuery(listDealsQuerySchema), dealController.list);
router.get("/stats", dealController.stats);
router.get("/:id", dealController.getById);
router.patch("/:id", validate(updateDealSchema), dealController.update);
router.delete("/:id", dealController.remove);

// Snooze
router.post("/:id/snooze", validate(snoozeDealSchema), dealController.snooze);
router.delete("/:id/snooze", dealController.unsnooze);

module.exports = router;
