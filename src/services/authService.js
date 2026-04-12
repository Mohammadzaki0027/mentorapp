const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { getJwtSecret, getJwtAlgorithm } = require("../config/jwtConfig");

const JWT_SECRET = getJwtSecret();
const JWT_ALGORITHM = getJwtAlgorithm();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getCurrentTimestamp = () => {
  return new Date().toISOString().replace("T", " ").split(".")[0];
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const isEmail = (identifier) => identifier.includes("@");

// ─── Email Service ────────────────────────────────────────────────────────────

const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || "587");
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

const sendEmailOtpService = async (email, otp, userName = "User") => {
  try {
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: false,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your OTP Code</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Verification Code</h1>
          </div>
          <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px; border: 1px solid #ddd; border-top: none;">
              <h2 style="color: #333; margin-top: 0;">Hello ${userName}!</h2>
              <p style="font-size: 16px; margin-bottom: 30px;">
                  We received a request to verify your account. Use the following OTP code to complete your verification:
              </p>
              <div style="background: white; border: 2px dashed #667eea; border-radius: 10px; padding: 25px; text-align: center; margin: 30px 0;">
                  <h1 style="color: #667eea; font-size: 36px; margin: 0; letter-spacing: 5px; font-weight: bold;">${otp}</h1>
              </div>
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; color: #856404; font-size: 14px;">
                      <strong>⚠️ Important:</strong> This code will expire in 5 minutes. Don't share this code with anyone.
                  </p>
              </div>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  If you didn't request this code, please ignore this email or contact our support team.
              </p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                  This is an automated message, please do not reply to this email.
              </p>
          </div>
      </body>
      </html>
    `;

    const textContent = `
      Hello ${userName}!

      We received a request to verify your account. Use the following OTP code to complete your verification:

      OTP Code: ${otp}

      This code will expire in 5 minutes. Don't share this code with anyone.

      If you didn't request this code, please ignore this email or contact our support team.
    `;

    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: "Your OTP Code",
      text: textContent,
      html: htmlContent,
    });

    console.log(`Email OTP sent successfully to ${email}`);
    return true;
  } catch (e) {
    console.log(`Failed to send email OTP to ${email}: ${e.message}`);
    return false;
  }
};

// ─── Phone Utilities ──────────────────────────────────────────────────────────

const normalizePhoneNumber = (phone) => {
  if (!phone) return "";

  const cleaned = phone.replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+")) return cleaned;

  if (cleaned.length >= 10) {
    if (
      cleaned.length === 10 &&
      ["9", "8", "7", "6"].includes(cleaned[0])
    ) {
      return `+91${cleaned}`;
    }
    return `+${cleaned}`;
  }

  return cleaned;
};

const findUserByPhone = async (phone, supabase) => {
  const normalizedPhone = normalizePhoneNumber(phone);

  const phoneVariations = [
    ...new Set([
      phone,
      normalizedPhone,
      phone.replace(/[+\-\s()]/g, ""),
      normalizedPhone.replace("+", ""),
    ]),
  ].filter(Boolean);

  for (const variant of phoneVariations) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("phone", variant);

      if (data && data.length > 0) {
        return { profile: data[0], matchedPhone: variant };
      }
    } catch {
      continue;
    }
  }

  return { profile: null, matchedPhone: null };
};

const toE164 = (phone) => {
  if (phone.startsWith("+")) return phone;
  if (
    phone.length === 10 &&
    ["9", "8", "7", "6"].includes(phone[0])
  ) {
    return `+91${phone}`;
  }
  return `+${phone}`;
};

// ─── Custom JWT Session ───────────────────────────────────────────────────────

const createCustomSession = (userId, email, phone = null) => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 604800; // 7 days

    const accessPayload = {
      sub: userId,
      email,
      phone,
      iat: now,
      exp: now + expiresIn,
      type: "access",
    };

    const refreshPayload = {
      sub: userId,
      email,
      iat: now,
      exp: now + 30 * 24 * 3600, // 30 days
      type: "refresh",
    };

    const accessToken = jwt.sign(accessPayload, JWT_SECRET, {
      algorithm: JWT_ALGORITHM,
      noTimestamp: true, // we set iat manually
    });

    const refreshToken = jwt.sign(refreshPayload, JWT_SECRET, {
      algorithm: JWT_ALGORITHM,
      noTimestamp: true,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "bearer",
      expires_in: expiresIn,
    };
  } catch (e) {
    console.log(`Custom session creation failed: ${e.message}`);
    return null;
  }
};

const verifyCustomToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    });
  } catch (e) {
    if (e.name === "TokenExpiredError") {
      const error = new Error("Token expired");
      error.statusCode = 401;
      throw error;
    }
    const error = new Error("Invalid token");
    error.statusCode = 401;
    throw error;
  }
};

module.exports = {
  getCurrentTimestamp,
  generateOtp,
  isEmail,
  sendEmailOtpService,
  normalizePhoneNumber,
  findUserByPhone,
  toE164,
  createCustomSession,
  verifyCustomToken,
};
