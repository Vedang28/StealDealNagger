const integrationService = require('../services/integrationService');

const getAll = async (req, res, next) => {
  try {
    const statusMap = await integrationService.getStatusMap(req.user.teamId);
    res.json({ success: true, data: statusMap });
  } catch (err) {
    next(err);
  }
};

const connect = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const integration = await integrationService.connect(req.user.teamId, provider, req.body);
    res.status(201).json({ success: true, data: integration });
  } catch (err) {
    next(err);
  }
};

const disconnect = async (req, res, next) => {
  try {
    const { provider } = req.params;
    const result = await integrationService.disconnect(req.user.teamId, provider);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, connect, disconnect };
