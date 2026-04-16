const express = require("express");
const router = express.Router();

const { getCurrentUser } = require("../middleware/authMiddleware");
const {
  getShortlist,
  addToShortlist,
  removeFromShortlist,
  getShortlistStats,
} = require("../controllers/shortlistsController");

// NOTE: /stats must be before /:university_id
// otherwise Express matches "stats" as the university_id param

// GET  /shortlists/stats
router.get("/stats", getCurrentUser, getShortlistStats);

// GET  /shortlists
router.get("/", getCurrentUser, getShortlist);

// POST /shortlists/:university_id
router.post("/:university_id", getCurrentUser, addToShortlist);

// DELETE /shortlists/:university_id
router.delete("/:university_id", getCurrentUser, removeFromShortlist);

module.exports = router;
