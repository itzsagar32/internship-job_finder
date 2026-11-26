const mongoose = require("mongoose");
const { getIsConnectedToMongo } = require("../db");
const { createCollection } = require("../data/store");

const LoginLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  browser: { type: String, default: "Unknown" },
  browserVersion: { type: String, default: "" },
  os: { type: String, default: "Unknown" },
  deviceType: {
    type: String,
    enum: ["desktop", "laptop", "tablet", "mobile"],
    default: "desktop",
  },
  deviceModel: { type: String, default: "" },
  ip: { type: String, default: "" },
  location: { type: String, default: "India (Approx.)" },
  status: {
    type: String,
    enum: ["success", "rejected_mobile_time", "otp_required", "failed"],
    default: "success",
  },
  isTrustedDevice: { type: Boolean, default: false },
  sessionToken: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

let MongooseLoginLogModel;
try {
  MongooseLoginLogModel = mongoose.model("LoginLog");
} catch {
  MongooseLoginLogModel = mongoose.model("LoginLog", LoginLogSchema);
}

const FallbackLoginLogModel = createCollection("login_logs");

const LoginLogModel = new Proxy(FallbackLoginLogModel, {
  get(target, prop) {
    if (getIsConnectedToMongo()) {
      return MongooseLoginLogModel[prop];
    }
    return target[prop];
  },
  construct(target, args) {
    if (getIsConnectedToMongo()) {
      return new MongooseLoginLogModel(...args);
    }
    return new target(...args);
  },
});

module.exports = LoginLogModel;
