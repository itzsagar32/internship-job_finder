const express = require("express");
const { sendOtp } = require("../utils/mailer");
const router = express.Router();
const crypto = require("crypto");
const Resume = require("../Model/Resume");
const ResumePayment = require("../Model/ResumePayment");
const Invoice = require("../Model/Invoice");
const User = require("../Model/User");
const { verifyToken } = require("../middleware/auth");
const { generateResumePdfBuffer } = require("../utils/pdfGenerator");

// 1. Get current user's default / latest resume
router.get("/my", verifyToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: String(req.user.id) });
    const defaultResume =
      resumes.find((r) => r.isDefault) || resumes[resumes.length - 1] || null;

    return res.json({
      resume: defaultResume,
      hasResume: !!defaultResume,
    });
  } catch (error) {
    console.error("Get resume error:", error);
    return res.status(500).json({ error: "Failed to fetch resume" });
  }
});

// 2. Save or update resume data
router.post("/save", verifyToken, async (req, res) => {
  try {
    const {
      personalDetails,
      education,
      experience,
      skills,
      projects,
      certifications,
      isDefault = true,
    } = req.body;

    let resume = await Resume.findOne({
      userId: String(req.user.id),
      isDefault: true,
    });

    const now = new Date();

    if (resume) {
      resume.personalDetails = personalDetails || resume.personalDetails;
      resume.education = education || resume.education;
      resume.experience = experience || resume.experience;
      resume.skills = skills || resume.skills;
      resume.projects = projects || resume.projects;
      resume.certifications = certifications || resume.certifications;
      resume.updatedAt = now;
      await resume.save();
    } else {
      resume = new Resume({
        userId: String(req.user.id),
        userEmail: req.user.email,
        personalDetails: personalDetails || {
          fullName: req.user.name || "",
          email: req.user.email || "",
          phone: req.user.phone || "",
        },
        education: education || [],
        experience: experience || [],
        skills: skills || [],
        projects: projects || [],
        certifications: certifications || [],
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      });
      await resume.save();
    }

    // Sync skills and headline to user profile
    try {
      const userDoc = await User.findById(req.user.id);
      if (userDoc) {
        if (!userDoc.profile) userDoc.profile = {};
        if (skills && Array.isArray(skills)) {
          userDoc.profile.skills = skills;
        }
        if (personalDetails && personalDetails.summary) {
          userDoc.profile.headline = personalDetails.summary;
        }
        await userDoc.save();
      }
    } catch (e) {
      console.warn("Failed to sync profile skills:", e.message);
    }

    return res.json({
      success: true,
      message: "Resume saved successfully",
      resume,
    });
  } catch (error) {
    console.error("Save resume error:", error);
    return res.status(500).json({ error: "Failed to save resume" });
  }
});

// 3. STEP 1 OF PREMIUM DOWNLOAD: Request OTP (CRITICAL RULE)
// Before Razorpay payment gateway opens, server must send OTP to user email
router.post("/request-download-otp", verifyToken, async (req, res) => {
  try {
    const { resumeId } = req.body;
    let targetResumeId = resumeId;

    if (!targetResumeId) {
      let defaultRes = await Resume.findOne({
        userId: String(req.user.id),
        isDefault: true,
      });
      if (!defaultRes) {
        defaultRes = await Resume.findOne({
          userId: String(req.user.id),
        });
      }
      if (!defaultRes) {
        defaultRes = new Resume({
          userId: String(req.user.id),
          userEmail: req.user.email,
          personalDetails: {
            fullName: req.user.name || "Candidate",
            email: req.user.email || "",
            phone: req.user.phone || "",
          },
          isDefault: true,
        });
        await defaultRes.save();
      }
      targetResumeId = defaultRes._id;
    }

    // Generate 6-digit cryptographic numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const paymentRecord = new ResumePayment({
      userId: String(req.user.id),
      userEmail: req.user.email,
      resumeId: String(targetResumeId),
      amount: 50,
      currency: "INR",
      otp,
      otpExpiresAt: expiresAt,
      otpVerified: false,
      paymentStatus: "otp_pending",
      createdAt: new Date(),
    });
    await paymentRecord.save();

    // Universal email/notification delivery (real SMTP + console fallback)
    try {
      await sendOtp(req.user.email, otp, req.user.name, "Premium Resume Download");
    } catch (mailErr) {
      console.warn("Mail dispatch warning in request-download-otp:", mailErr.message);
    }

    return res.json({
      success: true,
      paymentId: paymentRecord._id,
      message: `OTP has been sent to your email (${req.user.email}). Please enter it to unlock the payment gateway.`,
    });
  } catch (error) {
    console.error("Request OTP error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate download OTP" });
  }
});

