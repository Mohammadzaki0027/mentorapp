// Replaces Pydantic Form model
// Used wherever form submissions (application, feedback, etc.) are needed

const validateForm = (data) => {
  const errors = [];
  if (!data.user_id) errors.push("user_id is required");
  if (!data.form_type) errors.push("form_type is required");
  if (!data.data || typeof data.data !== "object") errors.push("data must be an object");
  return errors;
};

module.exports = { validateForm };
