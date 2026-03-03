const teamService = require('../services/teamService');

const getTeam = async (req, res, next) => {
  try {
    const team = await teamService.getTeam(req.user.teamId);
    res.json({ success: true, data: team });
  } catch (err) {
    next(err);
  }
};

const updateTeam = async (req, res, next) => {
  try {
    const team = await teamService.updateTeam(req.user.teamId, req.body);
    res.json({ success: true, data: team });
  } catch (err) {
    next(err);
  }
};

const getMembers = async (req, res, next) => {
  try {
    const members = await teamService.getMembers(req.user.teamId);
    res.json({ success: true, data: members });
  } catch (err) {
    next(err);
  }
};

const inviteUser = async (req, res, next) => {
  try {
    const result = await teamService.inviteUser(req.user.teamId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const user = await teamService.updateUserRole(
      req.user.teamId,
      req.params.userId,
      req.body.role,
      req.user.id
    );
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const deactivateUser = async (req, res, next) => {
  try {
    const user = await teamService.deactivateUser(
      req.user.teamId,
      req.params.userId,
      req.user.id
    );
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const reactivateUser = async (req, res, next) => {
  try {
    const user = await teamService.reactivateUser(req.user.teamId, req.params.userId);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await teamService.updateProfile(req.user.id, req.body);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const result = await teamService.changePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
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
};
