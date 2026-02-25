const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const stalenessService = require('../services/stalenessService');

// Admin-only: manually trigger a staleness check (for testing + on-demand runs)
router.post(
  '/run',
  authenticate,
  authorize('admin', 'manager'),
  async (req, res, next) => {
    try {
      // Scope to the caller's team only (never cross-tenant)
      const result = await stalenessService.runStalenessCheck(req.user.teamId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
