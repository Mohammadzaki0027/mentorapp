// Replaces Pydantic AdminRole, AdminCreate, AdminUpdate models

const validateAdminCreate = (data) => {
  const errors = [];
  if (!data.email || !data.email.includes("@"))
    errors.push("Valid email is required");
  return errors;
};

const validateAdminUpdate = (data) => {
  const errors = [];
  if (data.role !== undefined && typeof data.role !== "string")
    errors.push("role must be a string");
  if (data.name !== undefined && typeof data.name !== "string")
    errors.push("name must be a string");
  return errors;
};

const ADMIN_UPDATE_FIELDS = ["name", "role"];

module.exports = { validateAdminCreate, validateAdminUpdate, ADMIN_UPDATE_FIELDS };
