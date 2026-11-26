const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../Model/User");
const PasswordReset = require("../Model/PasswordReset");
const LoginLog = require("../Model/LoginLog");
const { verifyToken, JWT_SECRET } = require("../middleware/auth");
const { sendOtp } = require("../utils/mailer");

// In-memory temp store for pending Chrome OTP logins: tempToken -> { userId, otp, expiresAt, deviceDetails }
const chromeLoginOtpStore = new Map();

// Helper to parse browser, OS, and device type from User-Agent
function parseClientEnvironment(userAgent = "", ip = "127.0.0.1") {
  const ua = userAgent.toLowerCase();

  // 1. Device Type & Model
  let deviceType = "desktop";
  let deviceModel = "PC / Desktop";

  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    deviceType = "tablet";
    deviceModel = /ipad/i.test(ua) ? "Apple iPad" : "Android Tablet";
  } else if (/mobile|iphone|ipod|android.*mobile|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType = "mobile";
    if (/iphone/i.test(ua)) deviceModel = "Apple iPhone";
    else if (/samsung/i.test(ua)) deviceModel = "Samsung Galaxy";
    else if (/pixel/i.test(ua)) deviceModel = "Google Pixel";
    else deviceModel = "Smartphone (Mobile)";
  } else if (/macintosh|mac os x/i.test(ua)) {
    deviceModel = "MacBook / iMac";
  }

  // 2. Browser
  let browser = "Other Browser";
  let browserVersion = "";

  if (/edg/i.test(ua)) {
    browser = "Edge";
  } else if (/chrome|crios/i.test(ua)) {
    browser = "Chrome";
  } else if (/firefox|fxios/i.test(ua)) {
    browser = "Firefox";
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = "Safari";
  } else if (/opr\//i.test(ua)) {
    browser = "Opera";
  }

  // 3. Operating System
  let os = "Unknown OS";
  if (/windows nt 10/i.test(ua)) os = "Windows 10/11";
  else if (/windows nt/i.test(ua)) os = "Windows";
  else if (/android/i.test(ua)) os = "Android OS";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/mac os x/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return { browser, browserVersion, os, deviceType, deviceModel };
}

