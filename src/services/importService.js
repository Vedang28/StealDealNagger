const { parse } = require("csv-parse/sync");
const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../config/logger");

// ---------------------------------------------------------------------------
// Flexible column-header → internal-field mapping
// ---------------------------------------------------------------------------
const COLUMN_ALIASES = {
  // Deal name
  name: "name",
  deal: "name",
  "deal name": "name",
  deal_name: "name",
  dealname: "name",
  title: "name",

  // Stage
  stage: "stage",
  "pipeline stage": "stage",
  "deal stage": "stage",
  pipeline: "stage",

  // Staleness status
  status: "stalenessStatus",
  "staleness status": "stalenessStatus",
  staleness: "stalenessStatus",
  health: "stalenessStatus",

  // Days stale
  "days stale": "daysStale",
  days_stale: "daysStale",
  daysstale: "daysStale",
  stale: "daysStale",
  "stale days": "daysStale",

  // Value / Amount
  value: "amount",
  amount: "amount",
  "deal value": "amount",
  deal_value: "amount",
  revenue: "amount",
  price: "amount",
  $: "amount",

  // Currency
  currency: "currency",

  // Contact name
  contact: "contactName",
  "contact name": "contactName",
  contact_name: "contactName",
  contactname: "contactName",
  company: "contactName",

  // Contact email
  email: "contactEmail",
  "contact email": "contactEmail",
  contact_email: "contactEmail",
  contactemail: "contactEmail",

  // CRM Deal ID
  "crm id": "crmDealId",
  crm_id: "crmDealId",
  "deal id": "crmDealId",
  deal_id: "crmDealId",
  crmid: "crmDealId",
  id: "crmDealId",

  // Owner
  owner: "ownerEmail",
  "owner email": "ownerEmail",
  owner_email: "ownerEmail",
  rep: "ownerEmail",
  "sales rep": "ownerEmail",

  // Last activity
  "last activity": "lastActivityAt",
  last_activity: "lastActivityAt",
  lastactivity: "lastActivityAt",
  "last activity date": "lastActivityAt",
  "activity date": "lastActivityAt",
};

// ---------------------------------------------------------------------------
// Stage helpers  (our DB stores title-case: Discovery, Proposal, …)
// ---------------------------------------------------------------------------
const VALID_STAGES = [
  "Discovery",
  "Qualification",
  "Proposal",
  "Negotiation",
  "Closing",
];

const STAGE_MAP = {
  discovery: "Discovery",
  qualification: "Qualification",
  qualifying: "Qualification",
  demo: "Discovery",
  proposal: "Proposal",
  negotiation: "Negotiation",
  negotiating: "Negotiation",
  closing: "Closing",
  "closed won": "Closing",
  "closed lost": "Closing",
  close: "Closing",
};

// ---------------------------------------------------------------------------
// Utility: map raw CSV headers to internal field names
// ---------------------------------------------------------------------------
function normalizeHeaders(headers) {
  const mapping = {};
  for (const header of headers) {
    const key = header.toLowerCase().trim();
    if (COLUMN_ALIASES[key]) {
      mapping[header] = COLUMN_ALIASES[key];
    }
  }
  return mapping;
}

