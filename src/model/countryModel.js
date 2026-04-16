// Replaces Pydantic Country model

const validateCountry = (data) => {
  const errors = [];

  if (!data.name) errors.push("name is required");
  if (!data.icon) errors.push("icon is required");
  if (!data.bachelors_tuition_fee) errors.push("bachelors_tuition_fee is required");
  if (!data.masters_tuition_fee) errors.push("masters_tuition_fee is required");
  if (!data.tuition_fee) errors.push("tuition_fee is required");
  if (!data.living_expenses) errors.push("living_expenses is required");
  if (!data.post_study_work_permit) errors.push("post_study_work_permit is required");
  if (!data.course_duration) errors.push("course_duration is required");

  if (!Array.isArray(data.admission_intake))
    errors.push("admission_intake must be an array");
  if (!Array.isArray(data.top_cities))
    errors.push("top_cities must be an array");
  if (!Array.isArray(data.top_universities))
    errors.push("top_universities must be an array");
  if (!Array.isArray(data.recognition))
    errors.push("recognition must be an array");
  if (!Array.isArray(data.why_study))
    errors.push("why_study must be an array");

  return errors;
};

module.exports = { validateCountry };
