const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const teamController = require("../controllers/teamController");
const {
  inviteUserSchema,
  updateUserRoleSchema,
  updateTeamSchema,
  updateProfileSchema,
  changePasswordSchema,
  validate,
} = require("../validators/teamValidator");

// All routes require authentication
router.use(authenticate);

// ── Team info ──────────────────────────────────────────────────────────────────
router.get("/team", teamController.getTeam);
router.patch(
  "/team",
  authorize("admin"),
  validate(updateTeamSchema),
  teamController.updateTeam,
);
router.delete("/team", authorize("admin"), teamController.deleteTeam);

// ── Team members ───────────────────────────────────────────────────────────────
router.get("/team/members", teamController.getMembers);
router.post(
  "/team/members",
  authorize("admin", "manager"),
  validate(inviteUserSchema),
  teamController.inviteUser,
);
router.patch(
  "/team/members/:userId",
  authorize("admin"),
  validate(updateUserRoleSchema),
  teamController.updateUserRole,
);
router.delete(
  "/team/members/:userId",
  authorize("admin"),
  teamController.deactivateUser,
);
router.post(
  "/team/members/:userId/reactivate",
  authorize("admin"),
  teamController.reactivateUser,
);

// ── Self-service profile ───────────────────────────────────────────────────────
router.patch(
  "/users/me",
  validate(updateProfileSchema),
  teamController.updateProfile,
);
router.patch(
  "/users/me/password",
  validate(changePasswordSchema),
  teamController.changePassword,
);

module.exports = router;
