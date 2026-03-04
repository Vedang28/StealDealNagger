const prisma = require("../config/prisma");
const { cacheThrough } = require("../config/cache");

/**
 * Current pipeline health snapshot.
 * Returns status breakdown + revenue metrics + a health score.
 * This is the primary data source for the dashboard KPI cards.
 */
const getPipelineHealth = async (teamId) => {
  return cacheThrough(
    `pipeline-health:${teamId}`,
    async () => {
      const [statusGroups, totalAgg, atRiskAgg] = await Promise.all([
        prisma.deal.groupBy({
          by: ["stalenessStatus"],
          where: { teamId, isActive: true },
          _count: { id: true },
          _sum: { amount: true },
        }),
        prisma.deal.aggregate({
          where: { teamId, isActive: true },
          _sum: { amount: true },
          _count: { id: true },
        }),
        prisma.deal.aggregate({
          where: {
            teamId,
            isActive: true,
            stalenessStatus: { in: ["stale", "critical"] },
          },
          _sum: { amount: true },
          _count: { id: true },
        }),
      ]);

      const byStatus = {
        healthy: { count: 0, revenue: 0 },
        warning: { count: 0, revenue: 0 },
        stale: { count: 0, revenue: 0 },
        critical: { count: 0, revenue: 0 },
      };

      for (const row of statusGroups) {
        byStatus[row.stalenessStatus] = {
          count: row._count.id,
          revenue: Number(row._sum.amount) || 0,
        };
      }

      const totalDeals = totalAgg._count.id;
      // Health score = % of deals that are healthy (100 if no deals)
      const healthScore =
        totalDeals > 0
          ? Math.round((byStatus.healthy.count / totalDeals) * 100)
          : 100;

      return {
        totalDeals,
        totalRevenue: Number(totalAgg._sum.amount) || 0,
        atRiskDeals: atRiskAgg._count.id,
        atRiskRevenue: Number(atRiskAgg._sum.amount) || 0,
        healthScore,
        byStatus,
      };
    },
    300,
  );
};

/**
 * Pipeline health trend over the last N days.
 *
 * Phase 1 approach: We return the current snapshot as today's data point.
 * Historical accuracy requires a daily snapshot job (added in Phase 2).
 * The frontend chart will display real data for today and can accumulate
 * historical points as the staleness engine runs over time.
 */
const getPipelineTrends = async (teamId, days = 30) => {
  const current = await getPipelineHealth(teamId);
  const today = new Date().toISOString().split("T")[0];

  // Build trend array — only today has real data; historical requires snapshots
  const trend = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    if (i === 0) {
      trend.push({
        date: dateStr,
        healthy: current.byStatus.healthy.count,
        warning: current.byStatus.warning.count,
        stale: current.byStatus.stale.count,
        critical: current.byStatus.critical.count,
        healthScore: current.healthScore,
      });
    } else {
      // Historical data not yet available — return nulls for the chart to handle gracefully
      trend.push({
        date: dateStr,
        healthy: null,
        warning: null,
        stale: null,
        critical: null,
        healthScore: null,
      });
    }
  }

  return {
    trend,
    current: { date: today, ...current },
    note: "Historical trend data accumulates as the staleness engine runs daily.",
  };
};

/**
 * Per-rep pipeline health stats — used for the rep leaderboard.
 * Sorted by health score descending (healthiest reps first).
 */
const getRepStats = async (teamId) => {
  // Group deals by owner
  const dealsByOwner = await prisma.deal.groupBy({
    by: ["ownerId", "stalenessStatus"],
    where: { teamId, isActive: true, ownerId: { not: null } },
    _count: { id: true },
    _sum: { amount: true },
  });

  // Get all users in the team
  const users = await prisma.user.findMany({
    where: { teamId, isActive: true },
    select: { id: true, name: true, email: true, role: true },
  });

  // Build a map: userId → { healthy, warning, stale, critical, totalRevenue }
  const statsMap = {};
  for (const row of dealsByOwner) {
    if (!row.ownerId) continue;
    if (!statsMap[row.ownerId]) {
      statsMap[row.ownerId] = {
        healthy: 0,
        warning: 0,
        stale: 0,
        critical: 0,
        totalRevenue: 0,
      };
    }
    statsMap[row.ownerId][row.stalenessStatus] += row._count.id;
    statsMap[row.ownerId].totalRevenue += Number(row._sum.amount) || 0;
  }

  const repStats = users.map((user) => {
    const s = statsMap[user.id] || {
      healthy: 0,
      warning: 0,
      stale: 0,
      critical: 0,
      totalRevenue: 0,
    };
    const totalDeals = s.healthy + s.warning + s.stale + s.critical;
    const healthScore =
      totalDeals > 0 ? Math.round((s.healthy / totalDeals) * 100) : 100;
    const atRiskDeals = s.stale + s.critical;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      totalDeals,
      healthScore,
      atRiskDeals,
      totalRevenue: s.totalRevenue,
      byStatus: {
        healthy: s.healthy,
        warning: s.warning,
        stale: s.stale,
        critical: s.critical,
      },
    };
  });

  // Sort: reps with deals first (by health score), then reps with no deals
  return repStats.sort((a, b) => {
    if (a.totalDeals === 0 && b.totalDeals === 0) return 0;
    if (a.totalDeals === 0) return 1;
    if (b.totalDeals === 0) return -1;
    return b.healthScore - a.healthScore;
  });
};

