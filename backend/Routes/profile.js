const express = require("express");
const router = express.Router();
const User = require("../Model/User");
const { verifyToken } = require("../middleware/auth");

// Get current profile
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const safeUser = {
      id: user._id ? user._id.toString() : user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profile: user.profile || {},
      createdAt: user.createdAt,
    };

    return res.status(200).json(safeUser);
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Update current profile
router.put("/me", verifyToken, async (req, res) => {
  try {
    const { name, phone, profile } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedProfile = {
      ...(user.profile || {}),
      ...(profile || {}),
    };

    const updateData = {
      profile: updatedProfile,
    };

    if (name) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    );

    const safeUser = {
      id: updatedUser._id ? updatedUser._id.toString() : updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      profile: updatedUser.profile || {},
      createdAt: updatedUser.createdAt,
    };

    return res.status(200).json({
      message: "Profile updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
