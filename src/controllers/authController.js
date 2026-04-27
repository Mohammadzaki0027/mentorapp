const { v4: uuidv4 } = require("uuid");
const { getSupabase } = require("../config/database");
const { refreshAccessToken } = require("../middleware/authMiddleware");
const {
  getCurrentTimestamp,
  generateOtp,
  sendEmailOtpService,
  findUserByPhone,
  toE164,
  createCustomSession,
  verifyCustomToken,
} = require("../services/authService");

// ─── Signup ───────────────────────────────────────────────────────────────────

// const signupUser = async (req, res) => {
//   const { name, email, phone } = req.body;
//   const supabase = getSupabase();
// console.log("supabase credential is getting or not",supabase)
//   try {
//     // Check if user already exists
//     const { data: existingProfile } = await supabase
//       .from("profiles")
//       .select("*")
//       .or(`phone.eq.${phone},email.eq.${email}`);

//     if (existingProfile && existingProfile.length > 0) {
//       return res
//         .status(400)
//         .json({ detail: "User already exists with this phone or email" });
//     }

//     const tempPassword = uuidv4();

//     const { data: userResponse, error: signUpError } =
//       await supabase.auth.signUp({
//         email,
//         password: tempPassword,
//       });

//     if (signUpError || !userResponse?.user) {
//   return res.status(400).json({ detail: signUpError.message });

// }

//     const user = userResponse.user;

//     const profileData = {
//       user_id: user.id,
//       name,
//       email,
//       phone,
//       icon: "",
//       preferred_intake: "",
//       neet_score: 0,
//       category: "",
//       shortlisted_universities: [],
//       applied_universities: [],
//       phone_verified: false,
//       email_verified: false,
//       created_at: getCurrentTimestamp(),
//     };

//     const { data: profileResult, error: profileError } = await supabase
//       .from("profiles")
//       .insert(profileData)
//       .select();

//     if (profileError || !profileResult || profileResult.length === 0) {
//       await supabase.auth.admin.deleteUser(user.id);
//       return res.status(500).json({ detail: "Failed to create user profile" });
//     }

//     return res.status(200).json({
//       message: "Signup initiated, please verify phone with OTP",
//       user_id: user.id,
//     });
//   } catch (e) {
//     if (e.message?.includes("User already registered")) {
//       return res
//         .status(400)
//         .json({ detail: "Phone number already registered" });
//     }
//     return res.status(500).json({ detail: `Signup failed: ${e.message}` });
//   }
// };