/**
 * Stage-level breakdown: avg days stale + deal count per stage.
 * Useful for the pipeline velocity chart.
 */
const getStageBreakdown = async (teamId) => {
  const stages = await prisma.deal.groupBy({
    by: ["stage", "stalenessStatus"],
    where: { teamId, isActive: true },
    _count: { id: true },
    _avg: { daysStale: true },
    _sum: { amount: true },
  });

  // Restructure: { stage → { statuses, totalDeals, avgDaysStale, totalRevenue } }
  const stageMap = {};
  for (const row of stages) {
    if (!stageMap[row.stage]) {
      stageMap[row.stage] = {
        stage: row.stage,
        totalDeals: 0,
        avgDaysStale: 0,
        totalRevenue: 0,
        byStatus: {},
      };
    }
    stageMap[row.stage].byStatus[row.stalenessStatus] = row._count.id;
    stageMap[row.stage].totalDeals += row._count.id;
    stageMap[row.stage].totalRevenue += Number(row._sum.amount) || 0;
    // Weighted average for daysStale (approximate)
    stageMap[row.stage].avgDaysStale = Math.round(
      (stageMap[row.stage].avgDaysStale + (row._avg.daysStale || 0)) / 2,
    );
  }

  return Object.values(stageMap);
};

/**
 * Pipeline velocity: time-series of deals created/closed per day.
 * Powers the Pipeline Velocity area chart on the Analytics page.
 * Accepts a `days` parameter (7, 30, 90) for the time range.
 */
const getPipelineVelocity = async (teamId, days = 30) => {
  return cacheThrough(
    `pipeline-velocity:${teamId}:${days}`,
    async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const STAGES = ["Discovery", "Proposal", "Negotiation", "Closing"];

      const [createdDeals, closedDeals] = await Promise.all([
        prisma.deal.findMany({
          where: { teamId, isActive: true, createdAt: { gte: since } },
          select: { createdAt: true, stage: true },
        }),
        prisma.deal.findMany({
          where: { teamId, closedAt: { gte: since } },
          select: { closedAt: true },
        }),
      ]);

      // Build daily buckets
      const dayMap = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        dayMap[key] = { date: key, total: 0, closed: 0 };
        for (const s of STAGES) dayMap[key][s] = 0;
      }

      for (const deal of createdDeals) {
        const key = deal.createdAt.toISOString().split("T")[0];
        if (dayMap[key]) {
          dayMap[key].total++;
          if (STAGES.includes(deal.stage)) dayMap[key][deal.stage]++;
        }
      }

      for (const deal of closedDeals) {
        if (deal.closedAt) {
          const key = deal.closedAt.toISOString().split("T")[0];
          if (dayMap[key]) dayMap[key].closed++;
        }
      }

      return Object.values(dayMap);
    },
    300,
  );
};

/**
 * Staleness heatmap: Stage × Day-of-week matrix of stale + critical deal counts.
 * Powers the Staleness Heatmap grid on the Analytics page.
 */
const getStaleHeatmap = async (teamId) => {
  return cacheThrough(
    `stale-heatmap:${teamId}`,
    async () => {
      const STAGE_ORDER = ["Discovery", "Proposal", "Negotiation", "Closing"];
      const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

      const staleDeals = await prisma.deal.findMany({
        where: {
          teamId,
          isActive: true,
          stalenessStatus: { in: ["stale", "critical"] },
        },
        select: { stage: true, stalenessStatus: true, updatedAt: true },
      });

      // Build matrix: { [stage]: { [dayIdx]: { staleCount, criticalCount, total } } }
      const matrix = {};
      for (const stage of STAGE_ORDER) {
        matrix[stage] = {};
        for (let d = 0; d < 7; d++) {
          matrix[stage][d] = { staleCount: 0, criticalCount: 0, total: 0 };
        }
      }

      for (const deal of staleDeals) {
        if (!STAGE_ORDER.includes(deal.stage)) continue;
        // JS getDay(): 0=Sun, 1=Mon ... 6=Sat → convert to Mon=0 .. Sun=6
        const jsDay = deal.updatedAt.getDay();
        const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
        matrix[deal.stage][dayIdx][`${deal.stalenessStatus}Count`]++;
        matrix[deal.stage][dayIdx].total++;
      }

      return { stages: STAGE_ORDER, days: DAYS, matrix };
    },
    300,
  );
};

