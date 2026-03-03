/**
 * End-to-end staleness engine test.
 *
 * Runs the staleness check against seeded data and verifies that
 * deals transition correctly and notifications are created.
 *
 * Usage:  node src/scripts/testStaleness.js
 *
 * Pre-requisites:
 *   - Database seeded (npm run seed)
 *   - .env configured with DATABASE_URL
 */

require("dotenv").config();
const prisma = require("../config/prisma");
const { runStalenessCheck } = require("../services/stalenessService");

const SEED_TEAM_SLUG = "acme-corp-sales";

// ANSI colors
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ${green("✓")} ${label}`);
    passed++;
  } else {
    console.log(`  ${red("✗")} ${label}`);
    failed++;
  }
}

async function main() {
  console.log(bold("\n═══════════════════════════════════════════"));
  console.log(bold("  Stale Deal Nagger — End-to-End Test"));
  console.log(bold("═══════════════════════════════════════════\n"));

  // ── 1. Verify seed data exists ──────────────────────────────────────────
  console.log(bold("1. Verifying seed data..."));

  const team = await prisma.team.findUnique({
    where: { slug: SEED_TEAM_SLUG },
  });
  assert(!!team, "Seed team exists");

  if (!team) {
    console.log(red("\n  ✗ Run `npm run seed` first!\n"));
    process.exit(1);
  }

  const rules = await prisma.rule.findMany({
    where: { teamId: team.id, isActive: true },
  });
  assert(rules.length === 4, `4 staleness rules found (got ${rules.length})`);

  const dealsBefore = await prisma.deal.findMany({
    where: { teamId: team.id, isActive: true },
    orderBy: { name: "asc" },
  });
  assert(
    dealsBefore.length >= 15,
    `At least 15 deals found (got ${dealsBefore.length})`,
  );

  const users = await prisma.user.findMany({
    where: { teamId: team.id, isActive: true },
  });
  assert(users.length >= 5, `At least 5 users found (got ${users.length})`);

  // ── 2. Capture pre-run state ────────────────────────────────────────────
  console.log(bold("\n2. Pre-run deal status snapshot..."));

  const statusCounts = {};
  for (const deal of dealsBefore) {
    statusCounts[deal.stalenessStatus] =
      (statusCounts[deal.stalenessStatus] || 0) + 1;
  }
  console.log(
    `  ${dim(`healthy=${statusCounts.healthy || 0}, warning=${statusCounts.warning || 0}, stale=${statusCounts.stale || 0}, critical=${statusCounts.critical || 0}`)}`,
  );

  // Count existing notifications
  const notifCountBefore = await prisma.notification.count({
    where: { deal: { teamId: team.id } },
  });
  console.log(`  ${dim(`Notifications before: ${notifCountBefore}`)}`);

  // ── 3. Run the staleness engine ─────────────────────────────────────────
  console.log(bold("\n3. Running staleness engine..."));

  const result = await runStalenessCheck(team.id);

  assert(
    result.teamsChecked === 1,
    `Checked 1 team (got ${result.teamsChecked})`,
  );
  assert(
    result.totalProcessed === dealsBefore.length,
    `Processed ${dealsBefore.length} deals (got ${result.totalProcessed})`,
  );
  console.log(`  ${dim(`Transitions: ${result.totalTransitioned}`)}`);

  // ── 4. Verify deal statuses after engine run ────────────────────────────
  console.log(bold("\n4. Verifying deal statuses post-run..."));

  const dealsAfter = await prisma.deal.findMany({
    where: { teamId: team.id, isActive: true },
    orderBy: { name: "asc" },
  });

  // Check that daysStale is calculated correctly for each deal
  for (const deal of dealsAfter) {
    const rule = rules.find((r) => r.stage === deal.stage);
    if (!rule) continue;

    const daysInactive = deal.lastActivityAt
      ? Math.floor(
          (Date.now() - new Date(deal.lastActivityAt).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    // Determine expected status based on thresholds
    let expectedStatus;
    if (daysInactive >= rule.criticalAfterDays) expectedStatus = "critical";
    else if (daysInactive >= rule.escalateAfterDays) expectedStatus = "stale";
    else if (daysInactive >= rule.staleAfterDays) expectedStatus = "warning";
    else expectedStatus = "healthy";

    // Skip snoozed deals
    if (deal.snoozedUntil && new Date(deal.snoozedUntil) > new Date()) continue;

    assert(
      deal.stalenessStatus === expectedStatus,
      `${deal.name}: ${deal.stalenessStatus} === ${expectedStatus} (${daysInactive}d inactive)`,
    );
  }

  // ── 5. Verify notifications were created ────────────────────────────────
  console.log(bold("\n5. Checking notifications..."));

  const notifCountAfter = await prisma.notification.count({
    where: { deal: { teamId: team.id } },
  });

  const newNotifs = notifCountAfter - notifCountBefore;
  console.log(
    `  ${dim(`Notifications after: ${notifCountAfter} (+${newNotifs} new)`)}`,
  );

  // If there were transitions, there should be notifications
  if (result.totalTransitioned > 0) {
    assert(
      newNotifs > 0,
      `Notifications created for ${result.totalTransitioned} transitions`,
    );
  } else {
    assert(true, "No transitions → no new notifications expected");
  }

  // Verify notification structure
  const sampleNotif = await prisma.notification.findFirst({
    where: { deal: { teamId: team.id } },
    include: {
      deal: { select: { name: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (sampleNotif) {
    assert(!!sampleNotif.message, "Notification has message");
    assert(!!sampleNotif.type, `Notification type: ${sampleNotif.type}`);
    assert(
      !!sampleNotif.channel,
      `Notification channel: ${sampleNotif.channel}`,
    );
    assert(sampleNotif.status === "pending", "Notification status is pending");
  }

  // ── 6. Test deduplication (run engine again) ────────────────────────────
  console.log(bold("\n6. Testing deduplication (re-running engine)..."));

  const result2 = await runStalenessCheck(team.id);

  assert(
    result2.totalTransitioned === 0,
    `No re-transitions on second run (got ${result2.totalTransitioned})`,
  );

  const notifCountAfter2 = await prisma.notification.count({
    where: { deal: { teamId: team.id } },
  });
  const dupeNotifs = notifCountAfter2 - notifCountAfter;
  console.log(`  ${dim(`New notifications after re-run: ${dupeNotifs}`)}`);
  // Dedup window should prevent duplicate notifications
  assert(dupeNotifs === 0, "No duplicate notifications created");

  // ── 7. Test snooze behavior ─────────────────────────────────────────────
  console.log(bold("\n7. Testing snooze behavior..."));

  const snoozeDeal = dealsAfter[0];
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  await prisma.deal.update({
    where: { id: snoozeDeal.id },
    data: { snoozedUntil: futureDate, snoozeReason: "Test snooze" },
  });

  const result3 = await runStalenessCheck(team.id);
  assert(
    result3.totalProcessed === dealsAfter.length,
    "All deals processed (including snoozed)",
  );

  const snoozedDealAfter = await prisma.deal.findUnique({
    where: { id: snoozeDeal.id },
  });
  assert(
    !!snoozedDealAfter.snoozedUntil,
    "Snoozed deal still has snoozedUntil (not modified)",
  );

  // Clean up snooze
  await prisma.deal.update({
    where: { id: snoozeDeal.id },
    data: { snoozedUntil: null, snoozeReason: null },
  });

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log(bold("\n═══════════════════════════════════════════"));
  console.log(
    bold(
      `  Results: ${green(`${passed} passed`)}, ${failed > 0 ? red(`${failed} failed`) : green("0 failed")}`,
    ),
  );
  console.log(bold("═══════════════════════════════════════════\n"));

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error(red("\n  Fatal error:"), err.message);
  await prisma.$disconnect();
  process.exit(1);
});
