const { getSupabase } = require("../config/database");

// ─── List Countries ───────────────────────────────────────────────────────────

const listCountriesService = async () => {
  const supabase = getSupabase();

  const { data, error } = await supabase.from("countries").select("*");

  if (error) {
    const err = new Error(`Failed to fetch countries: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  return data || [];
};

// ─── Get Country by ID ────────────────────────────────────────────────────────

const getCountryService = async (countryId) => {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("countries")
    .select("*")
    .eq("id", countryId);

  if (error || !data || data.length === 0) {
    const err = new Error("Country not found");
    err.statusCode = 404;
    throw err;
  }

  return data[0];
};

// ─── Get Country Names ────────────────────────────────────────────────────────

const getCountryNamesService = async () => {
  const supabase = getSupabase();

  const { data, error } = await supabase.from("countries").select("name");

  if (error) {
    const err = new Error(`Failed to fetch country names: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  return (data || []).map((c) => c.name);
};

module.exports = {
  listCountriesService,
  getCountryService,
  getCountryNamesService,
};
