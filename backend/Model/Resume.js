const mongoose = require("mongoose");
const { getIsConnectedToMongo } = require("../db");
const { createCollection } = require("../data/store");

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  personalDetails: {
    fullName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    summary: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    portfolio: { type: String, default: "" },
  },
  education: [
    {
      degree: String,
      institution: String,
      startYear: String,
      endYear: String,
      score: String,
      fieldOfStudy: String,
    },
  ],
  experience: [
    {
      title: String,
      company: String,
      location: String,
      startDate: String,
      endDate: String,
      current: Boolean,
      description: String,
    },
  ],
  skills: {
    type: [String],
    default: [],
  },
  projects: [
    {
      title: String,
      description: String,
      link: String,
      techStack: [String],
    },
  ],
  certifications: [
    {
      name: String,
      issuer: String,
      year: String,
    },
  ],
  pdfUrl: {
    type: String,
    default: "",
  },
  isDefault: {
    type: Boolean,
    default: true,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

let MongooseResumeModel;
try {
  MongooseResumeModel = mongoose.model("Resume");
} catch {
  MongooseResumeModel = mongoose.model("Resume", ResumeSchema);
}

const FallbackResumeModel = createCollection("resumes");

const ResumeModel = new Proxy(FallbackResumeModel, {
  get(target, prop) {
    if (getIsConnectedToMongo()) {
      return MongooseResumeModel[prop];
    }
    return target[prop];
  },
  construct(target, args) {
    if (getIsConnectedToMongo()) {
      return new MongooseResumeModel(...args);
    }
    return new target(...args);
  },
});

module.exports = ResumeModel;
