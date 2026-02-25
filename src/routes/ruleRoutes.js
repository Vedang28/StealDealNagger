const express = require('express');
const router = express.Router();
const ruleController = require('../controllers/ruleController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createRuleSchema,
  updateRuleSchema,
  listRulesQuerySchema,
  validate,
  validateQuery,
} = require('../validators/ruleValidator');

// All rule routes require authentication
router.use(authenticate);

router.get('/', validateQuery(listRulesQuerySchema), ruleController.list);
router.get('/:id', ruleController.getById);
router.post('/', authorize('admin', 'manager'), validate(createRuleSchema), ruleController.create);
router.patch('/:id', authorize('admin', 'manager'), validate(updateRuleSchema), ruleController.update);
router.delete('/:id', authorize('admin'), ruleController.remove);

module.exports = router;
