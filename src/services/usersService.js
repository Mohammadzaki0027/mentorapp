const { getSupabase } = require("../config/database");
const {
  validateUserProfileUpdate,
  RESTRICTED_FIELDS,
  UPDATABLE_FIELDS,
} = require("../models/userModel");

// ─── Get Profile ──────────────────────────────────────────────────────────────

const getProfileService = async (userId) => {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId);

  if (error || !data || data.length === 0) {
    const err = new Error("Profile not found");
    err.statusCode = 404;
    throw err;
  }

  return data[0];
};

// ─── Update Profile ───────────────────────────────────────────────────────────

const updateProfileService = async (userId, body) => {
  const supabase = getSupabase();

  // Check if profile exists
  const { data: existingData, error: existingError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId);

  if (existingError || !existingData || existingData.length === 0) {
    const err = new Error("Profile not found");
    err.statusCode = 404;
    throw err;
  }

  // Validate incoming data
  const validationErrors = validateUserProfileUpdate(body);
  if (validationErrors.length > 0) {
    const err = new Error(validationErrors.join(", "));
    err.statusCode = 422;
    throw err;
  }

  // Only pick allowed updatable fields
  let updateData = {};
  for (const field of UPDATABLE_FIELDS) {
    if (body[field] !== undefined && body[field] !== null) {
      updateData[field] = body[field];
    }
  }

  // Remove restricted fields just in case
  for (const field of RESTRICTED_FIELDS) {
    delete updateData[field];
  }

  // Nothing to update — return current profile
  if (Object.keys(updateData).length === 0) {
    return existingData[0];
  }

  // Add updated_at timestamp
  updateData.updated_at = new Date().toISOString();

  // Check email conflict
  if (updateData.email) {
    const { data: emailCheck } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", updateData.email)
      .neq("user_id", userId);

    if (emailCheck && emailCheck.length > 0) {
      const err = new Error("Email already exists");
      err.statusCode = 400;
      throw err;
    }
  }

  // Check phone conflict
  if (updateData.phone) {
    const { data: phoneCheck } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("phone", updateData.phone)
      .neq("user_id", userId);

    if (phoneCheck && phoneCheck.length > 0) {
      const err = new Error("Phone number already exists");
      err.statusCode = 400;
      throw err;
    }
  }

  // Perform update
  const { data: updatedData, error: updateError } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("user_id", userId)
    .select();

  if (updateError || !updatedData || updatedData.length === 0) {
    const err = new Error("Failed to update profile");
    err.statusCode = 500;
    throw err;
  }

  return updatedData[0];
};

// ─── Get Verification Status ──────────────────────────────────────────────────

const getVerificationStatusService = async (userId) => {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("profiles")
    .select("phone_verified, email_verified, phone, email")
    .eq("user_id", userId);

  if (error || !data || data.length === 0) {
    const err = new Error("Profile not found");
    err.statusCode = 404;
    throw err;
  }

  const profile = data[0];

  return {
    phone_verified: profile.phone_verified,
    email_verified: profile.email_verified,
    phone: profile.phone,
    email: profile.email,
    fully_verified: profile.phone_verified && profile.email_verified,
  };
};

// ─── Get Profile Stats ────────────────────────────────────────────────────────

