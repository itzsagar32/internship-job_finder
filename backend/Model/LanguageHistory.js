const mongoose = require("mongoose");
const { getIsConnectedToMongo } = require("../db");
const { createCollection } = require("../data/store");

const LanguageHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  oldLanguage: {
    type: String,
    default: "en",
  },
  newLanguage: {
    type: String,
    required: true,
  },
  ip: {
    type: String,
    default: "unknown",
  },
  browser: {
    type: String,
    default: "unknown",
  },
  userAgent: {
    type: String,
    default: "",
  },
  otpRequired: {
    type: Boolean,
    default: false,
  },
  otpVerified: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

let MongooseLanguageHistoryModel;
try {
  MongooseLanguageHistoryModel = mongoose.model("LanguageHistory");
} catch {
  MongooseLanguageHistoryModel = mongoose.model("LanguageHistory", LanguageHistorySchema);
}

const FallbackLanguageHistoryModel = createCollection("language_histories");

const LanguageHistoryModel = new Proxy(FallbackLanguageHistoryModel, {
  get(target, prop) {
    if (getIsConnectedToMongo()) {
      return MongooseLanguageHistoryModel[prop];
    }
    return target[prop];
  },
  construct(target, args) {
    if (getIsConnectedToMongo()) {
      return new MongooseLanguageHistoryModel(...args);
    }
    return new target(...args);
  },
});

module.exports = LanguageHistoryModel;
