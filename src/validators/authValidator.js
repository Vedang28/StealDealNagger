const Joi = require("joi");

const registerSchema = Joi.object({
  teamName: Joi.string().min(2).max(100).required(),
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((d) => d.message);
    return res.status(400).json({
      success: false,
      error: { message: "Validation failed", details: messages },
    });
  }
  next();
};

module.exports = { registerSchema, loginSchema, validate };
