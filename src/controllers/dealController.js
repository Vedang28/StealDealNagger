const dealService = require("../services/dealService");

const create = async (req, res, next) => {
  try {
    const deal = await dealService.createDeal(req.user.teamId, req.body);
    res.status(201).json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const result = await dealService.listDeals(req.user.teamId, req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const deal = await dealService.getDealById(req.user.teamId, req.params.id);
    res.json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const deal = await dealService.updateDeal(
      req.user.teamId,
      req.params.id,
      req.body,
    );
    res.json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

const snooze = async (req, res, next) => {
  try {
    const deal = await dealService.snoozeDeal(
      req.user.teamId,
      req.params.id,
      req.body,
    );
    res.json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

const unsnooze = async (req, res, next) => {
  try {
    const deal = await dealService.unsnoozeDeal(req.user.teamId, req.params.id);
    res.json({ success: true, data: deal });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await dealService.deleteDeal(req.user.teamId, req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const stats = async (req, res, next) => {
  try {
    const result = await dealService.getDealStats(req.user.teamId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  list,
  getById,
  update,
  snooze,
  unsnooze,
  remove,
  stats,
};
