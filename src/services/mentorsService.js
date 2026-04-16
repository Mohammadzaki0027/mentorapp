const { v4: uuidv4 } = require("uuid");
const { getSupabase } = require("../config/database");
const {
  MessageType,
  MessageStatus,
  ConversationStatus,
  MentorAvailability,
  validateConversationRequest,
  validateMessageRequest,
  validateMentorRatingRequest,
  validateMentorApplicationUpdate,
} = require("../model/mentorModel");

const getCurrentTimestamp = () =>
  new Date().toISOString().replace("T", " ").split(".")[0];

// ─── Search Mentors ───────────────────────────────────────────────────────────

const searchMentorsService = async ({ specialization, availability, min_rating, max_response_time, language, search_query, limit = 20 }) => {
  const supabase = getSupabase();

  let query = supabase.from("mentors").select("*").eq("is_active", true);

  if (specialization) query = query.contains("specializations", [specialization]);
  if (availability) query = query.eq("availability", availability);
  if (min_rating) query = query.gte("rating", min_rating);
  if (max_response_time) query = query.lte("response_time_minutes", max_response_time);
  if (language) query = query.contains("languages", [language]);
  if (search_query) query = query.or(`name.ilike.%${search_query}%,bio.ilike.%${search_query}%`);

  const { data, error } = await query.order("rating", { ascending: false }).limit(limit);

  if (error) {
    const err = new Error(`Failed to search mentors: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  return data || [];
};

// ─── Get Mentor Profile ───────────────────────────────────────────────────────

const getMentorProfileService = async (mentorId) => {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("mentors")
    .select("*")
    .eq("mentor_id", mentorId)
    .eq("is_active", true);

  if (error || !data || data.length === 0) {
    const err = new Error("Mentor not found");
    err.statusCode = 404;
    throw err;
  }

  return data[0];
};

// ─── Start Conversation ───────────────────────────────────────────────────────

const startConversationService = async (userId, body) => {
  const supabase = getSupabase();

  const validationErrors = validateConversationRequest(body);
  if (validationErrors.length > 0) {
    const err = new Error(validationErrors.join(", "));
    err.statusCode = 422;
    throw err;
  }

  // Check mentor exists and is active
  const { data: mentorData, error: mentorError } = await supabase
    .from("mentors")
    .select("*")
    .eq("mentor_id", body.mentor_id)
    .eq("is_active", true);

  if (mentorError || !mentorData || mentorData.length === 0) {
    const err = new Error("Mentor not found");
    err.statusCode = 404;
    throw err;
  }

  const mentor = mentorData[0];

  if (mentor.availability === MentorAvailability.OFFLINE) {
    const err = new Error("Mentor is currently offline");
    err.statusCode = 400;
    throw err;
  }

  // Check for existing active conversation
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("mentor_id", body.mentor_id)
    .eq("status", ConversationStatus.ACTIVE);

  if (existing && existing.length > 0) {
    return _buildConversationResponse(existing[0], mentor);
  }

  // Create new conversation
  const conversationId = uuidv4();
  const conversationData = {
    conversation_id: conversationId,
    user_id: userId,
    mentor_id: body.mentor_id,
    subject: body.subject,
    status: ConversationStatus.ACTIVE,
    priority: body.priority || "normal",
    category: body.category || null,
    unread_count: 0,
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp(),
  };

  const { data: convResult, error: convError } = await supabase
    .from("conversations")
    .insert(conversationData)
    .select();

  if (convError || !convResult || convResult.length === 0) {
    const err = new Error("Failed to create conversation");
    err.statusCode = 500;
    throw err;
  }

  // Send initial message
  await supabase.from("messages").insert({
    message_id: uuidv4(),
    conversation_id: conversationId,
    sender_id: userId,
    sender_type: "user",
    message_type: MessageType.TEXT,
    content: body.message,
    status: MessageStatus.SENT,
    created_at: getCurrentTimestamp(),
  });

  // Fetch conversation with mentor details
  const { data: fullConv } = await supabase
    .from("conversations")
    .select("*, mentors(name, profile_image)")
    .eq("conversation_id", conversationId);

  return _buildConversationResponse(fullConv[0], fullConv[0].mentors);
};

// ─── Get My Conversations ─────────────────────────────────────────────────────

const getMyConversationsService = async (userId, statusFilter) => {
  const supabase = getSupabase();

  let query = supabase
    .from("conversations")
    .select("*, mentors(name, profile_image)")
    .eq("user_id", userId);

  if (statusFilter) query = query.eq("status", statusFilter);

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) {
    const err = new Error(`Failed to fetch conversations: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  const conversations = [];

  for (const conv of data || []) {
    const { data: lastMsgData } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.conversation_id)
      .order("created_at", { ascending: false })
      .limit(1);

    const lastMessage = lastMsgData && lastMsgData.length > 0 ? lastMsgData[0] : null;
    conversations.push(_buildConversationResponse(conv, conv.mentors, lastMessage));
  }

  return conversations;
};

// ─── Get Conversation Messages ────────────────────────────────────────────────

const getConversationMessagesService = async (userId, conversationId, limit, offset) => {
  const supabase = getSupabase();

  const { data: convData, error: convError } = await supabase
    .from("conversations")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (convError || !convData || convData.length === 0) {
    const err = new Error("Conversation not found");
    err.statusCode = 404;
    throw err;
  }

  const { data: messages, error: msgError } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (msgError) {
    const err = new Error(`Failed to fetch messages: ${msgError.message}`);
    err.statusCode = 500;
    throw err;
  }

  // Mark mentor messages as read
  await supabase
    .from("messages")
    .update({ status: MessageStatus.READ, read_at: getCurrentTimestamp() })
    .eq("conversation_id", conversationId)
    .eq("sender_type", "mentor")
    .eq("status", MessageStatus.DELIVERED);

  // Reset unread count
  await supabase
    .from("conversations")
    .update({ unread_count: 0, updated_at: getCurrentTimestamp() })
    .eq("conversation_id", conversationId);

  return [...(messages || [])].reverse();
};

// ─── Send Message ─────────────────────────────────────────────────────────────

const sendMessageService = async (userId, conversationId, body) => {
  const supabase = getSupabase();

  const validationErrors = validateMessageRequest(body);
  if (validationErrors.length > 0) {
    const err = new Error(validationErrors.join(", "));
    err.statusCode = 422;
    throw err;
  }

  const { data: convData, error: convError } = await supabase
    .from("conversations")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (convError || !convData || convData.length === 0) {
    const err = new Error("Conversation not found");
    err.statusCode = 404;
    throw err;
  }

  if (convData[0].status !== ConversationStatus.ACTIVE) {
    const err = new Error("Conversation is not active");
    err.statusCode = 400;
    throw err;
  }

  const messageData = {
    message_id: uuidv4(),
    conversation_id: conversationId,
    sender_id: userId,
    sender_type: "user",
    message_type: body.message_type || MessageType.TEXT,
    content: body.content,
    attachments: body.attachments || null,
    status: MessageStatus.SENT,
    created_at: getCurrentTimestamp(),
  };

  const { data: result, error: insertError } = await supabase
    .from("messages")
    .insert(messageData)
    .select();

  if (insertError || !result || result.length === 0) {
    const err = new Error("Failed to send message");
    err.statusCode = 500;
    throw err;
  }

  await supabase
    .from("conversations")
    .update({ updated_at: getCurrentTimestamp() })
    .eq("conversation_id", conversationId);

  return result[0];
};

// ─── Book Session ─────────────────────────────────────────────────────────────

const bookMentorSessionService = async (userId, body) => {
  const supabase = getSupabase();

  const { data: mentorData, error: mentorError } = await supabase
    .from("mentors")
    .select("*")
    .eq("mentor_id", body.mentor_id)
    .eq("is_active", true);

  if (mentorError || !mentorData || mentorData.length === 0) {
    const err = new Error("Mentor not found");
    err.statusCode = 404;
    throw err;
  }

  if (mentorData[0].availability === MentorAvailability.OFFLINE) {
    const err = new Error("Mentor is currently offline");
    err.statusCode = 400;
    throw err;
  }

  const scheduledAt = body.scheduled_at
    ? new Date(body.scheduled_at)
    : new Date(Date.now() + 60 * 60 * 1000); // default: 1 hour from now

  const sessionData = {
    session_id: uuidv4(),
    user_id: userId,
    mentor_id: body.mentor_id,
    session_type: body.session_type || "consultation",
    duration_minutes: body.duration_minutes || 30,
    scheduled_at: scheduledAt.toISOString(),
    status: "scheduled",
    notes: body.notes || null,
    created_at: getCurrentTimestamp(),
  };

  const { data: result, error: insertError } = await supabase
    .from("mentor_sessions")
    .insert(sessionData)
    .select();

  if (insertError || !result || result.length === 0) {
    const err = new Error("Failed to book session");
    err.statusCode = 500;
    throw err;
  }

  return result[0];
};

// ─── Get My Sessions ──────────────────────────────────────────────────────────

const getMySessionsService = async (userId, statusFilter) => {
  const supabase = getSupabase();

  let query = supabase
    .from("mentor_sessions")
    .select("*")
    .eq("user_id", userId);

  if (statusFilter) query = query.eq("status", statusFilter);

  const { data, error } = await query.order("scheduled_at", { ascending: false });

  if (error) {
    const err = new Error(`Failed to fetch sessions: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  return data || [];
};

// ─── Rate Mentor ──────────────────────────────────────────────────────────────

const rateMentorService = async (userId, mentorId, body) => {
  const supabase = getSupabase();

  const validationErrors = validateMentorRatingRequest(body);
  if (validationErrors.length > 0) {
    const err = new Error(validationErrors.join(", "));
    err.statusCode = 422;
    throw err;
  }

  const { data: mentorData } = await supabase
    .from("mentors")
    .select("*")
    .eq("mentor_id", mentorId);

  if (!mentorData || mentorData.length === 0) {
    const err = new Error("Mentor not found");
    err.statusCode = 404;
    throw err;
  }

  if (body.session_id) {
    const { data: sessionData } = await supabase
      .from("mentor_sessions")
      .select("*")
      .eq("session_id", body.session_id)
      .eq("user_id", userId)
      .eq("mentor_id", mentorId);

    if (!sessionData || sessionData.length === 0) {
      const err = new Error("Session not found");
      err.statusCode = 404;
      throw err;
    }
  }

  const { data: existingRating } = await supabase
    .from("mentor_ratings")
    .select("*")
    .eq("user_id", userId)
    .eq("mentor_id", mentorId);

  if (existingRating && existingRating.length > 0) {
    const err = new Error("You have already rated this mentor");
    err.statusCode = 400;
    throw err;
  }

  const ratingId = uuidv4();
  const { data: ratingResult, error: ratingError } = await supabase
    .from("mentor_ratings")
    .insert({
      rating_id: ratingId,
      user_id: userId,
      mentor_id: mentorId,
      session_id: body.session_id || null,
      rating: body.rating,
      feedback: body.feedback || null,
      categories: body.categories || null,
      created_at: getCurrentTimestamp(),
    })
    .select();

  if (ratingError || !ratingResult || ratingResult.length === 0) {
    const err = new Error("Failed to submit rating");
    err.statusCode = 500;
    throw err;
  }

  // Recalculate average rating
  const { data: allRatings } = await supabase
    .from("mentor_ratings")
    .select("rating")
    .eq("mentor_id", mentorId);

  const ratings = (allRatings || []).map((r) => r.rating);
  const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

  await supabase
    .from("mentors")
    .update({
      rating: Math.round(averageRating * 100) / 100,
      total_sessions: ratings.length,
      updated_at: getCurrentTimestamp(),
    })
    .eq("mentor_id", mentorId);

  return {
    message: "Rating submitted successfully",
    rating_id: ratingId,
    average_rating: Math.round(averageRating * 100) / 100,
  };
};

// ─── Close Conversation ───────────────────────────────────────────────────────

const closeConversationService = async (userId, conversationId) => {
  const supabase = getSupabase();

  const { data: convData } = await supabase
    .from("conversations")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (!convData || convData.length === 0) {
    const err = new Error("Conversation not found");
    err.statusCode = 404;
    throw err;
  }

  const { data: result, error } = await supabase
    .from("conversations")
    .update({ status: ConversationStatus.CLOSED, updated_at: getCurrentTimestamp() })
    .eq("conversation_id", conversationId)
    .select();

  if (error || !result || result.length === 0) {
    const err = new Error("Failed to close conversation");
    err.statusCode = 500;
    throw err;
  }

  return { message: "Conversation closed successfully" };
};

// ─── Admin: Create Mentor ─────────────────────────────────────────────────────

const createMentorService = async (body) => {
  const supabase = getSupabase();

  const mentorId = uuidv4();
  const now = getCurrentTimestamp();

  const { data, error } = await supabase
    .from("mentors")
    .insert({ ...body, mentor_id: mentorId, created_at: now, updated_at: now })
    .select();

  if (error || !data || data.length === 0) {
    const err = new Error("Failed to create mentor");
    err.statusCode = 500;
    throw err;
  }

  return data[0];
};

// ─── Admin: Get All Mentors ───────────────────────────────────────────────────

const getAllMentorsService = async () => {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("mentors")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    const err = new Error(`Failed to fetch mentors: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  return data || [];
};

// ─── Admin: Get Mentor Applications ──────────────────────────────────────────

const getMentorApplicationsService = async ({ statusFilter, limit, offset }) => {
  const supabase = getSupabase();

  let query = supabase.from("mentor_applications").select("*");
  if (statusFilter) query = query.eq("status", statusFilter);

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    const err = new Error(`Failed to fetch mentor applications: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  return data || [];
};

// ─── Admin: Get Single Mentor Application ─────────────────────────────────────

const getMentorApplicationService = async (applicationId) => {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("mentor_applications")
    .select("*")
    .eq("application_id", applicationId);

  if (error || !data || data.length === 0) {
    const err = new Error("Mentor application not found");
    err.statusCode = 404;
    throw err;
  }

  return data[0];
};

// ─── Admin: Update Mentor Application ────────────────────────────────────────

const updateMentorApplicationService = async (applicationId, adminUserId, body) => {
  const supabase = getSupabase();

  const validationErrors = validateMentorApplicationUpdate(body);
  if (validationErrors.length > 0) {
    const err = new Error(validationErrors.join(", "));
    err.statusCode = 422;
    throw err;
  }

  const { data: existing } = await supabase
    .from("mentor_applications")
    .select("*")
    .eq("application_id", applicationId);

  if (!existing || existing.length === 0) {
    const err = new Error("Mentor application not found");
    err.statusCode = 404;
    throw err;
  }

  const { data, error } = await supabase
    .from("mentor_applications")
    .update({
      status: body.status,
      admin_notes: body.admin_notes || null,
      reviewed_by: adminUserId,
      reviewed_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp(),
    })
    .eq("application_id", applicationId)
    .select();

  if (error || !data || data.length === 0) {
    const err = new Error("Failed to update mentor application");
    err.statusCode = 500;
    throw err;
  }

  return data[0];
};

// ─── Admin: Approve Mentor Application ───────────────────────────────────────

const approveMentorApplicationService = async (applicationId, adminUserId) => {
  const supabase = getSupabase();

  const { data: appData } = await supabase
    .from("mentor_applications")
    .select("*")
    .eq("application_id", applicationId);

  if (!appData || appData.length === 0) {
    const err = new Error("Mentor application not found");
    err.statusCode = 404;
    throw err;
  }

  const app = appData[0];

  if (app.status !== "pending" && app.status !== "under_review") {
    const err = new Error("Application is not in a state that can be approved");
    err.statusCode = 400;
    throw err;
  }

  const { data: existingMentor } = await supabase
    .from("mentors")
    .select("*")
    .eq("email", app.email);

  if (existingMentor && existingMentor.length > 0) {
    const err = new Error("A mentor with this email already exists");
    err.statusCode = 400;
    throw err;
  }

  const mentorId = uuidv4();
  const now = getCurrentTimestamp();

  const { data: mentorResult, error: mentorError } = await supabase
    .from("mentors")
    .insert({
      mentor_id: mentorId,
      name: app.full_name,
      email: app.email,
      phone: app.mobile,
      profile_image: null,
      bio: "Mentor profile created from application",
      specializations: ["general_guidance"],
      experience_years: 0,
      education: "To be updated",
      languages: ["English"],
      availability: "available",
      rating: 0.0,
      total_sessions: 0,
      response_time_minutes: 60,
      is_verified: false,
      is_active: true,
      created_at: now,
      updated_at: now,
    })
    .select();

  if (mentorError || !mentorResult || mentorResult.length === 0) {
    const err = new Error("Failed to create mentor profile");
    err.statusCode = 500;
    throw err;
  }

  await supabase
    .from("mentor_applications")
    .update({
      status: "approved",
      admin_notes: `Approved and mentor profile created. Mentor ID: ${mentorId}`,
      reviewed_by: adminUserId,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("application_id", applicationId);

  return {
    success: true,
    message: "Mentor application approved and profile created successfully",
    mentor_id: mentorId,
    application_id: applicationId,
  };
};

// ─── Admin: Delete Mentor Application ────────────────────────────────────────

const deleteMentorApplicationService = async (applicationId) => {
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("mentor_applications")
    .select("*")
    .eq("application_id", applicationId);

  if (!existing || existing.length === 0) {
    const err = new Error("Mentor application not found");
    err.statusCode = 404;
    throw err;
  }

  const { data, error } = await supabase
    .from("mentor_applications")
    .delete()
    .eq("application_id", applicationId)
    .select();

  if (error || !data || data.length === 0) {
    const err = new Error("Failed to delete mentor application");
    err.statusCode = 500;
    throw err;
  }

  return { success: true, message: "Mentor application deleted successfully" };
};

// ─── Internal Helper ──────────────────────────────────────────────────────────

const _buildConversationResponse = (conv, mentor, lastMessage = null) => ({
  conversation_id: conv.conversation_id,
  user_id: conv.user_id,
  mentor_id: conv.mentor_id,
  mentor_name: mentor?.name || "Unknown",
  mentor_profile_image: mentor?.profile_image || null,
  subject: conv.subject,
  status: conv.status,
  priority: conv.priority,
  category: conv.category || null,
  last_message: lastMessage,
  unread_count: conv.unread_count || 0,
  created_at: conv.created_at,
  updated_at: conv.updated_at,
});

module.exports = {
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
};
