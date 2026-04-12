const { getSupabase } = require("../config/database");

// ─── List Universities ────────────────────────────────────────────────────────

const listUniversitiesService = async ({ country, top }) => {
  const supabase = getSupabase();

  let query = supabase.from("universities").select("*");

  // Filter by country name if provided
  if (country) {
    const { data: countryData, error: countryError } = await supabase
      .from("countries")
      .select("id")
      .eq("name", country);

    if (countryError || !countryData || countryData.length === 0) {
      const err = new Error("Country not found");
      err.statusCode = 404;
      throw err;
    }

    const countryId = countryData[0].id;
    query = query.eq("country_id", countryId);
  }

  // Filter by top flag if provided
  if (top !== undefined && top !== null) {
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
