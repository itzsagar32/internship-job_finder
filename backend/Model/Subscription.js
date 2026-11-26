const mongoose = require("mongoose");
const { getIsConnectedToMongo } = require("../db");
const { createCollection } = require("../data/store");

const SubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    default: "",
  },
  plan: {
    type: String,
    enum: ["Free", "Bronze", "Silver", "Gold"],
    default: "Free",
  },
  price: {
    type: Number,
    default: 0,
  },
  applicationsAllowed: {
    type: Number,
    default: 1, // Free: 1, Bronze: 3, Silver: 5, Gold: -1 (unlimited)
  },
  applicationsUsed: {
    type: Number,
    default: 0,
  },
  billingCycleStart: {
    type: Date,
    default: Date.now,
  },
  billingCycleEnd: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  status: {
    type: String,
    enum: ["active", "expired", "cancelled"],
    default: "active",
  },
  paymentId: {
    type: String,
    default: "",
  },
  orderId: {
    type: String,
    default: "",
  },
  invoiceId: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

let MongooseSubscriptionModel;
try {
  MongooseSubscriptionModel = mongoose.model("Subscription");
} catch {
  MongooseSubscriptionModel = mongoose.model("Subscription", SubscriptionSchema);
}

const FallbackSubscriptionModel = createCollection("subscriptions");

const SubscriptionModel = new Proxy(FallbackSubscriptionModel, {
  get(target, prop) {
    if (getIsConnectedToMongo()) {
      return MongooseSubscriptionModel[prop];
    }
    return target[prop];
  },
  construct(target, args) {
    if (getIsConnectedToMongo()) {
      return new MongooseSubscriptionModel(...args);
    }
    return new target(...args);
  },
});

module.exports = SubscriptionModel;
