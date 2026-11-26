const express = require("express");
const router = express.Router();
const User = require("../Model/User");
const LanguageHistory = require("../Model/LanguageHistory");
const { verifyToken } = require("../middleware/auth");
const { sendOtp: sendOtpEmail } = require("../utils/mailer");

// In-memory OTP store for French language verification: userId -> { otp, expiresAt }
const frenchLanguageOtpStore = new Map();

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "fr", name: "French", nativeName: "Français" },
];

function parseBrowserInfo(userAgent = "") {
  let browser = "Unknown Browser";
  if (/chrome|crios/i.test(userAgent) && !/edg/i.test(userAgent)) {
    browser = "Chrome";
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    browser = "Safari";
  } else if (/firefox|fxios/i.test(userAgent)) {
    browser = "Firefox";
  } else if (/edg/i.test(userAgent)) {
    browser = "Edge";
  }
  return browser;
}

// 1. Get supported languages and current user's language
router.get("/current", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const currentLang = user ? user.language || "en" : "en";

    return res.json({
      language: currentLang,
      supportedLanguages: SUPPORTED_LANGUAGES,
    });
  } catch (error) {
    console.error("Get language error:", error);
    return res.status(500).json({ error: "Failed to fetch language settings" });
  }
});

// 2. Change language with CRITICAL RULE: Intercept French with OTP
router.post("/change", verifyToken, async (req, res) => {
  try {
    const { language, otp } = req.body;

    if (!language) {
      return res.status(400).json({ error: "Target language code is required" });
    }

    const normalizedLang = language.toLowerCase().trim();
    const isSupported = SUPPORTED_LANGUAGES.some(
      (l) => l.code === normalizedLang || l.name.toLowerCase() === normalizedLang
    );

    if (!isSupported) {
      return res.status(400).json({
        error: `Unsupported language: '${language}'. Supported: ${SUPPORTED_LANGUAGES.map((l) => l.code).join(", ")}`,
      });
    }

    // Standardize code
    const langObj = SUPPORTED_LANGUAGES.find(
      (l) => l.code === normalizedLang || l.name.toLowerCase() === normalizedLang
    );
    const targetCode = langObj.code;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const oldLanguage = user.language || "en";
    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "";
    const browser = parseBrowserInfo(userAgent);

    // CRITICAL RULE: French language requires OTP interception
    if (targetCode === "fr") {
      const pendingRecord = frenchLanguageOtpStore.get(String(req.user.id));

      if (!otp) {
        // Generate new 6-digit OTP
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        frenchLanguageOtpStore.set(String(req.user.id), {
          otp: generatedOtp,
          expiresAt,
          targetLanguage: "fr",
        });

        // Send OTP via mailer (real email or console fallback)
        await sendOtpEmail(user.email, generatedOtp, user.name, "French Language Switch");

        return res.status(202).json({
          requireOtp: true,
          targetLanguage: "fr",
          message:
            "Security check: Changing language to French requires OTP verification. An OTP has been sent to your registered email.",
        });
      }

      // If OTP was provided, verify it
      if (!pendingRecord) {
        return res.status(400).json({
          error: "No pending OTP request found for French language switch. Please request a new OTP.",
          requireOtp: true,
        });
      }

      if (Date.now() > pendingRecord.expiresAt) {
        frenchLanguageOtpStore.delete(String(req.user.id));
        return res.status(400).json({
          error: "OTP has expired. Please request a new OTP to change language to French.",
          requireOtp: true,
        });
      }

      if (String(otp).trim() !== pendingRecord.otp) {
        return res.status(400).json({
          error: "Invalid OTP. Please check your email and try again.",
          requireOtp: true,
        });
      }

      // OTP verified! Clear OTP
      frenchLanguageOtpStore.delete(String(req.user.id));
    }

    // Update user profile in DB
    user.language = targetCode;
    await user.save();

    // Log language change audit history
    const historyEntry = new LanguageHistory({
      userId: String(user._id),
      userEmail: user.email,
      oldLanguage,
      newLanguage: targetCode,
      ip,
      browser,
      userAgent,
      otpRequired: targetCode === "fr",
      otpVerified: targetCode === "fr",
      timestamp: new Date(),
    });
    await historyEntry.save();

    console.log(
      `🌐 [I18N AUDIT] Language updated for ${user.email}: ${oldLanguage} -> ${targetCode} (IP: ${ip}, Browser: ${browser}, OTP Verified: ${targetCode === "fr"})`
    );

    return res.json({
      success: true,
      language: targetCode,
      languageName: langObj.name,
      message: `Language successfully changed to ${langObj.name} (${targetCode})`,
      historyId: historyEntry._id,
    });
  } catch (error) {
    console.error("Change language error:", error);
    return res.status(500).json({ error: "Failed to update language" });
  }
});

// 3. Get user's language change audit history
router.get("/history", verifyToken, async (req, res) => {
  try {
    const history = await LanguageHistory.find({ userId: String(req.user.id) });
    return res.json({ history });
  } catch (error) {
    console.error("Get language history error:", error);
    return res.status(500).json({ error: "Failed to retrieve language history" });
  }
});

module.exports = {
  router,
  SUPPORTED_LANGUAGES,
};
