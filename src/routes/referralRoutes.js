const express = require("express");
const router = express.Router();

const { getCurrentUser } = require("../middleware/authMiddleware");
const {
  referFriend,
  getMyReferrals,
  getReferralStats,
  updateReferral,
  claimReward,
  getLeaderboard,
  validateCode,
  processRegistration,
} = require("../controllers/referralController");

// Public routes
router.get("/validate-code/:referral_code", validateCode);
router.post("/process-registration", processRegistration);
router.get("/leaderboard", getLeaderboard);

// Protected routes
router.post("/refer-friend", getCurrentUser, referFriend);
router.get("/my-referrals", getCurrentUser, getMyReferrals);
router.get("/stats", getCurrentUser, getReferralStats);
router.put("/:referral_id/update", getCurrentUser, updateReferral);
router.post("/:referral_id/claim-reward", getCurrentUser, claimReward);

module.exports = router;