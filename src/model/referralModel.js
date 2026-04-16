// Enums
const ReferralStatus = Object.freeze({
  PENDING: "pending",
  SENT: "sent",
  ACCEPTED: "accepted",
  REGISTERED: "registered",
  EXPIRED: "expired",
});

const ReferralRewardStatus = Object.freeze({
  PENDING: "pending",
  EARNED: "earned",
  CLAIMED: "claimed",
  EXPIRED: "expired",
});

// Validators
const validateReferralRequest = (data) => {
  const errors = [];

  if (!data.friend_name || typeof data.friend_name !== "string") {
    errors.push("friend_name is required and must be a string");
  }

  if (!data.friend_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.friend_email)) {
    errors.push("friend_email must be a valid email address");
  }

  if (!data.friend_phone || typeof data.friend_phone !== "string") {
    errors.push("friend_phone is required and must be a string");
  }

  return errors;
};

const validateReferralUpdate = (data) => {
  const errors = [];

  if (data.status && !Object.values(ReferralStatus).includes(data.status)) {
    errors.push(`status must be one of: ${Object.values(ReferralStatus).join(", ")}`);
  }

  return errors;
};

const validateRewardClaim = (data) => {
  const errors = [];
  const validClaimMethods = ["wallet", "discount", "cashback"];

  if (!data.claim_method || !validClaimMethods.includes(data.claim_method)) {
    errors.push(`claim_method must be one of: ${validClaimMethods.join(", ")}`);
  }

  return errors;
};

// Response formatters — shape the raw DB row into the response contract
const formatReferralResponse = (referral) => ({
  referral_id: referral.referral_id,
  referrer_id: referral.referrer_id,
  friend_name: referral.friend_name,
  friend_email: referral.friend_email,
  friend_phone: referral.friend_phone,
  message: referral.message || null,
  status: referral.status,
  referral_code: referral.referral_code,
  created_at: referral.created_at,
  expires_at: referral.expires_at,
  reward_status: referral.reward_status,
  reward_amount: referral.reward_amount ?? 0,
});

const formatReferralStats = (stats) => ({
  total_referrals: stats.total_referrals,
  successful_referrals: stats.successful_referrals,
  pending_referrals: stats.pending_referrals,
  total_rewards_earned: stats.total_rewards_earned,
  total_rewards_claimed: stats.total_rewards_claimed,
  referral_code: stats.referral_code,
  success_rate: stats.success_rate,
});

const formatLeaderboardEntry = (entry) => ({
  user_id: entry.user_id,
  user_name: entry.user_name,
  total_referrals: entry.total_referrals,
  successful_referrals: entry.successful_referrals,
  total_rewards: entry.total_rewards,
  rank: entry.rank,
});

module.exports = {
  ReferralStatus,
  ReferralRewardStatus,
  validateReferralRequest,
  validateReferralUpdate,
  validateRewardClaim,
  formatReferralResponse,
  formatReferralStats,
  formatLeaderboardEntry,
};