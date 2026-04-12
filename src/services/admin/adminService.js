const { v4: uuidv4 } = require("uuid");
const { getSupabase } = require("../config/database");
const {
  validateAdminCreate,
  validateAdminUpdate,
  ADMIN_UPDATE_FIELDS,
} = require("../models/adminRoleModel");

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

const getDashboardMetricsService = async () => {
  const supabase = getSupabase();

  const { count: totalStudents } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { count: newRegistrations } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gt("created_at", thirtyDaysAgo);

  const { data: applications } = await supabase
    .from("applications")
    .select("status");

  const applicationStatusCounts = {};
  for (const app of applications || []) {
    applicationStatusCounts[app.status] =
      (applicationStatusCounts[app.status] || 0) + 1;
  }

  const { data: rewards } = await supabase
    .from("rewards")
    .select("milestone");

  const milestoneCounts = {};
  for (const reward of rewards || []) {
    milestoneCounts[reward.milestone] =
      (milestoneCounts[reward.milestone] || 0) + 1;
  }

  const { count: totalReferrals } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true });

  const { count: applicationsOnHold } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "on_hold");

  return {
    total_students: totalStudents,
    new_registrations: newRegistrations,
    application_status_counts: applicationStatusCounts,
    milestone_counts: milestoneCounts,
    total_referrals: totalReferrals,
    applications_on_hold: applicationsOnHold,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENTS
// ═══════════════════════════════════════════════════════════════════════════════

const listStudentsService = async () => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("profiles").select("*");
  if (error) {
    const err = new Error(`Failed to fetch students: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }
  return data || [];
};

const getStudentService = async (userId) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId);

  if (error || !data || data.length === 0) {
    const err = new Error("Student not found");
    err.statusCode = 404;
    throw err;
  }
  return data[0];
};

const updateStudentService = async (userId, body) => {
  const supabase = getSupabase();

  // Only pass fields that are present in the body
  const updateData = {};
  for (const key of Object.keys(body)) {
    if (body[key] !== undefined) updateData[key] = body[key];
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("user_id", userId)
    .select();

  if (error || !data || data.length === 0) {
    const err = new Error("Student not found");
    err.statusCode = 404;
    throw err;
  }
  return data[0];
};

// ═══════════════════════════════════════════════════════════════════════════════
// UNIVERSITIES ADMIN
// ═══════════════════════════════════════════════════════════════════════════════

const addUniversityService = async (body) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("universities")
    .insert(body)
    .select();

  if (error || !data || data.length === 0) {
    const err = new Error(`Failed to add university: ${error?.message}`);
    err.statusCode = 500;
    throw err;
  }
  return data[0];
};

const updateUniversityService = async (id, body) => {
  const supabase = getSupabase();

  // Check university exists
  const { data: existing, error: existingError } = await supabase
    .from("universities")
    .select("*")
    .eq("id", id);

  if (existingError || !existing || existing.length === 0) {
    const err = new Error("University not found");
    err.statusCode = 404;
    throw err;
  }

  // Update university
  const { data: updated, error: updateError } = await supabase
    .from("universities")
    .update(body)
    .eq("id", id)
    .select();

  if (updateError || !updated || updated.length === 0) {
    const err = new Error("University not found after update");
    err.statusCode = 404;
    throw err;
  }

  const updatedUniv = updated[0];
  const countryId = updatedUniv.country_id;

  // Sync 'top' field with country's top_universities list
  const { data: countryData, error: countryError } = await supabase
    .from("countries")
    .select("top_universities")
    .eq("id", countryId);

  if (countryError || !countryData || countryData.length === 0) {
    const err = new Error("Country not found");
    err.statusCode = 404;
    throw err;
  }

  let topUniversities = countryData[0].top_universities || [];
  const universityId = updatedUniv.id;

  if (updatedUniv.top) {
    if (!topUniversities.includes(universityId)) {
      topUniversities.push(universityId);
    }
  } else {
    topUniversities = topUniversities.filter((uid) => uid !== universityId);
  }

  await supabase
    .from("countries")
    .update({ top_universities: topUniversities })
    .eq("id", countryId);

  return updatedUniv;
};

const deleteUniversityService = async (id) => {
  const supabase = getSupabase();
  await supabase.from("universities").delete().eq("id", id);
  return { message: "University deleted" };
};

// ═══════════════════════════════════════════════════════════════════════════════
// APPLICATIONS ADMIN
// ═══════════════════════════════════════════════════════════════════════════════

const listApplicationsService = async () => {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("applications").select("*");
  if (error) {
    const err = new Error(`Failed to fetch applications: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }
  return data || [];
};

const getApplicationService = async (id) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id);

  if (error || !data || data.length === 0) {
    const err = new Error("Application not found");
    err.statusCode = 404;
    throw err;
  }
  return data[0];
};

