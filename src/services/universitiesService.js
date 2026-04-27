const { getSupabase } = require("../config/database");

// ─── List Universities ────────────────────────────────────────────────────────

const listUniversitiesService = async ({ country_id, top }) => {
  const supabase = getSupabase();

  let query = supabase.from("universities").select("*");

  if (country_id) {
    query = query.eq("country_id", country_id);
  }

  if (top !== undefined) {
    query = query.eq("top", top);
  }

  const { data, error } = await query;

  if (error) {
    const err = new Error(`Failed to fetch universities: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  return data || [];
};

module.exports = { listUniversitiesService };
