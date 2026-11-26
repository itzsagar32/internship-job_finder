const mongoose = require("mongoose");
const { getIsConnectedToMongo } = require("../db");
const { createCollection } = require("../data/store");

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  senderName: { type: String, default: "" },
  senderAvatar: { type: String, default: "" },
  type: {
    type: String,
    enum: ["like", "comment", "share", "friend_request", "friend_accepted", "mention"],
    required: true,
  },
  postId: { type: String, default: "" },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

let MongooseNotificationModel;
try {
  MongooseNotificationModel = mongoose.model("Notification");
} catch {
  MongooseNotificationModel = mongoose.model("Notification", NotificationSchema);
}

const FallbackNotificationModel = createCollection("notifications");

const NotificationModel = new Proxy(FallbackNotificationModel, {
  get(target, prop) {
    if (getIsConnectedToMongo()) {
      return MongooseNotificationModel[prop];
    }
    return target[prop];
  },
  construct(target, args) {
    if (getIsConnectedToMongo()) {
      return new MongooseNotificationModel(...args);
    }
    return new target(...args);
  },
});

module.exports = NotificationModel;
