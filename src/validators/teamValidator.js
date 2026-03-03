const Joi = require('joi');
const { validate } = require('./authValidator');

const inviteUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid('admin', 'manager', 'rep').required(),
});

const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'manager', 'rep').required(),
});

const updateTeamSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  timezone: Joi.string().max(100).optional(),
  digestTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional()
    .messages({ 'string.pattern.base': 'digestTime must be in HH:MM format' }),
}).min(1);

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  slackUserId: Joi.string().max(50).allow(null, '').optional(),
  notificationPrefs: Joi.object().optional(),
}).min(1);

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

module.exports = {
  inviteUserSchema,
  updateUserRoleSchema,
  updateTeamSchema,
  updateProfileSchema,
  changePasswordSchema,
  validate,
};
