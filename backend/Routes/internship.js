const express = require("express");
const router = express.Router();
const Internship = require("../Model/Internship");
const { verifyToken, optionalAuth, requireRole } = require("../middleware/auth");

// Create internship (Company or Admin only - RBAC enforced)
router.post("/", verifyToken, requireRole("company", "admin"), async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      category,
      aboutCompany,
      aboutInternship,
      whoCanApply,
      perks,
      numberOfOpening,
      stipend,
      startDate,
      duration,
      additionalInfo,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const companyName =
      company ||
      (req.user.profile && req.user.profile.companyName) ||
      req.user.name;

    const internshipData = new Internship({
      title,
      company: companyName,
      companyId: req.user.id,
      location: location || "Remote",
      category: category || "General",
      aboutCompany:
        aboutCompany ||
        (req.user.profile && req.user.profile.companyDescription) ||
        "",
      aboutInternship: aboutInternship || "",
      whoCanApply: whoCanApply || "",
      perks: Array.isArray(perks) ? perks : perks ? [perks] : [],
      numberOfOpening: numberOfOpening || "1",
      stipend: stipend || "Unpaid",
      startDate: startDate || "Immediately",
      duration: duration || "3 Months",
      additionalInfo: additionalInfo || "",
      createdAt: new Date().toISOString(),
    });

    const saved = await internshipData.save();
    return res.status(201).json(saved);
  } catch (error) {
    console.error("Create internship error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get all internships with search & filters
router.get("/", async (req, res) => {
  try {
    const { search, category, location, companyId } = req.query;
    let query = {};

    if (companyId) {
      query.companyId = companyId;
    }

    const data = await Internship.find(query);

    // Apply filtering if provided
    let results = data;
    if (search) {
      const s = search.toLowerCase();
      results = results.filter(
        (i) =>
          (i.title && i.title.toLowerCase().includes(s)) ||
          (i.company && i.company.toLowerCase().includes(s)) ||
          (i.category && i.category.toLowerCase().includes(s))
      );
    }
    if (category) {
      const c = category.toLowerCase();
      results = results.filter(
        (i) =>
          (i.category && i.category.toLowerCase().includes(c)) ||
          (i.title && i.title.toLowerCase().includes(c)) ||
          (i.company && i.company.toLowerCase().includes(c))
      );
    }
    if (location) {
      const l = location.toLowerCase();
      results = results.filter(
        (i) => i.location && i.location.toLowerCase().includes(l)
      );
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("Get internships error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get single internship by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await Internship.findById(id);
    if (!data) {
      return res.status(404).json({ error: "Internship not found" });
    }
    return res.status(200).json(data);
  } catch (error) {
    console.error("Get internship by id error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Delete internship (Company owner or Admin only - RBAC enforced)
router.delete("/:id", verifyToken, requireRole("company", "admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const item = await Internship.findById(id);
    if (!item) {
      return res.status(404).json({ error: "Internship not found" });
    }

    // If company, verify ownership
    if (req.user.role === "company") {
      const isOwner =
        item.companyId === req.user.id ||
        (req.user.profile && item.company === req.user.profile.companyName) ||
        item.company === req.user.name;

      if (!isOwner) {
        return res.status(403).json({
          error: "Forbidden: You can only delete your own company's internships",
        });
      }
    }

    await Internship.findByIdAndDelete(id);
    return res.status(200).json({ message: "Internship deleted successfully" });
  } catch (error) {
    console.error("Delete internship error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
