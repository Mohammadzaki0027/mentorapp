const validateSimpleReferralRequest = (data) => {
  const errors = [];

  if (!data.friend_name || typeof data.friend_name !== "string") {
    errors.push("friend_name is required and must be a string");
  }
  if (!data.friend_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.friend_email)) {
    errors.push("friend_email must be a valid email address");
  }
  if (!data.friend_phone || typeof data.friend_phone !== "string") {
    errors.push("friend_phone is required and must be a string");
  }

  return errors;
};

const validateMentorApplicationRequest = (data) => {
  const errors = [];

  if (!data.full_name || typeof data.full_name !== "string") {
    errors.push("full_name is required and must be a string");
  }
  if (!data.mobile || typeof data.mobile !== "string") {
    errors.push("mobile is required and must be a string");
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("email must be a valid email address");
  }

  return errors;
};

const validateTalkToMentorRequest = (data) => {
  const errors = [];

  if (!data.subject || typeof data.subject !== "string") {
    errors.push("subject is required and must be a string");
  }
  if (!data.message || typeof data.message !== "string") {
    errors.push("message is required and must be a string");
  }

  return errors;
};

module.exports = {
  validateSimpleReferralRequest,
  validateMentorApplicationRequest,
  validateTalkToMentorRequest,
};