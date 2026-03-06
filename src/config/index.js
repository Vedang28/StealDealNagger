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
  hubspot: {
    clientId: process.env.HUBSPOT_CLIENT_ID || "",
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET || "",
  },
  slack: {
    clientId: process.env.SLACK_CLIENT_ID || "",
    clientSecret: process.env.SLACK_CLIENT_SECRET || "",
  },
  email: {
    host: process.env.EMAIL_HOST || "",
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
    from: process.env.EMAIL_FROM || "noreply@staledealnagger.com",
  },
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};
