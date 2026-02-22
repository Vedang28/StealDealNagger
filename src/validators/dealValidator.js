const Joi = require("joi");
const { validate } = require("./authValidator");

const createDealSchema = Joi.object({
  crmDealId: Joi.string().required(),
  crmSource: Joi.string()
    .valid("hubspot", "salesforce", "pipedrive", "sheets")
    .required(),
  name: Joi.string().min(1).max(255).required(),
  stage: Joi.string().required(),
  amount: Joi.number().min(0).default(0),
  currency: Joi.string().length(3).default("USD"),
  ownerId: Joi.string().uuid().optional(),
  lastActivityAt: Joi.date().iso().optional(),
  metadata: Joi.object().optional(),
});

const updateDealSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  stage: Joi.string().optional(),
  amount: Joi.number().min(0).optional(),
  currency: Joi.string().length(3).optional(),
  ownerId: Joi.string().uuid().allow(null).optional(),
  lastActivityAt: Joi.date().iso().optional(),
  metadata: Joi.object().optional(),
}).min(1);

const listDealsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string()
    .valid("healthy", "warning", "stale", "critical")
    .optional(),
  stage: Joi.string().optional(),
  ownerId: Joi.string().uuid().optional(),
  search: Joi.string().max(100).optional(),
  sortBy: Joi.string()
    .valid("name", "amount", "daysStale", "lastActivityAt", "createdAt")
    .default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

const snoozeDealSchema = Joi.object({
  snoozedUntil: Joi.date().iso().greater("now").required(),
  snoozeReason: Joi.string().max(500).required(),
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
      error: { message: "Validation failed", details: messages },
    });
  }
  req.query = value;
  next();
};

module.exports = {
  createDealSchema,
  updateDealSchema,
  listDealsQuerySchema,
  snoozeDealSchema,
  validate,
  validateQuery,
};
