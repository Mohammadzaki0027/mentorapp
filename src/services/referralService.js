const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const {
  ReferralStatus,
  ReferralRewardStatus,
  formatReferralResponse,
  formatReferralStats,
  formatLeaderboardEntry,
} = require("../model/referralModel");

const getCurrentTimestamp = () => new Date().toISOString();

const generateReferralCode = (length = 8) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(crypto.randomBytes(length))
    .map((byte) => chars[byte % chars.length])
    .join("");
};

// Ensure the user has a referral code, creating one if absent
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

const referFriend = async (supabase, userId, body) => {
  const { friend_name, friend_email, friend_phone, message } = body;

  const referralCode = await getOrCreateReferralCode(supabase, userId);

  // Block if friend is already a registered user
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("user_id")
    .or(`email.eq.${friend_email},phone.eq.${friend_phone}`)
    .maybeSingle();

  if (existingUser) {
    const err = new Error("Friend is already registered on the platform");
    err.statusCode = 400;
    throw err;
  }

  // Block duplicate referral entries
  const { data: existingReferral } = await supabase
    .from("referrals")
    .select("referral_id")
    .or(`friend_email.eq.${friend_email},friend_phone.eq.${friend_phone}`)
    .maybeSingle();

  if (existingReferral) {
    const err = new Error("Referral already exists for this friend");
    err.statusCode = 400;
    throw err;
  }

  const referralId = uuidv4();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const referralData = {
    referral_id: referralId,
    referrer_id: userId,
    friend_name,
    friend_email,
    friend_phone,
    message: message || null,
    status: ReferralStatus.PENDING,
    referral_code: referralCode,
    reward_status: ReferralRewardStatus.PENDING,
    reward_amount: 100,
    created_at: getCurrentTimestamp(),
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

  // TODO: Send referral email/SMS to friend

  return formatReferralResponse(data);
};

const getMyReferrals = async (supabase, userId, statusFilter) => {
  let query = supabase
    .from("referrals")
    .select("*")
    .eq("referrer_id", userId)
    .order("created_at", { ascending: false });

  if (statusFilter) query = query.eq("status", statusFilter);

  const { data, error } = await query;
  if (error) throw new Error("Failed to fetch referrals");

  return data.map(formatReferralResponse);
};

const getReferralStats = async (supabase, userId) => {
  const referralCode = await getOrCreateReferralCode(supabase, userId);

  const { data: referrals, error } = await supabase
    .from("referrals")
    .select("*")
    .eq("referrer_id", userId);

  if (error) throw new Error("Failed to fetch referral stats");

  const total = referrals.length;
  const successful = referrals.filter((r) => r.status === ReferralStatus.REGISTERED).length;
  const pending = referrals.filter((r) => r.status === ReferralStatus.PENDING).length;

  const totalEarned = referrals
    .filter((r) => r.reward_status === ReferralRewardStatus.EARNED)
    .reduce((sum, r) => sum + r.reward_amount, 0);

  const totalClaimed = referrals
    .filter((r) => r.reward_status === ReferralRewardStatus.CLAIMED)
    .reduce((sum, r) => sum + r.reward_amount, 0);

  return formatReferralStats({
    total_referrals: total,
    successful_referrals: successful,
    pending_referrals: pending,
    total_rewards_earned: totalEarned,
    total_rewards_claimed: totalClaimed,
    referral_code: referralCode,
    success_rate: total > 0 ? Math.round((successful / total) * 10000) / 100 : 0,
  });
};

const updateReferral = async (supabase, referralId, userId, userRole, body) => {
  const { data: existing, error: fetchError } = await supabase
    .from("referrals")
    .select("*")
    .eq("referral_id", referralId)
    .single();

  if (fetchError || !existing) {
    const err = new Error("Referral not found");
    err.statusCode = 404;
    throw err;
  }

  if (existing.referrer_id !== userId && userRole !== "admin") {
    const err = new Error("Permission denied");
    err.statusCode = 403;
    throw err;
  }

  const updateData = { updated_at: getCurrentTimestamp() };
  if (body.status) updateData.status = body.status;
  if (body.message) updateData.message = body.message;

  const { data, error } = await supabase
    .from("referrals")
    .update(updateData)
    .eq("referral_id", referralId)
    .select()
    .single();

  if (error || !data) {
    const err = new Error("Failed to update referral");
    err.statusCode = 500;
    throw err;
  }

  return formatReferralResponse(data);
};

const claimReward = async (supabase, referralId, userId, body) => {
  const { claim_method, account_details } = body;

  const { data: referral, error: fetchError } = await supabase
    .from("referrals")
    .select("*")
    .eq("referral_id", referralId)
    .single();

  if (fetchError || !referral) {
    const err = new Error("Referral not found");
    err.statusCode = 404;
    throw err;
  }

  if (referral.referrer_id !== userId) {
    const err = new Error("Permission denied");
    err.statusCode = 403;
    throw err;
  }

  if (referral.status !== ReferralStatus.REGISTERED) {
    const err = new Error("Referral must be registered to claim reward");
    err.statusCode = 400;
    throw err;
  }

  if (referral.reward_status !== ReferralRewardStatus.EARNED) {
    const err = new Error("Reward not available for claiming");
    err.statusCode = 400;
    throw err;
  }

  const { error } = await supabase
    .from("referrals")
    .update({
      reward_status: ReferralRewardStatus.CLAIMED,
      claim_method,
      account_details: account_details || null,
      claimed_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp(),
    })
    .eq("referral_id", referralId);

  if (error) {
    const err = new Error("Failed to claim reward");
    err.statusCode = 500;
    throw err;
  }

  // TODO: Process reward payment based on claim_method

  return {
    message: "Reward claimed successfully",
    referral_id: referralId,
    reward_amount: referral.reward_amount,
    claim_method,
  };
};

const getLeaderboard = async (supabase, limit = 10) => {
  const { data: referrals, error } = await supabase
    .from("referrals")
    .select("referrer_id, status, reward_status, reward_amount");

  if (error) throw new Error("Failed to fetch leaderboard data");

  // Aggregate per referrer in memory (mirrors the Python approach)
  const stats = {};
  for (const r of referrals) {
    if (!stats[r.referrer_id]) {
      stats[r.referrer_id] = { total_referrals: 0, successful_referrals: 0, total_rewards: 0 };
    }
    stats[r.referrer_id].total_referrals++;
    if (r.status === ReferralStatus.REGISTERED) stats[r.referrer_id].successful_referrals++;
    if ([ReferralRewardStatus.EARNED, ReferralRewardStatus.CLAIMED].includes(r.reward_status)) {
      stats[r.referrer_id].total_rewards += r.reward_amount;
    }
  }

  const sorted = Object.entries(stats)
    .sort((a, b) => b[1].successful_referrals - a[1].successful_referrals)
    .slice(0, limit);

  const leaderboard = await Promise.all(
    sorted.map(async ([userId, userStats], index) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", userId)
        .single();

      return formatLeaderboardEntry({
        user_id: userId,
        user_name: profile?.name ?? "Unknown User",
        ...userStats,
        rank: index + 1,
      });
    })
  );

  return leaderboard;
};

