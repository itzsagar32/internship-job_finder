const express = require("express");
const router = express.Router();
const Job = require("../Model/Job");
const { verifyToken, requireRole } = require("../middleware/auth");

// Create job (Company or Admin only - RBAC enforced)
router.post("/", verifyToken, requireRole("company", "admin"), async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      category,
      aboutCompany,
      aboutJob,
      whoCanApply,
      perks,
      numberOfOpening,
      Salary,
      startDate,
      Experience,
      additionalInfo,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const companyName =
      company ||
      (req.user.profile && req.user.profile.companyName) ||
      req.user.name;

    const jobData = new Job({
      title,
      company: companyName,
      companyId: req.user.id,
      location: location || "Remote",
      category: category || "General",
      aboutCompany:
        aboutCompany ||
        (req.user.profile && req.user.profile.companyDescription) ||
        "",
      aboutJob: aboutJob || "",
      whoCanApply: whoCanApply || "",
      perks: Array.isArray(perks) ? perks : perks ? [perks] : [],
      numberOfOpening: numberOfOpening || "1",
      Salary: Salary || "Not specified",
      startDate: startDate || "Immediately",
      Experience: Experience || "0-1 Years",
      additionalInfo: additionalInfo || "",
      createdAt: new Date().toISOString(),
    });

    const saved = await jobData.save();
    return res.status(201).json(saved);
  } catch (error) {
    console.error("Create job error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get all jobs with search & filters
router.get("/", async (req, res) => {
  try {
    const { search, category, location, companyId } = req.query;
    let query = {};

    if (companyId) {
      query.companyId = companyId;
    }

    const data = await Job.find(query);

    let results = data;
    if (search) {
      const s = search.toLowerCase();
      results = results.filter(
        (j) =>
          (j.title && j.title.toLowerCase().includes(s)) ||
          (j.company && j.company.toLowerCase().includes(s)) ||
          (j.category && j.category.toLowerCase().includes(s))
      );
    }
    if (category) {
      const c = category.toLowerCase();
      results = results.filter(
        (j) =>
          (j.category && j.category.toLowerCase().includes(c)) ||
          (j.title && j.title.toLowerCase().includes(c)) ||
          (j.company && j.company.toLowerCase().includes(c))
      );
    }
    if (location) {
      const l = location.toLowerCase();
      results = results.filter(
        (j) => j.location && j.location.toLowerCase().includes(l)
      );
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("Get jobs error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get single job by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await Job.findById(id);
    if (!data) {
      return res.status(404).json({ error: "Job not found" });
    }
    return res.status(200).json(data);
  } catch (error) {
    console.error("Get job by id error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Delete job (Company owner or Admin only - RBAC enforced)
router.delete("/:id", verifyToken, requireRole("company", "admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const item = await Job.findById(id);
    if (!item) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (req.user.role === "company") {
      const isOwner =
        item.companyId === req.user.id ||
        (req.user.profile && item.company === req.user.profile.companyName) ||
        item.company === req.user.name;

      if (!isOwner) {
        return res.status(403).json({
          error: "Forbidden: You can only delete your own company's jobs",
        });
      }
    }

    await Job.findByIdAndDelete(id);
    return res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Delete job error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;