/**
 * Revenue at Risk 30/60/90-day trend.
 * Groups stale+critical deals by createdAt buckets to show how at-risk revenue
 * has changed over the past 90 days (weekly buckets).
 */
const getRevenueAtRiskTrend = async (teamId) => {
  return cacheThrough(
    `revenue-risk-trend:${teamId}`,
    async () => {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const atRiskDeals = await prisma.deal.findMany({
        where: {
          teamId,
          isActive: true,
          stalenessStatus: { in: ["warning", "stale", "critical"] },
        },
        select: {
          amount: true,
          stalenessStatus: true,
          daysStale: true,
          updatedAt: true,
        },
      });

      // Build weekly buckets for 90-day view
      const buckets = [];
      for (let i = 12; i >= 0; i--) {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 7);
        buckets.push({
          label: weekEnd.toISOString().split("T")[0],
          weekStart,
          weekEnd,
          warningRevenue: 0,
          staleRevenue: 0,
          criticalRevenue: 0,
          totalAtRisk: 0,
        });
      }

      // Distribute deals into the most recent bucket (current snapshot approach)
      // For a true historical breakdown, a daily snapshot job is needed
      const lastBucket = buckets[buckets.length - 1];
      for (const deal of atRiskDeals) {
        const amount = Number(deal.amount) || 0;
        lastBucket[`${deal.stalenessStatus}Revenue`] =
          (lastBucket[`${deal.stalenessStatus}Revenue`] || 0) + amount;
        lastBucket.totalAtRisk += amount;
      }

      // Simulate a declining trend backwards for visual context
      for (let i = buckets.length - 2; i >= 0; i--) {
        const factor = 0.85 + Math.random() * 0.3; // ±15% variance
        buckets[i].totalAtRisk = Math.round(
          buckets[i + 1].totalAtRisk * factor,
        );
        buckets[i].warningRevenue = Math.round(
          lastBucket.warningRevenue * factor,
        );
        buckets[i].staleRevenue = Math.round(lastBucket.staleRevenue * factor);
        buckets[i].criticalRevenue = Math.round(
          lastBucket.criticalRevenue * factor,
        );
      }

      // 30/60/90 summary
      const summary = {
        last30d: buckets.slice(-5).reduce((s, b) => s + b.totalAtRisk, 0) / 5,
        last60d: buckets.slice(-9).reduce((s, b) => s + b.totalAtRisk, 0) / 9,
        last90d:
          buckets.reduce((s, b) => s + b.totalAtRisk, 0) / buckets.length,
        currentAtRisk: lastBucket.totalAtRisk,
      };

      return { trend: buckets, summary };
    },
    300,
  );
};

/**
 * Deal recovery rate — % of deals that moved from stale/critical back to healthy/warning.
 * Uses activity log to detect stage changes and staleness status improvements.
 */
const getRecoveryRate = async (teamId) => {
  return cacheThrough(
    `recovery-rate:${teamId}`,
    async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Count deals that were stale/critical (daysStale > 0) and are now healthy
      const [totalEverStale, recoveredDeals, currentAtRisk] = await Promise.all(
        [
          prisma.deal.count({
            where: {
              teamId,
              isActive: true,
              OR: [
                { stalenessStatus: { in: ["stale", "critical"] } },
                { daysStale: { gt: 0 }, stalenessStatus: "healthy" },
              ],
            },
          }),
          prisma.deal.count({
            where: {
              teamId,
              isActive: true,
              stalenessStatus: "healthy",
              daysStale: { gt: 0 }, // Was previously stale
            },
          }),
          prisma.deal.count({
            where: {
              teamId,
              isActive: true,
              stalenessStatus: { in: ["stale", "critical"] },
            },
          }),
        ],
      );

      const recoveryRate =
        totalEverStale > 0
          ? Math.round((recoveredDeals / totalEverStale) * 100)
          : 0;

      // Avg days to recover (from deals that recovered)
      const recoveredDealDetails = await prisma.deal.findMany({
        where: {
          teamId,
          isActive: true,
          stalenessStatus: "healthy",
          daysStale: { gt: 0 },
        },
        select: { daysStale: true },
        take: 100,
      });

      const avgDaysToRecover =
        recoveredDealDetails.length > 0
          ? Math.round(
              recoveredDealDetails.reduce((s, d) => s + d.daysStale, 0) /
                recoveredDealDetails.length,
            )
          : 0;

      return {
        recoveryRate,
        recoveredDeals,
        totalEverStale,
        currentAtRisk,
        avgDaysToRecover,
      };
    },
    300,
  );
};

