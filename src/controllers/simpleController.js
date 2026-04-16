const simpleService = require("../services/simpleService");
const {
  validateSimpleReferralRequest,
  validateMentorApplicationRequest,
  validateTalkToMentorRequest,
} = require("../model/simpleModel");

// POST /simple/refer-friend
const simpleReferFriend = async (req, res) => {
  const errors = validateSimpleReferralRequest(req.body);
  if (errors.length) return res.status(422).json({ errors });

  try {
    const data = await simpleService.simpleReferFriend(req.supabase, req.user, req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
};

// POST /simple/apply-to-be-mentor
const simpleApplyToBeMentor = async (req, res) => {
  const errors = validateMentorApplicationRequest(req.body);
  if (errors.length) return res.status(422).json({ errors });

  try {
    const data = await simpleService.simpleApplyToBeMentor(req.supabase, req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
};

// POST /simple/talk-to-mentor
const simpleTalkToMentor = async (req, res) => {
  const errors = validateTalkToMentorRequest(req.body);
  if (errors.length) return res.status(422).json({ errors });

  try {
    const data = await simpleService.simpleTalkToMentor(req.supabase, req.user, req.body);
    res.json(data);
  } catch (err) {
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
};

// GET /simple/my-referrals
const getMySimpleReferrals = async (req, res) => {
  try {
    const data = await simpleService.getMySimpleReferrals(req.supabase, req.user.user_id);
    res.json(data);
  } catch (err) {
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
};

// GET /simple/my-conversations
const getMySimpleConversations = async (req, res) => {
  try {
    const data = await simpleService.getMySimpleConversations(req.supabase, req.user.user_id);
    res.json(data);
  } catch (err) {
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
};

// GET /simple/available-mentors
const getAvailableMentors = async (req, res) => {
  try {
    const data = await simpleService.getAvailableMentors(req.supabase);
    res.json(data);
  } catch (err) {
    res.status(err.statusCode ?? 500).json({ error: err.message });
  }
};

module.exports = {
  simpleReferFriend,
  simpleApplyToBeMentor,
  simpleTalkToMentor,
  getMySimpleReferrals,
  getMySimpleConversations,
  getAvailableMentors,
};