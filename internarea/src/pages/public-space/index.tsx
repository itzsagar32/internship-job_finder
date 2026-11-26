import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import api from "@/utils/api";
import { toast } from "react-toastify";
import {
  Users,
  Send,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Flag,
  UserPlus,
  Clock,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  Video,
  Hash,
  AtSign,
  Bell,
  Trash2,
  Edit2,
  Info,
  AlertCircle,
} from "lucide-react";

interface PostItem {
  _id: string;
  author: string;
  authorName: string;
  authorEmail: string;
  authorAvatar: string;
  authorHeadline: string;
  content: string;
  mediaUrl?: string;
  mediaType: "text" | "photo" | "video";
  tags: string[];
  mentions: string[];
  privacy: "public" | "friends";
  likes: string[];
  comments: Array<{
    userId: string;
    userName: string;
    userAvatar: string;
    text: string;
    createdAt: string;
  }>;
  shares: number;
  views: number;
  friendCountAtPost: number;
  savedBy: string[];
  createdAt: string;
  updatedAt: string;
}

export default function PublicSpacePage() {
  const user = useSelector(selectuser);

  // Privileges & User Friends State
  const [privileges, setPrivileges] = useState<any>({
    friendCount: 0,
    dailyLimit: 0,
    postsUsedToday: 0,
    remainingPosts: 0,
    canPost: false,
    postingRule: "Loading posting privileges...",
  });

  const [activeTab, setActiveTab] = useState<"feed" | "friends" | "notifications">("feed");
  const [feedPosts, setFeedPosts] = useState<PostItem[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [backendOffline, setBackendOffline] = useState(false);

  // Create Post Form State
  const [postContent, setPostContent] = useState("");
  const [mediaType, setMediaType] = useState<"text" | "photo" | "video">("text");
  const [mediaUrl, setMediaUrl] = useState("");
  const [postPrivacy, setPostPrivacy] = useState<"public" | "friends">("public");
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Edit Post State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Friends & Notifications State
  const [friendsData, setFriendsData] = useState<any>({
    acceptedFriends: [],
    pendingIncoming: [],
    pendingOutgoing: [],
  });
  const [targetFriendIdentifier, setTargetFriendIdentifier] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);

  // Comment Input State: postId -> text
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // Fetch Privileges
  const fetchPrivileges = async () => {
    if (!user) return;
    try {
      const res = await api.get("/posts/privileges");
      setPrivileges(res.data);
    } catch (err: any) {
      console.warn("Error fetching privileges:", err.message);
    }
  };

  // Fetch Feed
  const fetchFeed = async () => {
    if (!user) return;
    try {
      setLoadingFeed(true);
      const res = await api.get("/posts/feed");
      setFeedPosts(res.data.feed || []);
      setBackendOffline(false);
    } catch (err: any) {
      if (!err.response && err.message === "Network Error") {
        setBackendOffline(true);
      }
      console.warn("Feed fetch notice:", err.message);
    } finally {
      setLoadingFeed(false);
    }
  };

  // Fetch Friends List
  const fetchFriends = async () => {
    if (!user) return;
    try {
      const res = await api.get("/posts/friends/list");
      setFriendsData(res.data);
    } catch (err: any) {
      console.error("Error fetching friends:", err);
    }
  };

  // Fetch Notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get("/posts/notifications");
      setNotifications(res.data.notifications || []);
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPrivileges();
      fetchFeed();
      fetchFriends();
      fetchNotifications();
    }
  }, [user]);

  // Handle Post Creation
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.warning("Please log in to participate in the Public Space");
      return;
    }

    if (!privileges.canPost) {
      toast.error(
        privileges.friendCount === 0
          ? "Posting privileges require at least 1 friend. Users with 0 friends cannot create posts."
          : `Daily limit reached (${privileges.dailyLimit} post/day for ${privileges.friendCount} friend(s)).`
      );
      return;
    }

    try {
      setIsSubmittingPost(true);
      const res = await api.post("/posts/create", {
        content: postContent,
        mediaUrl: mediaUrl.trim() || undefined,
        mediaType,
        privacy: postPrivacy,
      });

      if (res.data.success) {
        toast.success("Post created successfully!");
        setPostContent("");
        setMediaUrl("");
        setMediaType("text");
        fetchFeed();
        fetchPrivileges();
      }
    } catch (err: any) {
      const errMsg =
        err.response?.data?.error || "Failed to create post. Check your posting privileges.";
      toast.error(errMsg);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Handle Like
  const handleLike = async (postId: string) => {
    try {
      const res = await api.post(`/posts/${postId}/like`);
      if (res.data.success) {
        setFeedPosts((prev) =>
          prev.map((p) => {
            if (p._id === postId) {
              const currentUserId = user?.id || "";
              const alreadyLiked = p.likes.includes(currentUserId);
              return {
                ...p,
                likes: alreadyLiked
                  ? p.likes.filter((id) => id !== currentUserId)
                  : [...p.likes, currentUserId],
              };
            }
            return p;
          })
        );
      }
    } catch (err: any) {
      toast.error("Failed to like post");
    }
  };

  // Handle Comment Submit
  const handleCommentSubmit = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    try {
      const res = await api.post(`/posts/${postId}/comment`, { text });
      if (res.data.success) {
        setFeedPosts((prev) =>
          prev.map((p) => {
            if (p._id === postId) {
              return {
                ...p,
                comments: [...p.comments, res.data.comment],
              };
            }
            return p;
          })
        );
        setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
        toast.success("Comment added!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add comment");
    }
  };

  // Handle Share
  const handleShare = async (postId: string) => {
    try {
      const res = await api.post(`/posts/${postId}/share`);
      if (res.data.success) {
        setFeedPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, shares: res.data.shares } : p))
        );
        toast.success("Post shared!");
      }
    } catch {
      toast.error("Failed to share");
    }
  };

  // Handle Save
  const handleSave = async (postId: string) => {
    try {
      const res = await api.post(`/posts/${postId}/save`);
      if (res.data.success) {
        const userIdStr = user?.id || "";
        setFeedPosts((prev) =>
          prev.map((p) => {
            if (p._id === postId) {
              return {
                ...p,
                savedBy: res.data.saved
                  ? [...(p.savedBy || []), userIdStr]
                  : (p.savedBy || []).filter((id) => id !== userIdStr),
              };
            }
            return p;
          })
        );
        toast.info(res.data.saved ? "Post saved to your bookmarks!" : "Post removed from bookmarks.");
      }
    } catch {
      toast.error("Failed to bookmark post");
    }
  };

  // Handle Report
  const handleReport = async (postId: string) => {
    const reason = prompt("Please provide a reason for reporting this post:");
    if (!reason || !reason.trim()) return;

    try {
      const res = await api.post(`/posts/${postId}/report`, { reason });
      toast.success(res.data.message || "Report submitted");
    } catch {
      toast.error("Failed to report post");
    }
  };

  // Handle Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await api.delete(`/posts/${postId}`);
      if (res.data.success) {
        toast.success("Post deleted");
        setFeedPosts((prev) => prev.filter((p) => p._id !== postId));
        fetchPrivileges();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete post");
    }
  };

  // Handle Edit Post
  const handleSaveEdit = async (postId: string) => {
    if (!editContent.trim()) return;
    try {
      const res = await api.put(`/posts/${postId}`, { content: editContent });
      if (res.data.success) {
        toast.success("Post updated successfully");
        setFeedPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, content: editContent } : p))
        );
        setEditingPostId(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to edit post");
    }
  };

  // Send Friend Request
  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFriendIdentifier.trim()) return;

    try {
      const res = await api.post("/posts/friends/request", {
        targetEmailOrName: targetFriendIdentifier.trim(),
      });
      toast.success(res.data.message);
      setTargetFriendIdentifier("");
      fetchFriends();
      fetchPrivileges();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send friend request");
    }
  };

  // Respond to Friend Request
  const handleRespondFriendRequest = async (friendshipId: string, action: "accept" | "reject") => {
    try {
      const res = await api.post("/posts/friends/respond", { friendshipId, action });
      toast.success(res.data.message);
      fetchFriends();
      fetchPrivileges();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update friend request");
    }
  };

  return (
    <>
      <Head>
        <title>Public Space & Community | Internshala</title>
      </Head>

      <div className="min-h-screen bg-gray-50/60 pb-16 pt-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 mb-6 gap-3">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold mb-2">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>Task 1 Enterprise Community Engagement</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Public Space & Community
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Connect with peers, share updates, and discover opportunities with community friend-tier privileges.
              </p>
            </div>

            {/* Quick Navigation Pills */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab("feed")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                  activeTab === "feed"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-gray-700 border hover:bg-gray-50"
                }`}
              >
                <span>Feed</span>
              </button>
              <button
                onClick={() => setActiveTab("friends")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  activeTab === "friends"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-gray-700 border hover:bg-gray-50"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Friends ({friendsData.acceptedFriends?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                  activeTab === "notifications"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-gray-700 border hover:bg-gray-50"
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Alerts ({notifications.length})</span>
              </button>
            </div>
          </div>

          {/* Backend Offline Warning Banner */}
          {backendOffline && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-start space-x-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-red-900">Backend Server Offline (Port 5000 Unreachable)</h4>
                <p className="mt-1 text-red-700">
                  The frontend cannot communicate with the API server. Please start the backend server in a terminal:
                </p>
                <code className="block bg-red-100/80 text-red-950 font-mono text-[11px] px-3 py-1.5 rounded-lg mt-2 select-all border border-red-200">
                  cd &quot;C:\Users\Krishu Raj\Desktop\internship\internshala-clone\backend&quot; ; node index.js
                </code>
              </div>
            </div>
          )}

          {/* CRITICAL RULE: Posting Privileges Banner */}
          <div className="mb-6 p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    privileges.canPost ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {privileges.canPost ? <Sparkles className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-gray-900">Posting Privileges Status</h3>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        privileges.canPost
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {privileges.canPost ? "Authorized" : "Posting Gated"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    <strong>Rule:</strong> {privileges.postingRule}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100 w-full md:w-auto justify-between sm:justify-start">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Friends</span>
                  <span className="font-extrabold text-blue-600 text-sm">
                    {privileges.friendCount}
                  </span>
                </div>
                <div className="h-6 w-px bg-gray-200" />
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Daily Limit</span>
                  <span className="font-bold text-gray-800 text-sm">
                    {privileges.dailyLimit}
                  </span>
                </div>
                <div className="h-6 w-px bg-gray-200" />
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Remaining Today</span>
                  <span
                    className={`font-black text-sm ${
                      privileges.remainingPosts === 0 ? "text-red-500" : "text-emerald-600"
                    }`}
                  >
                    {privileges.remainingPosts}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TAB 1: FEED & CREATE POST */}
          {activeTab === "feed" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Create Post & Feed */}
              <div className="lg:col-span-2 space-y-6">
                {/* Create Post Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 sm:p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center space-x-1.5">
                    <Edit2 className="w-4 h-4 text-blue-600" />
                    <span>Create a Community Post</span>
                  </h3>

                  {!privileges.canPost ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Posting privileges are currently restricted.</p>
                        <p className="mt-0.5">
                          {privileges.friendCount === 0
                            ? "You need at least 1 accepted friend to create posts. Head over to the Friends tab to connect with peers!"
                            : `You have reached your daily quota of ${privileges.dailyLimit} post(s). Please return tomorrow or connect with more friends to unlock higher posting tiers!`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleCreatePost} className="space-y-3">
                      <div>
                        <textarea
                          rows={3}
                          required
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          placeholder="What's on your mind? Share internships, projects, ask questions (use @username to mention, #tag for topics)..."
                          className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Optional Media URL input */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <input
                            type="url"
                            value={mediaUrl}
                            onChange={(e) => setMediaUrl(e.target.value)}
                            placeholder="Optional Image or Video URL (https://...)"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <select
                            value={mediaType}
                            onChange={(e) => setMediaType(e.target.value as any)}
                            className="px-2.5 py-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-700"
                          >
                            <option value="text">Text Only</option>
                            <option value="photo">Photo / Graphic</option>
                            <option value="video">Video</option>
                          </select>
                          <select
                            value={postPrivacy}
                            onChange={(e) => setPostPrivacy(e.target.value as any)}
                            className="px-2.5 py-2 border border-gray-200 rounded-lg text-xs bg-white text-gray-700"
                          >
                            <option value="public">Public (Everyone)</option>
                            <option value="friends">Friends Only</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={isSubmittingPost || !postContent.trim()}
                          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 flex items-center space-x-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSubmittingPost ? "Publishing..." : "Publish Post"}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Feed Posts */}
                {loadingFeed ? (
                  <div className="text-center py-12 text-xs text-gray-500">
                    Loading personalized feed (prioritizing friends)...
                  </div>
                ) : feedPosts.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-6">
                    <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-gray-800">No posts in the community yet</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Be the first to create a post, or connect with peers to view their updates!
                    </p>
                  </div>
                ) : (
                  feedPosts.map((post) => {
                    const isMyPost = String(post.author) === String(user?.id);
                    const isLiked = user ? post.likes.includes(user.id) : false;
                    const isSaved = user ? (post.savedBy || []).includes(user.id) : false;
                    const isEditing = editingPostId === post._id;

                    return (
                      <div
                        key={post._id}
                        className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 sm:p-5 transition hover:border-gray-300"
                      >
                        {/* Author Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <img
                              src={post.authorAvatar}
                              alt={post.authorName}
                              className="w-10 h-10 rounded-full border border-gray-100 object-cover bg-gray-50"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="text-xs font-bold text-gray-900">{post.authorName}</h4>
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                                  {post.friendCountAtPost} friend(s) at post
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 line-clamp-1">{post.authorHeadline}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 text-gray-400">
                            <span className="text-[11px] text-gray-400">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                            {isMyPost && (
                              <button
                                onClick={() => handleDeletePost(post._id)}
                                className="p-1 text-red-400 hover:text-red-600 transition"
                                title="Delete Post"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Content Body */}
                        {isEditing ? (
                          <div className="space-y-2 mb-3">
                            <textarea
                              rows={2}
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full text-xs p-2.5 border rounded-lg"
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => setEditingPostId(null)}
                                className="text-xs px-2 py-1 border rounded"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(post._id)}
                                className="text-xs px-3 py-1 bg-blue-600 text-white rounded font-bold"
                              >
                                Save Edit
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed mb-3">
                            {post.content}
                          </p>
                        )}

                        {/* Media Display if present */}
                        {post.mediaUrl && (
                          <div className="mb-3 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 max-h-72 flex items-center justify-center">
                            {post.mediaType === "video" ? (
                              <video src={post.mediaUrl} controls className="max-h-72 w-full object-contain" />
                            ) : (
                              <img src={post.mediaUrl} alt="Post media" className="max-h-72 w-full object-contain" />
                            )}
                          </div>
                        )}

                        {/* Tags & Mentions */}
                        {(post.tags?.length > 0 || post.mentions?.length > 0) && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {post.tags.map((t, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full"
                              >
                                #{t}
                              </span>
                            ))}
                            {post.mentions.map((m, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full"
                              >
                                @{m}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Social Engagement Actions */}
                        <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-600">
                          <button
                            onClick={() => handleLike(post._id)}
                            className={`flex items-center space-x-1.5 font-bold transition ${
                              isLiked ? "text-red-500" : "hover:text-red-500"
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500" : ""}`} />
                            <span>{post.likes.length}</span>
                          </button>

                          <button
                            onClick={() =>
                              setExpandedComments((prev) => ({
                                ...prev,
                                [post._id]: !prev[post._id],
                              }))
                            }
                            className="flex items-center space-x-1.5 hover:text-blue-600 transition"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.comments?.length || 0} Comments</span>
                          </button>

                          <button
                            onClick={() => handleShare(post._id)}
                            className="flex items-center space-x-1 hover:text-emerald-600 transition"
                          >
                            <Share2 className="w-4 h-4" />
                            <span>{post.shares || 0}</span>
                          </button>

                          <button
                            onClick={() => handleSave(post._id)}
                            className={`flex items-center space-x-1 transition ${
                              isSaved ? "text-blue-600" : "hover:text-blue-600"
                            }`}
                            title="Save / Bookmark"
                          >
                            <Bookmark className={`w-4 h-4 ${isSaved ? "fill-blue-600" : ""}`} />
                          </button>

                          <button
                            onClick={() => handleReport(post._id)}
                            className="hover:text-amber-600 transition text-[11px] text-gray-400"
                            title="Report Inappropriate Content"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Comments Drawer */}
                        {expandedComments[post._id] && (
                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-3 bg-gray-50/70 p-3 rounded-xl">
                            {post.comments?.map((c, cIdx) => (
                              <div key={cIdx} className="text-xs">
                                <span className="font-bold text-gray-900">{c.userName}: </span>
                                <span className="text-gray-700">{c.text}</span>
                              </div>
                            ))}

                            <div className="flex space-x-2 pt-1">
                              <input
                                type="text"
                                value={commentInputs[post._id] || ""}
                                onChange={(e) =>
                                  setCommentInputs((prev) => ({
                                    ...prev,
                                    [post._id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleCommentSubmit(post._id);
                                }}
                                placeholder="Write a comment..."
                                className="flex-1 text-xs px-3 py-1.5 border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <button
                                onClick={() => handleCommentSubmit(post._id)}
                                className="px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition"
                              >
                                Post
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Col: Community Rules & Quick Connect */}
              <div className="space-y-6">
                {/* Friend-Tier Posting Rules Guide */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                    Posting Privileges Matrix
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between p-2 rounded-lg bg-red-50 text-red-900 border border-red-100">
                      <span>0 Friends</span>
                      <span className="font-bold">No Posting Rights</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-blue-50 text-blue-900 border border-blue-100">
                      <span>1 Friend</span>
                      <span className="font-bold">1 Post / Day</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-purple-50 text-purple-900 border border-purple-100">
                      <span>2–5 Friends</span>
                      <span className="font-bold">2 Posts / Day</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-100">
                      <span>6–10 Friends</span>
                      <span className="font-bold">5 Posts / Day</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-100">
                      <span>&gt;10 Friends</span>
                      <span className="font-bold">Unlimited Daily Posts</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
                    Designed to foster authentic community connections and prevent spam bots.
                  </p>
                </div>

                {/* Quick Add Friend Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <span>Send Friend Request</span>
                  </h3>
                  <form onSubmit={handleSendFriendRequest} className="space-y-2">
                    <input
                      type="text"
                      required
                      value={targetFriendIdentifier}
                      onChange={(e) => setTargetFriendIdentifier(e.target.value)}
                      placeholder="Candidate Name or Email Address"
                      className="w-full text-xs px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition"
                    >
                      Connect & Increase Limit
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FRIENDS MANAGEMENT */}
          {activeTab === "friends" && (
            <div className="space-y-6">
              {/* Send Request Form */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span>Connect with New Friends</span>
                </h3>
                <form onSubmit={handleSendFriendRequest} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    value={targetFriendIdentifier}
                    onChange={(e) => setTargetFriendIdentifier(e.target.value)}
                    placeholder="Enter Candidate Name or Email address..."
                    className="flex-1 text-xs px-3.5 py-2.5 border rounded-xl"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Send Friend Request
                  </button>
                </form>
              </div>

              {/* Pending Incoming Requests */}
              {friendsData.pendingIncoming?.length > 0 && (
                <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-xs">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-3">
                    Pending Friend Requests ({friendsData.pendingIncoming.length})
                  </h4>
                  <div className="space-y-2">
                    {friendsData.pendingIncoming.map((req: any) => (
                      <div
                        key={req._id}
                        className="flex items-center justify-between p-3 bg-amber-50/60 rounded-xl text-xs border border-amber-100"
                      >
                        <span className="font-bold text-gray-900">{req.requesterName}</span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRespondFriendRequest(req._id, "accept")}
                            className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRespondFriendRequest(req._id, "reject")}
                            className="px-3 py-1 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accepted Friends List */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                  Your Accepted Friends ({friendsData.acceptedFriends?.length || 0})
                </h4>
                {friendsData.acceptedFriends?.length === 0 ? (
                  <p className="text-xs text-gray-500 py-4">
                    No friends connected yet. Connect with at least 1 friend to start creating posts!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {friendsData.acceptedFriends.map((f: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        <img
                          src={
                            f.avatar ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(f.name)}`
                          }
                          alt={f.name}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        <span className="text-xs font-bold text-gray-800 line-clamp-1">{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center space-x-1.5">
                <Bell className="w-4 h-4 text-blue-600" />
                <span>Community Alerts & Mentions</span>
              </h3>
              {notifications.length === 0 ? (
                <p className="text-xs text-gray-500 py-8 text-center">No new notifications yet.</p>
              ) : (
                notifications.map((notif: any) => (
                  <div
                    key={notif._id}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                      <span className="text-gray-800">{notif.message}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
