const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");

// ── Team ──────────────────────────────────────────────────────────────────────

const getTeam = async (teamId) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      timezone: true,
      digestTime: true,
      createdAt: true,
      _count: { select: { users: { where: { isActive: true } } } },
    },
  });

  if (!team) {
    throw new AppError("Team not found", 404);
  }

  return team;
};

const updateTeam = async (teamId, data) => {
  const team = await prisma.team.update({
    where: { id: teamId },
    data,
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      timezone: true,
      digestTime: true,
    },
  });

  return team;
};

// ── Members ───────────────────────────────────────────────────────────────────

const getMembers = async (teamId) => {
  const members = await prisma.user.findMany({
    where: { teamId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      slackUserId: true,
      notificationPrefs: true,
      inviteStatus: true,
      invitedAt: true,
      createdAt: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return members;
};

const inviteUser = async (teamId, data) => {
  // Check email not already taken
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new AppError("A user with this email already exists", 409);
  }

  // Generate a temporary password (they would reset via email in production)
  const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: {
      teamId,
      name: data.name,
      email: data.email,
      password: passwordHash,
      role: data.role,
      isActive: true,
      inviteStatus: "pending",
      invitedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      inviteStatus: true,
      invitedAt: true,
      createdAt: true,
    },
  });

  return { user, tempPassword };
};

const updateUserRole = async (teamId, userId, role, requestingUserId) => {
  if (userId === requestingUserId) {
    throw new AppError("You cannot change your own role", 400);
  }

  const member = await prisma.user.findFirst({ where: { id: userId, teamId } });
  if (!member) {
    throw new AppError("User not found in this team", 404);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  return updated;
};

const deactivateUser = async (teamId, userId, requestingUserId) => {
  if (userId === requestingUserId) {
    throw new AppError("You cannot deactivate your own account", 400);
  }

  const member = await prisma.user.findFirst({ where: { id: userId, teamId } });
  if (!member) {
    throw new AppError("User not found in this team", 404);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  return updated;
};

const reactivateUser = async (teamId, userId) => {
  const member = await prisma.user.findFirst({ where: { id: userId, teamId } });
  if (!member) {
    throw new AppError("User not found in this team", 404);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  return updated;
};

// ── User profile self-management ──────────────────────────────────────────────

const updateProfile = async (userId, data) => {
  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      slackUserId: true,
      notificationPrefs: true,
    },
  });

  return updated;
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    throw new AppError("Current password is incorrect", 401);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: passwordHash },
  });

  return { message: "Password changed successfully" };
};
const deleteTeam = async (teamId, requestingUserId) => {
  // Verify requesting user is an admin of this team
  const user = await prisma.user.findFirst({
    where: { id: requestingUserId, teamId, role: "admin" },
  });
  if (!user) {
    throw new AppError("Only team admins can delete a team", 403);
  }

  // Delete all related data in a transaction (order matters for FK constraints)
  await prisma.$transaction(async (tx) => {
    // Delete notifications (depends on deals + users)
    await tx.notification.deleteMany({ where: { deal: { teamId } } });
    // Delete activities (depends on deals)
    await tx.activity.deleteMany({ where: { deal: { teamId } } });
    // Delete deals
    await tx.deal.deleteMany({ where: { teamId } });
    // Delete rules
    await tx.rule.deleteMany({ where: { teamId } });
    // Delete integrations
    await tx.integration.deleteMany({ where: { teamId } });
    // Delete users
    await tx.user.deleteMany({ where: { teamId } });
    // Delete team
    await tx.team.delete({ where: { id: teamId } });
  });

  return { message: "Team and all associated data deleted permanently" };
};
module.exports = {
  getTeam,
  updateTeam,
  getMembers,
  inviteUser,
  updateUserRole,
  deactivateUser,
  reactivateUser,
  updateProfile,
  changePassword,
  deleteTeam,
};
