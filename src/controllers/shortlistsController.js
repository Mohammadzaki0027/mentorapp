const {
  getShortlistService,
  addToShortlistService,
  removeFromShortlistService,
  getShortlistStatsService,
} = require("../services/shortlistsService");

// GET /shortlists/stats  ← must be before /:university_id
const getShortlistStats = async (req, res) => {
  try {
    const data = await getShortlistStatsService(req.user.user_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

// GET /shortlists
const getShortlist = async (req, res) => {
  try {
    const data = await getShortlistService(req.user.user_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

// POST /shortlists/:university_id
const addToShortlist = async (req, res) => {
  try {
    const data = await addToShortlistService(req.user.user_id, req.params.university_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

// DELETE /shortlists/:university_id
const removeFromShortlist = async (req, res) => {
  try {
    const data = await removeFromShortlistService(req.user.user_id, req.params.university_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

module.exports = {
  getShortlist,
  addToShortlist,
  removeFromShortlist,
  getShortlistStats,
};
