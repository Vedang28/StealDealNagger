const prisma = require("../config/prisma");
const nodemailer = require("nodemailer");
const logger = require("../config/logger");
const config = require("../config");

/**
 * Email Service — sends digest emails and transactional notifications.
 * Uses Nodemailer with SMTP (configurable: Gmail, SendGrid, Resend, etc.)
 */

// ─── Transporter Setup ──────────────────────────────────────────────────────

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const emailConfig = config.email || {};

  if (emailConfig.host) {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port || 587,
      secure: emailConfig.secure || false,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
    });
    logger.info(`Email transporter configured with SMTP: ${emailConfig.host}`);
  } else {
    // Fallback: create a test account (Ethereal) for development
    logger.warn(
      "No email configuration found. Emails will be logged but not sent. " +
        "Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env to enable.",
    );
    transporter = {
      sendMail: async (options) => {
        logger.info(
          `[EMAIL MOCK] To: ${options.to}, Subject: ${options.subject}`,
        );
        logger.debug(
          `[EMAIL MOCK] Body preview: ${options.text?.substring(0, 200)}`,
        );
        return { messageId: `mock-${Date.now()}`, accepted: [options.to] };
      },
    };
  }

  return transporter;
};

// ─── HTML Template Builder ──────────────────────────────────────────────────

/**
 * Build the HTML email template for the daily pipeline digest.
 */
