const { getSupabase } = require("../config/database");

const getTestimonialsService = async () => {
  const supabase = getSupabase();

  const { data, error } = await supabase.from("testimonials").select("*");

  if (error) {
    const err = new Error(`Failed to fetch testimonials: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  return data || [];
};

module.exports = { getTestimonialsService };
