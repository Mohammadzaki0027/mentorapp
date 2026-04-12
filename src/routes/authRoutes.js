const express = require("express");
const router = express.Router();

const {
  getCurrentUser,
} = require("../middleware/authMiddleware");

const {
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
} = require("../controllers/authController");

// ─── Public Routes ────────────────────────────────────────────────────────────

// POST /auth/signup
router.post("/signup", signupUser);

// POST /auth/verify_phone_otp   body: { phone, otp }
router.post("/verify_phone_otp", verifyPhoneOtp);

// POST /auth/send_email_otp   query: ?email=
router.post("/send_email_otp", sendEmailOtp);

// POST /auth/verify_email_otp   body: { email, otp }
router.post("/verify_email_otp", verifyEmailOtp);

// POST /auth/login_phone   query: ?phone=
router.post("/login_phone", loginPhone);

// POST /auth/verify_phone_login   body: { phone, otp }
router.post("/verify_phone_login", verifyPhoneLogin);

// POST /auth/login_email   query: ?email=
router.post("/login_email", loginEmail);

// POST /auth/verify_email_login   body: { email, otp }
router.post("/verify_email_login", verifyEmailLogin);

// POST /auth/login_email_password   body: { email, password }
router.post("/login_email_password", loginEmailPassword);

// GET /auth/profile/:user_id
router.get("/profile/:user_id", getUserProfile);

// POST /auth/resend_otp   query: ?identifier=&otp_type=phone|email
router.post("/resend_otp", resendOtp);

// POST /auth/refresh-token   query: ?refresh_token=
router.post("/refresh-token", refreshToken);

// POST /auth/refresh-custom-token   query: ?refresh_token=
router.post("/refresh-custom-token", refreshCustomToken);

// ─── Protected Routes ─────────────────────────────────────────────────────────

// POST /auth/logout   (requires Bearer token)
router.post("/logout", getCurrentUser, logout);

module.exports = router;