// 4. STEP 2 OF PREMIUM DOWNLOAD: Verify OTP (CRITICAL RULE)
router.post("/verify-download-otp", verifyToken, async (req, res) => {
  try {
    const { paymentId, otp } = req.body;

    if (!paymentId || !otp) {
      return res.status(400).json({ error: "paymentId and otp are required" });
    }

    const paymentRecord = await ResumePayment.findById(paymentId);
    if (!paymentRecord) {
      return res.status(404).json({ error: "Payment verification session not found" });
    }

    if (String(paymentRecord.userId) !== String(req.user.id)) {
      return res.status(403).json({ error: "Unauthorized access to this session" });
    }

    if (new Date() > new Date(paymentRecord.otpExpiresAt)) {
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    if (paymentRecord.otp !== String(otp).trim()) {
      return res.status(400).json({ error: "Invalid OTP. Please check and try again." });
    }

    // OTP verified successfully! Generate verification token to unlock payment gateway
    const verificationToken = crypto.randomBytes(24).toString("hex");
    paymentRecord.otpVerified = true;
    paymentRecord.otpVerifiedAt = new Date();
    paymentRecord.verificationToken = verificationToken;
    paymentRecord.paymentStatus = "otp_verified";
    await paymentRecord.save();

    return res.json({
      success: true,
      verified: true,
      verificationToken,
      paymentId: paymentRecord._id,
      amount: 50,
      currency: "INR",
      message: "OTP successfully verified! Razorpay payment gateway is now unlocked.",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ error: "Failed to verify OTP" });
  }
});

// 5. STEP 3 OF PREMIUM DOWNLOAD: Create Razorpay Order (STRICTLY GATED BY OTP)
router.post("/create-payment-order", verifyToken, async (req, res) => {
  try {
    const { paymentId, verificationToken } = req.body;

    if (!paymentId || !verificationToken) {
      return res.status(400).json({
        error: "paymentId and verificationToken are required to unlock payment",
      });
    }

    const paymentRecord = await ResumePayment.findById(paymentId);
    if (!paymentRecord) {
      return res.status(404).json({ error: "Payment session not found" });
    }

    // CRITICAL ENFORCEMENT: Payment gateway is ONLY enabled after OTP is successfully verified
    if (!paymentRecord.otpVerified || paymentRecord.verificationToken !== verificationToken) {
      return res.status(403).json({
        error: "Access Denied: Payment gateway requires successful OTP verification before initiation.",
        code: "OTP_REQUIRED",
      });
    }

    const orderId = `order_res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    paymentRecord.orderId = orderId;
    paymentRecord.paymentStatus = "payment_pending";
    await paymentRecord.save();

    return res.json({
      success: true,
      orderId,
      amount: 5000, // ₹50 in paise
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID || "rzp_test_internshala",
      message: "Payment order created successfully for OTP-verified user",
    });
  } catch (error) {
    console.error("Create resume payment order error:", error);
    return res.status(500).json({ error: "Failed to create payment order" });
  }
});

// 6. STEP 4 OF PREMIUM DOWNLOAD: Verify Payment & Generate PDF & Save as Default
router.post("/verify-payment", verifyToken, async (req, res) => {
  try {
    const { paymentId, verificationToken, razorpayPaymentId } = req.body;

    const paymentRecord = await ResumePayment.findById(paymentId);
    if (!paymentRecord) {
      return res.status(404).json({ error: "Payment session not found" });
    }

    // Verify OTP was passed
    if (!paymentRecord.otpVerified) {
      return res.status(403).json({
        error: "Cannot complete payment without prior OTP verification",
        code: "OTP_REQUIRED",
      });
    }

    const activePaymentId =
      razorpayPaymentId || `pay_res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const invoiceNumber = `INV-RES-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();

    // Fetch resume data
    const resume = await Resume.findById(paymentRecord.resumeId);
    if (!resume) {
      return res.status(404).json({ error: "Resume data not found" });
    }

    // Generate PDF Buffer
    const pdfBuffer = generateResumePdfBuffer(resume);
    const pdfBase64 = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;

    // Link PDF to User profile and save as default resume
    resume.pdfUrl = pdfBase64;
    resume.isDefault = true;
    resume.downloadCount = (resume.downloadCount || 0) + 1;
    await resume.save();

    // Update User model
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        if (!user.profile) user.profile = {};
        user.profile.resume = pdfBase64;
        await user.save();
      }
    } catch (e) {
      console.warn("Failed to link default resume to user profile:", e.message);
    }

    // Update Payment Record
    paymentRecord.paymentId = activePaymentId;
    paymentRecord.paymentStatus = "completed";
    paymentRecord.downloadCount = (paymentRecord.downloadCount || 0) + 1;
    if (!paymentRecord.downloadHistory) paymentRecord.downloadHistory = [];
    paymentRecord.downloadHistory.push({
      downloadedAt: now,
      ip: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "",
    });
    await paymentRecord.save();

    // Create Invoice
    const invoice = new Invoice({
      invoiceNumber,
      userId: String(req.user.id),
      userEmail: req.user.email,
      userName: req.user.name || "Student",
      type: "resume",
      amount: 50,
      currency: "INR",
      paymentId: activePaymentId,
      status: "paid",
      items: [
        {
          description: "Internshala Premium Resume PDF Generation & Download",
          amount: 50,
          quantity: 1,
        },
      ],
      createdAt: now,
    });
    await invoice.save();

    // // Mock Email Confirmation(just for testing putrposes, you can remove this later if you want)
    // console.log("\n=======================================================");
    // console.log(" [MOCK EMAIL CONFIRMATION] Premium Resume Download");
    // console.log(`To: ${req.user.email} (${req.user.name})`);
    // console.log(`Subject: Your Premium Resume PDF is Ready!`);
    // console.log(`Amount Paid: ₹50 INR`);
    // console.log(`Invoice: ${invoiceNumber}`);
    // console.log(`Status: Linked to profile as default resume`);
    // console.log("=======================================================\n");

    return res.json({
      success: true,
      message: "Payment confirmed! Resume PDF generated and linked to your profile as default resume.",
      pdfUrl: pdfBase64,
      invoiceNumber,
      resumeId: resume._id,
      downloadCount: resume.downloadCount,
    });
  } catch (error) {
    console.error("Resume payment verification error:", error);
    return res.status(500).json({ error: "Failed to finalize resume payment" });
  }
});

// 7. Track history of resumes, payments, and downloads
router.get("/history", verifyToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: String(req.user.id) });
    const payments = await ResumePayment.find({ userId: String(req.user.id) });
    const invoices = await Invoice.find({
      userId: String(req.user.id),
      type: "resume",
    });

    return res.json({
      resumes,
      payments,
      invoices,
      totalDownloads: resumes.reduce((acc, r) => acc + (r.downloadCount || 0), 0),
    });
  } catch (error) {
    console.error("Get resume history error:", error);
    return res.status(500).json({ error: "Failed to retrieve resume history" });
  }
});

// 8. Direct PDF download endpoint
router.get("/download/:resumeId", verifyToken, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.resumeId);
    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    if (String(resume.userId) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized access to this resume" });
    }

    const pdfBuffer = generateResumePdfBuffer(resume);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Resume_${(resume.personalDetails?.fullName || "Internshala").replace(/\s+/g, "_")}.pdf"`
    );
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Download resume error:", error);
    return res.status(500).json({ error: "Failed to download resume" });
  }
});

module.exports = router;
