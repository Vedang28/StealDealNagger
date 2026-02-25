const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/pipeline', analyticsController.pipeline);
router.get('/trends', analyticsController.trends);
router.get('/reps', analyticsController.reps);
router.get('/stages', analyticsController.stages);

module.exports = router;
