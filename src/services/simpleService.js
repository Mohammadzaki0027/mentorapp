const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");

const getCurrentTimestamp = () => new Date().toISOString();

const generateReferralCode = (length = 8) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(crypto.randomBytes(length))
    .map((byte) => chars[byte % chars.length])
    .join("");
};

const getOrCreateReferralCode = async (supabase, userId) => {
  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("user_id", userId)
    .single();

  if (profile?.referral_code) return profile.referral_code;

  const referralCode = generateReferralCode();
  await supabase
    .from("profiles")
    .update({ referral_code: referralCode, updated_at: getCurrentTimestamp() })
    .eq("user_id", userId);

  return referralCode;
};

// =====================================================
// SIMPLE REFER A FRIEND
// =====================================================
const simpleReferFriend = async (supabase, currentUser, body) => {
  const { friend_name, friend_email, friend_phone } = body;
  const userId = currentUser.user_id;

  const referralCode = await getOrCreateReferralCode(supabase, userId);

  // Check if friend is already registered
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("user_id")
    .or(`email.eq.${friend_email},phone.eq.${friend_phone}`)
    .maybeSingle();

  if (existingUser) {
    return {
      success: false,
      message: "Friend is already registered on the platform",
      referral_id: null,
      referral_code: referralCode,
    };
  }

  const referralId = uuidv4();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const referralData = {
    referral_id: referralId,
    referrer_id: userId,
    friend_name,
    friend_email,
    friend_phone,
    message: `Referred by ${currentUser.name ?? "User"}`,
    status: "pending",
    referral_code: referralCode,
    reward_status: "pending",
    reward_amount: 100,
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp(),
    expires_at: expiresAt,
  };

  const { data, error } = await supabase
    .from("referrals")
    .insert(referralData)
    .select()
    .single();

  if (error || !data) {
    const err = new Error("Failed to create referral");
    err.statusCode = 500;
    throw err;
  }

  return {
    success: true,
    message: `Friend ${friend_name} has been referred successfully! They will receive an invitation with your referral code: ${referralCode}`,
    referral_id: referralId,
    referral_code: referralCode,
  };
};

// =====================================================
// SIMPLE APPLY TO BE MENTOR
// =====================================================
const simpleApplyToBeMentor = async (supabase, body) => {
  const { full_name, mobile, email } = body;

  // Check for duplicate application
  const { data: existing } = await supabase
    .from("mentor_applications")
    .select("application_id")
    .or(`email.eq.${email},mobile.eq.${mobile}`)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      message: "An application with this email or mobile number already exists",
      application_id: null,
    };
  }

  const applicationId = uuidv4();

  const applicationData = {
    application_id: applicationId,
    full_name,
    mobile,
    email,
    status: "pending",
    created_at: getCurrentTimestamp(),
    updated_at: getCurrentTimestamp(),
  };

  const { data, error } = await supabase
    .from("mentor_applications")
    .insert(applicationData)
    .select()
    .single();

  if (error || !data) {
    const err = new Error("Failed to create mentor application");
    err.statusCode = 500;
    throw err;
  }

  return {
    success: true,
    message:
      "Your mentor application has been submitted successfully! Our admin team will review it and get back to you soon.",
    application_id: applicationId,
  };
};

// =====================================================
// SIMPLE TALK TO A MENTOR
// =====================================================
const simpleTalkToMentor = async (supabase, currentUser, body) => {
  const { subject, message, mentor_id: requestedMentorId } = body;
  const userId = currentUser.user_id;

  let mentorId = requestedMentorId;
  let mentorName;

  if (!mentorId) {
    // Try available mentor first, fallback to any active mentor
    let { data: mentors } = await supabase
      .from("mentors")
      .select("*")
      .eq("is_active", true)
      .eq("availability", "available")
      .order("rating", { ascending: false })
      .limit(1);

    if (!mentors?.length) {
      const { data: fallback } = await supabase
        .from("mentors")
        .select("*")
        .eq("is_active", true)
        .order("rating", { ascending: false })
        .limit(1);

      mentors = fallback;
    }

    if (!mentors?.length) {
      return {
        success: false,
        message: "No mentors are currently available. Please try again later.",
        conversation_id: null,
        mentor_name: null,
        mentor_id: null,
      };
    }

    mentorId = mentors[0].mentor_id;
    mentorName = mentors[0].name;
  } else {
    // Verify specified mentor exists and is active
    const { data: mentors } = await supabase
      .from("mentors")
      .select("*")
      .eq("mentor_id", mentorId)
      .eq("is_active", true);

    if (!mentors?.length) {
      return {
        success: false,
        message: "Specified mentor not found or not available",
        conversation_id: null,
        mentor_name: null,
        mentor_id: mentorId,
      };
    }

    mentorName = mentors[0].name;
  }

  // Create conversation
  const conversationId = uuidv4();

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      mentor_id: mentorId,
      subject,
      status: "active",
      priority: "normal",
      category: "general_inquiry",
      unread_count: 0,
      created_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp(),
    })
    .select()
    .single();

  if (convError || !conversation) {
    const err = new Error("Failed to create conversation");
    err.statusCode = 500;
    throw err;
  }

  // Create initial message
  const { data: msg, error: msgError } = await supabase
    .from("messages")
    .insert({
      message_id: uuidv4(),
      conversation_id: conversationId,
      sender_id: userId,
      sender_type: "user",
      message_type: "text",
      content: message,
      status: "sent",
      created_at: getCurrentTimestamp(),
    })
    .select()
    .single();

  if (msgError || !msg) {
    // Rollback conversation on message failure
    await supabase.from("conversations").delete().eq("conversation_id", conversationId);
    const err = new Error("Failed to send initial message");
    err.statusCode = 500;
    throw err;
  }

  return {
    success: true,
    message: `Conversation started successfully with ${mentorName}! You can now continue the conversation.`,
    conversation_id: conversationId,
    mentor_name: mentorName,
    mentor_id: mentorId,
  };
};

// =====================================================
// GET MY REFERRALS
// =====================================================
const getMySimpleReferrals = async (supabase, userId) => {
  const { data, error } = await supabase
    .from("referrals")
    .select("referral_id, friend_name, friend_email, status, created_at")
    .eq("referrer_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    const err = new Error("Failed to fetch referrals");
    err.statusCode = 500;
    throw err;
  }

  return {
    success: true,
    referrals: data ?? [],
    total_count: data?.length ?? 0,
  };
};

// =====================================================
// GET MY CONVERSATIONS
// =====================================================
const getMySimpleConversations = async (supabase, userId) => {
  const { data, error } = await supabase
    .from("conversations")
    .select("conversation_id, subject, status, created_at, mentors(name)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    const err = new Error("Failed to fetch conversations");
    err.statusCode = 500;
    throw err;
  }

  return {
    success: true,
    conversations: data ?? [],
    total_count: data?.length ?? 0,
  };
};

// =====================================================
// GET AVAILABLE MENTORS
// =====================================================
const getAvailableMentors = async (supabase) => {
  const { data, error } = await supabase
    .from("mentors")
    .select("mentor_id, name, bio, specializations, rating, availability")
    .eq("is_active", true)
    .order("rating", { ascending: false });

  if (error) {
    const err = new Error("Failed to fetch mentors");
    err.statusCode = 500;
    throw err;
  }

  return {
    success: true,
    mentors: data ?? [],
    total_count: data?.length ?? 0,
  };
};

module.exports = {
  simpleReferFriend,
  simpleApplyToBeMentor,
  simpleTalkToMentor,
  getMySimpleReferrals,
  getMySimpleConversations,
  getAvailableMentors,
};