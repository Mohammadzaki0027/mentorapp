const express = require("express");
const router = express.Router();

const { getCurrentUser, getCurrentAdmin } = require("../middleware/authMiddleware");
const {
  getProfile,
  updateProfile,
  patchProfile,
  getVerificationStatus,
  getProfileStats,
  deleteProfile,
  softDeleteProfile,
  adminDeleteUser,
} = require("../controllers/usersController");

// NOTE: Specific routes must be defined BEFORE parameterized routes
// to avoid Express matching "/verification-status" as a param

// ─── Protected Routes (require auth) ─────────────────────────────────────────

// GET  /users/profile/verification-status
router.get("/profile/verification-status", getCurrentUser, getVerificationStatus);

// GET  /users/profile/stats
router.get("/profile/stats", getCurrentUser, getProfileStats);

// GET  /users/profile
router.get("/profile", getCurrentUser, getProfile);

// PUT  /users/profile
router.put("/profile", getCurrentUser, updateProfile);

// PATCH /users/profile
router.patch("/profile", getCurrentUser, patchProfile);

// DELETE /users/profile/soft
router.delete("/profile/soft", getCurrentUser, softDeleteProfile);

// DELETE /users/profile
router.delete("/profile", getCurrentUser, deleteProfile);

// ─── Admin Routes ─────────────────────────────────────────────────────────────

// DELETE /users/admin/:user_id
router.delete("/admin/:user_id", getCurrentUser, getCurrentAdmin, adminDeleteUser);

module.exports = router;
