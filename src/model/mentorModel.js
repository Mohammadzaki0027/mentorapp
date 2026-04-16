// Replaces Pydantic mentor models and enums

const MessageType = {
  TEXT: "text",
  IMAGE: "image",
  FILE: "file",
  VOICE: "voice",
  VIDEO: "video",
};

const MessageStatus = {
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
  FAILED: "failed",
};

const ConversationStatus = {
  ACTIVE: "active",
  CLOSED: "closed",
  ARCHIVED: "archived",
  PENDING: "pending",
};

const MentorAvailability = {
  AVAILABLE: "available",
  BUSY: "busy",
  OFFLINE: "offline",
  AWAY: "away",
};

const MentorSpecialization = {
  MBBS_ADMISSION: "mbbs_admission",
  COUNTRY_SPECIFIC: "country_specific",
  UNIVERSITY_SELECTION: "university_selection",
  APPLICATION_PROCESS: "application_process",
  DOCUMENTATION: "documentation",
  INTERVIEW_PREPARATION: "interview_preparation",
  VISA_PROCESS: "visa_process",
  GENERAL_GUIDANCE: "general_guidance",
};

const VALID_MESSAGE_TYPES = Object.values(MessageType);
const VALID_MESSAGE_STATUSES = Object.values(MessageStatus);
const VALID_CONVERSATION_STATUSES = Object.values(ConversationStatus);
const VALID_AVAILABILITIES = Object.values(MentorAvailability);
const VALID_SPECIALIZATIONS = Object.values(MentorSpecialization);

// ─── Validators ───────────────────────────────────────────────────────────────

const validateConversationRequest = (data) => {
  const errors = [];
  if (!data.mentor_id) errors.push("mentor_id is required");
  if (!data.subject) errors.push("subject is required");
  if (!data.message) errors.push("message is required");
  return errors;
};

const validateMessageRequest = (data) => {
  const errors = [];
  if (!data.content) errors.push("content is required");
  if (data.message_type && !VALID_MESSAGE_TYPES.includes(data.message_type)) {
    errors.push(`message_type must be one of: ${VALID_MESSAGE_TYPES.join(", ")}`);
  }
  return errors;
};

const validateMentorRatingRequest = (data) => {
  const errors = [];
  if (!data.rating) errors.push("rating is required");
  if (data.rating < 1 || data.rating > 5) errors.push("rating must be between 1 and 5");
  return errors;
};

const validateMentorApplicationUpdate = (data) => {
  const errors = [];
  const validStatuses = ["pending", "under_review", "approved", "rejected"];
  if (!data.status) errors.push("status is required");
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push(`status must be one of: ${validStatuses.join(", ")}`);
  }
  return errors;
};

module.exports = {
  MessageType,
  MessageStatus,
  ConversationStatus,
  MentorAvailability,
  MentorSpecialization,
  VALID_MESSAGE_TYPES,
  VALID_CONVERSATION_STATUSES,
  VALID_AVAILABILITIES,
  VALID_SPECIALIZATIONS,
  validateConversationRequest,
  validateMessageRequest,
  validateMentorRatingRequest,
  validateMentorApplicationUpdate,
};
