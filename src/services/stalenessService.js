const prisma = require('../config/prisma');
const { matchRuleForDeal } = require('./ruleService');
const notificationService = require('./notificationService');
const logger = require('../config/logger');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const daysSince = (date) => {
  if (!date) return 0;
  const diff = Date.now() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

/**
 * State machine: determine new staleness status from days inactive + rule thresholds.
 *
 *  healthy  → daysSinceLastActivity < staleAfterDays
 *  warning  → daysSinceLastActivity >= staleAfterDays
 *  stale    → daysSinceLastActivity >= escalateAfterDays
 *  critical → daysSinceLastActivity >= criticalAfterDays
 */
const determineStatus = (daysInactive, rule) => {
  if (daysInactive >= rule.criticalAfterDays) return 'critical';
  if (daysInactive >= rule.escalateAfterDays) return 'stale';
  if (daysInactive >= rule.staleAfterDays) return 'warning';
  return 'healthy';
};

// ─── Notification dispatch on status transition ────────────────────────────────

const notifyOnTransition = async (deal, prevStatus, newStatus, rule, daysInactive) => {
  const usersToNotify = [];

  // Always notify the deal owner
  if (deal.ownerId) {
    const notifType = newStatus === 'stale' || newStatus === 'critical' ? 'escalation' : 'nudge';
    usersToNotify.push({ userId: deal.ownerId, type: notifType });
  }

  // Escalate to managers/admins when deal reaches stale or critical
  if (newStatus === 'stale' || newStatus === 'critical') {
    const managers = await prisma.user.findMany({
      where: {
        teamId: deal.teamId,
        role: { in: ['admin', 'manager'] },
        isActive: true,
      },
      select: { id: true },
    });

    for (const mgr of managers) {
      if (mgr.id !== deal.ownerId) {
        usersToNotify.push({ userId: mgr.id, type: 'escalation' });
      }
    }
  }

  const message =
    `Deal "${deal.name}" has been inactive for ${daysInactive} day${daysInactive !== 1 ? 's' : ''} ` +
    `(${prevStatus} → ${newStatus})`;

  for (const { userId, type } of usersToNotify) {
    await notificationService.createNotification({
      dealId: deal.id,
      userId,
      type,
      channel: 'slack',
      message,
      suggestedAction: rule.suggestedAction,
    });
  }
};

// ─── Core staleness check logic ───────────────────────────────────────────────

const processTeam = async (team) => {
  const now = new Date();

  const deals = await prisma.deal.findMany({
    where: { teamId: team.id, isActive: true },
    select: {
      id: true,
      name: true,
      stage: true,
      teamId: true,
      ownerId: true,
      lastActivityAt: true,
      stalenessStatus: true,
      snoozedUntil: true,
      snoozeReason: true,
    },
  });

  let processed = 0;
  let transitioned = 0;

  for (const deal of deals) {
    // ── Snooze check ────────────────────────────────────────────────────────
    if (deal.snoozedUntil) {
      if (new Date(deal.snoozedUntil) > now) {
        // Still snoozed — skip entirely
        processed++;
        continue;
      } else {
        // Snooze expired — clear it so the engine re-evaluates the deal
        await prisma.deal.update({
          where: { id: deal.id },
          data: { snoozedUntil: null, snoozeReason: null },
        });
      }
    }

    // ── Find matching rule ──────────────────────────────────────────────────
    const rule = await matchRuleForDeal(team.id, deal.stage);
    if (!rule) {
      // No rule configured for this stage — skip silently
      processed++;
      continue;
    }

    // ── Calculate staleness ─────────────────────────────────────────────────
    const daysInactive = daysSince(deal.lastActivityAt);
    const newStatus = determineStatus(daysInactive, rule);
    const prevStatus = deal.stalenessStatus;

    if (newStatus !== prevStatus) {
      // Status transition — update deal + create notifications
      await prisma.deal.update({
        where: { id: deal.id },
        data: { stalenessStatus: newStatus, daysStale: daysInactive },
      });

      await notifyOnTransition(deal, prevStatus, newStatus, rule, daysInactive);
      transitioned++;
    } else {
      // No transition — just keep daysStale in sync
      await prisma.deal.update({
        where: { id: deal.id },
        data: { daysStale: daysInactive },
      });
    }

    processed++;
  }

  return { processed, transitioned };
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Run the staleness check for all teams (or a single team if teamId provided).
 * Called by the Bull queue cron job every 15 minutes, and via the manual API endpoint.
 */
const runStalenessCheck = async (teamId = null) => {
  const label = teamId ? `team ${teamId}` : 'all teams';
  logger.info(`Staleness check started for ${label}`);

  const teams = await prisma.team.findMany({
    where: teamId ? { id: teamId } : {},
    select: { id: true, name: true },
  });

  let totalProcessed = 0;
  let totalTransitioned = 0;

  for (const team of teams) {
    const result = await processTeam(team);
    totalProcessed += result.processed;
    totalTransitioned += result.transitioned;
    logger.debug(`Team "${team.name}": ${result.processed} processed, ${result.transitioned} transitioned`);
  }

  const summary = { totalProcessed, totalTransitioned, teamsChecked: teams.length };
  logger.info('Staleness check complete', summary);
  return summary;
};

module.exports = { runStalenessCheck };