const getProfileStatsService = async (userId) => {
  const supabase = getSupabase();

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId);

  if (profileError || !profileData || profileData.length === 0) {
    const err = new Error("Profile not found");
    err.statusCode = 404;
    throw err;
  }

  const profile = profileData[0];

  const { data: referrals = [] } = await supabase
    .from("referrals")
    .select("*")
    .eq("referrer_id", userId);

  const { data: conversations = [] } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId);

  const { data: sessions = [] } = await supabase
    .from("mentor_sessions")
    .select("*")
    .eq("user_id", userId);

  return {
    profile_completion: {
      name: Boolean(profile.name),
      email: Boolean(profile.email),
      phone: Boolean(profile.phone),
      neet_score: Boolean((profile.neet_score ?? 0) > 0),
      preferred_country: Boolean(profile.preferred_country),
      category: Boolean(profile.category),
      icon: Boolean(profile.icon),
    },
    verification: {
      phone_verified: profile.phone_verified ?? false,
      email_verified: profile.email_verified ?? false,
      fully_verified:
        (profile.phone_verified ?? false) &&
        (profile.email_verified ?? false),
    },
    activity: {
      total_referrals: referrals.length,
      successful_referrals: referrals.filter(
        (r) => r.status === "registered"
      ).length,
      total_conversations: conversations.length,
      active_conversations: conversations.filter(
        (c) => c.status === "active"
      ).length,
      total_sessions: sessions.length,
      completed_sessions: sessions.filter(
        (s) => s.status === "completed"
      ).length,
    },
    referral_code: profile.referral_code,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
};

// ─── Delete Profile ───────────────────────────────────────────────────────────

const deleteProfileService = async (userId) => {
  const supabase = getSupabase();

  const { data: profileCheck, error: checkError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", userId);

  if (checkError || !profileCheck || profileCheck.length === 0) {
    const err = new Error("Profile not found");
    err.statusCode = 404;
    throw err;
  }

  // Clean up OTP verifications
  try {
    await supabase.from("otp_verifications").delete().eq("user_id", userId);
  } catch (e) {
    console.warn(
      `Warning: Failed to clean up OTP verifications for user ${userId}: ${e.message}`
    );
  }

  const { data: deleteResult, error: deleteError } = await supabase
    .from("profiles")
    .delete()
    .eq("user_id", userId)
    .select();

  if (deleteError || !deleteResult || deleteResult.length === 0) {
    const err = new Error("Failed to delete profile");
    err.statusCode = 500;
    throw err;
  }

  return {
    message: "Profile deleted successfully",
    user_id: userId,
    note: "User account remains active. Contact support to completely remove your account.",
  };
};

// ─── Soft Delete Profile ──────────────────────────────────────────────────────

const softDeleteProfileService = async (userId) => {
  const supabase = getSupabase();

  const { data: profileCheck, error: checkError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", userId);

  if (checkError || !profileCheck || profileCheck.length === 0) {
    const err = new Error("Profile not found");
    err.statusCode = 404;
    throw err;
  }

  const softDeleteData = {
    deleted_at: new Date().toISOString(),
    is_deleted: true,
    phone: `DELETED_${userId.slice(0, 8)}`,
    email: `deleted_${userId.slice(0, 8)}@deleted.com`,
  };

  const { data: result, error: updateError } = await supabase
    .from("profiles")
    .update(softDeleteData)
    .eq("user_id", userId)
    .select();

  if (updateError || !result || result.length === 0) {
    const err = new Error("Failed to soft delete profile");
    err.statusCode = 500;
    throw err;
  }

  return {
    message: "Profile soft deleted successfully",
    user_id: userId,
    note: "Profile marked as deleted. Data can be recovered by support if needed.",
  };
};

// ─── Admin Delete User ────────────────────────────────────────────────────────

const adminDeleteUserService = async (userId, adminUserId) => {
  const supabase = getSupabase();

  const { data: profileCheck, error: checkError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", userId);

  if (checkError || !profileCheck || profileCheck.length === 0) {
    const err = new Error("User profile not found");
    err.statusCode = 404;
    throw err;
  }

  try {
    await supabase.from("otp_verifications").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("user_id", userId);
    await supabase.auth.admin.deleteUser(userId);
  } catch (e) {
    const err = new Error(`Failed to delete user data: ${e.message}`);
    err.statusCode = 500;
    throw err;
  }

  return {
    message: "User completely deleted successfully",
    user_id: userId,
    deleted_by: adminUserId,
    note: "User account and all data have been permanently removed.",
  };
};

module.exports = {
  getProfileService,
  updateProfileService,
  getVerificationStatusService,
  getProfileStatsService,
  deleteProfileService,
  softDeleteProfileService,
  adminDeleteUserService,
};
