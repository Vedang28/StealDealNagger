const Joi = require('joi');
const { validate } = require('./authValidator');

const createRuleSchema = Joi.object({
  pipeline: Joi.string().max(100).default('default'),
  stage: Joi.string().min(1).max(100).required(),
  staleAfterDays: Joi.number().integer().min(1).max(365).required(),
  escalateAfterDays: Joi.number().integer().min(1).max(365).required(),
  criticalAfterDays: Joi.number().integer().min(1).max(365).required(),
  minDealAmount: Joi.number().min(0).default(0),
  notifyChannels: Joi.array()
    .items(Joi.string().valid('slack', 'email', 'teams'))
    .default(['slack']),
  suggestedAction: Joi.string().max(500).optional(),
});

const updateRuleSchema = Joi.object({
  pipeline: Joi.string().max(100).optional(),
  stage: Joi.string().min(1).max(100).optional(),
  staleAfterDays: Joi.number().integer().min(1).max(365).optional(),
  escalateAfterDays: Joi.number().integer().min(1).max(365).optional(),
  criticalAfterDays: Joi.number().integer().min(1).max(365).optional(),
  minDealAmount: Joi.number().min(0).optional(),
  notifyChannels: Joi.array()
    .items(Joi.string().valid('slack', 'email', 'teams'))
    .optional(),
  suggestedAction: Joi.string().max(500).allow(null, '').optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

const listRulesQuerySchema = Joi.object({
  pipeline: Joi.string().optional(),
  stage: Joi.string().optional(),
  isActive: Joi.boolean().default(true),
});

const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const messages = error.details.map((d) => d.message);
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', details: messages },
    });
  }
  req.query = value;
  next();
};

module.exports = {
  createRuleSchema,
  updateRuleSchema,
  listRulesQuerySchema,
  validate,
  validateQuery,
};
