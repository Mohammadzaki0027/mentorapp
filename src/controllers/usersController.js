const {
  getProfileService,
  updateProfileService,
  getVerificationStatusService,
  getProfileStatsService,
  deleteProfileService,
  softDeleteProfileService,
  adminDeleteUserService,
} = require("../services/usersService");

const getProfile = async (req, res) => {
  try {
    const data = await getProfileService(req.user.user_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const data = await updateProfileService(req.user.user_id, req.body);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const patchProfile = (req, res) => updateProfile(req, res);

const getVerificationStatus = async (req, res) => {
  try {
    const data = await getVerificationStatusService(req.user.user_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const getProfileStats = async (req, res) => {
  try {
    const data = await getProfileStatsService(req.user.user_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const data = await deleteProfileService(req.user.user_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const softDeleteProfile = async (req, res) => {
  try {
    const data = await softDeleteProfileService(req.user.user_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const adminDeleteUser = async (req, res) => {
  try {
    const data = await adminDeleteUserService(req.params.user_id, req.user.user_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  patchProfile,
  getVerificationStatus,
  getProfileStats,
  deleteProfile,
  softDeleteProfile,
  adminDeleteUser,
};
