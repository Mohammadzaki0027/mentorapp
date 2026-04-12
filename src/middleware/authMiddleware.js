const jwt = require("jsonwebtoken");
const { getSupabase } = require("../config/database");
const { getJwtSecret, getSupabaseJwtSecret } = require("../config/jwtConfig");

class AuthService {
  constructor(supabase) {
    this.supabase = supabase;
    this.supabaseJwtSecret = getSupabaseJwtSecret();
    this.customJwtSecret = getJwtSecret();
  }

  verifyJwtToken(token) {
    // First try Supabase token
    const supabasePayload = this._verifySupabaseToken(token);
    if (supabasePayload) return supabasePayload;

    // Then try custom token
    const customPayload = this._verifyCustomToken(token);
    if (customPayload) return customPayload;

    // Both failed — collect error details
    const errorDetails = [];

    if (!this.supabaseJwtSecret) {
      errorDetails.push("Supabase JWT secret not configured");
    }

    try {
      const unverifiedPayload = jwt.decode(token);
      if (unverifiedPayload) {
        const tokenType =
          unverifiedPayload.aud === "authenticated" ? "Supabase" : "Custom";
        errorDetails.push(`Token appears to be ${tokenType} format`);

        if (unverifiedPayload.exp) {
          const expTime = new Date(unverifiedPayload.exp * 1000);
          if (expTime < new Date()) {
            errorDetails.push("Token has expired");
          } else {
            errorDetails.push("Token is not expired");
          }
        }
      }
    } catch {
      errorDetails.push("Token format is invalid");
    }

    const error = new Error(
      `Token verification failed: ${errorDetails.join("; ")}`
    );
    error.statusCode = 401;
    throw error;
  }

  _verifySupabaseToken(token) {
    try {
      if (!this.supabaseJwtSecret) {
        console.log(
          "Supabase token verification failed: No JWT secret configured"
        );
        return null;
      }

      const payload = jwt.verify(token, this.supabaseJwtSecret, {
        algorithms: ["HS256"],
        audience: "authenticated",
      });
      return payload;
    } catch (e) {
      if (e.name === "TokenExpiredError") {
        console.log("Supabase token verification failed: Token expired");
      } else if (e.name === "JsonWebTokenError") {
        console.log(
          "Supabase token verification failed: Invalid signature or format"
        );
      } else {
        console.log(
          `Supabase token verification failed: Unexpected error - ${e.message}`
        );
      }
      return null;
    }
  }

  _verifyCustomToken(token) {
    try {
      const payload = jwt.verify(token, this.customJwtSecret, {
        algorithms: ["HS256"],
      });

      if (payload.type === "access" && payload.sub) {
        return payload;
      }
      return null;
    } catch (e) {
      if (e.name === "TokenExpiredError") {
        console.log("Custom token verification failed: Token expired");
      } else if (e.name === "JsonWebTokenError") {
        console.log(
          "Custom token verification failed: Invalid signature or format"
        );
      } else {
        console.log(
          `Custom token verification failed: Unexpected error - ${e.message}`
        );
      }
      return null;
    }
  }

  async getUserFromToken(token) {
    const payload = this.verifyJwtToken(token);
    const userId = payload.sub;

    if (!userId) {
      const error = new Error("Invalid token payload");
      error.statusCode = 401;
      throw error;
    }

    // Get user profile from database
    const { data: profileData, error: profileError } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId);

    if (profileError || !profileData || profileData.length === 0) {
      const error = new Error("User profile not found");
      error.statusCode = 404;
      throw error;
    }

    const userProfile = profileData[0];
    const tokenType =
      payload.aud === "authenticated" ? "supabase" : "custom";

    return {
      user_id: userId,
      email: payload.email,
      phone: payload.phone,
      name: userProfile.name,
      icon: userProfile.icon,
      phone_verified: userProfile.phone_verified,
      email_verified: userProfile.email_verified,
      preferred_intake: userProfile.preferred_intake,
      neet_score: userProfile.neet_score ?? 0,
      category: userProfile.category ?? "",
      shortlisted_universities: userProfile.shortlisted_universities ?? [],
      applied_universities: userProfile.applied_universities ?? [],
      created_at: userProfile.created_at,
      updated_at: userProfile.updated_at,
      role: userProfile.role,
      token_type: tokenType,
      aud: payload.aud,
      exp: payload.exp,
    };
  }
}

// ─── Middleware: get current authenticated user ───────────────────────────────
const getCurrentUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ detail: "Missing or invalid Authorization header" });
    }

    const token = authHeader.split(" ")[1];
    const supabase = getSupabase();
    const authService = new AuthService(supabase);

    req.user = await authService.getUserFromToken(token);
    next();
  } catch (err) {
    return res
      .status(err.statusCode || 401)
      .json({ detail: err.message });
  }
};

// ─── Middleware: verified users only ─────────────────────────────────────────
const getVerifiedUser = (req, res, next) => {
  if (!req.user?.phone_verified || !req.user?.email_verified) {
    return res.status(403).json({
      detail:
        "Please verify your phone and email to access this resource",
    });
  }
  next();
};

// ─── Middleware: admin only ───────────────────────────────────────────────────
const getCurrentAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ detail: "Admin access required" });
  }
  next();
};

// ─── Utility: refresh access token ───────────────────────────────────────────
const refreshAccessToken = async (refreshToken) => {
  const supabase = getSupabase();

  // Try Supabase token refresh first
  try {
    const { data: sessionData, error } =
      await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (!error && sessionData?.session) {
      return {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        token_type: "bearer",
        expires_in: sessionData.session.expires_in,
        token_type_source: "supabase",
      };
    }
  } catch {
    // Supabase refresh failed, fall through to custom token
  }

  // Try custom token refresh
  const {
    createCustomSession,
    verifyCustomToken,
  } = require("../services/authService");

  try {
    const payload = verifyCustomToken(refreshToken);

    if (payload.type !== "refresh") {
      const error = new Error("Invalid refresh token type");
      error.statusCode = 401;
      throw error;
    }

    const { sub: userId, email, phone } = payload;
    const newSession = createCustomSession(userId, email, phone);

    if (newSession) {
      return { ...newSession, token_type_source: "custom" };
    } else {
      const error = new Error("Failed to create new session");
      error.statusCode = 500;
      throw error;
    }
  } catch (customError) {
    const error = new Error(
      `Custom token refresh failed: ${customError.message}`
    );
    error.statusCode = 401;
    throw error;
  }
};

module.exports = {
  AuthService,
  getCurrentUser,
  getVerifiedUser,
  getCurrentAdmin,
  refreshAccessToken,
};
