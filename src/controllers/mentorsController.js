const {
  searchMentorsService,
  getMentorProfileService,
  startConversationService,
  getMyConversationsService,
  getConversationMessagesService,
  sendMessageService,
  bookMentorSessionService,
  getMySessionsService,
  rateMentorService,
  closeConversationService,
  createMentorService,
  getAllMentorsService,
  getMentorApplicationsService,
  getMentorApplicationService,
  updateMentorApplicationService,
  approveMentorApplicationService,
  deleteMentorApplicationService,
} = require("../services/mentorsService");

const searchMentors = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const data = await searchMentorsService({ ...req.query, limit });
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const getMentorProfile = async (req, res) => {
  try {
    const data = await getMentorProfileService(req.params.mentor_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const startConversation = async (req, res) => {
  try {
    const data = await startConversationService(req.user.user_id, req.body);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const getMyConversations = async (req, res) => {
  try {
    const data = await getMyConversationsService(req.user.user_id, req.query.status_filter);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const getConversationMessages = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);
    const data = await getConversationMessagesService(req.user.user_id, req.params.conversation_id, limit, offset);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const data = await sendMessageService(req.user.user_id, req.params.conversation_id, req.body);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const bookMentorSession = async (req, res) => {
  try {
    const data = await bookMentorSessionService(req.user.user_id, req.body);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const getMySessions = async (req, res) => {
  try {
    const data = await getMySessionsService(req.user.user_id, req.query.status_filter);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const rateMentor = async (req, res) => {
  try {
    const data = await rateMentorService(req.user.user_id, req.params.mentor_id, req.body);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const closeConversation = async (req, res) => {
  try {
    const data = await closeConversationService(req.user.user_id, req.params.conversation_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const createMentor = async (req, res) => {
  try {
    const data = await createMentorService(req.body);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const getAllMentors = async (req, res) => {
  try {
    const data = await getAllMentorsService();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const getMentorApplications = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);
    const data = await getMentorApplicationsService({ statusFilter: req.query.status_filter, limit, offset });
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const getMentorApplication = async (req, res) => {
  try {
    const data = await getMentorApplicationService(req.params.application_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const updateMentorApplication = async (req, res) => {
  try {
    const data = await updateMentorApplicationService(req.params.application_id, req.user.user_id, req.body);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const approveMentorApplication = async (req, res) => {
  try {
    const data = await approveMentorApplicationService(req.params.application_id, req.user.user_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

const deleteMentorApplication = async (req, res) => {
  try {
    const data = await deleteMentorApplicationService(req.params.application_id);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(e.statusCode || 500).json({ detail: e.message });
  }
};

module.exports = {
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
};
