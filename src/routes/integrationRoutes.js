const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const integrationController = require('../controllers/integrationController');

router.use(authenticate);

router.get('/', integrationController.getAll);
router.post('/:provider/connect', authorize('admin'), integrationController.connect);
router.delete('/:provider', authorize('admin'), integrationController.disconnect);

module.exports = router;
