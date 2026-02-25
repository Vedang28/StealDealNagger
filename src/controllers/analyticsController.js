const analyticsService = require("../services/analyticsService");

const pipeline = async (req, res, next) => {
  try {
    const data = await analyticsService.getPipelineHealth(req.user.teamId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const trends = async (req, res, next) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 90); // cap at 90 days
    const data = await analyticsService.getPipelineTrends(
      req.user.teamId,
      days,
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const reps = async (req, res, next) => {
  try {
    const data = await analyticsService.getRepStats(req.user.teamId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const stages = async (req, res, next) => {
  try {
    const data = await analyticsService.getStageBreakdown(req.user.teamId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = { pipeline, trends, reps, stages };
