const express = require("express");
const router = express.Router();
const Application = require("../Model/Application");
const { verifyToken, optionalAuth, requireRole } = require("../middleware/auth");
const { getOrCreateActiveSubscription } = require("./subscription");

// In-memory event stream for polling fallback
const recentApplicationEvents = [];

function recordEvent(type, payload) {
  recentApplicationEvents.unshift({
    id: Date.now() + Math.random().toString(36).substring(2, 6),
    type,
    payload,
    timestamp: new Date().toISOString(),
  });
  if (recentApplicationEvents.length > 50) {
    recentApplicationEvents.pop();
  }
}

// Student applies to an Internship or Job
router.post("/", optionalAuth, async (req, res) => {
  try {
    const {
      company,
      companyId,
      category,
      coverLetter,
      user,
      Application: appDetails,
      title,
      opportunityId,
      opportunityType,
    } = req.body;

    // Use authenticated user if available, otherwise body user
    const applicantUser = req.user
      ? {
          _id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
          resume: req.user.profile ? req.user.profile.resume : "",
          skills: req.user.profile ? req.user.profile.skills : [],
          ...user,
        }
      : user || {
          name: "Anonymous Applicant",
          email: "student@example.com",
        };

    // Check and enforce subscription application quota
    const userIdForQuota = req.user ? req.user.id : (applicantUser._id || "anon");
    const userEmailForQuota = req.user ? req.user.email : (applicantUser.email || "student@example.com");
    const userNameForQuota = req.user ? req.user.name : (applicantUser.name || "Student");

    let userSubscription = null;
    if (userIdForQuota !== "anon") {
      userSubscription = await getOrCreateActiveSubscription(
        userIdForQuota,
        userEmailForQuota,
        userNameForQuota
      );

      // If quota is exhausted and plan is not unlimited (-1)
      if (
        userSubscription.applicationsAllowed !== -1 &&
        (userSubscription.applicationsUsed || 0) >= userSubscription.applicationsAllowed
      ) {
        return res.status(403).json({
          error: "Monthly application quota exhausted. Please upgrade your subscription to apply for more opportunities.",
          quotaExhausted: true,
          plan: userSubscription.plan,
          applicationsAllowed: userSubscription.applicationsAllowed,
          applicationsUsed: userSubscription.applicationsUsed,
          message: `Your current ${userSubscription.plan} plan allows ${userSubscription.applicationsAllowed} application(s) per month, which you have already used.`,
        });
      }
    }

    const newApplication = new Application({
      company: company || (appDetails && appDetails.company) || "Hiring Company",
      companyId: companyId || (appDetails && appDetails.companyId) || "",
      category: category || (appDetails && appDetails.category) || "General",
      coverLetter: coverLetter || "",
      user: applicantUser,
      Application: appDetails || {},
      title: title || (appDetails && appDetails.title) || "Opportunity Application",
      opportunityId: opportunityId || (appDetails && appDetails._id) || "",
      opportunityType: opportunityType || "internship",
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    const saved = await newApplication.save();

    // Increment used application quota if tracked
    if (userSubscription && userSubscription.applicationsAllowed !== -1) {
      userSubscription.applicationsUsed = (userSubscription.applicationsUsed || 0) + 1;
      await userSubscription.save();
    }

    // Trigger Real-Time notification via Socket.io
    const io = req.app.get("io");
    if (io) {
      io.emit("new_application", saved);
      if (saved.company) {
        io.to(saved.company).emit("new_application", saved);
      }
      if (saved.companyId) {
        io.to(`company_${saved.companyId}`).emit("new_application", saved);
      }
    }

    // Record for polling fallback
    recordEvent("new_application", saved);

    return res.status(201).json(saved);
  } catch (error) {
    console.error("Create application error:", error);
    return res.status(500).json({ error: "Failed to submit application" });
  }
});

// Student: view their own applications
router.get("/my", verifyToken, async (req, res) => {
  try {
    const all = await Application.find();
    const myApplications = all.filter((app) => {
      if (!app.user) return false;
      return (
        String(app.user._id) === String(req.user.id) ||
        String(app.user.id) === String(req.user.id) ||
        app.user.email === req.user.email
      );
    });
    return res.status(200).json(myApplications);
  } catch (error) {
    console.error("Get my applications error:", error);
    return res.status(500).json({ error: "Failed to fetch student applications" });
  }
});

// Company: view applications for their posted opportunities
router.get("/company", verifyToken, requireRole("company", "admin"), async (req, res) => {
  try {
    const all = await Application.find();
    if (req.user.role === "admin") {
      return res.status(200).json(all);
    }

    const companyName = (req.user.profile && req.user.profile.companyName) || req.user.name;
    const companyApps = all.filter((app) => {
      const matchId = app.companyId && String(app.companyId) === String(req.user.id);
      const matchName =
        app.company &&
        companyName &&
        app.company.toLowerCase().trim() === companyName.toLowerCase().trim();
      return matchId || matchName;
    });

    return res.status(200).json(companyApps);
  } catch (error) {
    console.error("Get company applications error:", error);
    return res.status(500).json({ error: "Failed to fetch company applications" });
  }
});

// Polling fallback endpoint for real-time notifications
router.get("/recent-events", (req, res) => {
  const since = req.query.since;
  if (!since) {
    return res.json({ events: recentApplicationEvents.slice(0, 10) });
  }
  const filtered = recentApplicationEvents.filter(
    (e) => new Date(e.timestamp) > new Date(since)
  );
  return res.json({ events: filtered });
});

// Get all applications (Admin or public listing with backward compatibility)
router.get("/", async (req, res) => {
  try {
    const data = await Application.find();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Get applications error:", error);
    return res.status(500).json({ error: "internal server error" });
  }
});

// Get single application by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await Application.findById(id);
    if (!data) {
      return res.status(404).json({ error: "application not found" });
    }
    return res.status(200).json(data);
  } catch (error) {
    console.error("Get application by id error:", error);
    return res.status(500).json({ error: "internal server error" });
  }
});

