const referralService = require("../services/referralService");
const {
  validateReferralRequest,
  validateReferralUpdate,
  validateRewardClaim,
} = require("../model/referralModel");

// POST /referrals/refer-friend
const referFriend = async (req, res) => {
  const errors = validateReferralRequest(req.body);
  if (errors.length) return res.status(422).json({ errors });

  try {
    const data = await referralService.referFriend(req.supabase, req.user.user_id, req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
};

// GET /referrals/my-referrals
const getMyReferrals = async (req, res) => {
  try {
    const { status } = req.query;
    const data = await referralService.getMyReferrals(req.supabase, req.user.user_id, status);
    res.json(data);
  } catch (err) {
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
};

// GET /referrals/stats
const getReferralStats = async (req, res) => {
  try {
    const data = await referralService.getReferralStats(req.supabase, req.user.user_id);
    res.json(data);
  } catch (err) {
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
};

// PUT /referrals/:referral_id/update
const updateReferral = async (req, res) => {
  const errors = validateReferralUpdate(req.body);
  if (errors.length) return res.status(422).json({ errors });

  try {
    const data = await referralService.updateReferral(
      req.supabase,
      req.params.referral_id,
      req.user.user_id,
      req.user.role,
      req.body
    );
    res.json(data);
  } catch (err) {
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
};

// POST /referrals/:referral_id/claim-reward
const claimReward = async (req, res) => {
  const errors = validateRewardClaim(req.body);
  if (errors.length) return res.status(422).json({ errors });

  try {
    const data = await referralService.claimReward(
      req.supabase,
      req.params.referral_id,
      req.user.user_id,
      req.body
    );
    res.json(data);
  } catch (err) {
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
};

// GET /referrals/leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit ?? "10"), 1), 100);
    const data = await referralService.getLeaderboard(req.supabase, limit);
    res.json(data);
  } catch (err) {
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
};

// GET /referrals/validate-code/:referral_code
const validateCode = async (req, res) => {
  try {
    const data = await referralService.validateCode(req.supabase, req.params.referral_code);
    res.json(data);
  } catch (err) {
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
};

// POST /referrals/process-registration
const processRegistration = async (req, res) => {
  try {
    const { referral_code, new_user_id } = req.body;
    const data = await referralService.processRegistration(req.supabase, referral_code, new_user_id);
    res.json(data);
  } catch (err) {
    // Mirror Python: never fail registration if referral processing fails
    res.json({ message: `Referral processing failed: ${err.message}` });
  }
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