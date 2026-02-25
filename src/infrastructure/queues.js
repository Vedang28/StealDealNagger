/**
 * Bull queue infrastructure — async job processing backed by Redis.
 *
 * NOTE: Bull queues require a persistent process to run.
 * On Vercel (serverless), these queues are NOT active in production.
 * For production use, run a separate worker process (e.g., Railway, Render, or a dedicated dyno).
 * Alternatively, migrate to Vercel Cron Jobs + a stateless staleness endpoint in Phase 5.
 */

const Bull = require('bull');
const config = require('../config');
const logger = require('../config/logger');

let stalenessQueue = null;

const initQueues = () => {
  if (!config.redis.url) {
    logger.warn('REDIS_URL not configured — skipping queue initialization');
    return;
  }

  try {
    stalenessQueue = new Bull('staleness-check', config.redis.url, {
      defaultJobOptions: {
        removeOnComplete: 10, // Keep last 10 completed jobs
        removeOnFail: 20,     // Keep last 20 failed jobs for debugging
      },
    });

    // Process staleness check jobs
    stalenessQueue.process(async (job) => {
      // Lazy-require to avoid circular deps at module load time
      const stalenessService = require('../services/stalenessService');
      const teamId = job.data.teamId || null;
      return stalenessService.runStalenessCheck(teamId);
    });

    // Schedule recurring staleness check every 15 minutes
    stalenessQueue.add(
      { source: 'cron' },
      { repeat: { cron: '*/15 * * * *' } }
    );

    stalenessQueue.on('completed', (job, result) => {
      logger.info('Staleness queue job completed', { jobId: job.id, result });
    });

    stalenessQueue.on('failed', (job, err) => {
      logger.error('Staleness queue job failed', { jobId: job.id, error: err.message });
    });

    logger.info('Bull queues initialized — staleness check scheduled every 15 minutes');
  } catch (err) {
    logger.error(`Failed to initialize queues: ${err.message}`);
  }
};

/**
 * Manually enqueue a one-time staleness check job (useful for testing and admin triggers).
 */
const enqueueStalenessCheck = async (teamId = null) => {
  if (!stalenessQueue) {
    throw new Error('Queue not initialized — Redis may be unavailable');
  }
  return stalenessQueue.add({ teamId, source: 'manual' });
};

const getQueue = (name) => {
  if (name === 'staleness') return stalenessQueue;
  return null;
};

module.exports = { initQueues, enqueueStalenessCheck, getQueue };
