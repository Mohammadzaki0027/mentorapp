const express = require("express");
const router = express.Router();

const { getCurrentUser } = require("../middleware/authMiddleware");
const {
  getApplications,
  submitApplication,
  getApplicationStats,
  getApplication,
  updateApplication,
} = require("../controllers/applicationsController");

// NOTE: /stats/overview must be defined BEFORE /:application_id
// otherwise Express matches "stats" as the application_id param

// GET  /applications
router.get("/", getCurrentUser, getApplications);

// POST /applications
router.post("/", getCurrentUser, submitApplication);

// GET  /applications/stats/overview
router.get("/stats/overview", getCurrentUser, getApplicationStats);

// GET  /applications/:application_id
router.get("/:application_id", getCurrentUser, getApplication);

// PUT  /applications/:application_id
router.put("/:application_id", getCurrentUser, updateApplication);

module.exports = router;
