"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Send,
  Plus,
  X,
  MoreVertical,
  Edit2,
  Trash2,
  Users,
  Trophy,
  BookOpen,
  Briefcase,
  Heart,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../lib/useUser";
import "../../styles/navilink.css";
import Link from "next/link";

// Types
interface Post {
  id: string;
  title: string;
  content: string;
  category_id: string;
  user_id: string;
  user_email: string;
  created_at: string;
  updated_at: string;
}

interface Reply {
  id: string;
  post_id: string;
  content: string;
  user_id: string;
  user_email: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

// Categories with icons
const CATEGORIES: Category[] = [
  {
    id: "sports",
    name: "Sports & Recreation",
    icon: <Trophy size={20} />,
    description: "Discuss local sports events, teams, and activities",
  },
  {
    id: "education",
    name: "Education & Learning",
    icon: <BookOpen size={20} />,
    description: "Share educational resources and learning opportunities",
  },
  {
    id: "careers",
    name: "Careers & Jobs",
    icon: <Briefcase size={20} />,
    description: "Job postings, career advice, and networking",
  },
  {
    id: "community",
    name: "Community Events",
    icon: <Users size={20} />,
    description: "Local meetups, gatherings, and community activities",
  },
  {
    id: "wellness",
    name: "Health & Wellness",
    icon: <Heart size={20} />,
    description: "Health tips, wellness programs, and support",
  },
];

// Helper functions
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

const getInitials = (email: string): string => {
  return email.charAt(0).toUpperCase();
};

const getDisplayName = (email: string): string => {
  return email.split("@")[0];
};

// Post Menu Component
const PostMenu = ({
  onEdit,
  onDelete,
}: {
  post: Post;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="navilink-post-menu" ref={menuRef}>
      <button
        className="navilink-post-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MoreVertical size={18} />
      </button>
      {isOpen && (
        <div className="navilink-post-menu-dropdown">
          <button
            className="navilink-post-menu-item"
            onClick={() => {
              onEdit();
              setIsOpen(false);
            }}
          >
            <Edit2 size={16} />
            Edit
          </button>
          <button
            className="navilink-post-menu-item delete"
            onClick={() => {
              onDelete();
              setIsOpen(false);
            }}
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

// Create Post Modal
const CreatePostModal = ({
  isOpen,
  onClose,
  onSubmit,
  categoryName,
  moderationError,
  onClearError,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, content: string) => Promise<boolean>;
  categoryName: string;
  moderationError: string | null;
  onClearError: () => void;
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    const success = await onSubmit(title.trim(), content.trim());
    setLoading(false);
    if (success) {
      setTitle("");
      setContent("");
      onClose();
    }
  };

  const handleClose = () => {
    setTitle("");
    setContent("");
    onClearError();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="navilink-modal-overlay" onClick={handleClose}>
      <div className="navilink-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0 }}>Create Post in {categoryName}</h3>
          <button
            onClick={handleClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "0.5rem",
            }}
          >
            <X size={20} />
          </button>
        </div>
        {moderationError && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
              color: "#dc2626",
              fontSize: "0.9rem",
            }}
          >
            {moderationError}
          </div>
        )}
        <input
          type="text"
          placeholder="Post Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (moderationError) onClearError();
          }}
          className="navilink-modal-input"
        />
        <textarea
          placeholder="What would you like to share?"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (moderationError) onClearError();
          }}
          className="navilink-modal-textarea"
        />
        <div className="navilink-modal-actions">
          <button className="navilink-modal-cancel" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="navilink-modal-submit"
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !content.trim()}
          >
            {loading ? "Checking & Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Edit Post Modal
// Inner component that resets when post changes via key
const EditPostModalContent = ({
  onClose,
  onSubmit,
  post,
  moderationError,
  onClearError,
}: {
  onClose: () => void;
  onSubmit: (title: string, content: string) => Promise<boolean>;
  post: Post;
  moderationError: string | null;
  onClearError: () => void;
}) => {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    const success = await onSubmit(title.trim(), content.trim());
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  const handleClose = () => {
    onClearError();
    onClose();
  };

  return (
    <div className="navilink-modal-overlay" onClick={handleClose}>
      <div className="navilink-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0 }}>Edit Post</h3>
          <button
            onClick={handleClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "0.5rem",
            }}
          >
            <X size={20} />
          </button>
        </div>
        {moderationError && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
              color: "#dc2626",
              fontSize: "0.9rem",
            }}
          >
            {moderationError}
          </div>
        )}
        <input
          type="text"
          placeholder="Post Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (moderationError) onClearError();
          }}
          className="navilink-modal-input"
        />
        <textarea
          placeholder="What would you like to share?"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (moderationError) onClearError();
          }}
          className="navilink-modal-textarea"
        />
        <div className="navilink-modal-actions">
          <button className="navilink-modal-cancel" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="navilink-modal-submit"
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !content.trim()}
          >
            {loading ? "Checking & Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

const EditPostModal = ({
  isOpen,
  onClose,
  onSubmit,
  post,
  moderationError,
  onClearError,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, content: string) => Promise<boolean>;
  post: Post | null;
  moderationError: string | null;
  onClearError: () => void;
}) => {
  if (!isOpen || !post) return null;

  // Using key to reset component state when post changes
  return (
    <EditPostModalContent
      key={post.id}
      onClose={onClose}
      onSubmit={onSubmit}
      post={post}
      moderationError={moderationError}
      onClearError={onClearError}
    />
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="navilink-modal-overlay" onClick={onClose}>
      <div 
        className="navilink-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "400px", textAlign: "center" }}
      >
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}
          >
            <Trash2 size={28} color="#dc2626" />
          </div>
          <h3 style={{ margin: "0 0 0.5rem", color: "var(--secondary-text)" }}>
            Delete Post?
          </h3>
          <p style={{ margin: 0, color: "#666", fontSize: "0.95rem" }}>
            This action cannot be undone. Are you sure you want to delete this post?
          </p>
        </div>
        <div className="navilink-modal-actions" style={{ justifyContent: "center" }}>
          <button 
            className="navilink-modal-cancel navilink-delete-cancel-btn" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="navilink-modal-submit navilink-delete-confirm-btn"
            onClick={onConfirm}
            disabled={loading}
            style={{ background: "#dc2626" }}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Post Card Component
const PostCard = ({
  post,
  replies,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
}: {
  post: Post;
  replies: Reply[];
  currentUserId: string | null;
  onReply: (postId: string, content: string) => void;
  onEdit: (post: Post) => void;
  onDelete: (postId: string) => void;
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    await onReply(post.id, replyContent.trim());
    setReplyContent("");
    setSubmitting(false);
  };

  const isOwner = currentUserId === post.user_id;
  const postReplies = replies.filter((r) => r.post_id === post.id);

  return (
    <div className="navilink-post-card">
      <div className="navilink-post-header">
        <div className="navilink-post-author">
          <div className="navilink-author-avatar">
            {getInitials(post.user_email)}
          </div>
          <div className="navilink-author-info">
            <span className="navilink-author-name">
              {getDisplayName(post.user_email)}
            </span>
            <span className="navilink-post-time">
              {formatTimeAgo(post.created_at)}
              {post.updated_at !== post.created_at && " (edited)"}
            </span>
          </div>
        </div>
        {isOwner && (
          <PostMenu
            post={post}
            onEdit={() => onEdit(post)}
            onDelete={() => onDelete(post.id)}
          />
        )}
      </div>

      <h4 className="navilink-post-title">{post.title}</h4>
      <p className="navilink-post-content">{post.content}</p>

      <div className="navilink-post-actions">
        <button
          className="navilink-action-btn"
          onClick={() => setShowReplies(!showReplies)}
        >
          <MessageCircle size={18} />
          {postReplies.length > 0
            ? `${postReplies.length} ${postReplies.length === 1 ? "Reply" : "Replies"}`
            : "Reply"}
        </button>
      </div>

      {showReplies && (
        <div className="navilink-replies-container">
          {postReplies.map((reply) => (
            <div key={reply.id} className="navilink-reply">
              <div className="navilink-reply-avatar">
                {getInitials(reply.user_email)}
              </div>
              <div className="navilink-reply-content">
                <div className="navilink-reply-header">
                  <span className="navilink-reply-author">
                    {getDisplayName(reply.user_email)}
                  </span>
                  <span className="navilink-reply-time">
                    {formatTimeAgo(reply.created_at)}
                  </span>
                </div>
                <p className="navilink-reply-text">{reply.content}</p>
              </div>
            </div>
          ))}

          {currentUserId && (
            <div className="navilink-reply-input-container">
              <input
                type="text"
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="navilink-reply-input"
                onKeyPress={(e) => e.key === "Enter" && handleReplySubmit()}
              />
              <button
                className="navilink-reply-submit"
                onClick={handleReplySubmit}
                disabled={submitting || !replyContent.trim()}
              >
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main Page Component
export default function NaviLinkPage() {
  const { user, loading: userLoading } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<Category>(CATEGORIES[0]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);

  // Fetch posts for selected category
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("navilink_posts")
          .select("*")
          .eq("category_id", selectedCategory.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching posts:", error);
          setPosts([]);
        } else {
          setPosts(data || []);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setPosts([]);
      }
      setLoading(false);
    };

    fetchPosts();
  }, [selectedCategory]);

  // Fetch all replies for current posts
  useEffect(() => {
    const fetchReplies = async () => {
      if (posts.length === 0) {
        setReplies([]);
        return;
      }

      const postIds = posts.map((p) => p.id);
      try {
        const { data, error } = await supabase
          .from("navilink_replies")
          .select("*")
          .in("post_id", postIds)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching replies:", error);
          setReplies([]);
        } else {
          setReplies(data || []);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setReplies([]);
      }
    };

    fetchReplies();
  }, [posts]);

  // Real-time subscription for posts
  useEffect(() => {
    const channel = supabase
      .channel("navilink_posts_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "navilink_posts",
          filter: `category_id=eq.${selectedCategory.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPosts((prev) => [payload.new as Post, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setPosts((prev) =>
              prev.map((p) =>
                p.id === payload.new.id ? (payload.new as Post) : p
              )
            );
          } else if (payload.eventType === "DELETE") {
            setPosts((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCategory]);

  // Real-time subscription for replies
  useEffect(() => {
    const channel = supabase
      .channel("navilink_replies_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "navilink_replies",
        },
        (payload) => {
          const newReply = payload.new as Reply;
          if (posts.some((p) => p.id === newReply.post_id)) {
            setReplies((prev) => [...prev, newReply]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [posts]);

  // Create post handler with moderation
  const handleCreatePost = async (title: string, content: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Moderate content before saving (check both title and content)
      const moderationResponse = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `${title}\n${content}` }),
      });

      const moderationResult = await moderationResponse.json();

      if (!moderationResult.safe) {
        setModerationError(moderationResult.message || "Your content contains inappropriate material.");
        return false;
      }

      // Content is safe, save to Supabase
      const { error } = await supabase.from("navilink_posts").insert([
        {
          title,
          content,
          category_id: selectedCategory.id,
          user_id: user.id,
          user_email: user.email,
        },
      ]);

      if (error) {
        console.error("Error creating post:", error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Unexpected error:", err);
      setModerationError("Failed to check content. Please try again.");
      return false;
    }
  };

  // Edit post handler with moderation
  const handleEditPost = async (title: string, content: string): Promise<boolean> => {
    if (!user || !editingPost) return false;

    try {
      // Moderate content before saving (check both title and content)
      const moderationResponse = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `${title}\n${content}` }),
      });

      const moderationResult = await moderationResponse.json();

      if (!moderationResult.safe) {
        setModerationError(moderationResult.message || "Your content contains inappropriate material.");
        return false;
      }

      // Content is safe, update in Supabase
      const { error } = await supabase
        .from("navilink_posts")
        .update({ title, content, updated_at: new Date().toISOString() })
        .eq("id", editingPost.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating post:", error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Unexpected error:", err);
      setModerationError("Failed to check content. Please try again.");
      return false;
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (postId: string) => {
    setDeletingPostId(postId);
    setShowDeleteModal(true);
  };

  // Delete post handler
  const handleDeletePost = async () => {
    if (!user || !deletingPostId) return;

    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from("navilink_posts")
        .delete()
        .eq("id", deletingPostId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting post:", error);
      } else {
        // Remove the post from local state immediately
        setPosts((prev) => prev.filter((p) => p.id !== deletingPostId));
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setDeletingPostId(null);
    }
  };

  // Reply handler
  const handleReply = async (postId: string, content: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("navilink_replies").insert([
        {
          post_id: postId,
          content,
          user_id: user.id,
          user_email: user.email,
        },
      ]);

      if (error) {
        console.error("Error creating reply:", error);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  return (
    <div className="navilink-page min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Hero Section */}
      <section
        className="relative border-b"
        style={{
          height: "60vh",
          borderColor: "var(--border)",
          overflow: "hidden",
        }}
      >
        <img
          src="/navilink.jpg"
          alt="NaviLink"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.4)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(48px, 8vw, 80px)",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            NAVILINK
          </h1>
          <p
            style={{
              fontSize: "1.25rem",
              opacity: 0.9,
              maxWidth: "600px",
              textAlign: "center",
              padding: "0 1rem",
            }}
          >
            Connect, share, and engage with your community
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div
        className="container mx-auto px-4 py-8"
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: "2rem",
          maxWidth: "1400px",
        }}
      >
        {/* Categories Sidebar */}
        <aside className="navilink-sidebar">
          <h3
            style={{
              color: "var(--secondary-text)",
              fontSize: "1.1rem",
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            Discussion Categories
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                className={`navilink-category-btn ${
                  selectedCategory.id === category.id ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                <span className="navilink-category-icon">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </aside>

        {/* Chat Interface */}
        <div className="navilink-chat-container">
          {/* Header */}
          <div className="navilink-chat-header">
            <div>
              <h2>{selectedCategory.name}</h2>
              <p
                style={{
                  color: "#888",
                  fontSize: "0.9rem",
                  margin: "0.25rem 0 0",
                }}
              >
                {selectedCategory.description}
              </p>
            </div>
            {user ? (
              <button
                className="navilink-create-post-btn"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={18} />
                Create Post
              </button>
            ) : null}
          </div>

          {/* Auth Prompt for non-signed in users */}
          {!userLoading && !user && (
            <div className="navilink-auth-prompt" style={{ margin: "1rem 1.5rem 0" }}>
              <p>
                <Link href="/pages/signin">Sign in</Link> to create posts and join the discussion.
              </p>
            </div>
          )}

          {/* Posts Container */}
          <div className="navilink-posts-container">
            {loading ? (
              <div className="navilink-empty-state">
                <p>Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="navilink-empty-state">
                <MessageCircle size={48} />
                <h4>No posts yet</h4>
                <p>
                  {user
                    ? "Be the first to start a discussion in this category!"
                    : "Sign in to be the first to start a discussion!"}
                </p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  replies={replies}
                  currentUserId={user?.id || null}
                  onReply={handleReply}
                  onEdit={(p) => {
                    setEditingPost(p);
                    setShowEditModal(true);
                  }}
                  onDelete={handleDeleteClick}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePost}
        categoryName={selectedCategory.name}
        moderationError={moderationError}
        onClearError={() => setModerationError(null)}
      />
      <EditPostModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingPost(null);
        }}
        onSubmit={handleEditPost}
        post={editingPost}
        moderationError={moderationError}
        onClearError={() => setModerationError(null)}
      />
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingPostId(null);
        }}
        onConfirm={handleDeletePost}
        loading={deleteLoading}
      />
    </div>
  );
}