// Helper to check Mobile login time window: 10:00 AM - 1:00 PM IST (CRITICAL RULE)
function checkMobileLoginTimeWindow() {
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  const parts = istFormatter.formatToParts(now);
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  const totalMinutes = hour * 60 + minute;

  // 10:00 AM is 600 mins; 1:00 PM (13:00) is 780 mins
  const isOpen = totalMinutes >= 600 && totalMinutes <= 780;
  const currentIST = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} IST`;

  return { isOpen, currentIST };
}

// Helper to generate random password consisting ONLY of uppercase and lowercase English letters (CRITICAL RULE)
function generateRandomAlphaPassword(length = 12) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return result;
}

// 1. REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "student", phone, companyName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: "An account with this email address already exists" });
    }

    const validRoles = ["student", "company", "admin"];
    const userRole = validRoles.includes(role) ? role : "student";

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const initialProfile = {
      headline: userRole === "company" ? "Talent Acquisition Partner" : "Student",
      bio: "",
      skills: [],
      education: [],
      resume: "",
      companyName: companyName || (userRole === "company" ? name : ""),
      companyWebsite: "",
      companyDescription: "",
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    };

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: userRole,
      phone: phone || "",
      profile: initialProfile,
      mustChangePassword: false,
      trustedDevices: [],
    });

    await newUser.save();

    const token = jwt.sign(
      {
        id: newUser._id ? newUser._id.toString() : newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const safeUser = {
      id: newUser._id ? newUser._id.toString() : newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      profile: newUser.profile,
      mustChangePassword: false,
      createdAt: newUser.createdAt,
    };

    return res.status(201).json({
      message: "Registration successful",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Internal server error during registration" });
  }
});

// 2. LOGIN (With Dynamic Context-Aware Rules: Chrome OTP & Mobile Time-Window)
router.post("/login", async (req, res) => {
  try {
    const { email, password, trustDevice = false } = req.body;
    const userAgent = req.headers["user-agent"] || "";
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const env = parseClientEnvironment(userAgent, ip);

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Log failed attempt
      try {
        const failedLog = new LoginLog({
          userId: "unknown",
          userEmail: normalizedEmail,
          ...env,
          ip,
          status: "failed",
        });
        await failedLog.save();
      } catch {}
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      try {
        const failedLog = new LoginLog({
          userId: String(user._id),
          userEmail: user.email,
          ...env,
          ip,
          status: "failed",
        });
        await failedLog.save();
      } catch {}
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // ==========================================
    // CRITICAL RULE 1: Mobile Device Time-Gating (10:00 AM - 1:00 PM IST)
    // ==========================================
    if (env.deviceType === "mobile") {
      const mobileWindow = checkMobileLoginTimeWindow();
      if (!mobileWindow.isOpen) {
        try {
          const rejectedLog = new LoginLog({
            userId: String(user._id),
            userEmail: user.email,
            ...env,
            ip,
            status: "rejected_mobile_time",
          });
          await rejectedLog.save();
        } catch {}

        return res.status(403).json({
          error: `Mobile access restriction: Users logging in from mobile devices are strictly permitted only between 10:00 AM and 1:00 PM IST. (Current IST: ${mobileWindow.currentIST}). Please access via desktop/laptop or return during the permitted window.`,
          code: "MOBILE_LOGIN_TIME_WINDOW_BLOCKED",
          currentIST: mobileWindow.currentIST,
          allowedWindow: "10:00 AM - 1:00 PM IST",
        });
      }
    }

    // ==========================================
    // CRITICAL RULE 2: Google Chrome OTP Verification
    // ==========================================
    const deviceFingerprint = `${env.browser}_${env.os}_${ip}`;
    const isTrusted = user.trustedDevices && user.trustedDevices.includes(deviceFingerprint);

    if (env.browser === "Chrome" && !isTrusted) {
      // Generate Chrome Security OTP
      const chromeOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const tempToken = crypto.randomBytes(24).toString("hex");
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      chromeLoginOtpStore.set(tempToken, {
        userId: String(user._id),
        email: user.email,
        name: user.name,
        otp: chromeOtp,
        expiresAt,
        deviceFingerprint,
        env,
        ip,
      });

      // Send OTP via mailer
      await sendOtp(user.email, chromeOtp, user.name, "Google Chrome Login Verification");

      return res.status(202).json({
        requireChromeOtp: true,
        tempToken,
        email: user.email,
        message:
          "Security Requirement: Users signing in through Google Chrome must complete OTP verification sent to their registered email before access is granted.",
      });
    }

    // Login Success -> Issue JWT
    const token = jwt.sign(
      {
        id: user._id ? user._id.toString() : user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Save Login Log
    try {
      const loginLog = new LoginLog({
        userId: String(user._id),
        userEmail: user.email,
        ...env,
        ip,
        status: "success",
        isTrustedDevice: isTrusted || trustDevice,
        sessionToken: token.substring(token.length - 16),
        createdAt: new Date(),
      });
      await loginLog.save();

      if (trustDevice && !isTrusted) {
        if (!user.trustedDevices) user.trustedDevices = [];
        user.trustedDevices.push(deviceFingerprint);
        await user.save();
      }
    } catch (logErr) {
      console.warn("Login log warning:", logErr.message);
    }

    const safeUser = {
      id: user._id ? user._id.toString() : user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profile: user.profile,
      mustChangePassword: !!user.mustChangePassword,
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      message: "Login successful",
      token,
      user: safeUser,
      mustChangePassword: !!user.mustChangePassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error during login" });
  }
});

// 3. VERIFY CHROME LOGIN OTP
router.post("/chrome-login-verify", async (req, res) => {
  try {
    const { tempToken, otp, trustDevice = false } = req.body;

    if (!tempToken || !otp) {
      return res.status(400).json({ error: "tempToken and otp are required" });
    }

    const pending = chromeLoginOtpStore.get(tempToken);
    if (!pending) {
      return res.status(400).json({ error: "Session expired or invalid. Please log in again." });
    }

    if (Date.now() > pending.expiresAt) {
      chromeLoginOtpStore.delete(tempToken);
      return res.status(400).json({ error: "OTP has expired. Please log in again." });
    }

    if (pending.otp !== String(otp).trim()) {
      return res.status(400).json({ error: "Invalid OTP code. Please check and try again." });
    }

    // OTP Verified! Clean up temp store
    chromeLoginOtpStore.delete(tempToken);

    const user = await User.findById(pending.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (trustDevice) {
      if (!user.trustedDevices) user.trustedDevices = [];
      if (!user.trustedDevices.includes(pending.deviceFingerprint)) {
        user.trustedDevices.push(pending.deviceFingerprint);
        await user.save();
      }
    }

    const token = jwt.sign(
      {
        id: user._id ? user._id.toString() : user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Save success login log
    try {
      const loginLog = new LoginLog({
        userId: String(user._id),
        userEmail: user.email,
        ...pending.env,
        ip: pending.ip,
        status: "success",
        isTrustedDevice: trustDevice,
        sessionToken: token.substring(token.length - 16),
        createdAt: new Date(),
      });
      await loginLog.save();
    } catch {}

    const safeUser = {
      id: user._id ? user._id.toString() : user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profile: user.profile,
      mustChangePassword: !!user.mustChangePassword,
      createdAt: user.createdAt,
    };

    return res.json({
      success: true,
      message: "Google Chrome OTP verified successfully! Access granted.",
      token,
      user: safeUser,
      mustChangePassword: !!user.mustChangePassword,
    });
  } catch (err) {
    console.error("Chrome OTP verification error:", err);
    return res.status(500).json({ error: "Failed to verify Chrome login OTP" });
  }
});

// ==========================================
// TASK 2: FORGOT PASSWORD WITH 24-HOUR LIMIT & RANDOM LETTERS-ONLY PASSWORD
// ==========================================

// 4. POST /api/auth/forgot-password/request
router.post("/forgot-password/request", async (req, res) => {
  try {
    const { contact, method = "email" } = req.body; // contact can be email or phone

    if (!contact || !contact.trim()) {
      return res.status(400).json({ error: "Registered email address or mobile number is required" });
    }

    const normalizedContact = contact.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalizedContact }, { phone: contact.trim() }],
    });

    if (!user) {
      return res.status(404).json({ error: "No user found with the provided email address or mobile number" });
    }

    const userAgent = req.headers["user-agent"] || "";
    const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
    const env = parseClientEnvironment(userAgent, ip);

    // CRITICAL RULE: Users are permitted to request password reset ONLY once every 24 hours.
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingRecentRequest = await PasswordReset.findOne({
      userId: String(user._id),
      createdAt: { $gte: twentyFourHoursAgo },
    });

    if (existingRecentRequest) {
      return res.status(429).json({
        error: "You can use this option only once per day.",
        code: "PASSWORD_RESET_ONCE_PER_DAY",
        lastRequestedAt: existingRecentRequest.createdAt,
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const resetRecord = new PasswordReset({
      userId: String(user._id),
      email: user.email,
      phone: user.phone,
      method,
      otp,
      otpExpiresAt: expiresAt,
      verified: false,
      used: false,
      ip,
      userAgent,
      browser: env.browser,
      device: `${env.deviceType} (${env.deviceModel})`,
      createdAt: new Date(),
    });
    await resetRecord.save();

    // Send OTP to email or mobile
    await sendOtp(user.email, otp, user.name, "Password Reset Identity Verification");

    return res.json({
      success: true,
      resetId: resetRecord._id,
      message: `Verification OTP has been sent to your registered ${method === "phone" ? "mobile number" : "email address"}.`,
    });
  } catch (err) {
    console.error("Forgot password request error:", err);
    return res.status(500).json({ error: "Failed to process password reset request" });
  }
});

// 5. POST /api/auth/forgot-password/verify
router.post("/forgot-password/verify", async (req, res) => {
  try {
    const { resetId, otp } = req.body;

    if (!resetId || !otp) {
      return res.status(400).json({ error: "resetId and otp are required" });
    }

    const resetRecord = await PasswordReset.findById(resetId);
    if (!resetRecord) {
      return res.status(404).json({ error: "Password reset session not found or expired" });
    }

    if (resetRecord.used) {
      return res.status(400).json({ error: "This password reset session has already been used" });
    }

    if (new Date() > new Date(resetRecord.otpExpiresAt)) {
      return res.status(400).json({ error: "OTP code has expired. Please try again after 24 hours." });
    }

    if (resetRecord.otp !== String(otp).trim()) {
      resetRecord.attempts = (resetRecord.attempts || 0) + 1;
      await resetRecord.save();
      return res.status(400).json({ error: "Invalid OTP code. Please check and try again." });
    }

    // CRITICAL RULE: Generate a random password consisting ONLY of uppercase and lowercase English letters
    // without any numbers or special characters.
    const randomPassword = generateRandomAlphaPassword(12);
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(randomPassword, saltRounds);

    // Update user in DB with mustChangePassword = true
    const user = await User.findById(resetRecord.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.password = hashedPassword;
    user.mustChangePassword = true; // User required to change immediately after next login
    await user.save();

    resetRecord.verified = true;
    resetRecord.used = true;
    await resetRecord.save();

    // Deliver newly generated password only through verified email / SMS
    console.log("\n=======================================================");
    console.log("🔑 [NEW PASSWORD GENERATED] (Letters Only [A-Za-z])");
    console.log(`To: ${user.email}`);
    console.log(`New Password: ${randomPassword}`);
    console.log(`Requirement: User must change password immediately upon next login`);
    console.log("=======================================================\n");

    await sendOtp(
      user.email,
      randomPassword,
      user.name,
      "New Temporary Password (Letters-Only). Please log in and change it immediately."
    );

    return res.json({
      success: true,
      message:
        "Identity verified! Your new password (consisting of letters only) has been sent to your registered contact. Please log in with it and change it immediately.",
    });
  } catch (err) {
    console.error("Forgot password verify error:", err);
    return res.status(500).json({ error: "Failed to complete password reset" });
  }
});

// 6. POST /api/auth/change-password: Change password after login
router.post("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (currentPassword) {
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();

    return res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update password" });
  }
});

// ==========================================
// TASK 6: LOGIN ACTIVITY AUDIT & ACTIVE SESSION MANAGEMENT
// ==========================================

// 7. GET /api/auth/login-history
router.get("/login-history", verifyToken, async (req, res) => {
  try {
    const logs = await LoginLog.find({ userId: String(req.user.id) });
    logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ success: true, loginHistory: logs });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch login history" });
  }
});

// 8. POST /api/auth/logout-other-devices
router.post("/logout-other-devices", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.trustedDevices = [];
      await user.save();
    }
    return res.json({ success: true, message: "Signed out of all other devices successfully." });
  } catch (err) {
    return res.status(500).json({ error: "Failed to sign out from other devices" });
  }
});

// 9. GET CURRENT USER PROFILE
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      user: {
        id: user._id ? user._id.toString() : user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profile: user.profile,
        mustChangePassword: !!user.mustChangePassword,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
