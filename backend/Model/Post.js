const mongoose = require("mongoose");
const { getIsConnectedToMongo } = require("../db");
const { createCollection } = require("../data/store");

const PostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  authorName: { type: String, required: true },
  authorEmail: { type: String, required: true },
  authorAvatar: { type: String, default: "" },
  authorHeadline: { type: String, default: "" },
  content: { type: String, required: true, trim: true },
  mediaUrl: { type: String, default: "" },
  mediaType: {
    type: String,
    enum: ["text", "photo", "video"],
    default: "text",
  },
  tags: { type: [String], default: [] },
  mentions: { type: [String], default: [] },
  privacy: {
    type: String,
    enum: ["public", "friends"],
    default: "public",
  },
  likes: { type: [String], default: [] },
  comments: [
    {
      userId: { type: String, required: true },
      userName: { type: String, required: true },
      userAvatar: { type: String, default: "" },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  shares: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  friendCountAtPost: { type: Number, default: 0 },
  savedBy: { type: [String], default: [] },
  reports: [
    {
      userId: String,
      reason: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

let MongoosePostModel;
try {
  MongoosePostModel = mongoose.model("Post");
} catch {
  MongoosePostModel = mongoose.model("Post", PostSchema);
}

const FallbackPostModel = createCollection("posts");

const PostModel = new Proxy(FallbackPostModel, {
  get(target, prop) {
    if (getIsConnectedToMongo()) {
      return MongoosePostModel[prop];
    }
    return target[prop];
  },
  construct(target, args) {
    if (getIsConnectedToMongo()) {
      return new MongoosePostModel(...args);
    }
    return new target(...args);
  },
});

module.exports = PostModel;
