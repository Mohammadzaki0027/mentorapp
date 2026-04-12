const getJwtSecret = () => {
  return process.env.JWT_SECRET || "your-default-secret-change-in-production";
};

const getJwtAlgorithm = () => {
  return process.env.JWT_ALGORITHM || "HS256";
};

const getSupabaseJwtSecret = () => {
  return process.env.SUPABASE_JWT_SECRET || null;
};

module.exports = { getJwtSecret, getJwtAlgorithm, getSupabaseJwtSecret };