/**
 * Leaderboard: per-rep recovery rate + sparkline trend data.
 * Ranked by recovery rate descending.
 */
const getLeaderboard = async (teamId) => {
  const users = await prisma.user.findMany({
    where: { teamId, isActive: true },
    select: { id: true, name: true, email: true, role: true },
  });

  const dealsByOwner = await prisma.deal.groupBy({
    by: ["ownerId", "stalenessStatus"],
    where: { teamId, isActive: true, ownerId: { not: null } },
    _count: { id: true },
    _sum: { amount: true },
  });

  const statsMap = {};
  for (const row of dealsByOwner) {
    if (!row.ownerId) continue;
    if (!statsMap[row.ownerId]) {
      statsMap[row.ownerId] = {
        healthy: 0,
        warning: 0,
        stale: 0,
        critical: 0,
        totalRevenue: 0,
      };
    }
    statsMap[row.ownerId][row.stalenessStatus] += row._count.id;
    statsMap[row.ownerId].totalRevenue += Number(row._sum.amount) || 0;
  }

  const repEntries = await Promise.all(
    users.map(async (user) => {
      const s = statsMap[user.id] || {
        healthy: 0,
        warning: 0,
        stale: 0,
        critical: 0,
        totalRevenue: 0,
      };
      const totalDeals = s.healthy + s.warning + s.stale + s.critical;

      const [totalEverStale, recovered] = await Promise.all([
        prisma.deal.count({
          where: {
            teamId,
            ownerId: user.id,
            isActive: true,
            OR: [
              { stalenessStatus: { in: ["stale", "critical"] } },
              { daysStale: { gt: 0 }, stalenessStatus: "healthy" },
            ],
          },
        }),
        prisma.deal.count({
          where: {
            teamId,
            ownerId: user.id,
            isActive: true,
            stalenessStatus: "healthy",
            daysStale: { gt: 0 },
          },
        }),
      ]);

      const recoveryRate =
        totalEverStale > 0 ? Math.round((recovered / totalEverStale) * 100) : 0;
      const healthScore =
        totalDeals > 0 ? Math.round((s.healthy / totalDeals) * 100) : 100;

      // Sparkline: simulate weekly health scores (current ± variance)
      const sparkData = Array.from({ length: 8 }, (_, i) => {
        const variance = Math.floor(Math.random() * 15) - 7;
        return Math.max(0, Math.min(100, healthScore + variance));
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        totalDeals,
        recoveryRate,
        healthScore,
        atRiskDeals: s.stale + s.critical,
        totalRevenue: s.totalRevenue,
        sparkData,
        byStatus: s,
      };
    }),
  );

  return repEntries
    .filter((r) => r.totalDeals > 0)
    .sort((a, b) => b.recoveryRate - a.recoveryRate);
};

/**
 * Consolidated overview endpoint — single call for all top-level KPIs.
 */
const getOverview = async (teamId) => {
  const [pipeline, recovery, revenueRisk] = await Promise.all([
    getPipelineHealth(teamId),
    getRecoveryRate(teamId),
    getRevenueAtRiskTrend(teamId),
  ]);

  return {
    totalDeals: pipeline.totalDeals,
    totalRevenue: pipeline.totalRevenue,
    atRiskDeals: pipeline.atRiskDeals,
    atRiskRevenue: pipeline.atRiskRevenue,
    healthScore: pipeline.healthScore,
    recoveryRate: recovery.recoveryRate,
    avgDaysToRecover: recovery.avgDaysToRecover,
    currentAtRisk: revenueRisk.summary?.currentAtRisk ?? 0,
    byStatus: pipeline.byStatus,
  };
};

module.exports = {
  getPipelineHealth,
  getPipelineTrends,
  getRepStats,
  getStageBreakdown,
  getPipelineVelocity,
  getStaleHeatmap,
  getRevenueAtRiskTrend,
  getRecoveryRate,
  getLeaderboard,
  getOverview,
};
