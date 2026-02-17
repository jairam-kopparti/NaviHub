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
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../lib/useUser";
import "../../styles/navilink.css";
import Link from "next/link";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 }
};

const fadeInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
};

const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalContent = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: 20 }
};

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

const DEMO_POSTS: Post[] = [
  // Sports
  {
    id: "demo-sports-1",
    title: "Our NaviHub Running Club just hit 50 members!",
    content: "What started as a simple post looking for a running buddy has turned into a massive weekly event. We just hit 50 active members running every Tuesday! If you want to get fit and meet great people, come join us at the central trail entrance.",
    category_id: "sports",
    user_id: "demo-user-1",
    user_email: "tom.h@example.com",
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-sports-2",
    title: "Looking for tennis partners (Beginner/Intermediate)",
    content: "Hi everyone, I just moved to the area and I'm looking for someone to play tennis with on weekends. I'm around a 3.0 level. Let me know if you're interested!",
    category_id: "sports",
    user_id: "demo-user-2",
    user_email: "sarah.k@example.com",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Education
  {
    id: "demo-edu-1",
    title: "Compiled Study Notes for the Advanced Certification Exam",
    content: "Hi everyone! I noticed many of us are preparing for the upcoming certification. I've compiled all the notes from our study group sessions into one comprehensive PDF. The community support kept me going when I wanted to quit. Hope this helps others cross the finish line!",
    category_id: "education",
    user_id: "demo-user-3",
    user_email: "david.k@example.com",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-edu-2",
    title: "Free Python workshops starting next month",
    content: "Just wanted to share that the local library is hosting free coding workshops. Great specific resource for anyone trying to toggle careers!",
    category_id: "education",
    user_id: "demo-user-4",
    user_email: "tech.tutor@example.com",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Careers
  {
    id: "demo-career-1",
    title: "Landed my first developer role thanks to the mentorship program!",
    content: "I wanted to share a huge win with the community. After struggling with imposter syndrome for months, I connected with a mentor through the 'Careers' section here. Their guidance on my portfolio was invaluable. Two weeks later, I passed my interviews and got an offer! relationships built here really change lives.",
    category_id: "careers",
    user_id: "demo-user-5",
    user_email: "sarah.j@example.com",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-career-2",
    title: "Remote vs Office: What's your preference?",
    content: "I'm currently weighing two job offers. One is fully remote, the other is hybrid. I'd love to hear some perspectives from this community on what you value most in a work environment.",
    category_id: "careers",
    user_id: "demo-user-6",
    user_email: "job.seeker@example.com",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Community
  {
    id: "demo-comm-1",
    title: "Update: Weekend Park Cleanup Results",
    content: "Thank you to the 25 volunteers from NaviHub who showed up this Saturday! We successfully collected over 40 bags of litter and planted 10 new saplings. It's incredible to see our online connections translate into real-world positive change for our neighborhood.",
    category_id: "community",
    user_id: "demo-user-7",
    user_email: "marcus.w@example.com",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-comm-2",
    title: "Annual Block Party Planning",
    content: "It's that time of year again! We need volunteers for the food committee and music setup. Let's make this year the best one yet.",
    category_id: "community",
    user_id: "demo-user-8",
    user_email: "community.lead@example.com",
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  // Wellness
  {
    id: "demo-well-1",
    title: "30 Days of Mindfulness: My Journey initiated here",
    content: "A month ago, I saw a post here challenging us to practice mindfulness. I was skeptical, but I tried it. Today marks day 30, and my stress levels are down significantly. This platform isn't just about information; it's about better living. Thanks for the push!",
    category_id: "wellness",
    user_id: "demo-user-9",
    user_email: "alex.c@example.com",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-well-2",
    title: "Healthy Meal Prep Ideas needed",
    content: "I'm trying to eat healthier but struggle with time. Does anyone have quick, healthy meal prep recipes they swear by?",
    category_id: "wellness",
    user_id: "demo-user-10",
    user_email: "fit.fan@example.com",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const DEMO_REPLIES: Reply[] = [
  {
    id: "demo-reply-1",
    post_id: "demo-sports-1",
    content: "I joined two weeks ago and I'm already running my fastest 5k. The encouragement from the group is unmatched!",
    user_id: "demo-user-11",
    user_email: "lisa.m@example.com",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-reply-2",
    post_id: "demo-edu-1",
    content: "You are a lifesaver, David! The section on data structures was exactly what I was missing. Thank you for giving back.",
    user_id: "demo-user-12",
    user_email: "priya.m@example.com",
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-reply-3",
    post_id: "demo-career-1",
    content: "This is so inspiring to hear! Congratulations Sarah. Do you have any tips for the technical interview part?",
    user_id: "demo-user-13",
    user_email: "mike.t@example.com",
    created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-reply-4",
    post_id: "demo-comm-1",
    content: "My kids had a blast helping out! It was a great way to teach them about community service. Count us in for the next one.",
    user_id: "demo-user-14",
    user_email: "jessica.b@example.com",
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
     id: "demo-reply-5",
    post_id: "demo-well-1",
    content: "I'm on day 12 myself! The support thread really helps keep me accountable. Keep it up, Alex!",
    user_id: "demo-user-15",
    user_email: "raj.p@example.com",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }
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
    <motion.div 
      className="navilink-modal-overlay" 
      onClick={handleClose}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={modalOverlay}
      transition={{ duration: 0.2 }}
    >
      <motion.div 
        className="navilink-modal" 
        onClick={(e) => e.stopPropagation()}
        variants={modalContent}
        transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="navilink-modal-header">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3>Create Post</h3>
            <p className="navilink-modal-subtitle">Share with {categoryName}</p>
          </motion.div>
          <button onClick={handleClose} className="navilink-modal-close">
            <X size={20} />
          </button>
        </div>
        <AnimatePresence>
          {moderationError && (
            <motion.div 
              className="navilink-error-banner"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {moderationError}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div 
          className="navilink-modal-body"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
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
        </motion.div>
        <motion.div 
          className="navilink-modal-actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button className="navilink-modal-cancel" onClick={handleClose}>
            Cancel
          </button>
          <motion.button
            className="navilink-modal-submit"
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !content.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
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
    <motion.div 
      className="navilink-modal-overlay" 
      onClick={handleClose}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={modalOverlay}
      transition={{ duration: 0.2 }}
    >
      <motion.div 
        className="navilink-modal" 
        onClick={(e) => e.stopPropagation()}
        variants={modalContent}
        transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="navilink-modal-header">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3>Edit Post</h3>
            <p className="navilink-modal-subtitle">Update your post</p>
          </motion.div>
          <button onClick={handleClose} className="navilink-modal-close">
            <X size={20} />
          </button>
        </div>
        <AnimatePresence>
          {moderationError && (
            <motion.div 
              className="navilink-error-banner"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {moderationError}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div 
          className="navilink-modal-body"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
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
        </motion.div>
        <motion.div 
          className="navilink-modal-actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button className="navilink-modal-cancel" onClick={handleClose}>
            Cancel
          </button>
          <motion.button
            className="navilink-modal-submit"
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !content.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
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
    <motion.div 
      className="navilink-modal-overlay" 
      onClick={onClose}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={modalOverlay}
      transition={{ duration: 0.2 }}
    >
      <motion.div 
        className="navilink-modal navilink-modal-small" 
        onClick={(e) => e.stopPropagation()}
        variants={modalContent}
        transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
      >
        <motion.div 
          className="navilink-delete-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 15 }}
        >
          <Trash2 size={28} />
        </motion.div>
        <motion.h3 
          className="navilink-delete-title"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          Delete Post?
        </motion.h3>
        <motion.p 
          className="navilink-delete-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          This action cannot be undone. Are you sure you want to delete this post?
        </motion.p>
        <motion.div 
          className="navilink-modal-actions navilink-delete-actions"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <button 
            className="navilink-modal-cancel" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <motion.button
            className="navilink-modal-submit navilink-delete-btn"
            onClick={onConfirm}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
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
    <motion.div 
      className="navilink-post-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3 }}
    >
      <div className="navilink-post-accent" style={{ backgroundColor: category.color }} />
      <div className="navilink-post-header">
        <div className="navilink-post-author">
          <motion.div 
            className="navilink-author-avatar" 
            style={{ backgroundColor: category.color }}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {getInitials(post.user_email)}
          </motion.div>
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
        <motion.button
          className={`navilink-reply-toggle ${showReplies ? 'active' : ''}`}
          onClick={() => setShowReplies(!showReplies)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <MessageCircle size={18} />
          <span>
            {postReplies.length > 0
              ? `${postReplies.length} ${postReplies.length === 1 ? "Reply" : "Replies"}`
              : "Reply"}
          </span>
          <ChevronRight size={16} className={`navilink-chevron ${showReplies ? 'rotated' : ''}`} />
        </motion.button>
      </div>

      <AnimatePresence>
        {showReplies && (
          <motion.div 
            className="navilink-replies-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {postReplies.length > 0 && (
              <div className="navilink-replies-list">
                {postReplies.map((reply, index) => (
                  <motion.div 
                    key={reply.id} 
                    className="navilink-reply"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
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
                </motion.div>
              ))}
            </div>
          )}

          {currentUserId && (
            <div className="navilink-reply-input-wrapper">
              <AnimatePresence>
                {replyError && (
                  <motion.div 
                    className="navilink-reply-error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {replyError}
                  </motion.div>
                )}
              </AnimatePresence>
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
                <motion.button
                  className="navilink-reply-submit"
                  onClick={handleReplySubmit}
                  disabled={submitting || !replyContent.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send size={16} />
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
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
          const demoPosts = DEMO_POSTS.filter(p => p.category_id === selectedCategory.id);
          setPosts(demoPosts);
        } else {
          const demoPosts = DEMO_POSTS.filter(p => p.category_id === selectedCategory.id);
          setPosts([...demoPosts, ...(data || [])]);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        const demoPosts = DEMO_POSTS.filter(p => p.category_id === selectedCategory.id);
        setPosts(demoPosts);
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

      const allPostIds = posts.map((p) => p.id);
      const dbPostIds = allPostIds.filter(id => !id.startsWith('demo-'));
      
      let dbReplies: Reply[] = [];

      if (dbPostIds.length > 0) {
        try {
          const { data, error } = await supabase
            .from("navilink_replies")
            .select("*")
            .in("post_id", dbPostIds)
            .order("created_at", { ascending: true });

          if (error) {
            console.error("Error fetching replies:", error);
          } else {
            dbReplies = data || [];
          }
        } catch (err) {
          console.error("Unexpected error:", err);
        }
      }

      const demoReplies = DEMO_REPLIES.filter(r => allPostIds.includes(r.post_id));
      setReplies([...demoReplies, ...dbReplies]);
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
      
      // OPTIONAL: Warn user about low severity issues (like mild insults) even if allowed
      if (moderationResult.details && moderationResult.details.flagged && moderationResult.details.allowed) {
         // You could choose to show a toast or notification here
         console.warn("Content flagged but allowed:", moderationResult.details.reason);
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
      
      // OPTIONAL: Warn user about low severity issues (like mild insults) even if allowed
      if (moderationResult.details && moderationResult.details.flagged && moderationResult.details.allowed) {
         console.warn("Content flagged but allowed:", moderationResult.details.reason);
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

    // Check if replying to a demo post
    const isDemoPost = DEMO_POSTS.some(p => p.id === postId);

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

      if (moderationResult.details && moderationResult.details.flagged && moderationResult.details.allowed) {
         console.warn("Reply flagged but allowed:", moderationResult.details.reason);
      }

      if (isDemoPost) {
        // Handle local-only reply for demo posts
        const newReply: Reply = {
          id: `local-reply-${Date.now()}`,
          post_id: postId,
          content,
          user_id: user.id,
          user_email: user.email || 'user',
          created_at: new Date().toISOString(),
        };
        setReplies(prev => [...prev, newReply]);
        return { success: true };
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
        <motion.div 
          className="navilink-hero-bg"
          style={{ backgroundImage: "url('/navilink.jpg')" }}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <div className="navilink-hero-overlay" />
        <div className="navilink-hero-content">
          <motion.div 
            className="navilink-hero-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Sparkles size={14} />
            Community Forum
          </motion.div>
          <motion.h1 
            className="navilink-hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            NaviLink
          </motion.h1>
          <motion.p 
            className="navilink-hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            Connect, share, and engage with your community in meaningful discussions
          </motion.p>
          <motion.div 
            className="navilink-search-container"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Search className="navilink-search-icon" size={20} />
            <input
              type="text"
              placeholder="Search discussions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="navilink-search-input"
            />
          </motion.div>
        </div>
      </section>

      <motion.div 
        className="navilink-mobile-categories"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="navilink-mobile-categories-scroll">
          {CATEGORIES.map((category, index) => (
            <motion.button
              key={category.id}
              className={`navilink-category-pill ${selectedCategory.id === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
              style={{ 
                '--category-color': category.color 
              } as React.CSSProperties}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {category.icon}
              <span>{category.name.split(' ')[0]}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <div className="navilink-main">
        <motion.aside 
          className="navilink-sidebar"
          initial="hidden"
          animate="visible"
          variants={fadeInLeft}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="navilink-sidebar-header">
            <h3>Categories</h3>
            <p>Choose a topic to explore</p>
          </div>
          <motion.div 
            className="navilink-categories-list"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {CATEGORIES.map((category, index) => (
              <motion.button
                key={category.id}
                className={`navilink-category-btn ${selectedCategory.id === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
                variants={fadeInUp}
                transition={{ duration: 0.3 }}
                whileHover={{ x: 5, transition: { duration: 0.2 } }}
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
              </motion.button>
            ))}
          </motion.div>
        </motion.aside>

        <motion.div 
          className="navilink-content"
          initial="hidden"
          animate="visible"
          variants={fadeInRight}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.div 
            className="navilink-content-header"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <div className="navilink-content-title">
              <motion.div 
                className="navilink-content-icon"
                style={{ backgroundColor: `${selectedCategory.color}15`, color: selectedCategory.color }}
                key={selectedCategory.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                {selectedCategory.icon}
              </motion.div>
              <div>
                <motion.h2
                  key={selectedCategory.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {selectedCategory.name}
                </motion.h2>
                <p>{selectedCategory.description}</p>
              </div>
            </div>
            {user && (
              <motion.button
                className="navilink-create-btn"
                onClick={() => setShowCreateModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus size={18} />
                <span>New Post</span>
              </motion.button>
            )}
          </motion.div>

          {!userLoading && !user && (
            <motion.div 
              className="navilink-auth-prompt"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <div className="navilink-auth-content">
                <MessageCircle size={24} />
                <div>
                  <p className="navilink-auth-title">Join the conversation</p>
                  <p className="navilink-auth-text">
                    <Link href="/pages/signin">Sign in</Link> to create posts and participate in discussions.
                  </p>
                </div>
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link href="/pages/signin" className="navilink-auth-btn">
                  Sign In
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            </motion.div>
          )}

          <div className="navilink-posts-list">
            {loading ? (
              <motion.div 
                className="navilink-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="navilink-loading-spinner"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p>Loading discussions...</p>
              </motion.div>
            ) : filteredPosts.length === 0 ? (
              <motion.div 
                className="navilink-empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div 
                  className="navilink-empty-icon"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 15 }}
                >
                  <MessageCircle size={48} />
                </motion.div>
                <h4>No discussions yet</h4>
                <p>
                  {searchTerm 
                    ? "No posts match your search. Try different keywords."
                    : user
                    ? "Be the first to start a discussion in this category!"
                    : "Sign in to be the first to start a discussion!"}
                </p>
                {user && !searchTerm && (
                  <motion.button 
                    className="navilink-empty-btn"
                    onClick={() => setShowCreateModal(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus size={18} />
                    Create First Post
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                <AnimatePresence>
                  {filteredPosts.map((post) => (
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
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <CreatePostModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreatePost}
            categoryName={selectedCategory.name}
            moderationError={moderationError}
            onClearError={() => setModerationError(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showEditModal && (
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
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showDeleteModal && (
          <DeleteConfirmModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setDeletingPostId(null);
            }}
            onConfirm={handleDeletePost}
            loading={deleteLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