const updateApplicationService = async (id, body) => {
  const supabase = getSupabase();

  // Only pass fields present in body
  const updateData = {};
  for (const key of Object.keys(body)) {
    if (body[key] !== undefined) updateData[key] = body[key];
  }

  const { data: updated, error: updateError } = await supabase
    .from("applications")
    .update(updateData)
    .eq("id", id)
    .select();

  if (updateError || !updated || updated.length === 0) {
    const err = new Error("Application not found");
    err.statusCode = 404;
    throw err;
  }

  // If status was updated, sync it into the user's profile applied_universities
  if ("status" in updateData) {
    const { data: appData } = await supabase
      .from("applications")
      .select("user_id")
      .eq("id", id);

    if (appData && appData.length > 0) {
      const userId = appData[0].user_id;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("applied_universities")
        .eq("user_id", userId);

      if (profileData && profileData.length > 0) {
        const appliedUniversities = profileData[0].applied_universities || [];

        for (const entry of appliedUniversities) {
          if (entry.application_id === id) {
            entry.application_status = updateData.status;
            break;
          }
        }

        await supabase
          .from("profiles")
          .update({ applied_universities: appliedUniversities })
          .eq("user_id", userId);
      }
    }
  }

  return updated[0];
};

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════════════════════

const studentConversionReportService = async () => {
  const supabase = getSupabase();

  const { count: totalStudents } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { data: appliedData } = await supabase
    .from("applications")
    .select("user_id");

  // Count distinct user_ids
  const distinctUsers = new Set((appliedData || []).map((a) => a.user_id));
  const appliedStudents = distinctUsers.size;

  const conversionRate =
    totalStudents > 0 ? (appliedStudents / totalStudents) * 100 : 0;

  return { total_students: totalStudents, applied_students: appliedStudents, conversion_rate: conversionRate };
};

const applicationStatusReportService = async () => {
  const supabase = getSupabase();
  const { data } = await supabase.from("applications").select("status");

  const statusCounts = {};
  for (const app of data || []) {
    statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
  }
  return statusCounts;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROLES
// ═══════════════════════════════════════════════════════════════════════════════

const listRolesService = async () => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, name, email, phone, role")
    .eq("role", "admin");

  if (error) {
    const err = new Error(`Failed to fetch roles: ${error.message}`);
    err.statusCode = 500;
    throw err;
  }
  return data || [];
};

const addAdminRoleService = async (body) => {
  const supabase = getSupabase();

  const validationErrors = validateAdminCreate(body);
  if (validationErrors.length > 0) {
    const err = new Error(validationErrors.join(", "));
    err.statusCode = 422;
    throw err;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", body.email);

  if (error || !data || data.length === 0) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const userProfile = data[0];

  if (userProfile.role === "admin") {
    const err = new Error("User is already an admin");
    err.statusCode = 400;
    throw err;
  }

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("user_id", userProfile.user_id)
    .select();

  if (updateError || !updated || updated.length === 0) {
    const err = new Error("Failed to update role");
    err.statusCode = 500;
    throw err;
  }

  return updated[0];
};

const updateAdminRoleService = async (userId, body) => {
  const supabase = getSupabase();

  const validationErrors = validateAdminUpdate(body);
  if (validationErrors.length > 0) {
    const err = new Error(validationErrors.join(", "));
    err.statusCode = 422;
    throw err;
  }

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .eq("role", "admin");

  if (existingError || !existing || existing.length === 0) {
    const err = new Error("Admin user not found");
    err.statusCode = 404;
    throw err;
  }

  // Only pick allowed update fields
  const updateData = {};
  for (const field of ADMIN_UPDATE_FIELDS) {
    if (body[field] !== undefined) updateData[field] = body[field];
  }

  if (Object.keys(updateData).length === 0) {
    const err = new Error("No update data provided");
    err.statusCode = 400;
    throw err;
  }

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("user_id", userId)
    .select();

  if (updateError || !updated || updated.length === 0) {
    const err = new Error("Failed to update admin role");
    err.statusCode = 500;
    throw err;
  }

  return updated[0];
};

const removeAdminRoleService = async (userId) => {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .eq("role", "admin");

  if (error || !data || data.length === 0) {
    const err = new Error("Admin user not found");
    err.statusCode = 404;
    throw err;
  }

  await supabase
    .from("profiles")
    .update({ role: "user" })
    .eq("user_id", userId);

  return { message: "Admin role removed successfully" };
};

// ═══════════════════════════════════════════════════════════════════════════════
// COUNTRIES ADMIN
// ═══════════════════════════════════════════════════════════════════════════════

const addCountryService = async (body) => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("countries")
    .insert(body)
    .select();

  if (error || !data || data.length === 0) {
    const err = new Error(`Failed to add country: ${error?.message}`);
    err.statusCode = 500;
    throw err;
  }
  return data[0];
};

const updateCountryService = async (countryId, body) => {
  const supabase = getSupabase();

  const { data: existing, error: existingError } = await supabase
    .from("countries")
    .select("*")
    .eq("id", countryId);

  if (existingError || !existing || existing.length === 0) {
    const err = new Error("Country not found");
    err.statusCode = 404;
    throw err;
  }

  // Only pick fields present in body
  const updateData = {};
  for (const key of Object.keys(body)) {
    if (body[key] !== undefined) updateData[key] = body[key];
  }

  const { data: updated, error: updateError } = await supabase
    .from("countries")
    .update(updateData)
    .eq("id", countryId)
    .select();

  if (updateError || !updated || updated.length === 0) {
    const err = new Error("Failed to update country");
    err.statusCode = 500;
    throw err;
  }
  return updated[0];
};

