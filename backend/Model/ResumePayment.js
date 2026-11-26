const mongoose = require("mongoose");
const { getIsConnectedToMongo } = require("../db");
const { createCollection } = require("../data/store");

const ResumePaymentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  resumeId: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    default: 50,
  },
  currency: {
    type: String,
    default: "INR",
  },
  otp: {
    type: String,
    default: "",
  },
  otpExpiresAt: {
    type: Date,
  },
  otpVerified: {
    type: Boolean,
    default: false,
  },
  otpVerifiedAt: {
    type: Date,
  },
  verificationToken: {
    type: String,
    default: "",
  },
  orderId: {
    type: String,
    default: "",
  },
  paymentId: {
    type: String,
    default: "",
  },
  paymentStatus: {
    type: String,
    enum: ["otp_pending", "otp_verified", "payment_pending", "completed", "failed"],
    default: "otp_pending",
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  downloadHistory: [
    {
      downloadedAt: { type: Date, default: Date.now },
      ip: String,
      userAgent: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

let MongooseResumePaymentModel;
try {
  MongooseResumePaymentModel = mongoose.model("ResumePayment");
} catch {
  MongooseResumePaymentModel = mongoose.model("ResumePayment", ResumePaymentSchema);
}

const FallbackResumePaymentModel = createCollection("resume_payments");

const ResumePaymentModel = new Proxy(FallbackResumePaymentModel, {
  get(target, prop) {
    if (getIsConnectedToMongo()) {
      return MongooseResumePaymentModel[prop];
    }
    return target[prop];
  },
  construct(target, args) {
    if (getIsConnectedToMongo()) {
      return new MongooseResumePaymentModel(...args);
    }
    return new target(...args);
  },
});

module.exports = ResumePaymentModel;
