// Replaces Pydantic PromoCode model

const validatePromoCode = (data) => {
  const errors = [];
  if (!data.code) errors.push("code is required");
  if (!data.resource_id) errors.push("resource_id is required");
  if (data.expiration_date && isNaN(new Date(data.expiration_date).getTime())) {
    errors.push("expiration_date must be a valid date");
  }
  return errors;
};

module.exports = { validatePromoCode };
