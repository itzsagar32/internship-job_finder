const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Model/User");
const Internship = require("../Model/Internship");
const Job = require("../Model/Job");
const Application = require("../Model/Application");
const { verifyToken, requireRole, JWT_SECRET } = require("../middleware/auth");

// Legacy/Direct Admin Login route with modern JWT generation
router.post("/adminlogin", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if user credentials match admin
    let adminUser = await User.findOne({
      $or: [{ email: "admin@internshala.com" }, { role: "admin" }],
    });

    // Support legacy "admin"/"admin" check or real admin user check
    if (username === "admin" && (password === "admin" || password === "admin123")) {
      if (!adminUser) {
        // Create admin user on the fly if needed
        const hashedPassword = await bcrypt.hash("admin123", 10);
        adminUser = new User({
          name: "System Administrator",
          email: "admin@internshala.com",
          password: hashedPassword,
          role: "admin",
          phone: "+91 9876543210",
          profile: {
            headline: "Admin Supervisor",
          },
        });
        await adminUser.save();
      }

      const token = jwt.sign(
        {
          id: adminUser._id ? adminUser._id.toString() : adminUser.id,
          email: adminUser.email,
          role: "admin",
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        message: "admin is here",
        token,
        user: {
          id: adminUser._id ? adminUser._id.toString() : adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: "admin",
        },
      });
    }

    // Also check email-based login for admin
    if (username) {
      const found = await User.findOne({ email: username.toLowerCase().trim() });
      if (found && found.role === "admin") {
        const isMatch = await bcrypt.compare(password, found.password);
        if (isMatch) {
          const token = jwt.sign(
            {
              id: found._id ? found._id.toString() : found.id,
              email: found.email,
              role: "admin",
            },
            JWT_SECRET,
            { expiresIn: "7d" }
          );

          return res.status(200).json({
            message: "admin is here",
            token,
            user: {
              id: found._id ? found._id.toString() : found.id,
              name: found.name,
              email: found.email,
              role: "admin",
            },
          });
        }
      }
    }

    return res.status(401).json({ error: "Unauthorized: Invalid admin credentials" });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Admin stats: overview counts
router.get("/stats", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const [allUsers, allInternships, allJobs, allApplications] = await Promise.all([
      User.find(),
      Internship.find(),
      Job.find(),
      Application.find(),
    ]);

    const students = allUsers.filter((u) => u.role === "student").length;
    const companies = allUsers.filter((u) => u.role === "company").length;
    const pendingApps = allApplications.filter((a) => a.status === "pending").length;
    const acceptedApps = allApplications.filter((a) => a.status === "accepted").length;

    return res.status(200).json({
      totalUsers: allUsers.length,
      studentsCount: students,
      companiesCount: companies,
      internshipsCount: allInternships.length,
      jobsCount: allJobs.length,
      applicationsCount: allApplications.length,
      pendingApplications: pendingApps,
      acceptedApplications: acceptedApps,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Admin: view all registered users
router.get("/users", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const users = await User.find();
    const safeUsers = users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      profile: u.profile,
      createdAt: u.createdAt,
    }));
    return res.status(200).json(safeUsers);
  } catch (error) {
    console.error("Admin get users error:", error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Admin: delete user account
router.delete("/users/:id", verifyToken, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ error: "Cannot delete primary administrator" });
    }

    await User.findByIdAndDelete(id);
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return res.status(500).json({ error: "Failed to delete user" });
  }
});

// Admin: delete inappropriate internship
router.delete("/internship/:id", verifyToken, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Internship.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Internship not found" });
    }
    return res.status(200).json({ message: "Inappropriate internship deleted successfully" });
  } catch (error) {
    console.error("Admin delete internship error:", error);
    return res.status(500).json({ error: "Failed to delete internship" });
  }
});

// Admin: delete inappropriate job
router.delete("/job/:id", verifyToken, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Job.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Job not found" });
    }
    return res.status(200).json({ message: "Inappropriate job deleted successfully" });
  } catch (error) {
    console.error("Admin delete job error:", error);
    return res.status(500).json({ error: "Failed to delete job" });
  }
});

module.exports = router;
