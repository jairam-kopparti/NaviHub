"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, MessageCircle, AlertTriangle, X, ChevronDown, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";

// ─── Types ───

interface ChatMessage {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  message: string;
  created_at: string;
}

interface ModerationError {
  severity: string;
  reason: string;
  category?: string;
}

interface EventChatProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
}

// ─── Constants ───

const POLL_INTERVAL = 5000; // 5 seconds
const MESSAGE_LIMIT = 50;

// ─── Helpers ───

function formatChatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatChatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Get the auth token for API requests.
 */
async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

// ─── Component ───

export default function EventChat({ eventId, isOpen, onClose }: EventChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moderationWarning, setModerationWarning] = useState<ModerationError | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Scroll helpers ──

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollDown(distanceFromBottom > 100);
  }, []);

  // ── Get current user ──

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  // ── Fetch messages ──

  const fetchMessages = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) {
      setError("Please sign in to view chat");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}/messages?limit=${MESSAGE_LIMIT}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) {
        setError("You must be registered for this event to view chat");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await res.json();
      setMessages(data.messages || []);
      setError(null);
    } catch {
      setError("Unable to load messages");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // ── Polling lifecycle ──

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    fetchMessages().then(() => {
      // Scroll to bottom on initial load
      setTimeout(() => scrollToBottom("instant"), 100);
    });

    pollRef.current = setInterval(fetchMessages, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isOpen, fetchMessages, scrollToBottom]);

  // ── Send message ──

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const token = await getAuthToken();
    if (!token) {
      setError("Please sign in to send messages");
      return;
    }

    setSending(true);
    setModerationWarning(null);

    try {
      const res = await fetch(`/api/events/${eventId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await res.json();

      if (res.status === 422) {
        // Moderation blocked
        setModerationWarning(data.moderation);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Failed to send message");
        return;
      }

      // Success - append to local state immediately
      setMessages((prev) => [...prev, data.message]);
      setInput("");
      setError(null);

      // Show low-severity warning if flagged but allowed
      if (data.moderation) {
        setModerationWarning(data.moderation);
      }

      setTimeout(() => scrollToBottom(), 50);
    } catch {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Delete message ──
  const handleDelete = async (messageId: string) => {
    const token = await getAuthToken();
    if (!token) return;

    // Optimistic update
    setMessages((prev) => prev.filter((m) => m.id !== messageId));

    try {
      const res = await fetch(`/api/events/${eventId}/messages?messageId=${messageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // Revert if failed (simplified: just refetch or show error)
        fetchMessages();
        setError("Failed to delete message");
      }
    } catch {
      fetchMessages();
      setError("Failed to delete message");
    }
  };

  // ── Date separators ──

  const getDateKey = (iso: string) => new Date(iso).toDateString();

  // ── Render ──

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Chat Panel */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="eventchat-title"
          className="relative w-full sm:max-w-lg h-[85vh] sm:h-[600px] bg-white sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 py-4 bg-[#1F1F1F] text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#997e67] flex items-center justify-center">
                <MessageCircle size={18} />
              </div>
              <div>
                <h3 id="eventchat-title" className="font-semibold text-sm">Event Chat</h3>
                <p className="text-xs text-gray-400">
                  {messages.length} message{messages.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close chat"
              className="p-2 hover:bg-white/10 rounded-full transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Messages Area ── */}
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-[#FAFAF8]"
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <motion.div
                  className="w-8 h-8 border-3 border-[#997e67] border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <p className="text-gray-600 text-sm">{error}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-14 h-14 rounded-full bg-[#F5F0EB] flex items-center justify-center mb-4">
                  <MessageCircle size={24} className="text-[#997e67]" />
                </div>
                <p className="!text-black text-sm font-medium">No messages yet</p>
                <p className="!text-black text-xs mt-1">Be the first to start the conversation!</p>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => {
                  const isOwn = msg.user_id === currentUserId;
                  const showDate =
                    i === 0 || getDateKey(msg.created_at) !== getDateKey(messages[i - 1].created_at);
                  const showName =
                    !isOwn && (i === 0 || messages[i - 1].user_id !== msg.user_id);

                  return (
                    <React.Fragment key={msg.id}>
                      {/* Date separator */}
                      {showDate && (
                        <div className="flex items-center justify-center py-3">
                          <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500 font-medium">
                            {formatChatDate(msg.created_at)}
                          </span>
                        </div>
                      )}

                      {/* Message bubble */}
                      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} ${showName ? "mt-3" : "mt-0.5"}`}>
                        <div className={`max-w-[80%] ${isOwn ? "items-end" : "items-start"}`}>
                          <p className={`text-xs !text-black mb-1 font-medium ${isOwn ? "text-right mr-3" : "ml-3"}`}>
                            {isOwn ? "You" : msg.user_name}
                          </p>
                          <div className="relative group">
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                                isOwn
                                  ? "bg-[#F5F0EB] !text-black rounded-br-md border border-[#E5E0DB]" 
                                  : "bg-white !text-black border border-gray-100 rounded-bl-md"
                              }`}
                            >
                              {msg.message}
                            </div>
                            
                            {/* Delete button only for own messages, visible on hover */}
                            {isOwn && (
                              <button
                                onClick={() => handleDelete(msg.id)}
                                aria-label="Delete message"
                                className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 bg-red-50 text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                          <p
                            className={`text-[10px] !text-black mt-1 ${
                              isOwn ? "text-right mr-2" : "ml-3"
                            }`}
                          >
                            {formatChatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Scroll-to-bottom button */}
          <AnimatePresence>
            {showScrollDown && (
              <motion.button
                onClick={() => scrollToBottom()}
                aria-label="Scroll to latest messages"
                className="absolute bottom-24 right-4 w-9 h-9 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition cursor-pointer"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <ChevronDown size={16} className="text-gray-600" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* ── Moderation Warning ── */}
          <AnimatePresence>
            {moderationWarning && (
              <motion.div
                className="px-4 py-3 bg-amber-50 border-t border-amber-100 flex items-start gap-3 shrink-0"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-amber-800 font-medium">
                    {moderationWarning.reason || "Message was flagged"}
                  </p>
                </div>
                <button
                  onClick={() => setModerationWarning(null)}
                  className="text-amber-400 hover:text-amber-600 transition cursor-pointer shrink-0"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Input Area ── */}
          {!error && (
            <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  aria-label="Type your message"
                  rows={1}
                  className="flex-1 resize-none px-4 py-3 bg-[#F5F0EB] rounded-xl text-sm !text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#997e67]/30 transition max-h-24 overflow-y-auto"
                  style={{ minHeight: "44px" }}
                  disabled={sending}
                />
                <motion.button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  aria-label="Send message"
                  className={`p-3 rounded-xl transition cursor-pointer shrink-0 ${
                    input.trim() && !sending
                      ? "bg-[#1F1F1F] text-white hover:bg-black"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send size={16} />
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
