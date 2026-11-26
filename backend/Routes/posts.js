const express = require("express");
const router = express.Router();
const Post = require("../Model/Post");
const Friendship = require("../Model/Friendship");
const Notification = require("../Model/Notification");
const User = require("../Model/User");
const { verifyToken } = require("../middleware/auth");

// Helper to count accepted friends for a user
async function getAcceptedFriendCount(userId) {
  const friendships = await Friendship.find({
    status: "accepted",
    $or: [{ requester: userId }, { recipient: userId }],
  });
  return friendships.length;
}

// Helper to get friend IDs
async function getFriendIds(userId) {
  const friendships = await Friendship.find({
    status: "accepted",
    $or: [{ requester: userId }, { recipient: userId }],
  });
  return friendships.map((f) =>
    String(f.requester) === String(userId) ? String(f.recipient) : String(f.requester)
  );
}

// Helper to check daily post limit based on accepted friends
function getDailyPostLimit(friendCount) {
  if (friendCount === 0) return 0;
  if (friendCount === 1) return 1;
  if (friendCount >= 2 && friendCount <= 5) return 2;
  if (friendCount >= 6 && friendCount <= 10) return 5;
  return Infinity; // > 10 friends: unlimited
}

// 1. GET /api/posts/privileges: Check current user's friend count and daily posting allowance
router.get("/privileges", verifyToken, async (req, res) => {
  try {
    const friendCount = await getAcceptedFriendCount(req.user.id);
    const dailyLimit = getDailyPostLimit(friendCount);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const postsToday = await Post.find({
      author: req.user.id,
      createdAt: { $gte: startOfDay },
    });

    const usedToday = postsToday.length;
    const canPost = dailyLimit === Infinity ? true : usedToday < dailyLimit;

    return res.json({
      friendCount,
      dailyLimit: dailyLimit === Infinity ? "Unlimited" : dailyLimit,
      postsUsedToday: usedToday,
      remainingPosts: dailyLimit === Infinity ? "Unlimited" : Math.max(0, dailyLimit - usedToday),
      canPost,
      postingRule:
        friendCount === 0
          ? "Users with 0 friends cannot create posts. Connect with friends to unlock posting privileges!"
          : friendCount === 1
          ? "1 friend = 1 post/day"
          : friendCount <= 5
          ? "2–5 friends = 2 posts/day"
          : friendCount <= 10
          ? "6–10 friends = 5 posts/day"
          : ">10 friends = Unlimited daily posts",
    });
  } catch (err) {
    console.error("Privilege check error:", err);
    return res.status(500).json({ error: "Failed to check posting privileges" });
  }
});