// Accept or Reject application (Company or Admin only - RBAC enforced)
router.put("/:id", verifyToken, requireRole("company", "admin"), async (req, res) => {
  const { id } = req.params;
  const { action, status: directStatus } = req.body;
  const targetStatus = action || directStatus;

  if (targetStatus !== "accepted" && targetStatus !== "rejected" && targetStatus !== "pending") {
    return res.status(400).json({
      error: "Invalid status. Must be 'accepted', 'rejected', or 'pending'",
    });
  }

  try {
    const existing = await Application.findById(id);
    if (!existing) {
      return res.status(404).json({ error: "Application not found" });
    }

    // If company, verify permission
    if (req.user.role === "company") {
      const companyName = (req.user.profile && req.user.profile.companyName) || req.user.name;
      const owns =
        (existing.companyId && String(existing.companyId) === String(req.user.id)) ||
        (existing.company &&
          companyName &&
          existing.company.toLowerCase().trim() === companyName.toLowerCase().trim());

      if (!owns) {
        return res.status(403).json({
          error: "Forbidden: You can only update applications for your own company postings",
        });
      }
    }

    const updated = await Application.findByIdAndUpdate(
      id,
      { $set: { status: targetStatus } },
      { new: true }
    );

    // Socket.io notification
    const io = req.app.get("io");
    if (io) {
      io.emit("application_status_updated", updated);
    }
    recordEvent("application_status_updated", updated);

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Update application error:", error);
    return res.status(500).json({ error: "internal server error" });
  }
});

// Delete application (Admin only)
router.delete("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Application.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Application not found" });
    }
    return res.status(200).json({ message: "Application deleted successfully" });
  } catch (error) {
    console.error("Delete application error:", error);
    return res.status(500).json({ error: "internal server error" });
  }
});

module.exports = router;
