const { parse } = require("csv-parse/sync");
const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");
const activityService = require("./activityService");
const logger = require("../config/logger");

// Valid stages and CRM sources
const VALID_STAGES = ["discovery", "proposal", "negotiation", "closing"];
const VALID_CRM_SOURCES = [
  "hubspot",
  "salesforce",
  "pipedrive",
  "sheets",
  "manual",
  "csv",
];

/**
 * Parse a CSV buffer and return an array of deal objects.
 * Expects columns: name, stage, amount, currency, contactName, contactEmail, ownerId (optional)
 */
const parseCSV = (buffer) => {
  try {
    const records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    return records;
  } catch (err) {
    throw new AppError(`CSV parsing error: ${err.message}`, 400);
  }
};

/**
 * Validate and normalize a single CSV row into a deal object.
 */
const normalizeRow = (row, index) => {
  const errors = [];
  const name = row.name || row.Name || row.deal_name || row["Deal Name"];
  const stage = (
    row.stage ||
    row.Stage ||
    row.pipeline_stage ||
    "discovery"
  ).toLowerCase();
  const amount = parseFloat(
    row.amount || row.Amount || row.value || row.Value || "0",
  );
  const currency = (row.currency || row.Currency || "USD").toUpperCase();
  const contactName =
    row.contactName ||
    row.contact_name ||
    row["Contact Name"] ||
    row.contact ||
    null;
  const contactEmail =
    row.contactEmail ||
    row.contact_email ||
    row["Contact Email"] ||
    row.email ||
    null;

  if (!name) {
    errors.push(`Row ${index + 1}: Missing deal name`);
  }

  if (!VALID_STAGES.includes(stage)) {
    errors.push(
      `Row ${index + 1}: Invalid stage "${stage}". Valid: ${VALID_STAGES.join(", ")}`,
    );
  }

  if (isNaN(amount) || amount < 0) {
    errors.push(`Row ${index + 1}: Invalid amount "${row.amount}"`);
  }

  return {
    deal: {
      name,
      stage,
      amount,
      currency,
      contactName,
      contactEmail,
    },
    errors,
  };
};

/**
 * Import deals from CSV into a team.
 * Returns { imported, skipped, errors } summary.
 */
const importFromCSV = async (teamId, csvBuffer, userId) => {
  const records = parseCSV(csvBuffer);

  if (records.length === 0) {
    throw new AppError("CSV file is empty or has no valid rows", 400);
  }

  if (records.length > 500) {
    throw new AppError(
      "CSV import limited to 500 deals at a time. Please split your file.",
      400,
    );
  }

  const results = {
    total: records.length,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  for (let i = 0; i < records.length; i++) {
    const { deal, errors } = normalizeRow(records[i], i);

    if (errors.length > 0) {
      results.errors.push(...errors);
      results.skipped++;
      continue;
    }

    try {
      // Generate a deterministic CRM ID for CSV imports
      const crmDealId = `csv-${Date.now()}-${i}`;

      const created = await prisma.deal.create({
        data: {
          teamId,
          crmDealId,
          crmSource: "csv",
          name: deal.name,
          stage: deal.stage,
          amount: deal.amount,
          currency: deal.currency,
          contactName: deal.contactName,
          contactEmail: deal.contactEmail,
          lastActivityAt: new Date(),
          metadata: {
            importedBy: userId,
            importedAt: new Date().toISOString(),
          },
        },
      });

      // Log the import as an activity
      await activityService.logActivity({
        dealId: created.id,
        type: "note",
        description: "Deal imported via CSV upload",
        performedBy: userId,
      });

      results.imported++;
    } catch (err) {
      if (err.code === "P2002") {
        results.errors.push(`Row ${i + 1}: Duplicate deal "${deal.name}"`);
        results.skipped++;
      } else {
        results.errors.push(`Row ${i + 1}: ${err.message}`);
        results.skipped++;
      }
    }
  }

  logger.info(
    `CSV import for team ${teamId}: ${results.imported} imported, ${results.skipped} skipped`,
  );

  return results;
};

/**
 * Get import history for a team (deals imported via CSV).
 */
const getImportHistory = async (teamId, query = {}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const [deals, total] = await Promise.all([
    prisma.deal.findMany({
      where: { teamId, crmSource: "csv" },
      select: {
        id: true,
        name: true,
        stage: true,
        amount: true,
        contactName: true,
        createdAt: true,
        metadata: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.deal.count({ where: { teamId, crmSource: "csv" } }),
  ]);

  return {
    deals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  parseCSV,
  normalizeRow,
  importFromCSV,
  getImportHistory,
};
