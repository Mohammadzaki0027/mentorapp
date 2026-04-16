// Replaces Pydantic Application models and ApplicationStatus enum

const ApplicationStatus = {
  SUBMITTED: "submitted",
  PENDING: "pending",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  WAITLISTED: "waitlisted",
  WITHDRAWN: "withdrawn",
};

const VALID_STATUSES = Object.values(ApplicationStatus);

const validateApplicationCreate = (data) => {
  const errors = [];
  if (!data.university_id || data.university_id.trim().length === 0) {
    errors.push("University ID is required");
  }
  return errors;
};

const validateApplicationUpdate = (data) => {
  const errors = [];
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(", ")}`);
  }
  return errors;
};

module.exports = {
  ApplicationStatus,
  VALID_STATUSES,
  validateApplicationCreate,
  validateApplicationUpdate,
};
