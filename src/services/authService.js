const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const config = require("../config");
const { AppError } = require("../middleware/errorHandler");

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user.id, teamId: user.teamId, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiry },
  );
  const refreshToken = jwt.sign({ userId: user.id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });
  return { accessToken, refreshToken };
};

const register = async ({ teamName, name, email, password }) => {
  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("Email already registered", 409);
  }

  // Create team + user in a transaction
  const slug = teamName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const result = await prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: {
        name: teamName,
        slug: `${slug}-${Date.now().toString(36)}`,
      },
    });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await tx.user.create({
      data: {
        teamId: team.id,
        name,
        email,
        password: hashedPassword,
        role: "admin",
      },
    });

    // Create default staleness rules for the team
    const defaultStages = [
      {
        stage: "Discovery",
        staleAfterDays: 7,
        escalateAfterDays: 10,
        criticalAfterDays: 14,
      },
      {
        stage: "Proposal",
        staleAfterDays: 5,
        escalateAfterDays: 8,
        criticalAfterDays: 12,
      },
      {
        stage: "Negotiation",
        staleAfterDays: 3,
        escalateAfterDays: 5,
        criticalAfterDays: 7,
      },
      {
        stage: "Closing",
        staleAfterDays: 2,
        escalateAfterDays: 4,
        criticalAfterDays: 6,
      },
    ];

    for (const rule of defaultStages) {
      await tx.rule.create({
        data: {
          teamId: team.id,
          ...rule,
          suggestedAction: `Follow up on ${rule.stage} deal`,
        },
      });
    }

    return { team, user };
  });

  const tokens = generateTokens(result.user);

  return {
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
    },
    team: {
      id: result.team.id,
      name: result.team.name,
      slug: result.team.slug,
    },
    tokens,
  };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { team: true },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("Account is deactivated", 403);
  }

  const tokens = generateTokens(user);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    team: {
      id: user.team.id,
      name: user.team.name,
      slug: user.team.slug,
    },
    tokens,
  };
};

module.exports = { register, login };
