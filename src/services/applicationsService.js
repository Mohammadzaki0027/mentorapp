const { v4: uuidv4 } = require("uuid");
const { getSupabase } = require("../config/database");
const {
  ApplicationStatus,
  validateApplicationCreate,
  validateApplicationUpdate,
} = require("../model/applicationModel");

const getCurrentTimestamp = () => new Date().toISOString();

// ─── Get All Applications ─────────────────────────────────────────────────────

const getApplicationsService = async (userId) => {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("applications")
    .select(`*, universities!inner(name, country, city)`)
    .eq("user_id", userId)
    .order("submission_date", { ascending: false });

  if (error) {
    const err = new Error(`Failed to fetch applications: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  if (!data || data.length === 0) return [];

  return data.map((app) => {
    const university = app.universities || {};
    return {
      id: app.id,
      user_id: app.user_id,
      university_id: app.university_id,
      university_name: university.name || "Unknown",
      university_country: university.country || "Unknown",
      university_city: university.city || null,
      status: app.status,
      submission_date: app.submission_date,
      review_date: app.review_date || null,
      decision_date: app.decision_date || null,
      created_at: app.created_at,
      updated_at: app.updated_at,
    };
  });
};

// ─── Submit Application ───────────────────────────────────────────────────────

const submitApplicationService = async (userId, body) => {
  const supabase = getSupabase();

  // Validate
  const validationErrors = validateApplicationCreate(body);
  if (validationErrors.length > 0) {
    const err = new Error(validationErrors.join(", "));
    err.statusCode = 422;
    throw err;
  }

  const universityId = body.university_id.trim();

  // Check university exists
  const { data: universityData, error: uniError } = await supabase
    .from("universities")
    .select("*")
    .eq("id", universityId);

  if (uniError || !universityData || universityData.length === 0) {
    const err = new Error("University not found");
    err.statusCode = 404;
    throw err;
  }

  // Get user profile
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("shortlisted_universities, applied_universities")
    .eq("user_id", userId);

  if (profileError || !profileData || profileData.length === 0) {
    const err = new Error("Profile not found");
    err.statusCode = 404;
    throw err;
  }

  const profile = profileData[0];
  const shortlisted = profile.shortlisted_universities || [];
  const applied = profile.applied_universities || [];

  // Find university in shortlist (handles both array and object structures)
  let universityInShortlist = null;

  if (Array.isArray(shortlisted)) {
    universityInShortlist = shortlisted.find((u) => u?.id === universityId) || null;
  } else if (typeof shortlisted === "object") {
    if (shortlisted[universityId]) {
      universityInShortlist = shortlisted[universityId];
    } else {
      for (const value of Object.values(shortlisted)) {
        if (typeof value === "object" && value?.id === universityId) {
          universityInShortlist = value;
          break;
        }
      }
    }
  }

  if (!universityInShortlist) {
    const err = new Error("University must be in shortlist before applying");
    err.statusCode = 400;
    throw err;
  }

  // Check if already applied (handles both array and object structures)
  let alreadyApplied = false;
  if (Array.isArray(applied)) {
    alreadyApplied = applied.some((u) => u?.id === universityId);
  } else if (typeof applied === "object") {
    alreadyApplied =
      universityId in applied ||
      Object.values(applied).some(
        (v) => typeof v === "object" && v?.id === universityId
      );
  }

  if (alreadyApplied) {
    const err = new Error("Application already submitted for this university");
    err.statusCode = 400;
    throw err;
  }

  // Remove from shortlist
  let updatedShortlisted;
  if (Array.isArray(shortlisted)) {
    updatedShortlisted = shortlisted.filter((u) => u?.id !== universityId);
  } else {
    updatedShortlisted = Object.fromEntries(
      Object.entries(shortlisted).filter(([, v]) => v?.id !== universityId)
    );
  }

  // Create application record
  const applicationId = uuidv4();
  const currentTimestamp = getCurrentTimestamp();

  const newApplication = {
    id: applicationId,
    user_id: userId,
    university_id: universityId,
    status: ApplicationStatus.SUBMITTED,
    submission_date: currentTimestamp,
    created_at: currentTimestamp,
    updated_at: currentTimestamp,
  };

  await supabase.from("applications").insert(newApplication);

  // Build applied entry
  const appliedEntry = {
    ...universityInShortlist,
    application_id: applicationId,
    application_status: ApplicationStatus.SUBMITTED,
    submission_date: getCurrentTimestamp(),
  };

  // Add to applied list
  let updatedApplied;
  if (Array.isArray(applied)) {
    updatedApplied = [...applied, appliedEntry];
  } else if (typeof applied === "object") {
    updatedApplied = { ...applied, [universityId]: appliedEntry };
  } else {
    updatedApplied = [appliedEntry];
  }

  // Update profile
  await supabase
    .from("profiles")
    .update({
      shortlisted_universities: updatedShortlisted,
      applied_universities: updatedApplied,
      updated_at: getCurrentTimestamp(),
    })
    .eq("user_id", userId);

  return newApplication;
};

// ─── Get Single Application ───────────────────────────────────────────────────

const getApplicationService = async (userId, applicationId) => {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("applications")
    .select(`*, universities!inner(name, country, city)`)
    .eq("id", applicationId)
    .eq("user_id", userId);

  if (error || !data || data.length === 0) {
    const err = new Error("Application not found");
    err.statusCode = 404;
    throw err;
  }

  const app = data[0];
  const university = app.universities || {};

  return {
    id: app.id,
    user_id: app.user_id,
    university_id: app.university_id,
    university_name: university.name || "Unknown",
    university_country: university.country || "Unknown",
    university_city: university.city || null,
    status: app.status,
    submission_date: app.submission_date,
    review_date: app.review_date || null,
    decision_date: app.decision_date || null,
    created_at: app.created_at,
    updated_at: app.updated_at,
  };
};

// ─── Update Application ───────────────────────────────────────────────────────

const updateApplicationService = async (userId, applicationId, body) => {
  const supabase = getSupabase();

  // Validate
  const validationErrors = validateApplicationUpdate(body);
  if (validationErrors.length > 0) {
    const err = new Error(validationErrors.join(", "));
    err.statusCode = 422;
    throw err;
  }

  // Check exists and belongs to user
  const { data: existing, error: existingError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .eq("user_id", userId);

  if (existingError || !existing || existing.length === 0) {
    const err = new Error("Application not found");
    err.statusCode = 404;
    throw err;
  }

  // Build update data from only provided fields
  const updateData = {};
  for (const key of Object.keys(body)) {
    if (body[key] !== undefined && body[key] !== null) {
      updateData[key] = body[key];
    }
  }
  updateData.updated_at = getCurrentTimestamp();

  const { data: updated, error: updateError } = await supabase
    .from("applications")
    .update(updateData)
    .eq("id", applicationId)
    .select();

  if (updateError || !updated || updated.length === 0) {
    const err = new Error("Failed to update application");
    err.statusCode = 500;
    throw err;
  }

  return updated[0];
};

// ─── Application Stats ────────────────────────────────────────────────────────

const getApplicationStatsService = async (userId) => {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("applications")
    .select(`*, universities!inner(country)`)
    .eq("user_id", userId);

  if (error) {
    const err = new Error(`Failed to fetch application stats: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }

  const apps = data || [];
  const totalApplications = apps.length;
  const byStatus = {};
  const byCountry = {};

  for (const app of apps) {
    // Status count
    byStatus[app.status] = (byStatus[app.status] || 0) + 1;

    // Country count
    const country = app.universities?.country || "Unknown";
    byCountry[country] = (byCountry[country] || 0) + 1;
  }

  return { total_applications: totalApplications, by_status: byStatus, by_country: byCountry };
};

module.exports = {
  getApplicationsService,
  submitApplicationService,
  getApplicationService,
  updateApplicationService,
  getApplicationStatsService,
};
