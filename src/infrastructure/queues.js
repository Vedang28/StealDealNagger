/**
 * Bull queue infrastructure — async job processing backed by Redis.
 *
 * NOTE: Bull queues require a persistent process to run.
 * On Vercel (serverless), these queues are NOT active in production.
 * For production use, run a separate worker process (e.g., Railway, Render, or a dedicated dyno).
 * Alternatively, migrate to Vercel Cron Jobs + a stateless staleness endpoint in Phase 5.
 */

const Bull = require("bull");
const config = require("../config");
const logger = require("../config/logger");

let stalenessQueue = null;
let digestQueue = null;

const initQueues = () => {
  if (!config.redis.url || config.redis.url === "redis://localhost:6379") {
    // Check if Redis is actually reachable before initializing
    const net = require("net");
    const url = new URL(config.redis.url || "redis://localhost:6379");
    const socket = net.createConnection({
      host: url.hostname,
      port: url.port || 6379,
      timeout: 2000,
    });

    socket.on("connect", () => {
      socket.destroy();
      _startQueues();
    });

    socket.on("error", () => {
      socket.destroy();
      logger.warn(
        "Redis not reachable — skipping queue initialization. Staleness checks will only run via manual API trigger.",
      );
    });

    socket.on("timeout", () => {
      socket.destroy();
      logger.warn(
        "Redis connection timed out — skipping queue initialization.",
      );
    });

    return;
  }

  _startQueues();
};

const _startQueues = () => {
  try {
    stalenessQueue = new Bull("staleness-check", config.redis.url, {
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 20,
      },
      redis: {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
      },
    });

    // Process staleness check jobs
    stalenessQueue.process(async (job) => {
      const stalenessService = require("../services/stalenessService");
      const teamId = job.data.teamId || null;
      return stalenessService.runStalenessCheck(teamId);
    });

    stalenessQueue.on("completed", (job, result) => {
      logger.info("Staleness queue job completed", { jobId: job.id, result });
    });

    stalenessQueue.on("failed", (job, err) => {
      logger.error("Staleness queue job failed", {
        jobId: job.id,
        error: err.message,
      });
    });

    stalenessQueue.on("error", (err) => {
      logger.error(`Bull queue error (non-fatal): ${err.message}`);
    });

    // Wait for Redis connection to be ready before scheduling the cron job
    stalenessQueue
      .isReady()
      .then(() => {
        stalenessQueue.add(
          { source: "cron" },
          { repeat: { cron: "*/15 * * * *" } },
        );
        logger.info(
          "Bull queues initialized — staleness check scheduled every 15 minutes",
        );
      })
      .catch((err) => {
        logger.error(`Bull queue ready failed (non-fatal): ${err.message}`);
        stalenessQueue = null;
      });

    // ── Email Digest Queue ────────────────────────────────────────────────
    digestQueue = new Bull("email-digest", config.redis.url, {
      defaultJobOptions: {
        removeOnComplete: 5,
        removeOnFail: 10,
      },
    });

    digestQueue.process(async () => {
      const emailService = require("../services/emailService");
      return emailService.runAllDigests();
    });

    digestQueue.on("completed", (job, result) => {
      logger.info("Digest queue job completed", { jobId: job.id, result });
    });

    digestQueue.on("failed", (job, err) => {
      logger.error("Digest queue job failed", {
        jobId: job.id,
        error: err.message,
      });
    });

    digestQueue
      .isReady()
      .then(() => {
        // Run daily at 9:00 AM UTC (teams can configure their own digestTime)
        digestQueue.add({ source: "cron" }, { repeat: { cron: "0 9 * * *" } });
        logger.info("Email digest queue scheduled — daily at 9:00 AM UTC");
      })
      .catch((err) => {
        logger.error(`Digest queue ready failed (non-fatal): ${err.message}`);
        digestQueue = null;
      });
  } catch (err) {
    logger.error(`Failed to initialize queues (non-fatal): ${err.message}`);
    stalenessQueue = null;
  }
};

/**
 * Manually enqueue a one-time staleness check job (useful for testing and admin triggers).
 */
const enqueueStalenessCheck = async (teamId = null) => {
  if (!stalenessQueue) {
    throw new Error("Queue not initialized — Redis may be unavailable");
  }
  return stalenessQueue.add({ teamId, source: "manual" });
};

const getQueue = (name) => {
  if (name === "staleness") return stalenessQueue;
  if (name === "digest") return digestQueue;
  return null;
};

module.exports = { initQueues, enqueueStalenessCheck, getQueue };
