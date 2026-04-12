// Replaces Pydantic UserProfile and UserProfileUpdate models
// Validation is done manually since Express has no built-in Pydantic equivalent

const validateUserProfile = (data) => {
  const errors = [];

  if (!data.user_id) errors.push("user_id is required");
  if (!data.name) errors.push("name is required");
  if (!data.email || !data.email.includes("@")) errors.push("Valid email is required");
  if (!data.phone || data.phone.length < 10) errors.push("Valid phone number is required");

  const neetScore = data.neet_score ?? 0;
  if (neetScore < 0 || neetScore > 720)
    errors.push("NEET score must be between 0 and 720");

  return errors;
};

const validateUserProfileUpdate = (data) => {
  const errors = [];

  if (data.email !== undefined && data.email !== null) {
    if (!data.email.includes("@")) errors.push("Valid email is required");
  }

  if (data.phone !== undefined && data.phone !== null) {
    if (data.phone.length < 10) errors.push("Valid phone number is required");
  }

  if (data.neet_score !== undefined && data.neet_score !== null) {
    if (data.neet_score < 0 || data.neet_score > 720)
      errors.push("NEET score must be between 0 and 720");
  }

  return errors;
};

// Fields that cannot be updated via the update profile endpoint
const RESTRICTED_FIELDS = [
  "user_id",
  "phone_verified",
  "email_verified",
  "role",
  "referral_code",
  "created_at",
];

// Allowed fields for partial profile update
const UPDATABLE_FIELDS = [
  "name",
  "email",
  "phone",
  "icon",
  "preferred_intake",
  "neet_score",
  "category",
  "preferred_country",
  "shortlisted_universities",
  "applied_universities",
];

module.exports = {
  validateUserProfile,
  validateUserProfileUpdate,
  RESTRICTED_FIELDS,
  UPDATABLE_FIELDS,
};
