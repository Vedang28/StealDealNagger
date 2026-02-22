const app = require("./app");
const config = require("./config");
const logger = require("./config/logger");
const prisma = require("./config/prisma");

const start = async () => {
  try {
    await prisma.$connect();
    logger.info("Connected to PostgreSQL");

    app.listen(config.port, () => {
      logger.info(
        `Server running on port ${config.port} in ${config.nodeEnv} mode`,
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

start();