const validateCode = async (supabase, referralCode) => {
  const { data: user, error } = await supabase
    .from("profiles")
    .select("user_id, name")
    .eq("referral_code", referralCode)
    .single();

  if (error || !user) {
    const err = new Error("Invalid referral code");
    err.statusCode = 404;
    throw err;
  }

  return {
    valid: true,
    referrer_name: user.name,
    message: `Referral code is valid. You'll be referred by ${user.name}`,
  };
};

const processRegistration = async (supabase, referralCode, newUserId) => {
  const { data: referrer } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("referral_code", referralCode)
    .single();

  if (!referrer) return { message: "Invalid referral code, registration continues without referral" };

  const { data: referrals } = await supabase
    .from("referrals")
    .select("*")
    .eq("referrer_id", referrer.user_id)
    .eq("status", ReferralStatus.PENDING);

  if (!referrals?.length) return { message: "No pending referrals found" };

  const referral = referrals[0];

  await supabase
    .from("referrals")
    .update({
      status: ReferralStatus.REGISTERED,
      reward_status: ReferralRewardStatus.EARNED,
      registered_user_id: newUserId,
      registered_at: getCurrentTimestamp(),
      updated_at: getCurrentTimestamp(),
    })
    .eq("referral_id", referral.referral_id);

  return {
    message: "Referral processed successfully",
    referrer_id: referrer.user_id,
    reward_amount: referral.reward_amount,
  };
};

module.exports = {
  referFriend,
  getMyReferrals,
  getReferralStats,
  updateReferral,
  claimReward,
  getLeaderboard,
  validateCode,
  processRegistration,
};