// 2. POST /api/posts/create: Create a new post with strict friend-count tier validation
router.post("/create", verifyToken, async (req, res) => {
  try {
    const { content, mediaUrl, mediaType = "text", tags = [], privacy = "public" } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Post content cannot be empty" });
    }

    if (content.length > 3000) {
      return res.status(400).json({ error: "Post content exceeds maximum 3,000 character limit" });
    }

    // 1. Check Friend Count and Posting Privileges (CRITICAL RULE)
    const friendCount = await getAcceptedFriendCount(req.user.id);
    const dailyLimit = getDailyPostLimit(friendCount);

    if (friendCount === 0) {
      return res.status(403).json({
        error:
          "Posting privileges require at least 1 accepted friend. Users with 0 friends cannot create posts.",
        code: "NO_FRIENDS_CANNOT_POST",
      });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const postsToday = await Post.find({
      author: req.user.id,
      createdAt: { $gte: startOfDay },
    });

    if (dailyLimit !== Infinity && postsToday.length >= dailyLimit) {
      return res.status(403).json({
        error: `Daily post limit reached. Based on your ${friendCount} friend(s), your limit is ${dailyLimit} post(s) per day.`,
        code: "DAILY_LIMIT_EXCEEDED",
        friendCount,
        dailyLimit,
      });
    }

    // 2. Anti-Spam & Duplicate Check (within past 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentPosts = await Post.find({
      author: req.user.id,
      createdAt: { $gte: fiveMinutesAgo },
    });

    const isDuplicate = recentPosts.some(
      (p) => p.content.trim().toLowerCase() === content.trim().toLowerCase()
    );
    if (isDuplicate) {
      return res.status(400).json({
        error: "Duplicate post detected. Please avoid posting the exact same content repeatedly.",
      });
    }

    // 3. Extract @mentions and #hashtags
    const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g;

    const extractedMentions = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      extractedMentions.push(match[1]);
    }

    const extractedTags = [...tags];
    while ((match = hashtagRegex.exec(content)) !== null) {
      extractedTags.push(match[1].toLowerCase());
    }

    // 4. Create Post Document
    const post = new Post({
      author: req.user.id,
      authorName: req.user.name,
      authorEmail: req.user.email,
      authorAvatar:
        req.user.profile?.avatar ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(req.user.name)}`,
      authorHeadline: req.user.profile?.headline || "Internshala Member",
      content: content.trim(),
      mediaUrl: mediaUrl || "",
      mediaType,
      tags: [...new Set(extractedTags)],
      mentions: [...new Set(extractedMentions)],
      privacy,
      friendCountAtPost: friendCount,
      likes: [],
      comments: [],
      shares: 0,
      views: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await post.save();

    // 5. Send notifications to mentioned users
    for (const mentionName of extractedMentions) {
      try {
        const mentionedUser = await User.findOne({
          $or: [{ name: mentionName }, { email: mentionName }],
        });
        if (mentionedUser && String(mentionedUser._id) !== String(req.user.id)) {
          const notif = new Notification({
            recipient: mentionedUser._id,
            sender: req.user.id,
            senderName: req.user.name,
            senderAvatar: req.user.profile?.avatar || "",
            type: "mention",
            postId: String(post._id),
            message: `${req.user.name} mentioned you in a public space post!`,
          });
          await notif.save();
        }
      } catch (mErr) {
        console.warn("Mention notif warning:", mErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      post,
    });
  } catch (err) {
    console.error("Create post error:", err);
    return res.status(500).json({ error: "Failed to create post" });
  }
});

// 3. GET /api/posts/feed: Personalized feed (Friends first, then trending & recent public)
router.get("/feed", verifyToken, async (req, res) => {
  try {
    const friendIds = await getFriendIds(req.user.id);

    // Fetch all viewable posts
    const allPosts = await Post.find({});

    // Sort into personalized priority:
    // Priority 1: Posts authored by accepted friends
    // Priority 2: Trending public posts (high likes + comments)
    // Priority 3: Recent public posts
    const friendsPosts = [];
    const publicPosts = [];

    for (const p of allPosts) {
      const isAuthorFriend = friendIds.includes(String(p.author));
      const isMyPost = String(p.author) === String(req.user.id);

      if (isAuthorFriend) {
        friendsPosts.push(p);
      } else if (p.privacy === "public" || isMyPost) {
        publicPosts.push(p);
      }
    }

    // Sort friends posts newest first
    friendsPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Sort other public posts by trending engagement score (likes * 2 + comments * 3 + shares * 4)
    publicPosts.sort((a, b) => {
      const scoreA = (a.likes?.length || 0) * 2 + (a.comments?.length || 0) * 3 + (a.shares || 0) * 4;
      const scoreB = (b.likes?.length || 0) * 2 + (b.comments?.length || 0) * 3 + (b.shares || 0) * 4;
      return scoreB - scoreA || new Date(b.createdAt) - new Date(a.createdAt);
    });

    const combinedFeed = [...friendsPosts, ...publicPosts];

    return res.json({
      success: true,
      feed: combinedFeed,
      friendsCount: friendIds.length,
    });
  } catch (err) {
    console.error("Feed error:", err);
    return res.status(500).json({ error: "Failed to fetch feed" });
  }
});

// 4. PUT /api/posts/:id: Edit post within 15-minute configurable time limit
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (String(post.author) !== String(req.user.id)) {
      return res.status(403).json({ error: "You can only edit your own posts" });
    }

    // 15-minute edit window
    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - new Date(post.createdAt).getTime() > fifteenMinutes) {
      return res.status(400).json({
        error: "Edit window has expired. Posts can only be edited within 15 minutes of creation.",
      });
    }

    const { content, mediaUrl, tags } = req.body;
    if (content) post.content = content.trim();
    if (mediaUrl !== undefined) post.mediaUrl = mediaUrl;
    if (tags) post.tags = tags;
    post.updatedAt = new Date();

    await post.save();
    return res.json({ success: true, message: "Post edited successfully", post });
  } catch (err) {
    console.error("Edit post error:", err);
    return res.status(500).json({ error: "Failed to edit post" });
  }
});

// 5. DELETE /api/posts/:id: Delete post
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (String(post.author) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized to delete this post" });
    }

    await Post.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: "Post deleted successfully" });
  } catch (err) {
    console.error("Delete post error:", err);
    return res.status(500).json({ error: "Failed to delete post" });
  }
});

// 6. POST /api/posts/:id/like: Like / Unlike post
router.post("/:id/like", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userIdStr = String(req.user.id);
    const alreadyLiked = post.likes.includes(userIdStr);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id !== userIdStr);
    } else {
      post.likes.push(userIdStr);

      // Notify post author
      if (String(post.author) !== userIdStr) {
        const notif = new Notification({
          recipient: post.author,
          sender: req.user.id,
          senderName: req.user.name,
          senderAvatar: req.user.profile?.avatar || "",
          type: "like",
          postId: String(post._id),
          message: `${req.user.name} liked your post!`,
        });
        await notif.save();
      }
    }

    await post.save();
    return res.json({
      success: true,
      liked: !alreadyLiked,
      totalLikes: post.likes.length,
    });
  } catch (err) {
    console.error("Like error:", err);
    return res.status(500).json({ error: "Failed to update like" });
  }
});

// 7. POST /api/posts/:id/comment: Add comment & notify author
router.post("/:id/comment", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Comment text cannot be empty" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const newComment = {
      userId: String(req.user.id),
      userName: req.user.name,
      userAvatar: req.user.profile?.avatar || "",
      text: text.trim(),
      createdAt: new Date(),
    };

    if (!post.comments) post.comments = [];
    post.comments.push(newComment);
    await post.save();

    // Notify author
    if (String(post.author) !== String(req.user.id)) {
      const notif = new Notification({
        recipient: post.author,
        sender: req.user.id,
        senderName: req.user.name,
        senderAvatar: req.user.profile?.avatar || "",
        type: "comment",
        postId: String(post._id),
        message: `${req.user.name} commented: "${text.substring(0, 40)}..."`,
      });
      await notif.save();
    }

    return res.json({ success: true, comment: newComment, totalComments: post.comments.length });
  } catch (err) {
    console.error("Comment error:", err);
    return res.status(500).json({ error: "Failed to add comment" });
  }
});

// 8. POST /api/posts/:id/share: Share post
router.post("/:id/share", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.shares = (post.shares || 0) + 1;
    await post.save();

    if (String(post.author) !== String(req.user.id)) {
      const notif = new Notification({
        recipient: post.author,
        sender: req.user.id,
        senderName: req.user.name,
        type: "share",
        postId: String(post._id),
        message: `${req.user.name} shared your post!`,
      });
      await notif.save();
    }

    return res.json({ success: true, shares: post.shares });
  } catch (err) {
    return res.status(500).json({ error: "Failed to share post" });
  }
});

// 9. POST /api/posts/:id/save: Save/Bookmark post
router.post("/:id/save", verifyToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const userIdStr = String(req.user.id);
    if (!post.savedBy) post.savedBy = [];
    const isSaved = post.savedBy.includes(userIdStr);

    if (isSaved) {
      post.savedBy = post.savedBy.filter((id) => id !== userIdStr);
    } else {
      post.savedBy.push(userIdStr);
    }

    await post.save();
    return res.json({ success: true, saved: !isSaved });
  } catch (err) {
    return res.status(500).json({ error: "Failed to save post" });
  }
});

// 10. POST /api/posts/:id/report: Report inappropriate post
router.post("/:id/report", verifyToken, async (req, res) => {
  try {
    const { reason = "Inappropriate content" } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (!post.reports) post.reports = [];
    post.reports.push({
      userId: String(req.user.id),
      reason,
      createdAt: new Date(),
    });

    await post.save();
    return res.json({ success: true, message: "Thank you for reporting. Our moderation team will review this post." });
  } catch (err) {
    return res.status(500).json({ error: "Failed to report post" });
  }
});

// ==========================================
// FRIEND SYSTEM ROUTES
// ==========================================

// 11. POST /api/posts/friends/request: Send friend request
router.post("/friends/request", verifyToken, async (req, res) => {
  try {
    const { targetEmailOrName } = req.body;
    if (!targetEmailOrName) {
      return res.status(400).json({ error: "Target email or name is required" });
    }

    const targetUser = await User.findOne({
      $or: [
        { email: targetEmailOrName.toLowerCase().trim() },
        { name: targetEmailOrName.trim() },
      ],
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (String(targetUser._id) === String(req.user.id)) {
      return res.status(400).json({ error: "You cannot send a friend request to yourself" });
    }

    // Check existing friendship
    const existing = await Friendship.findOne({
      $or: [
        { requester: req.user.id, recipient: targetUser._id },
        { requester: targetUser._id, recipient: req.user.id },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(400).json({ error: "You are already friends with this user" });
      }
      return res.status(400).json({ error: "A friend request is already pending between you" });
    }

    const friendship = new Friendship({
      requester: req.user.id,
      requesterName: req.user.name,
      requesterAvatar: req.user.profile?.avatar || "",
      recipient: targetUser._id,
      recipientName: targetUser.name,
      recipientAvatar: targetUser.profile?.avatar || "",
      status: "pending",
      createdAt: new Date(),
    });
    await friendship.save();

    // Notification
    const notif = new Notification({
      recipient: targetUser._id,
      sender: req.user.id,
      senderName: req.user.name,
      senderAvatar: req.user.profile?.avatar || "",
      type: "friend_request",
      message: `${req.user.name} sent you a friend request!`,
    });
    await notif.save();

    return res.status(201).json({
      success: true,
      message: `Friend request sent to ${targetUser.name}`,
    });
  } catch (err) {
    console.error("Friend request error:", err);
    return res.status(500).json({ error: "Failed to send friend request" });
  }
});

// 12. POST /api/posts/friends/respond: Accept or reject friend request
router.post("/friends/respond", verifyToken, async (req, res) => {
  try {
    const { friendshipId, action } = req.body; // action: 'accept' | 'reject'
    if (!friendshipId || !["accept", "reject"].includes(action)) {
      return res.status(400).json({ error: "friendshipId and valid action ('accept' | 'reject') are required" });
    }

    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) return res.status(404).json({ error: "Friend request not found" });

    if (String(friendship.recipient) !== String(req.user.id)) {
      return res.status(403).json({ error: "Only the recipient can respond to this request" });
    }

    if (action === "accept") {
      friendship.status = "accepted";
      friendship.updatedAt = new Date();
      await friendship.save();

      // Notify requester
      const notif = new Notification({
        recipient: friendship.requester,
        sender: req.user.id,
        senderName: req.user.name,
        type: "friend_accepted",
        message: `${req.user.name} accepted your friend request! Your daily posting quota increased!`,
      });
      await notif.save();

      return res.json({ success: true, message: "Friend request accepted! Posting privileges updated." });
    } else {
      friendship.status = "rejected";
      await friendship.save();
      return res.json({ success: true, message: "Friend request rejected" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Failed to respond to friend request" });
  }
});

// 13. GET /api/posts/friends/list: Get accepted friends & pending requests
router.get("/friends/list", verifyToken, async (req, res) => {
  try {
    const allFriendships = await Friendship.find({
      $or: [{ requester: req.user.id }, { recipient: req.user.id }],
    });

    const accepted = [];
    const pendingIncoming = [];
    const pendingOutgoing = [];

    for (const f of allFriendships) {
      if (f.status === "accepted") {
        const friendInfo =
          String(f.requester) === String(req.user.id)
            ? { id: f.recipient, name: f.recipientName, avatar: f.recipientAvatar }
            : { id: f.requester, name: f.requesterName, avatar: f.requesterAvatar };
        accepted.push(friendInfo);
      } else if (f.status === "pending") {
        if (String(f.recipient) === String(req.user.id)) {
          pendingIncoming.push(f);
        } else {
          pendingOutgoing.push(f);
        }
      }
    }

    return res.json({
      success: true,
      acceptedFriends: accepted,
      friendCount: accepted.length,
      pendingIncoming,
      pendingOutgoing,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch friends list" });
  }
});

// 14. GET /api/posts/notifications: Get notifications for current user
router.get("/notifications", verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id });
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ success: true, notifications });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

module.exports = router;
