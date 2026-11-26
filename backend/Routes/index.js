const express = require("express");
const router = express.Router();
const admin = require("./admin");
const intern = require("./internship");
const job = require("./job");
const application = require("./application");
const auth = require("./auth");
const profile = require("./profile");
const { router: subscription } = require("./subscription");
const resume = require("./resume");
const { router: language } = require("./language");
const posts = require("./posts");

router.use("/auth", auth);
router.use("/profile", profile);
router.use("/admin", admin);
router.use("/internship", intern);
router.use("/job", job);
router.use("/application", application);
router.use("/subscription", subscription);
router.use("/resume", resume);
router.use("/language", language);
router.use("/posts", posts);

module.exports = router;
