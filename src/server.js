const app = require("./app");
const config = require("./config");
const logger = require("./config/logger");
const prisma = require("./config/prisma");
const { initQueues } = require("./infrastructure/queues");

const start = async () => {
  try {
    await prisma.$connect();
    logger.info("Connected to PostgreSQL");

    // Initialize Bull queues (requires Redis — skipped gracefully if unavailable)
    if (config.nodeEnv !== "test") {
      initQueues();
    }

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

process.on("uncaughtException", (err) => {
  // Don't crash on Redis/Bull connection errors
  if (
    err.name === "MaxRetriesPerRequestError" ||
    err.message?.includes("redis") ||
    err.message?.includes("ECONNREFUSED")
  ) {
    logger.error(`Non-fatal connection error suppressed: ${err.message}`);
    return;
  }
  logger.error("Uncaught exception:", err);
  process.exit(1);
});

start();
