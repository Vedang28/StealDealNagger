const prisma = require('../config/prisma');
const { AppError } = require('../middleware/errorHandler');

const listRules = async (teamId, query = {}) => {
  const where = { teamId };
  if (query.pipeline) where.pipeline = query.pipeline;
  if (query.stage) where.stage = query.stage;
  // Default to active rules unless explicitly requesting inactive
  where.isActive = query.isActive !== undefined ? query.isActive : true;

  const rules = await prisma.rule.findMany({
    where,
    orderBy: [{ pipeline: 'asc' }, { stage: 'asc' }],
  });

  return rules;
};

const getRuleById = async (teamId, ruleId) => {
  const rule = await prisma.rule.findFirst({
    where: { id: ruleId, teamId },
  });

  if (!rule) {
    throw new AppError('Rule not found', 404);
  }

  return rule;
};

const createRule = async (teamId, data) => {
  const pipeline = data.pipeline || 'default';

  // Validate threshold ordering
  if (data.staleAfterDays >= data.escalateAfterDays) {
    throw new AppError('escalateAfterDays must be greater than staleAfterDays', 400);
  }
  if (data.escalateAfterDays >= data.criticalAfterDays) {
    throw new AppError('criticalAfterDays must be greater than escalateAfterDays', 400);
  }

  // Check for duplicate active rule for this stage in the pipeline
  const existing = await prisma.rule.findFirst({
    where: { teamId, pipeline, stage: data.stage, isActive: true },
  });

  if (existing) {
    throw new AppError(
      `An active rule for stage "${data.stage}" already exists in pipeline "${pipeline}"`,
      409
    );
  }

  const rule = await prisma.rule.create({
    data: {
      teamId,
      pipeline,
      stage: data.stage,
      staleAfterDays: data.staleAfterDays,
      escalateAfterDays: data.escalateAfterDays,
      criticalAfterDays: data.criticalAfterDays,
      minDealAmount: data.minDealAmount || 0,
      notifyChannels: data.notifyChannels || ['slack'],
      suggestedAction: data.suggestedAction || null,
    },
  });

  return rule;
};

const updateRule = async (teamId, ruleId, data) => {
  const existing = await prisma.rule.findFirst({
    where: { id: ruleId, teamId },
  });

  if (!existing) {
    throw new AppError('Rule not found', 404);
  }

  // Merge proposed changes with existing values for threshold validation
  const merged = {
    staleAfterDays: data.staleAfterDays ?? existing.staleAfterDays,
    escalateAfterDays: data.escalateAfterDays ?? existing.escalateAfterDays,
    criticalAfterDays: data.criticalAfterDays ?? existing.criticalAfterDays,
  };

  if (merged.staleAfterDays >= merged.escalateAfterDays) {
    throw new AppError('escalateAfterDays must be greater than staleAfterDays', 400);
  }
  if (merged.escalateAfterDays >= merged.criticalAfterDays) {
    throw new AppError('criticalAfterDays must be greater than escalateAfterDays', 400);
  }

  const rule = await prisma.rule.update({
    where: { id: ruleId },
    data,
  });

  return rule;
};

const deleteRule = async (teamId, ruleId) => {
  const existing = await prisma.rule.findFirst({
    where: { id: ruleId, teamId },
  });

  if (!existing) {
    throw new AppError('Rule not found', 404);
  }

  // Soft delete — keeps history intact
  await prisma.rule.update({
    where: { id: ruleId },
    data: { isActive: false },
  });

  return { message: 'Rule deleted successfully' };
};

/**
 * Find the best-matching active rule for a deal's stage.
 * First tries exact pipeline match, then falls back to 'default' pipeline.
 */
const matchRuleForDeal = async (teamId, stage, pipeline = 'default') => {
  let rule = await prisma.rule.findFirst({
    where: { teamId, pipeline, stage, isActive: true },
  });

  if (!rule && pipeline !== 'default') {
    rule = await prisma.rule.findFirst({
      where: { teamId, pipeline: 'default', stage, isActive: true },
    });
  }

  return rule; // null if no rule found — deal will be skipped by staleness engine
};

module.exports = {
  listRules,
  getRuleById,
  createRule,
  updateRule,
  deleteRule,
  matchRuleForDeal,
};
