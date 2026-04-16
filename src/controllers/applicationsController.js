const {
  getApplicationsService,
  submitApplicationService,
  getApplicationService,
  updateApplicationService,
  getApplicationStatsService,
} = require("../services/applicationsService");

// GET /applications
const getApplications = async (req, res) => {
  try {
    const data = await getApplicationsService(req.user.user_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

// POST /applications
const submitApplication = async (req, res) => {
  try {
    const data = await submitApplicationService(req.user.user_id, req.body);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

// GET /applications/stats/overview  ← must be before /:application_id
const getApplicationStats = async (req, res) => {
  try {
    const data = await getApplicationStatsService(req.user.user_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

// GET /applications/:application_id
const getApplication = async (req, res) => {
  try {
    const data = await getApplicationService(
      req.user.user_id,
      req.params.application_id
    );
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

// PUT /applications/:application_id
const updateApplication = async (req, res) => {
  try {
    const data = await updateApplicationService(
      req.user.user_id,
      req.params.application_id,
      req.body
    );
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

module.exports = {
  getApplications,
  submitApplication,
  getApplicationStats,
  getApplication,
  updateApplication,
};
