const ruleService = require('../services/ruleService');

const list = async (req, res, next) => {
  try {
    const rules = await ruleService.listRules(req.user.teamId, req.query);
    res.json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const rule = await ruleService.getRuleById(req.user.teamId, req.params.id);
    res.json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const rule = await ruleService.createRule(req.user.teamId, req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const rule = await ruleService.updateRule(req.user.teamId, req.params.id, req.body);
    res.json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await ruleService.deleteRule(req.user.teamId, req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { list, getById, create, update, remove };
