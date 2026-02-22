require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret:
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh",
    accessExpiry: "15m",
    refreshExpiry: "7d",
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || "default_dev_key_replace_in_prod",
  },
};
