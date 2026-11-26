const mongoose = require("mongoose");
const { getIsConnectedToMongo } = require("../db");
const { createCollection } = require("../data/store");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["student", "company", "admin"],
    default: "student",
  },
  phone: {
    type: String,
    default: "",
  },
  mustChangePassword: {
    type: Boolean,
    default: false,
  },
  trustedDevices: {
    type: [String],
    default: [],
  },
  language: {
    type: String,
    enum: ["en", "es", "hi", "pt", "zh", "fr"],
    default: "en",
  },
  profile: {
    headline: { type: String, default: "" },
    bio: { type: String, default: "" },
    skills: { type: [String], default: [] },
    education: {
      type: [
        {
          degree: String,
          college: String,
          startYear: String,
          endYear: String,
        },
      ],
      default: [],
    },
    resume: { type: String, default: "" },
    companyName: { type: String, default: "" },
    companyWebsite: { type: String, default: "" },
    companyDescription: { type: String, default: "" },
    avatar: { type: String, default: "" },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

let MongooseUserModel;
try {
  MongooseUserModel = mongoose.model("User");
} catch {
  MongooseUserModel = mongoose.model("User", UserSchema);
}

const FallbackUserModel = createCollection("users");

// Proxy model that delegates to Mongoose or Fallback based on connection state
const UserModel = new Proxy(FallbackUserModel, {
  get(target, prop) {
    if (getIsConnectedToMongo()) {
      return MongooseUserModel[prop];
    }
    return target[prop];
  },
  construct(target, args) {
    if (getIsConnectedToMongo()) {
      return new MongooseUserModel(...args);
    }
    return new target(...args);
  },
});

module.exports = UserModel;