// ---------------------------------------------------------------------------
// Utility: parse monetary values like "$280K", "$1.5M", "1,200"
// ---------------------------------------------------------------------------
function parseValue(raw) {
  if (raw === null || raw === undefined) return 0;
  let cleaned = String(raw)
    .replace(/[$,\s]/g, "")
    .trim();
  if (cleaned === "") return 0;

  if (/^\d+(\.\d+)?[kK]$/.test(cleaned)) {
    return parseFloat(cleaned.replace(/[kK]/, "")) * 1000;
  }
  if (/^\d+(\.\d+)?[mM]$/.test(cleaned)) {
    return parseFloat(cleaned.replace(/[mM]/, "")) * 1000000;
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// ---------------------------------------------------------------------------
// Utility: normalise stage string → one of our valid enum values
// ---------------------------------------------------------------------------
function normalizeStage(raw) {
  if (!raw) return "Discovery";
  const cleaned = raw.toLowerCase().trim();

  if (STAGE_MAP[cleaned]) return STAGE_MAP[cleaned];

  // Title-case the input if it matches a valid stage (case-insensitive)
  const titleCase = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  if (VALID_STAGES.includes(titleCase)) return titleCase;

  return titleCase || "Discovery"; // preserve the original value title-cased
}

// ---------------------------------------------------------------------------
// Utility: parse "2d", "3 days", "10" → integer days
// ---------------------------------------------------------------------------
function parseDaysStale(raw) {
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim();
  const match = str.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// ---------------------------------------------------------------------------
// Utility: normalise staleness status string → one of our valid values
// ---------------------------------------------------------------------------
function normalizeStalenessStatus(raw) {
  if (!raw) return null;
  const cleaned = raw.toLowerCase().trim();
  const valid = ["healthy", "warning", "stale", "critical"];
  return valid.includes(cleaned) ? cleaned : null;
}

// ---------------------------------------------------------------------------
// Utility: best-effort date parsing  ("Mar 4", "2026-03-04", etc.)
// ---------------------------------------------------------------------------
function parseDate(raw) {
  if (!raw) return null;
  const str = String(raw).trim();

  // "Mar 4", "March 04"
  const monthNameMatch = str.match(
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2})$/i,
  );
  if (monthNameMatch) {
    const year = new Date().getFullYear();
    const d = new Date(`${monthNameMatch[1]} ${monthNameMatch[2]}, ${year}`);
    if (!isNaN(d.getTime())) return d;
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------------------
// Parse CSV buffer → records
// ---------------------------------------------------------------------------
const parseCSV = (buffer) => {
  try {
    return parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: true,
    });
  } catch (err) {
    throw new AppError(`CSV parsing error: ${err.message}`, 400);
  }
};

// ---------------------------------------------------------------------------
// Import deals from CSV into a team.
// Returns { total, imported, skipped, errors }
// ---------------------------------------------------------------------------
const importFromCSV = async (teamId, csvBuffer, userId) => {
  const records = parseCSV(csvBuffer);

  if (!records || records.length === 0) {
    throw new AppError("CSV file is empty or has no valid rows", 400);
  }

  if (records.length > 500) {
    throw new AppError(
      `CSV import limited to 500 deals at a time (got ${records.length}). Please split your file.`,
      400,
    );
  }

  // Build header mapping from first record's keys
  const headers = Object.keys(records[0]);
  const headerMap = normalizeHeaders(headers);

  logger.info(
    `CSV Import — detected column mapping: ${JSON.stringify(headerMap)}`,
  );

  // Make sure we can detect a name column
  const hasNameCol = Object.values(headerMap).includes("name");
  if (!hasNameCol) {
    throw new AppError(
      `Could not detect a "Deal Name" column. Found columns: ${headers.join(", ")}. ` +
        `Expected one of: name, deal, deal name, title, company`,
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
    const raw = records[i];
    const rowNum = i + 1;

    // Map raw columns → normalised field object
    const row = {};
    for (const [originalHeader, fieldName] of Object.entries(headerMap)) {
      const val = raw[originalHeader];
      if (val !== undefined && val !== "") {
        row[fieldName] = val;
      }
    }

    // Validate name
    const name = row.name ? String(row.name).trim() : "";
    if (!name) {
      results.skipped++;
      results.errors.push(`Row ${rowNum}: Missing deal name`);
      continue;
    }

    const stage = normalizeStage(row.stage);
    const amount = parseValue(row.amount);
    const currency = row.currency ? row.currency.toUpperCase() : "USD";
    const lastActivityAt = parseDate(row.lastActivityAt) || new Date();
    const contactName = row.contactName || null;
    const contactEmail = row.contactEmail || null;
    const daysStale = parseDaysStale(row.daysStale);
    const stalenessStatus = normalizeStalenessStatus(row.stalenessStatus);

    try {
      // Check for existing deal with same name in this team (upsert logic)
      const existing = await prisma.deal.findFirst({
        where: { teamId, name, isActive: true },
      });

      if (existing) {
        const updateData = {
          stage,
          amount,
          lastActivityAt,
          contactName: contactName || existing.contactName,
          contactEmail: contactEmail || existing.contactEmail,
        };
        if (daysStale !== null) updateData.daysStale = daysStale;
        if (stalenessStatus) updateData.stalenessStatus = stalenessStatus;
        await prisma.deal.update({
          where: { id: existing.id },
          data: updateData,
        });
        results.imported++;
      } else {
        const crmDealId = `csv-${Date.now()}-${i}`;

        const createData = {
          teamId,
          crmDealId,
          crmSource: "csv",
          name,
          stage,
          amount,
          currency,
          contactName,
          contactEmail,
          lastActivityAt,
          ownerId: userId,
          metadata: {
            importedBy: userId,
            importedAt: new Date().toISOString(),
          },
        };
        if (daysStale !== null) createData.daysStale = daysStale;
        if (stalenessStatus) createData.stalenessStatus = stalenessStatus;
        await prisma.deal.create({ data: createData });
        results.imported++;
      }
    } catch (err) {
      logger.error(`CSV row ${rowNum} DB error:`, err);
      if (err.code === "P2002") {
        results.errors.push(`Row ${rowNum}: Duplicate deal "${name}"`);
      } else {
        results.errors.push(`Row ${rowNum}: ${err.message}`);
      }
      results.skipped++;
    }
  }

  logger.info(
    `CSV import for team ${teamId}: ${results.imported} imported, ${results.skipped} skipped out of ${results.total}`,
  );

  return results;
};

// ---------------------------------------------------------------------------
// Get import history for a team (deals imported via CSV).
// ---------------------------------------------------------------------------
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
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

module.exports = {
  parseCSV,
  importFromCSV,
  getImportHistory,
};
