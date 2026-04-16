// Replaces Pydantic ShortlistItem, ShortlistResponse, ShortlistStats models

const validateShortlistItem = (data) => {
  const errors = [];
  if (!data.id) errors.push("id is required");
  if (!data.name) errors.push("name is required");
  if (!data.country) errors.push("country is required");
  return errors;
};

module.exports = { validateShortlistItem };
