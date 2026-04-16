const { getSupabase } = require("../config/database");

const getCurrentTimestamp = () => new Date().toISOString();

// ─── Get Shortlist ────────────────────────────────────────────────────────────

const getShortlistService = async (userId) => {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("profiles")
    .select("shortlisted_universities")
    .eq("user_id", userId);

  if (error || !data || data.length === 0) {
    const err = new Error("Profile not found");
    err.statusCode = 404;
    throw err;
  }

  return data[0].shortlisted_universities || [];
};

// ─── Add to Shortlist ─────────────────────────────────────────────────────────

const addToShortlistService = async (userId, universityId) => {
  const supabase = getSupabase();

  // Fetch university
  const { data: uniData, error: uniError } = await supabase
    .from("universities")
    .select("*")
    .eq("id", universityId);

  if (uniError || !uniData || uniData.length === 0) {
    const err = new Error("University not found");
    err.statusCode = 404;
    throw err;
  }

  const universityData = uniData[0];

  // Fetch profile
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("shortlisted_universities")
    .eq("user_id", userId);

  if (profileError || !profileData || profileData.length === 0) {
    const err = new Error("Profile not found");
    err.statusCode = 404;
    throw err;
  }

  const shortlisted = profileData[0].shortlisted_universities || [];

  // Check if already shortlisted
  if (shortlisted.some((u) => u?.id === universityId)) {
    const err = new Error("University already shortlisted");
    err.statusCode = 400;
    throw err;
  }

  // Add timestamp and append
  universityData.added_at = getCurrentTimestamp();
  shortlisted.push(universityData);

  // Update profile
  await supabase
    .from("profiles")
    .update({
      shortlisted_universities: shortlisted,
      updated_at: getCurrentTimestamp(),
    })
    .eq("user_id", userId);

  return {
    message: "University added to shortlist successfully",
    shortlisted_universities: shortlisted,
    total_count: shortlisted.length,
  };
};

// ─── Remove from Shortlist ────────────────────────────────────────────────────

const removeFromShortlistService = async (userId, universityId) => {
  const supabase = getSupabase();

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("shortlisted_universities")
    .eq("user_id", userId);

  if (profileError || !profileData || profileData.length === 0) {
    const err = new Error("Profile not found");
    err.statusCode = 404;
    throw err;
  }

  const shortlisted = profileData[0].shortlisted_universities || [];
  const updated = shortlisted.filter((u) => u?.id !== universityId);

  if (updated.length === shortlisted.length) {
    const err = new Error("University not found in shortlist");
    err.statusCode = 404;
    throw err;
  }

  await supabase
    .from("profiles")
    .update({
      shortlisted_universities: updated,
      updated_at: getCurrentTimestamp(),
    })
    .eq("user_id", userId);

  return {
    message: "University removed from shortlist successfully",
    shortlisted_universities: updated,
    total_count: updated.length,
  };
};

// ─── Get Shortlist Stats ──────────────────────────────────────────────────────

const getShortlistStatsService = async (userId) => {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("profiles")
    .select("shortlisted_universities")
    .eq("user_id", userId);

  if (error || !data || data.length === 0) {
    const err = new Error("Profile not found");
    err.statusCode = 404;
    throw err;
  }

  const shortlisted = data[0].shortlisted_universities || [];
  const totalShortlisted = shortlisted.length;
  const countries = {};
  let totalTuition = 0;
  let tuitionCount = 0;

  for (const item of shortlisted) {
    const country = item.country || "Unknown";
    countries[country] = (countries[country] || 0) + 1;

    if (item.tuition_fee) {
      totalTuition += item.tuition_fee;
      tuitionCount++;
    }
  }

  const topCountries = Object.entries(countries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([country, count]) => ({ country, count }));

  return {
    total_shortlisted: totalShortlisted,
    countries,
    average_tuition: tuitionCount > 0 ? totalTuition / tuitionCount : null,
    top_countries: topCountries,
  };
};

module.exports = {
  getShortlistService,
  addToShortlistService,
  removeFromShortlistService,
  getShortlistStatsService,
};
