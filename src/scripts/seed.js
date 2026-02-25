/**
 * Seed script — populates the DB with a realistic demo dataset.
 *
 * Usage:  node src/scripts/seed.js
 * Reset:  node src/scripts/seed.js --reset
 *
 * Credentials after seeding:
 *   Admin:   admin@acmesales.com   / password123
 *   Manager: david@acmesales.com   / password123
 *   Rep:     sarah@acmesales.com   / password123
 *   Rep:     marcus@acmesales.com  / password123
 *   Rep:     emma@acmesales.com    / password123
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');

const SEED_TEAM_SLUG = 'acme-corp-sales';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const daysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

// ─── Reset ────────────────────────────────────────────────────────────────────

async function reset() {
  console.log('🗑️  Resetting seed data...');
  const team = await prisma.team.findUnique({ where: { slug: SEED_TEAM_SLUG } });
  if (!team) {
    console.log('   Nothing to reset.');
    return;
  }

  // Delete in dependency order
  await prisma.notification.deleteMany({ where: { deal: { teamId: team.id } } });
  await prisma.activity.deleteMany({ where: { deal: { teamId: team.id } } });
  await prisma.deal.deleteMany({ where: { teamId: team.id } });
  await prisma.rule.deleteMany({ where: { teamId: team.id } });
  await prisma.user.deleteMany({ where: { teamId: team.id } });
  await prisma.team.delete({ where: { id: team.id } });

  console.log('✅ Seed data removed.\n');
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Starting seed...\n');

  // ── 1. Team ──────────────────────────────────────────────────────────────────
  const team = await prisma.team.create({
    data: {
      name: 'Acme Corp Sales',
      slug: SEED_TEAM_SLUG,
      timezone: 'America/New_York',
      digestTime: '09:00',
    },
  });
  console.log(`✅ Team created: ${team.name} (${team.id})`);

  // ── 2. Users ─────────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('password123', 12);

  const [admin, manager, sarah, marcus, emma] = await Promise.all([
    prisma.user.create({
      data: { teamId: team.id, email: 'admin@acmesales.com', name: 'Alex Rivera', password: hashedPassword, role: 'admin' },
    }),
    prisma.user.create({
      data: { teamId: team.id, email: 'david@acmesales.com', name: 'David Rodriguez', password: hashedPassword, role: 'manager' },
    }),
    prisma.user.create({
      data: { teamId: team.id, email: 'sarah@acmesales.com', name: 'Sarah Johnson', password: hashedPassword, role: 'rep' },
    }),
    prisma.user.create({
      data: { teamId: team.id, email: 'marcus@acmesales.com', name: 'Marcus Williams', password: hashedPassword, role: 'rep' },
    }),
    prisma.user.create({
      data: { teamId: team.id, email: 'emma@acmesales.com', name: 'Emma Chen', password: hashedPassword, role: 'rep' },
    }),
  ]);
  console.log(`✅ Created 5 users (1 admin, 1 manager, 3 reps)`);

  const reps = [sarah, marcus, emma];

  // ── 3. Staleness Rules ────────────────────────────────────────────────────────
  const ruleDefinitions = [
    {
      stage: 'Discovery',
      staleAfterDays: 7,
      escalateAfterDays: 10,
      criticalAfterDays: 14,
      suggestedAction: 'Send a discovery follow-up email and schedule a call',
    },
    {
      stage: 'Proposal',
      staleAfterDays: 5,
      escalateAfterDays: 8,
      criticalAfterDays: 12,
      suggestedAction: 'Follow up on the proposal and address any objections',
    },
    {
      stage: 'Negotiation',
      staleAfterDays: 3,
      escalateAfterDays: 5,
      criticalAfterDays: 7,
      suggestedAction: 'Schedule a negotiation call to resolve blockers',
    },
    {
      stage: 'Closing',
      staleAfterDays: 2,
      escalateAfterDays: 4,
      criticalAfterDays: 6,
      suggestedAction: 'Call the contact directly to close the deal',
    },
  ];

  await Promise.all(
    ruleDefinitions.map((rule) =>
      prisma.rule.create({
        data: { teamId: team.id, pipeline: 'default', ...rule },
      })
    )
  );
  console.log(`✅ Created ${ruleDefinitions.length} staleness rules`);

  // ── 4. Deals ──────────────────────────────────────────────────────────────────
  //
  // Thresholds:
  //   Discovery:   stale=7,  escalate=10, critical=14
  //   Proposal:    stale=5,  escalate=8,  critical=12
  //   Negotiation: stale=3,  escalate=5,  critical=7
  //   Closing:     stale=2,  escalate=4,  critical=6
  //
  // lastActivityDays => expected status
  const dealDefinitions = [
    // DISCOVERY (healthy<7, warning>=7, stale>=10, critical>=14)
    { name: 'Zenith Tech Partnership',      stage: 'Discovery',    amount: 85000,   lastActivityDays: 3,  status: 'healthy',  rep: sarah },
    { name: 'GlobalMart Expansion Suite',   stage: 'Discovery',    amount: 240000,  lastActivityDays: 8,  status: 'warning',  rep: marcus },
    { name: 'Apex Solutions Platform',      stage: 'Discovery',    amount: 120000,  lastActivityDays: 11, status: 'stale',    rep: emma },
    { name: 'Pacific Rim Networks Deal',    stage: 'Discovery',    amount: 310000,  lastActivityDays: 17, status: 'critical', rep: sarah },

    // PROPOSAL (healthy<5, warning>=5, stale>=8, critical>=12)
    { name: 'Northern Star Insurance',      stage: 'Proposal',     amount: 95000,   lastActivityDays: 2,  status: 'healthy',  rep: marcus },
    { name: 'DataStream Analytics Pro',     stage: 'Proposal',     amount: 178000,  lastActivityDays: 6,  status: 'warning',  rep: emma },
    { name: 'CloudFirst Migration Deal',    stage: 'Proposal',     amount: 430000,  lastActivityDays: 9,  status: 'stale',    rep: sarah },
    { name: 'RetailEdge Commerce Platform', stage: 'Proposal',     amount: 225000,  lastActivityDays: 14, status: 'critical', rep: marcus },

    // NEGOTIATION (healthy<3, warning>=3, stale>=5, critical>=7)
    { name: 'Vertex Capital Management',    stage: 'Negotiation',  amount: 550000,  lastActivityDays: 1,  status: 'healthy',  rep: emma },
    { name: 'Meridian Healthcare Systems',  stage: 'Negotiation',  amount: 890000,  lastActivityDays: 4,  status: 'warning',  rep: sarah },
    { name: 'Frontier Logistics Network',   stage: 'Negotiation',  amount: 340000,  lastActivityDays: 6,  status: 'stale',    rep: marcus },
    { name: 'BlueSky Aviation Corp',        stage: 'Negotiation',  amount: 1200000, lastActivityDays: 10, status: 'critical', rep: emma },
    { name: 'Quantum Dynamics Inc',         stage: 'Negotiation',  amount: 275000,  lastActivityDays: 2,  status: 'healthy',  rep: sarah },

    // CLOSING (healthy<2, warning>=2, stale>=4, critical>=6)
    { name: 'Ironwood Financial Group',     stage: 'Closing',      amount: 720000,  lastActivityDays: 1,  status: 'healthy',  rep: marcus },
    { name: 'Summit Retail Group',          stage: 'Closing',      amount: 490000,  lastActivityDays: 3,  status: 'warning',  rep: emma },
    { name: 'Cascade Energy Solutions',     stage: 'Closing',      amount: 980000,  lastActivityDays: 5,  status: 'stale',    rep: sarah },
    { name: 'Lighthouse Media Partners',    stage: 'Closing',      amount: 660000,  lastActivityDays: 8,  status: 'critical', rep: marcus },
    { name: 'Pinnacle Software Enterprise', stage: 'Closing',      amount: 415000,  lastActivityDays: 1,  status: 'healthy',  rep: emma },
  ];

  const createdDeals = [];
  for (let i = 0; i < dealDefinitions.length; i++) {
    const d = dealDefinitions[i];
    const deal = await prisma.deal.create({
      data: {
        teamId: team.id,
        ownerId: d.rep.id,
        crmDealId: `SEED-${String(i + 1).padStart(3, '0')}`,
        crmSource: 'hubspot',
        name: d.name,
        stage: d.stage,
        amount: d.amount,
        currency: 'USD',
        contactName: `${d.name.split(' ')[0]} Contact`,
        contactEmail: `contact@${d.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20)}.com`,
        lastActivityAt: daysAgo(d.lastActivityDays),
        stalenessStatus: d.status,
        daysStale: d.lastActivityDays,
      },
    });
    createdDeals.push({ deal, def: d });
  }
  console.log(`✅ Created ${createdDeals.length} deals`);

  // ── 5. Activities ─────────────────────────────────────────────────────────────
  const activityTypes = ['email', 'call', 'meeting', 'note'];

  for (const { deal, def } of createdDeals) {
    const numActivities = Math.floor(Math.random() * 3) + 2; // 2–4 activities per deal
    for (let j = 0; j < numActivities; j++) {
      const daysBack = def.lastActivityDays + j * Math.ceil(def.lastActivityDays / 2 + 3);
      const type = activityTypes[j % activityTypes.length];
      await prisma.activity.create({
        data: {
          dealId: deal.id,
          type,
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} with ${deal.contactName}`,
          performedBy: def.rep.name,
          performedAt: daysAgo(daysBack),
        },
      });
    }
  }
  console.log(`✅ Created activities for all deals`);

  // ── Summary ───────────────────────────────────────────────────────────────────
  const statusCount = dealDefinitions.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {});

  const totalRevenue = dealDefinitions.reduce((sum, d) => sum + d.amount, 0);
  const atRiskRevenue = dealDefinitions
    .filter((d) => d.status === 'stale' || d.status === 'critical')
    .reduce((sum, d) => sum + d.amount, 0);

  console.log('\n🎉 Seed complete!\n');
  console.log('=== Pipeline Summary ===');
  console.log(`  Healthy:  ${statusCount.healthy} deals`);
  console.log(`  Warning:  ${statusCount.warning} deals`);
  console.log(`  Stale:    ${statusCount.stale} deals`);
  console.log(`  Critical: ${statusCount.critical} deals`);
  console.log(`  Total Pipeline: $${(totalRevenue / 1000000).toFixed(2)}M`);
  console.log(`  At-Risk Revenue: $${(atRiskRevenue / 1000000).toFixed(2)}M`);
  console.log('\n=== Login Credentials ===');
  console.log('  Admin:   admin@acmesales.com  / password123');
  console.log('  Manager: david@acmesales.com  / password123');
  console.log('  Rep:     sarah@acmesales.com  / password123');
  console.log('  Rep:     marcus@acmesales.com / password123');
  console.log('  Rep:     emma@acmesales.com   / password123');
  console.log('=========================\n');
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  const shouldReset = process.argv.includes('--reset');

  if (shouldReset) {
    await reset();
  } else {
    // Check if already seeded
    const existing = await prisma.team.findUnique({ where: { slug: SEED_TEAM_SLUG } });
    if (existing) {
      console.log('⚠️  Seed data already exists.');
      console.log('   Run with --reset to clear and re-seed: node src/scripts/seed.js --reset');
      await prisma.$disconnect();
      return;
    }
  }

  await seed();
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Seed failed:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
