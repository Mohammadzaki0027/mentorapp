const express = require("express");
const router = express.Router();

const { getCurrentUser, getCurrentAdmin } = require("../middleware/authMiddleware");
const {
  searchMentors,
  getMentorProfile,
  startConversation,
  getMyConversations,
  getConversationMessages,
  sendMessage,
  bookMentorSession,
  getMySessions,
  rateMentor,
  closeConversation,
  createMentor,
  getAllMentors,
  getMentorApplications,
  getMentorApplication,
  updateMentorApplication,
  approveMentorApplication,
  deleteMentorApplication,
} = require("../controllers/mentorsController");

const adminAuth = [getCurrentUser, getCurrentAdmin];

// ─── IMPORTANT: Static routes must come BEFORE parameterized /:mentor_id ─────

// GET  /mentors/search
router.get("/search", searchMentors);

// GET  /mentors/conversations          (user's conversations)
router.get("/conversations", getCurrentUser, getMyConversations);

// POST /mentors/conversations/start
router.post("/conversations/start", getCurrentUser, startConversation);

// GET  /mentors/sessions/my-sessions
router.get("/sessions/my-sessions", getCurrentUser, getMySessions);

// POST /mentors/sessions/book
router.post("/sessions/book", getCurrentUser, bookMentorSession);

// ─── Admin routes (static, before /:mentor_id) ────────────────────────────────

// GET  /mentors/admin/mentors
router.get("/admin/mentors", ...adminAuth, getAllMentors);

// POST /mentors/admin/mentors
router.post("/admin/mentors", ...adminAuth, createMentor);

// GET  /mentors/admin/applications
router.get("/admin/applications", ...adminAuth, getMentorApplications);

// GET  /mentors/admin/applications/:application_id
router.get("/admin/applications/:application_id", ...adminAuth, getMentorApplication);

// PUT  /mentors/admin/applications/:application_id
router.put("/admin/applications/:application_id", ...adminAuth, updateMentorApplication);

// POST /mentors/admin/applications/:application_id/approve
router.post("/admin/applications/:application_id/approve", ...adminAuth, approveMentorApplication);

// DELETE /mentors/admin/applications/:application_id
router.delete("/admin/applications/:application_id", ...adminAuth, deleteMentorApplication);

// ─── Conversation sub-routes (before /:mentor_id) ────────────────────────────

// GET  /mentors/conversations/:conversation_id/messages
router.get("/conversations/:conversation_id/messages", getCurrentUser, getConversationMessages);

// POST /mentors/conversations/:conversation_id/messages
router.post("/conversations/:conversation_id/messages", getCurrentUser, sendMessage);

// PUT  /mentors/conversations/:conversation_id/close
router.put("/conversations/:conversation_id/close", getCurrentUser, closeConversation);

// ─── Parameterized routes LAST ────────────────────────────────────────────────

// POST /mentors/:mentor_id/rate
router.post("/:mentor_id/rate", getCurrentUser, rateMentor);

// GET  /mentors/:mentor_id
router.get("/:mentor_id", getMentorProfile);

module.exports = router;
