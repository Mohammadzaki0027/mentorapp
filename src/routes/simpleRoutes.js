const express = require("express");
const router = express.Router();

const { getCurrentUser } = require("../middleware/authMiddleware");
const {
  simpleReferFriend,
  simpleApplyToBeMentor,
  simpleTalkToMentor,
  getMySimpleReferrals,
  getMySimpleConversations,
  getAvailableMentors,
} = require("../controllers/simpleController");

// Public routes
router.post("/apply-to-be-mentor", simpleApplyToBeMentor);
router.get("/available-mentors",   getAvailableMentors);

// Protected routes
router.post("/refer-friend",       getCurrentUser, simpleReferFriend);
router.post("/talk-to-mentor",     getCurrentUser, simpleTalkToMentor);
router.get("/my-referrals",        getCurrentUser, getMySimpleReferrals);
router.get("/my-conversations",    getCurrentUser, getMySimpleConversations);

module.exports = router;