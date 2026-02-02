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
  Search,
  ArrowRight,
  ChevronRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../lib/useUser";
import "../../styles/navilink.css";
import Link from "next/link";

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
  color: string;
}

const CATEGORIES: Category[] = [
  {
    id: "sports",
    name: "Sports & Recreation",
    icon: <Trophy size={22} />,
    description: "Discuss local sports events, teams, and activities",
    color: "#f59e0b",
  },
  {
    id: "education",
    name: "Education & Learning",
    icon: <BookOpen size={22} />,
    description: "Share educational resources and learning opportunities",
    color: "#3b82f6",
  },
  {
    id: "careers",
    name: "Careers & Jobs",
    icon: <Briefcase size={22} />,
    description: "Job postings, career advice, and networking",
    color: "#8b5cf6",
  },
  {
    id: "community",
    name: "Community Events",
    icon: <Users size={22} />,
    description: "Local meetups, gatherings, and community activities",
    color: "#10b981",
  },
  {
    id: "wellness",
    name: "Health & Wellness",
    icon: <Heart size={22} />,
    description: "Health tips, wellness programs, and support",
    color: "#ef4444",
  },
];

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
}; const PostMenu = ({
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
        <div className="navilink-modal-header">
          <div>
            <h3>Create Post</h3>
            <p className="navilink-modal-subtitle">Share with {categoryName}</p>
          </div>
          <button onClick={handleClose} className="navilink-modal-close">
            <X size={20} />
          </button>
        </div>
        {moderationError && (
          <div className="navilink-error-banner">
            {moderationError}
          </div>
        )}
        <div className="navilink-modal-body">
          <input
            type="text"
            placeholder="Give your post a title..."
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (moderationError) onClearError();
            }}
            className="navilink-modal-input"
          />
          <textarea
            placeholder="What would you like to share with the community?"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (moderationError) onClearError();
            }}
            className="navilink-modal-textarea"
          />
        </div>
        <div className="navilink-modal-actions">
          <button className="navilink-modal-cancel" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="navilink-modal-submit"
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !content.trim()}
          >
            {loading ? (
              <>
                <span className="navilink-spinner"></span>
                Posting...
              </>
            ) : (
              <>
                <Send size={16} />
                Post
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

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
        <div className="navilink-modal-header">
          <div>
            <h3>Edit Post</h3>
            <p className="navilink-modal-subtitle">Update your post</p>
          </div>
          <button onClick={handleClose} className="navilink-modal-close">
            <X size={20} />
          </button>
        </div>
        {moderationError && (
          <div className="navilink-error-banner">
            {moderationError}
          </div>
        )}
        <div className="navilink-modal-body">
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
        </div>
        <div className="navilink-modal-actions">
          <button className="navilink-modal-cancel" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="navilink-modal-submit"
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !content.trim()}
          >
            {loading ? (
              <>
                <span className="navilink-spinner"></span>
                Saving...
              </>
            ) : (
              <>
                <Edit2 size={16} />
                Save Changes
              </>
            )}
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
        className="navilink-modal navilink-modal-small" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="navilink-delete-icon">
          <Trash2 size={28} />
        </div>
        <h3 className="navilink-delete-title">Delete Post?</h3>
        <p className="navilink-delete-text">
          This action cannot be undone. Are you sure you want to delete this post?
        </p>
        <div className="navilink-modal-actions navilink-delete-actions">
          <button 
            className="navilink-modal-cancel" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="navilink-modal-submit navilink-delete-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="navilink-spinner"></span>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const PostCard = ({
  post,
  replies,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  category,
}: {
  post: Post;
  replies: Reply[];
  currentUserId: string | null;
  onReply: (postId: string, content: string) => Promise<{ success: boolean; error?: string }>;
  onEdit: (post: Post) => void;
  onDelete: (postId: string) => void;
  category: Category;
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    setReplyError(null);
    const result = await onReply(post.id, replyContent.trim());
    setSubmitting(false);
    if (result.success) {
      setReplyContent("");
    } else {
      setReplyError(result.error || "Failed to post reply");
    }
  };

  const isOwner = currentUserId === post.user_id;
  const postReplies = replies.filter((r) => r.post_id === post.id);

  return (
    <div className="navilink-post-card">
      <div className="navilink-post-accent" style={{ backgroundColor: category.color }} />
      <div className="navilink-post-header">
        <div className="navilink-post-author">
          <div className="navilink-author-avatar" style={{ backgroundColor: category.color }}>
            {getInitials(post.user_email)}
          </div>
          <div className="navilink-author-info">
            <span className="navilink-author-name">
              {getDisplayName(post.user_email)}
            </span>
            <span className="navilink-post-time">
              <Clock size={12} />
              {formatTimeAgo(post.created_at)}
              {post.updated_at !== post.created_at && " • edited"}
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

      <div className="navilink-post-footer">
        <button
          className={`navilink-reply-toggle ${showReplies ? 'active' : ''}`}
          onClick={() => setShowReplies(!showReplies)}
        >
          <MessageCircle size={18} />
          <span>
            {postReplies.length > 0
              ? `${postReplies.length} ${postReplies.length === 1 ? "Reply" : "Replies"}`
              : "Reply"}
          </span>
          <ChevronRight size={16} className={`navilink-chevron ${showReplies ? 'rotated' : ''}`} />
        </button>
      </div>

      {showReplies && (
        <div className="navilink-replies-section">
          {postReplies.length > 0 && (
            <div className="navilink-replies-list">
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
            </div>
          )}

          {currentUserId && (
            <div className="navilink-reply-input-wrapper">
              {replyError && (
                <div className="navilink-reply-error">
                  {replyError}
                </div>
              )}
              <div className="navilink-reply-input-container">
                <input
                  type="text"
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => {
                    setReplyContent(e.target.value);
                    if (replyError) setReplyError(null);
                  }}
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleCreatePost = async (title: string, content: string): Promise<boolean> => {
    if (!user) return false;

    try {
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

  const handleEditPost = async (title: string, content: string): Promise<boolean> => {
    if (!user || !editingPost) return false;

    try {
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

  const handleDeleteClick = (postId: string) => {
    setDeletingPostId(postId);
    setShowDeleteModal(true);
  };

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

  const handleReply = async (postId: string, content: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "You must be signed in" };

    try {
      const moderationResponse = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const moderationResult = await moderationResponse.json();

      if (!moderationResult.safe) {
        return { success: false, error: moderationResult.message || "Inappropriate content detected" };
      }

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
        return { success: false, error: "Failed to save reply" };
      }

      return { success: true };
    } catch (err) {
      console.error("Unexpected error:", err);
      return { success: false, error: "Failed to check content. Please try again." };
    }
  };

  const filteredPosts = posts.filter((p) => {
    const q = searchTerm.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
  });

  return (
    <div className="navilink-page">
      <section className="navilink-hero">
        <div 
          className="navilink-hero-bg"
          style={{ backgroundImage: "url('/navilink.jpg')" }}
        />
        <div className="navilink-hero-overlay" />
        <div className="navilink-hero-content">
          <div className="navilink-hero-badge">
            <Sparkles size={14} />
            Community Forum
          </div>
          <h1 className="navilink-hero-title">NaviLink</h1>
          <p className="navilink-hero-subtitle">
            Connect, share, and engage with your community in meaningful discussions
          </p>
          <div className="navilink-search-container">
            <Search className="navilink-search-icon" size={20} />
            <input
              type="text"
              placeholder="Search discussions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="navilink-search-input"
            />
          </div>
        </div>
      </section>

      <div className="navilink-mobile-categories">
        <div className="navilink-mobile-categories-scroll">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={`navilink-category-pill ${selectedCategory.id === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
              style={{ 
                '--category-color': category.color 
              } as React.CSSProperties}
            >
              {category.icon}
              <span>{category.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="navilink-main">
        <aside className="navilink-sidebar">
          <div className="navilink-sidebar-header">
            <h3>Categories</h3>
            <p>Choose a topic to explore</p>
          </div>
          <div className="navilink-categories-list">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                className={`navilink-category-btn ${selectedCategory.id === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                <div 
                  className="navilink-category-icon"
                  style={{ backgroundColor: `${category.color}15`, color: category.color }}
                >
                  {category.icon}
                </div>
                <div className="navilink-category-info">
                  <span className="navilink-category-name">{category.name}</span>
                  <span className="navilink-category-desc">{category.description}</span>
                </div>
                <ChevronRight size={16} className="navilink-category-arrow" />
              </button>
            ))}
          </div>
        </aside>

        <div className="navilink-content">
          <div className="navilink-content-header">
            <div className="navilink-content-title">
              <div 
                className="navilink-content-icon"
                style={{ backgroundColor: `${selectedCategory.color}15`, color: selectedCategory.color }}
              >
                {selectedCategory.icon}
              </div>
              <div>
                <h2>{selectedCategory.name}</h2>
                <p>{selectedCategory.description}</p>
              </div>
            </div>
            {user && (
              <button
                className="navilink-create-btn"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={18} />
                <span>New Post</span>
              </button>
            )}
          </div>

          {!userLoading && !user && (
            <div className="navilink-auth-prompt">
              <div className="navilink-auth-content">
                <MessageCircle size={24} />
                <div>
                  <p className="navilink-auth-title">Join the conversation</p>
                  <p className="navilink-auth-text">
                    <Link href="/pages/signin">Sign in</Link> to create posts and participate in discussions.
                  </p>
                </div>
              </div>
              <Link href="/pages/signin" className="navilink-auth-btn">
                Sign In
                <ArrowRight size={16} />
              </Link>
            </div>
          )}

          <div className="navilink-posts-list">
            {loading ? (
              <div className="navilink-loading">
                <div className="navilink-loading-spinner" />
                <p>Loading discussions...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="navilink-empty">
                <div className="navilink-empty-icon">
                  <MessageCircle size={48} />
                </div>
                <h4>No discussions yet</h4>
                <p>
                  {searchTerm 
                    ? "No posts match your search. Try different keywords."
                    : user
                    ? "Be the first to start a discussion in this category!"
                    : "Sign in to be the first to start a discussion!"}
                </p>
                {user && !searchTerm && (
                  <button 
                    className="navilink-empty-btn"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus size={18} />
                    Create First Post
                  </button>
                )}
              </div>
            ) : (
              filteredPosts.map((post) => (
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
                  category={selectedCategory}
                />
              ))
            )}
          </div>
        </div>
      </div>

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