const buildDigestHTML = (team, data) => {
  const {
    totalDeals,
    totalRevenue,
    staleDeals,
    criticalDeals,
    atRiskRevenue,
    topDeals,
  } = data;

  const staleRows = topDeals
    .map(
      (d) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${d.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${d.ownerName || "Unassigned"}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">${d.stage}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">$${Number(d.amount).toLocaleString()}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: ${d.stalenessStatus === "critical" ? "#ef4444" : "#f59e0b"};">
          ${d.daysStale}d — ${d.stalenessStatus.toUpperCase()}
        </td>
      </tr>`,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pipeline Digest — ${team.name}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 12px 12px 0 0; padding: 24px; color: white;">
      <h1 style="margin: 0; font-size: 22px;">Pipeline Health Digest</h1>
      <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">${team.name} — ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
    </div>

    <!-- KPI Cards -->
    <div style="background: white; padding: 24px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="25%" style="text-align: center; padding: 12px;">
            <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${totalDeals}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Total Deals</div>
          </td>
          <td width="25%" style="text-align: center; padding: 12px;">
            <div style="font-size: 24px; font-weight: bold; color: #1e293b;">$${Number(totalRevenue).toLocaleString()}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Pipeline Value</div>
          </td>
          <td width="25%" style="text-align: center; padding: 12px;">
            <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${staleDeals}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Stale Deals</div>
          </td>
          <td width="25%" style="text-align: center; padding: 12px;">
            <div style="font-size: 24px; font-weight: bold; color: #ef4444;">${criticalDeals}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Critical</div>
          </td>
        </tr>
      </table>

      ${
        Number(atRiskRevenue) > 0
          ? `<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-top: 16px; text-align: center;">
        <span style="color: #dc2626; font-weight: 600;">⚠️ $${Number(atRiskRevenue).toLocaleString()} at risk</span>
        <span style="color: #64748b; font-size: 13px;"> from ${staleDeals + criticalDeals} stale/critical deals</span>
      </div>`
          : ""
      }
    </div>

    <!-- Top Stale Deals Table -->
    ${
      topDeals.length > 0
        ? `
    <div style="background: white; padding: 24px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
      <h2 style="margin: 0 0 16px; font-size: 16px; color: #1e293b;">🔥 Deals Requiring Attention</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="padding: 8px 12px; text-align: left; color: #64748b; font-weight: 600;">Deal</th>
            <th style="padding: 8px 12px; text-align: left; color: #64748b; font-weight: 600;">Rep</th>
            <th style="padding: 8px 12px; text-align: left; color: #64748b; font-weight: 600;">Stage</th>
            <th style="padding: 8px 12px; text-align: left; color: #64748b; font-weight: 600;">Amount</th>
            <th style="padding: 8px 12px; text-align: left; color: #64748b; font-weight: 600;">Status</th>
          </tr>
        </thead>
        <tbody>${staleRows}</tbody>
      </table>
    </div>`
        : ""
    }

    <!-- CTA -->
    <div style="background: white; padding: 24px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; text-align: center;">
      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard"
         style="display: inline-block; background: #3b82f6; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        View Dashboard
      </a>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; border-radius: 0 0 12px 12px; padding: 16px 24px; border: 1px solid #e2e8f0; border-top: none; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">
        Stale Deal Nagger — Automated pipeline health monitoring<br>
        <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/settings" style="color: #3b82f6;">Manage email preferences</a>
      </p>
    </div>
  </div>
</body>
</html>`;
};

/**
 * Build plain text version of the digest.
 */
const buildDigestText = (team, data) => {
  let text = `Pipeline Health Digest — ${team.name}\n`;
  text += `${new Date().toLocaleDateString()}\n\n`;
  text += `Total Deals: ${data.totalDeals}\n`;
  text += `Pipeline Value: $${Number(data.totalRevenue).toLocaleString()}\n`;
  text += `Stale Deals: ${data.staleDeals}\n`;
  text += `Critical Deals: ${data.criticalDeals}\n`;
  text += `At-Risk Revenue: $${Number(data.atRiskRevenue).toLocaleString()}\n\n`;

  if (data.topDeals.length > 0) {
    text += `Top Deals Requiring Attention:\n`;
    for (const d of data.topDeals) {
      text += `  - ${d.name} (${d.stage}) — $${Number(d.amount).toLocaleString()} — ${d.daysStale}d ${d.stalenessStatus}\n`;
    }
  }

  text += `\nView Dashboard: ${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard`;
  return text;
};

// ─── Digest Compilation ──────────────────────────────────────────────────────

/**
 * Compile digest data for a team.
 */
const compileDigestData = async (teamId) => {
  const [statusCounts, topDeals] = await Promise.all([
    prisma.deal.groupBy({
      by: ["stalenessStatus"],
      where: { teamId, isActive: true },
      _count: { id: true },
      _sum: { amount: true },
    }),
    prisma.deal.findMany({
      where: {
        teamId,
        isActive: true,
        stalenessStatus: { in: ["stale", "critical"] },
      },
      include: {
        owner: { select: { name: true } },
      },
      orderBy: { daysStale: "desc" },
      take: 5,
    }),
  ]);

  let totalDeals = 0;
  let totalRevenue = 0;
  let staleDeals = 0;
  let criticalDeals = 0;
  let atRiskRevenue = 0;

  for (const row of statusCounts) {
    totalDeals += row._count.id;
    totalRevenue += Number(row._sum.amount || 0);
    if (row.stalenessStatus === "stale") {
      staleDeals = row._count.id;
      atRiskRevenue += Number(row._sum.amount || 0);
    }
    if (row.stalenessStatus === "critical") {
      criticalDeals = row._count.id;
      atRiskRevenue += Number(row._sum.amount || 0);
    }
  }

  return {
    totalDeals,
    totalRevenue,
    staleDeals,
    criticalDeals,
    atRiskRevenue,
    topDeals: topDeals.map((d) => ({
      name: d.name,
      ownerName: d.owner?.name || "Unassigned",
      stage: d.stage,
      amount: d.amount,
      daysStale: d.daysStale,
      stalenessStatus: d.stalenessStatus,
    })),
  };
};

// ─── Send Digest ─────────────────────────────────────────────────────────────

/**
 * Send the daily digest email to all managers/admins in a team.
 */
const sendDigest = async (teamId) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      users: {
        where: {
          isActive: true,
          role: { in: ["admin", "manager"] },
        },
        select: { email: true, name: true, notificationPrefs: true },
      },
    },
  });

  if (!team) {
    logger.warn(`Team ${teamId} not found for digest`);
    return null;
  }

  // Filter users who have email notifications enabled
  const recipients = team.users.filter((u) => {
    const prefs =
      typeof u.notificationPrefs === "string"
        ? JSON.parse(u.notificationPrefs)
        : u.notificationPrefs || {};
    return prefs.email !== false; // Default to enabled
  });

  if (recipients.length === 0) {
    logger.debug(`No digest recipients for team ${team.name}`);
    return null;
  }

  const data = await compileDigestData(teamId);
  const html = buildDigestHTML(team, data);
  const text = buildDigestText(team, data);

  const transport = getTransporter();
  const fromAddress = config.email?.from || "noreply@staledealnagger.com";

  const results = [];
  for (const recipient of recipients) {
    try {
      const result = await transport.sendMail({
        from: `"Stale Deal Nagger" <${fromAddress}>`,
        to: recipient.email,
        subject: `Pipeline Digest — ${data.staleDeals + data.criticalDeals} deals need attention`,
        html,
        text,
      });
      results.push({
        email: recipient.email,
        status: "sent",
        messageId: result.messageId,
      });
      logger.info(`Digest sent to ${recipient.email}`);
    } catch (err) {
      results.push({
        email: recipient.email,
        status: "failed",
        error: err.message,
      });
      logger.error(
        `Failed to send digest to ${recipient.email}: ${err.message}`,
      );
    }
  }

  return { team: team.name, recipients: results };
};

/**
 * Run digest for all teams (called by the cron job).
 */
const runAllDigests = async () => {
  const teams = await prisma.team.findMany({
    select: { id: true, name: true },
  });
  const results = [];

  for (const team of teams) {
    try {
      const result = await sendDigest(team.id);
      if (result) results.push(result);
    } catch (err) {
      logger.error(`Digest failed for team ${team.name}: ${err.message}`);
    }
  }

  logger.info(`Digest run complete: ${results.length} teams processed`);
  return results;
};

module.exports = {
  getTransporter,
  buildDigestHTML,
  buildDigestText,
  compileDigestData,
  sendDigest,
  runAllDigests,
};
