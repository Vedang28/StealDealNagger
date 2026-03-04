const prisma = require('../config/prisma');

/**
 * Current pipeline health snapshot.
 * Returns status breakdown + revenue metrics + a health score.
 * This is the primary data source for the dashboard KPI cards.
 */
const getPipelineHealth = async (teamId) => {
  const [statusGroups, totalAgg, atRiskAgg] = await Promise.all([
    prisma.deal.groupBy({
      by: ['stalenessStatus'],
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
      where: { teamId, isActive: true, stalenessStatus: { in: ['stale', 'critical'] } },
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
    totalDeals > 0 ? Math.round((byStatus.healthy.count / totalDeals) * 100) : 100;

  return {
    totalDeals,
    totalRevenue: Number(totalAgg._sum.amount) || 0,
    atRiskDeals: atRiskAgg._count.id,
    atRiskRevenue: Number(atRiskAgg._sum.amount) || 0,
    healthScore,
    byStatus,
  };
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
  const today = new Date().toISOString().split('T')[0];

  // Build trend array — only today has real data; historical requires snapshots
  const trend = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

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
    note: 'Historical trend data accumulates as the staleness engine runs daily.',
  };
};

/**
 * Per-rep pipeline health stats — used for the rep leaderboard.
 * Sorted by health score descending (healthiest reps first).
 */
const getRepStats = async (teamId) => {
  // Group deals by owner
  const dealsByOwner = await prisma.deal.groupBy({
    by: ['ownerId', 'stalenessStatus'],
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
      statsMap[row.ownerId] = { healthy: 0, warning: 0, stale: 0, critical: 0, totalRevenue: 0 };
    }
    statsMap[row.ownerId][row.stalenessStatus] += row._count.id;
    statsMap[row.ownerId].totalRevenue += Number(row._sum.amount) || 0;
  }

  const repStats = users.map((user) => {
    const s = statsMap[user.id] || { healthy: 0, warning: 0, stale: 0, critical: 0, totalRevenue: 0 };
    const totalDeals = s.healthy + s.warning + s.stale + s.critical;
    const healthScore = totalDeals > 0 ? Math.round((s.healthy / totalDeals) * 100) : 100;
    const atRiskDeals = s.stale + s.critical;

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      totalDeals,
      healthScore,
      atRiskDeals,
      totalRevenue: s.totalRevenue,
      byStatus: { healthy: s.healthy, warning: s.warning, stale: s.stale, critical: s.critical },
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
    by: ['stage', 'stalenessStatus'],
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
      (stageMap[row.stage].avgDaysStale + (row._avg.daysStale || 0)) / 2
    );
  }

  return Object.values(stageMap);
};

/**
 * Pipeline velocity: avg days stale per stage + deal count, with rule benchmark.
 * Powers the Pipeline Velocity bar chart on the Analytics page.
 */
const getPipelineVelocity = async (teamId) => {
  const STAGE_ORDER = ['Discovery', 'Proposal', 'Negotiation', 'Closing'];
  const DEFAULTS = { Discovery: 10, Proposal: 8, Negotiation: 5, Closing: 4 };

  const [stageGroups, rules] = await Promise.all([
    prisma.deal.groupBy({
      by: ['stage', 'stalenessStatus'],
      where: { teamId, isActive: true },
      _count: { id: true },
      _avg: { daysStale: true },
    }),
    prisma.rule.findMany({
      where: { teamId },
      select: { stage: true, staleAfterDays: true },
    }),
  ]);

  const ruleMap = {};
  for (const rule of rules) {
    ruleMap[rule.stage] = rule.staleAfterDays;
  }

  const stageMap = {};
  for (const row of stageGroups) {
    if (!stageMap[row.stage]) {
      stageMap[row.stage] = {
        stage: row.stage,
        totalDeals: 0,
        avgDaysStale: 0,
        healthyCount: 0,
        warningCount: 0,
        staleCount: 0,
        criticalCount: 0,
        benchmark: ruleMap[row.stage] || DEFAULTS[row.stage] || 10,
        _weightedSum: 0,
      };
    }
    const s = stageMap[row.stage];
    s.totalDeals += row._count.id;
    s[`${row.stalenessStatus}Count`] = (s[`${row.stalenessStatus}Count`] || 0) + row._count.id;
    s._weightedSum += (row._avg.daysStale || 0) * row._count.id;
  }

  // Compute weighted average and clean up
  return STAGE_ORDER.map((stage) => {
    const s = stageMap[stage] || {
      stage, totalDeals: 0, avgDaysStale: 0, benchmark: ruleMap[stage] || DEFAULTS[stage] || 10,
      healthyCount: 0, warningCount: 0, staleCount: 0, criticalCount: 0,
    };
    if (s.totalDeals > 0) {
      s.avgDaysStale = Math.round(s._weightedSum / s.totalDeals);
    }
    delete s._weightedSum;
    return s;
  });
};

/**
 * Staleness heatmap: Stage × Rep matrix of stale + critical deal counts.
 * Powers the Staleness Heatmap grid on the Analytics page.
 */
const getStaleHeatmap = async (teamId) => {
  const STAGE_ORDER = ['Discovery', 'Proposal', 'Negotiation', 'Closing'];

  const [staleDeals, users] = await Promise.all([
    prisma.deal.findMany({
      where: {
        teamId,
        isActive: true,
        stalenessStatus: { in: ['stale', 'critical'] },
        ownerId: { not: null },
      },
      select: { stage: true, stalenessStatus: true, ownerId: true },
    }),
    prisma.user.findMany({
      where: { teamId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  // Build matrix: { [stage]: { [userId]: { staleCount, criticalCount, total } } }
  const matrix = {};
  for (const stage of STAGE_ORDER) {
    matrix[stage] = {};
    for (const user of users) {
      matrix[stage][user.id] = { staleCount: 0, criticalCount: 0, total: 0 };
    }
  }

  for (const deal of staleDeals) {
    if (!matrix[deal.stage] || !deal.ownerId) continue;
    if (!matrix[deal.stage][deal.ownerId]) {
      matrix[deal.stage][deal.ownerId] = { staleCount: 0, criticalCount: 0, total: 0 };
    }
    matrix[deal.stage][deal.ownerId][`${deal.stalenessStatus}Count`]++;
    matrix[deal.stage][deal.ownerId].total++;
  }

  return {
    stages: STAGE_ORDER,
    reps: users,
    matrix,
  };
};

module.exports = {
  getPipelineHealth,
  getPipelineTrends,
  getRepStats,
  getStageBreakdown,
  getPipelineVelocity,
  getStaleHeatmap,
};