const deleteCountryService = async (countryId) => {
  const supabase = getSupabase();

  const { data: existing, error: existingError } = await supabase
    .from("countries")
    .select("*")
    .eq("id", countryId);

  if (existingError || !existing || existing.length === 0) {
    const err = new Error("Country not found");
    err.statusCode = 404;
    throw err;
  }

  // Check if country has associated universities
  const { data: universities } = await supabase
    .from("universities")
    .select("id")
    .eq("country_id", countryId);

  if (universities && universities.length > 0) {
    const err = new Error(
      "Cannot delete country with associated universities"
    );
    err.statusCode = 400;
    throw err;
  }

  await supabase.from("countries").delete().eq("id", countryId);
  return { message: "Country deleted successfully" };
};

// ═══════════════════════════════════════════════════════════════════════════════
// TESTIMONIALS ADMIN
// ═══════════════════════════════════════════════════════════════════════════════

const addTestimonialService = async ({ name, university, videoBuffer, videoExt, contentType }) => {
  const supabase = getSupabase();

  const videoId = uuidv4();
  const videoPath = `testimonials/${videoId}.${videoExt}`;

  const { error: uploadError } = await supabase.storage
    .from("mbbs")
    .upload(videoPath, videoBuffer, { contentType });

  if (uploadError) {
    const err = new Error("Failed to upload video to Supabase bucket");
    err.statusCode = 500;
    throw err;
  }

  const videoUrl = supabase.storage.from("mbbs").getPublicUrl(videoPath).data.publicUrl;

  const testimonialData = {
    id: uuidv4(),
    name,
    university,
    link: videoUrl,
  };

  const { data, error } = await supabase
    .from("testimonials")
    .insert(testimonialData)
    .select();

  if (error || !data || data.length === 0) {
    const err = new Error("Failed to add testimonial");
    err.statusCode = 500;
    throw err;
  }

  return data[0];
};

const editTestimonialService = async ({ id, name, university, videoBuffer, videoExt, contentType }) => {
  const supabase = getSupabase();

  const { data: existing, error: existingError } = await supabase
    .from("testimonials")
    .select("*")
    .eq("id", id);

  if (existingError || !existing || existing.length === 0) {
    const err = new Error("Testimonial not found");
    err.statusCode = 404;
    throw err;
  }

  const updateData = { name, university };

  // If new video provided, delete old and upload new
  if (videoBuffer) {
    const oldUrl = existing[0].link;
    const oldPath = oldUrl.split("/storage/v1/object/public/mbbs/")[1];
    await supabase.storage.from("mbbs").remove([oldPath]);

    const videoId = uuidv4();
    const videoPath = `testimonials/${videoId}.${videoExt}`;

    const { error: uploadError } = await supabase.storage
      .from("mbbs")
      .upload(videoPath, videoBuffer, { contentType });

    if (uploadError) {
      const err = new Error("Failed to upload new video to Supabase bucket");
      err.statusCode = 500;
      throw err;
    }

    updateData.link = supabase.storage.from("mbbs").getPublicUrl(videoPath).data.publicUrl;
  }

  const { data, error } = await supabase
    .from("testimonials")
    .update(updateData)
    .eq("id", id)
    .select();

  if (error || !data || data.length === 0) {
    const err = new Error("Failed to update testimonial");
    err.statusCode = 500;
    throw err;
  }

  return data[0];
};

const deleteTestimonialService = async (id) => {
  const supabase = getSupabase();

  const { data: existing, error: existingError } = await supabase
    .from("testimonials")
    .select("*")
    .eq("id", id);

  if (existingError || !existing || existing.length === 0) {
    const err = new Error("Testimonial not found");
    err.statusCode = 404;
    throw err;
  }

  // Delete video from storage
  const videoUrl = existing[0].link;
  const videoPath = videoUrl.split("/storage/v1/object/public/mbbs/")[1];
  await supabase.storage.from("mbbs").remove([videoPath]);

  const { data, error } = await supabase
    .from("testimonials")
    .delete()
    .eq("id", id)
    .select();

  if (error || !data || data.length === 0) {
    const err = new Error("Failed to delete testimonial");
    err.statusCode = 500;
    throw err;
  }

  return { message: "Testimonial deleted successfully" };
};

module.exports = {
  // Dashboard
  getDashboardMetricsService,
  // Students
  listStudentsService,
  getStudentService,
  updateStudentService,
  // Universities
  addUniversityService,
  updateUniversityService,
  deleteUniversityService,
  // Applications
  listApplicationsService,
  getApplicationService,
  updateApplicationService,
  // Reports
  studentConversionReportService,
  applicationStatusReportService,
  // Roles
  listRolesService,
  addAdminRoleService,
  updateAdminRoleService,
  removeAdminRoleService,
  // Countries
  addCountryService,
  updateCountryService,
  deleteCountryService,
  // Testimonials
  addTestimonialService,
  editTestimonialService,
  deleteTestimonialService,
};
