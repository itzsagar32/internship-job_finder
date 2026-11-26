const mongoose = require("mongoose");
const { getIsConnectedToMongo } = require("../db");
const { createCollection } = require("../data/store");

const FriendshipSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  requesterName: { type: String, default: "" },
  requesterAvatar: { type: String, default: "" },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipientName: { type: String, default: "" },
  recipientAvatar: { type: String, default: "" },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

let MongooseFriendshipModel;
try {
  MongooseFriendshipModel = mongoose.model("Friendship");
} catch {
  MongooseFriendshipModel = mongoose.model("Friendship", FriendshipSchema);
}

const FallbackFriendshipModel = createCollection("friendships");

const FriendshipModel = new Proxy(FallbackFriendshipModel, {
  get(target, prop) {
    if (getIsConnectedToMongo()) {
      return MongooseFriendshipModel[prop];
    }
    return target[prop];
  },
  construct(target, args) {
    if (getIsConnectedToMongo()) {
      return new MongooseFriendshipModel(...args);
    }
    return new target(...args);
  },
});

module.exports = FriendshipModel;
