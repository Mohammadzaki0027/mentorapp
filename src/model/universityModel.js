// Replaces Pydantic University model

const validateUniversity = (data) => {
  const errors = [];

  if (!data.country_id) errors.push("country_id is required");
  if (!data.country) errors.push("country is required");
  if (!data.name) errors.push("name is required");
  if (!data.city) errors.push("city is required");

  return errors;
};

module.exports = { validateUniversity };
