const mongoose = require("mongoose");
const { getIsConnectedToMongo } = require("../db");
const { createCollection } = require("../data/store");

const PasswordResetSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  method: { type: String, enum: ["email", "phone"], default: "email" },
  otp: { type: String, required: true },
  otpExpiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  used: { type: Boolean, default: false },
  ip: { type: String, default: "" },
  userAgent: { type: String, default: "" },
  browser: { type: String, default: "" },
  device: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

let MongoosePasswordResetModel;
try {
  MongoosePasswordResetModel = mongoose.model("PasswordReset");
} catch {
  MongoosePasswordResetModel = mongoose.model("PasswordReset", PasswordResetSchema);
}

const FallbackPasswordResetModel = createCollection("password_resets");

const PasswordResetModel = new Proxy(FallbackPasswordResetModel, {
  get(target, prop) {
    if (getIsConnectedToMongo()) {
      return MongoosePasswordResetModel[prop];
    }
    return target[prop];
  },
  construct(target, args) {
    if (getIsConnectedToMongo()) {
      return new MongoosePasswordResetModel(...args);
    }
    return new target(...args);
  },
});

module.exports = PasswordResetModel;