const signupUser = async (req, res) => {
  const { name, email } = req.body;
  const supabase = getSupabase();

  try {
    if (!name || !email) {
      return res.status(400).json({ detail: "Name and email required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ✅ STEP 1: Check AUTH (source of truth)
    const { data: usersData } = await supabase.auth.admin.listUsers();

    let user = usersData.users.find(
      (u) => u.email === normalizedEmail
    );

    const tempPassword = "Zaki@123";

    // ✅ STEP 2: Create user only if not exists
    if (!user) {
      const { data: userResponse, error: signUpError } =
        await supabase.auth.admin.createUser({
          email: normalizedEmail,
          password: tempPassword,
          email_confirm: true,
        });

      if (signUpError) {
        return res.status(400).json({ detail: signUpError.message });
      }

      user = userResponse.user;
    }

    console.log("user", user);

    // ✅ STEP 3: UPSERT profile (no duplicate crash)
    const profileData = {
      user_id: user.id,
      name,
      email: normalizedEmail,
      created_at: getCurrentTimestamp(),
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profileData, { onConflict: "user_id" });

    if (profileError) {
      return res.status(500).json({
        detail: "Failed to create/update profile",
      });
    }

    return res.status(200).json({
      message: "Signup successful (DEV MODE)",
      user_id: user.id,
      tempPassword,
    });
  } catch (e) {
    return res.status(500).json({
      detail: `Signup failed: ${e.message}`,
    });
  }
};
// ─── Verify Phone OTP ─────────────────────────────────────────────────────────

const verifyPhoneOtp = async (req, res) => {
  const { phone, otp } = req.body;
  const supabase = getSupabase();

  try {
    const { profile, matchedPhone } = await findUserByPhone(phone, supabase);

    if (!profile) {
      return res.status(404).json({ detail: "Phone number not found" });
    }

    let otpPhone = matchedPhone || phone;
    otpPhone = toE164(otpPhone);

    const { data: sessionResponse, error } = await supabase.auth.verifyOtp({
      phone: otpPhone,
      token: otp,
      type: "sms",
    });

    if (error || !sessionResponse?.user) {
      return res.status(400).json({ detail: "Invalid OTP" });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        phone_verified: true,
        updated_at: getCurrentTimestamp(),
      })
      .eq("phone", matchedPhone);

    if (updateError) {
      return res
        .status(500)
        .json({ detail: "Failed to update verification status" });
    }

    if (sessionResponse.session) {
      // Login flow
      return res.status(200).json({
        access_token: sessionResponse.session.access_token,
        refresh_token: sessionResponse.session.refresh_token,
        token_type: "bearer",
        expires_in: sessionResponse.session.expires_in,
        user: {
          id: sessionResponse.user.id,
          email: sessionResponse.user.email,
          phone: sessionResponse.user.phone,
        },
        message: "Phone verified and login successful",
      });
    }

    // Signup flow
    return res.status(200).json({
      message: "Phone verified successfully, please verify email next",
      user_id: sessionResponse.user.id,
    });
  } catch (e) {
    const msg = e.message || "";
    if (msg.includes("Invalid token") || msg.toLowerCase().includes("expired")) {
      return res.status(400).json({ detail: "Invalid or expired OTP" });
    }
    return res
      .status(500)
      .json({ detail: `Verification failed: ${e.message}` });
  }
};

// ─── Send Email OTP ───────────────────────────────────────────────────────────

const sendEmailOtp = async (req, res) => {
  const { email } = req.query;
  const supabase = getSupabase();

  try {
    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("user_id, name, email_verified")
      .eq("email", email);

    if (error || !profileData || profileData.length === 0) {
      return res.status(404).json({ detail: "Email not found" });
    }

    const profile = profileData[0];
    const { user_id: userId, name: userName = "User" } = profile;
    const otp = generateOtp();

    // Delete existing OTPs for this email
    await supabase.from("otp_verifications").delete().eq("email", email);

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const otpData = {
      user_id: userId,
      email,
      otp,
      expires_at: expiresAt,
      created_at: getCurrentTimestamp(),
    };

    const { data: otpResult, error: otpError } = await supabase
      .from("otp_verifications")
      .insert(otpData)
      .select();

    if (otpError || !otpResult || otpResult.length === 0) {
      return res.status(500).json({ detail: "Failed to generate OTP" });
    }

    const emailSent = await sendEmailOtpService(email, otp, userName);

    if (!emailSent) {
      console.log(`Email service failed. OTP for ${email}: ${otp}`);
      return res.status(200).json({
        message: "OTP generated (email service unavailable - check console)",
      });
    }

    return res.status(200).json({ message: "OTP sent to email" });
  } catch (e) {
    return res
      .status(500)
      .json({ detail: `Failed to send OTP: ${e.message}` });
  }
};

// ─── Verify Email OTP ─────────────────────────────────────────────────────────

const verifyEmailOtp = async (req, res) => {
  const { email, otp } = req.body;
  const supabase = getSupabase();

  try {
    const currentTime = new Date().toISOString();

    const { data: verificationData, error: verifyError } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("email", email)
      .eq("otp", otp)
      .gt("expires_at", currentTime);

    if (verifyError || !verificationData || verificationData.length === 0) {
      return res.status(400).json({ detail: "Invalid or expired OTP" });
    }

    const { user_id: userId } = verificationData[0];

    // Mark email as verified
    await supabase
      .from("profiles")
      .update({
        email_verified: true,
        updated_at: getCurrentTimestamp(),
      })
      .eq("email", email);

    // Delete used OTP
    await supabase
      .from("otp_verifications")
      .delete()
      .eq("email", email)
      .eq("otp", otp);

    // Get profile for phone check
    const { data: profileData } = await supabase
      .from("profiles")
      .select("phone_verified, phone")
      .eq("email", email);

    if (profileData && profileData[0]?.phone_verified) {
      // Login flow — create custom session
      const phone = profileData[0].phone;
      const customSession = createCustomSession(userId, email, phone);

      if (customSession) {
        return res.status(200).json({
          ...customSession,
          user: { id: userId, email, phone },
          message: "Email verified and login successful (custom session)",
          session_type: "custom",
        });
      }

      // Final fallback
      return res.status(200).json({
        message: "Email verified but session creation failed",
        user_id: userId,
        email,
        requires_manual_session: true,
      });
    }

    // Signup verification
    return res.status(200).json({
      message: "Email verified successfully. Signup complete!",
      user_id: userId,
    });
  } catch (e) {
    return res
      .status(500)
      .json({ detail: `Verification failed: ${e.message}` });
  }
};

// ─── Login with Phone ─────────────────────────────────────────────────────────

const loginPhone = async (req, res) => {
  const { phone } = req.query;
  const supabase = getSupabase();

  try {
    const { profile, matchedPhone } = await findUserByPhone(phone, supabase);

    if (!profile) {
      return res.status(404).json({ detail: "Phone number not registered" });
    }

    let otpPhone = matchedPhone || phone;
    otpPhone = toE164(otpPhone);

    await supabase.auth.signInWithOtp({ phone: otpPhone });

    const verificationStatus = profile.phone_verified ? "verified" : "unverified";

    return res.status(200).json({
      message: `OTP sent to phone. Phone status: ${verificationStatus}`,
      verification_status: verificationStatus,
      matched_phone: matchedPhone,
    });
  } catch (e) {
    return res
      .status(500)
      .json({ detail: `Failed to send OTP: ${e.message}` });
  }
};

// ─── Verify Phone Login ───────────────────────────────────────────────────────
// Same as verifyPhoneOtp — delegates directly

const verifyPhoneLogin = (req, res) => verifyPhoneOtp(req, res);

// ─── Login with Email ─────────────────────────────────────────────────────────

// const loginEmail = async (req, res) => {
//   const { email } = req.query;
//   const supabase = getSupabase();

//   try {
//     const { data: profileData, error } = await supabase
//       .from("profiles")
//       .select("*")
//       .eq("email", email);

//     if (error || !profileData || profileData.length === 0) {
//       return res.status(404).json({ detail: "Email not registered" });
//     }

//     const profile = profileData[0];
//     const { user_id: userId, name: userName = "User" } = profile;
//     const otp = generateOtp();

//     // Delete existing OTPs
//     await supabase.from("otp_verifications").delete().eq("email", email);

//     const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
//     const otpData = {
//       user_id: userId,
//       email,
//       otp,
//       expires_at: expiresAt,
//       created_at: getCurrentTimestamp(),
//     };

//     const { data: otpResult, error: otpError } = await supabase
//       .from("otp_verifications")
//       .insert(otpData)
//       .select();

//     if (otpError || !otpResult || otpResult.length === 0) {
//       return res.status(500).json({ detail: "Failed to generate OTP" });
//     }

//     const emailSent = await sendEmailOtpService(email, otp, userName);
//     const verificationStatus = profile.email_verified ? "verified" : "unverified";

//     if (!emailSent) {
//       console.log(`Email service failed. OTP for ${email}: ${otp}`);
//       return res.status(200).json({
//         message: `OTP generated (email service unavailable - check console). Email status: ${verificationStatus}`,
//         verification_status: verificationStatus,
//       });
//     }

//     return res.status(200).json({
//       message: `OTP sent to email. Email status: ${verificationStatus}`,
//       verification_status: verificationStatus,
//     });
//   } catch (e) {
//     return res
//       .status(500)
//       .json({ detail: `Failed to send OTP: ${e.message}` });
//   }
// };
const loginEmail = async (req, res) => {
  const { email } = req.body;
  const supabase = getSupabase();

  try {
    if (!email) {
      return res.status(400).json({ detail: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", normalizedEmail);

    if (error || !profileData || profileData.length === 0) {
      return res.status(404).json({ detail: "Email not registered" });
    }

    const profile = profileData[0];

    return res.status(200).json({
      message: "Login successful (DEV MODE)",
      user_id: profile.user_id,
      name: profile.name,
      email: profile.email,
    });
  } catch (e) {
    return res.status(500).json({
      detail: `Login failed: ${e.message}`,
    });
  }
};
// ─── Verify Email Login ───────────────────────────────────────────────────────
// Same as verifyEmailOtp — delegates directly

const verifyEmailLogin = (req, res) => verifyEmailOtp(req, res);

// ─── Login with Email + Password ─────────────────────────────────────────────

const loginEmailPassword = async (req, res) => {
  const { email, password } = req.body;
  const supabase = getSupabase();

  try {
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (authError || !authData?.user) {
      return res.status(401).json({ detail: "Invalid email or password" });
    }

    if (!authData.session) {
      return res.status(401).json({ detail: "Authentication failed" });
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", authData.user.id);

    const profile = profileData?.[0] ?? {};

    return res.status(200).json({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      token_type: "bearer",
      expires_in: authData.session.expires_in,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        phone: authData.user.phone,
        name: profile.name ?? "",
        phone_verified: profile.phone_verified ?? false,
        email_verified: profile.email_verified ?? false,
      },
      message: "Login successful",
    });
  } catch (e) {
    const msg = e.message || "";
    if (
      msg.includes("Invalid login credentials") ||
      msg.includes("Invalid email or password")
    ) {
      return res.status(401).json({ detail: "Invalid email or password" });
    }
    if (msg.includes("Email not confirmed")) {
      return res.status(400).json({
        detail: "Email not verified. Please verify your email first.",
      });
    }
    return res.status(500).json({ detail: `Login failed: ${e.message}` });
  }
};

// ─── Get User Profile ─────────────────────────────────────────────────────────

const getUserProfile = async (req, res) => {
  const { user_id } = req.params;
  const supabase = getSupabase();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user_id);

    if (error || !data || data.length === 0) {
      return res.status(404).json({ detail: "User profile not found" });
    }

    return res.status(200).json(data[0]);
  } catch (e) {
    return res
      .status(500)
      .json({ detail: `Failed to fetch profile: ${e.message}` });
  }
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────

const resendOtp = async (req, res) => {
  const { identifier, otp_type } = req.query;

  if (otp_type === "phone") {
    req.query.phone = identifier;
    return loginPhone(req, res);
  } else if (otp_type === "email") {
    req.query.email = identifier;
    return loginEmail(req, res);
  } else {
    return res
      .status(400)
      .json({ detail: "Invalid OTP type. Use 'phone' or 'email'" });
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────

const logout = async (req, res) => {
  const supabase = getSupabase();
  try {
    await supabase.auth.signOut();
    return res.status(200).json({ message: "Logged out successfully" });
  } catch {
    return res.status(200).json({
      message: "Logout completed (client-side token removal required)",
    });
  }
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

const refreshToken = async (req, res) => {
  const { refresh_token } = req.query;

  try {
    const result = await refreshAccessToken(refresh_token);
    return res.status(200).json(result);
  } catch (e) {
    return res
      .status(e.statusCode || 401)
      .json({ detail: e.message });
  }
};

// ─── Refresh Custom Token ─────────────────────────────────────────────────────

const refreshCustomToken = async (req, res) => {
  const { refresh_token } = req.query;

  try {
    const payload = verifyCustomToken(refresh_token);

    if (payload.type !== "refresh") {
      return res.status(401).json({ detail: "Invalid refresh token" });
    }

    const { sub: userId, email, phone } = payload;
    const newSession = createCustomSession(userId, email, phone);

    if (newSession) {
      return res.status(200).json(newSession);
    }

    return res.status(500).json({ detail: "Failed to refresh token" });
  } catch (e) {
    return res
      .status(e.statusCode || 500)
      .json({ detail: `Token refresh failed: ${e.message}` });
  }
};

module.exports = {
  signupUser,
  verifyPhoneOtp,
  sendEmailOtp,
  verifyEmailOtp,
  loginPhone,
  verifyPhoneLogin,
  loginEmail,
  verifyEmailLogin,
  loginEmailPassword,
  getUserProfile,
  resendOtp,
  logout,
  refreshToken,
  refreshCustomToken,
};
