"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { X, MapPin, Clock, Users, Search, Filter, ArrowRight, MessageCircle, ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../lib/useUser";
import EventChat from "../../components/events/EventChat";
import "../../styles/events.css";
import Link from "next/link";

const CURRENT_YEAR = new Date().getFullYear();
const EVENT_WINDOW_START = `${CURRENT_YEAR}-05-01`;
const EVENT_WINDOW_END = `${CURRENT_YEAR}-06-30`;

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
};

const sidebarVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { 
      type: "spring" as const,
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    x: "100%", 
    opacity: 0,
    transition: { duration: 0.3, ease: "easeInOut" as const }
  }
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

type Category =
  | "sports"
  | "social"
  | "education"
  | "volunteer"
  | "workshops"
  | "community_meetings"
  | "other";

type Borough = "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island";

interface Event {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  event_date: string;
  start_time: string;
  end_time: string;
  location_name: string | null;
  address: string | null;
  is_virtual: boolean;
  capacity: number | null;
  spots_taken: number;
  signup_required: boolean;
  status: string | null;
  user_id: string | null;
  creator_name: string | null;
  created_at: string;
  updated_at: string;
}

const BOROUGHS: Borough[] = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];

const CATEGORIES: Category[] = [
  "sports",
  "social",
  "education",
  "volunteer",
  "workshops",
  "community_meetings",
  "other",
];

const CATEGORY_LABELS: Record<Category, string> = {
  sports: "Sports",
  social: "Social",
  education: "Education",
  volunteer: "Volunteer",
  workshops: "Workshops",
  community_meetings: "Community",
  other: "Other",
};

const formatDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

const getCreatorName = (creatorName?: string | null) => {
  const clean = creatorName?.trim();
  return clean && clean.length > 0 ? clean : "Community Sponsored";
};

// ---------- Event Detail Modal ----------

const EventModal = ({
  event,
  onClose,
  isSignedUp,
  onSignupChange,
  onOpenChat,
}: {
  event: Event;
  onClose: () => void;
  isSignedUp: boolean;
  onSignupChange: (eventId: string, signed: boolean) => void;
  onOpenChat: (eventId: string) => void;
}) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const spotsAvailable = event.capacity ? event.capacity - event.spots_taken : null;
  const isFull = spotsAvailable !== null && spotsAvailable <= 0;

  const handleSignup = async () => {
    if (!user) {
      setError("Please sign in to register");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isSignedUp) {
        await supabase.from("event_signups").delete().eq("user_id", user.id).eq("event_id", event.id);
        await supabase.from("events").update({ spots_taken: Math.max(0, event.spots_taken - 1) }).eq("id", event.id);
        onSignupChange(event.id, false);

        // Send cancellation email
        try {
          await fetch("/api/send-event-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userEmail: user.email,
              userName: user.user_metadata?.full_name || "Community Member",
              eventName: event.title,
              type: "cancellation"
            }),
          });
        } catch (emailErr) {
          console.error("Failed to send cancellation email:", emailErr);
        }
      } else {
        await supabase.from("event_signups").insert([{ user_id: user.id, event_id: event.id }]);
        await supabase.from("events").update({ spots_taken: event.spots_taken + 1 }).eq("id", event.id);
        onSignupChange(event.id, true);

        // Send confirmation email
        try {
          await fetch("/api/send-event-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userEmail: user.email,
              userName: user.user_metadata?.full_name || "Community Member",
              eventName: event.title,
              type: "confirmation"
            }),
          });
        } catch (emailErr) {
          console.error("Failed to send confirmation email:", emailErr);
          // Don't block the UI flow for email error, just log it
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div 
        className="absolute inset-0 bg-black/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
        className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Header with gradient */}
        <div className="bg-[#997e67] p-8 text-white">
          <button onClick={onClose} aria-label="Close event details" className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition cursor-pointer">
            <X size={20} />
          </button>
          <motion.span
            className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            {CATEGORY_LABELS[event.category]}
          </motion.span>
          <motion.h2
            id="event-modal-title"
            className="text-2xl font-bold mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {event.title}
          </motion.h2>
          <motion.p 
            className="text-white/90 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            {formatDate(event.event_date)}
          </motion.p>
          <motion.p
            className="text-white/90 text-sm mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Hosted by {getCreatorName(event.creator_name)}
          </motion.p>
        </div>

        {/* Content */}
        <motion.div 
          className="p-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {event.description && (
            <p className="!text-gray-600 mb-6 leading-relaxed">{event.description}</p>
          )}

          <div className="space-y-4 mb-6">
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="w-10 h-10 rounded-full bg-[#f4f1ee] flex items-center justify-center">
                <Clock size={18} className="text-[#997e67]" />
              </div>
              <div>
                <p className="!text-gray-400 text-xs uppercase tracking-wide">Time</p>
                <p className="!text-gray-800 font-medium">{formatTime(event.start_time)} - {formatTime(event.end_time)}</p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="w-10 h-10 rounded-full bg-[#f4f1ee] flex items-center justify-center">
                <MapPin size={18} className="text-[#997e67]" />
              </div>
              <div>
                <p className="!text-gray-400 text-xs uppercase tracking-wide">Location</p>
                <p className="!text-gray-800 font-medium">{event.is_virtual ? "Virtual Event" : event.location_name || "TBD"}</p>
                {event.address && !event.is_virtual && <p className="!text-gray-500 text-sm">{event.address}</p>}
              </div>
            </motion.div>

            {event.capacity && (
              <motion.div 
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
              >
                <div className="w-10 h-10 rounded-full bg-[#f4f1ee] flex items-center justify-center">
                  <Users size={18} className="text-[#997e67]" />
                </div>
                <div>
                  <p className="!text-gray-400 text-xs uppercase tracking-wide">Availability</p>
                  <p className="!text-gray-800 font-medium">{spotsAvailable} of {event.capacity} spots available</p>
                </div>
              </motion.div>
            )}
          </div>

          {error && <p role="alert" className="!text-black text-sm mb-4">{error}</p>}

          {event.signup_required && (
            <motion.button
              onClick={handleSignup}
              disabled={loading || (isFull && !isSignedUp)}
              className={`w-full py-4 rounded-2xl font-semibold transition-all cursor-pointer ${
                isFull && !isSignedUp
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : isSignedUp
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-[#1F1F1F] text-white hover:bg-black"
              } ${loading ? "opacity-60" : ""}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: isFull && !isSignedUp ? 1 : 1.02 }}
              whileTap={{ scale: isFull && !isSignedUp ? 1 : 0.98 }}
            >
              {loading ? "Processing..." : isFull && !isSignedUp ? "Fully Booked" : isSignedUp ? "Cancel Registration" : "Register Now"}
            </motion.button>
          )}

          {/* Chat Button - only visible for signed-up users */}
          {isSignedUp && (
            <motion.button
              onClick={() => { onClose(); onOpenChat(event.id); }}
              className="w-full mt-3 py-4 rounded-2xl font-semibold transition-all cursor-pointer bg-[#F5F0EB] text-[#997e67] hover:bg-[#EDE8E3] border border-[#E5E0DB] flex items-center justify-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <MessageCircle size={18} />
              Open Event Chat
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

// ---------- Main Component ----------

function CommunityEventsInner() {
  const { user, loading: userLoading } = useUser();
  const searchParams = useSearchParams();
  const deepLinkEventId = searchParams.get("eventId");
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [activeBorough, setActiveBorough] = useState<Borough | "all">("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [userSignups, setUserSignups] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [chatEventId, setChatEventId] = useState<string | null>(null);
  const [suggestSubmitting, setSuggestSubmitting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestSuccess, setSuggestSuccess] = useState<string | null>(null);
  const [suggestTitle, setSuggestTitle] = useState("");
  const [suggestDescription, setSuggestDescription] = useState("");
  const [suggestCategory, setSuggestCategory] = useState<Category>("community_meetings");
  const [suggestDate, setSuggestDate] = useState("");
  const [suggestStartTime, setSuggestStartTime] = useState("");
  const [suggestEndTime, setSuggestEndTime] = useState("");
  const [suggestBorough, setSuggestBorough] = useState<Borough>("Manhattan");
  const [suggestAddress, setSuggestAddress] = useState("");
  const [suggestVirtual, setSuggestVirtual] = useState(false);
  const [suggestCapacity, setSuggestCapacity] = useState("");

  // Pagination new
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  
  // (Effect removed)


  useEffect(() => {
    if (!user || userLoading) return;
    const fetchUserSignups = async () => {
      const { data } = await supabase.from("event_signups").select("event_id").eq("user_id", user.id);
      if (data) setUserSignups(data.map((s) => s.event_id));
    };
    fetchUserSignups();
  }, [user, userLoading]);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      
      const now = new Date();
      // Format as YYYY-MM-DD using local time
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const lowerBound = todayStr > EVENT_WINDOW_START ? todayStr : EVENT_WINDOW_START;

      if (lowerBound > EVENT_WINDOW_END) {
        setEvents([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from("events")
        .select("*")
        .eq("status", "approved")
        .gte("event_date", lowerBound)
        .lte("event_date", EVENT_WINDOW_END)
        .order("event_date", { ascending: true });
      
      if (activeCategory !== "all") query = query.eq("category", activeCategory);
      if (activeBorough !== "all") query = query.eq("location_name", activeBorough);
      
      const { data } = await query;
      
      let upcomingEvents = (data as Event[]) || [];

      // Filter out events that ended earlier today
      upcomingEvents = upcomingEvents.filter(event => {
        if (event.event_date > todayStr) return true;
        if (event.event_date === todayStr && event.end_time) {
           const [h, m] = event.end_time.split(":");
           const endMinutes = parseInt(h, 10) * 60 + parseInt(m, 10);
           return endMinutes >= currentMinutes;
        }
        return true;
      });

      setEvents(upcomingEvents);
      setLoading(false);
    };
    fetchEvents();
  }, [activeCategory, activeBorough]);

  useEffect(() => {
    if (deepLinkEventId && events.length > 0 && !deepLinkHandled) {
      const matched = events.find(e => e.id === deepLinkEventId);
      if (matched) {
        setSelectedEvent(matched);
      }
      setDeepLinkHandled(true);
    }
  }, [deepLinkEventId, events, deepLinkHandled]);

  const filteredEvents = events.filter((e) => {
    const q = searchTerm.toLowerCase();
    return e.title.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q) || e.location_name?.toLowerCase().includes(q);
  });
  const activeFilterCount = (activeCategory !== "all" ? 1 : 0) + (activeBorough !== "all" ? 1 : 0);
  const canEditSuggest = !!user && !userLoading;
  const canHoverSubmit = canEditSuggest && !suggestSubmitting;

  const totalPages = Math.ceil(filteredEvents.length / PAGE_SIZE);
  const paginatedEvents = filteredEvents.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const upcomingEvents = filteredEvents.slice(0, 3);
  const myEvents = filteredEvents.filter((e) => userSignups.includes(e.id));

  const handleSignupChange = (eventId: string, signed: boolean) => {
    setUserSignups((prev) => signed ? [...prev, eventId] : prev.filter((id) => id !== eventId));
    
    // Update the specific event in the events list to reflect new spots
    setEvents((prevEvents) => 
      prevEvents.map((e) => 
        e.id === eventId 
          ? { ...e, spots_taken: signed ? e.spots_taken + 1 : Math.max(0, e.spots_taken - 1) } 
          : e
      )
    );

    // If the selected event in the modal is this one, update it too
    if (selectedEvent && selectedEvent.id === eventId) {
      setSelectedEvent((prev) => prev ? ({
        ...prev,
        spots_taken: signed ? prev.spots_taken + 1 : Math.max(0, prev.spots_taken - 1)
      }) : null);
    }
  };

  const resetSuggestForm = () => {
    setSuggestTitle("");
    setSuggestDescription("");
    setSuggestCategory("community_meetings");
    setSuggestDate("");
    setSuggestStartTime("");
    setSuggestEndTime("");
    setSuggestBorough("Manhattan");
    setSuggestAddress("");
    setSuggestVirtual(false);
    setSuggestCapacity("");
  };

  const handleSuggestEventSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuggestError(null);
    setSuggestSuccess(null);

    if (!user) {
      setSuggestError("Please sign in to suggest an event.");
      return;
    }

    if (!suggestTitle.trim() || !suggestDescription.trim() || !suggestDate || !suggestStartTime || !suggestEndTime) {
      setSuggestError("Please complete all required fields.");
      return;
    }

    if (suggestEndTime <= suggestStartTime) {
      setSuggestError("End time must be later than start time.");
      return;
    }

    if (suggestDate < EVENT_WINDOW_START || suggestDate > EVENT_WINDOW_END) {
      setSuggestError("Date must be between May 1 and June 30.");
      return;
    }

    setSuggestSubmitting(true);

    try {
      const moderationRes = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `${suggestTitle}\n${suggestDescription}` }),
      });

      const moderationData = await moderationRes.json();
      if (!moderationData.safe) {
        throw new Error(moderationData.message || "Content did not pass moderation.");
      }

      const creatorName =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Community Sponsored";

      const parsedCapacity = suggestCapacity.trim() ? Number(suggestCapacity) : null;
      const capacityValue = Number.isNaN(parsedCapacity) ? null : parsedCapacity;

      const { error: insertError } = await supabase.from("events").insert([
        {
          title: suggestTitle.trim(),
          description: suggestDescription.trim(),
          category: suggestCategory,
          event_date: suggestDate,
          start_time: suggestStartTime,
          end_time: suggestEndTime,
          location_name: suggestVirtual ? "Virtual" : suggestBorough,
          address: suggestVirtual ? null : suggestAddress.trim() || null,
          is_virtual: suggestVirtual,
          capacity: capacityValue,
          spots_taken: 0,
          signup_required: true,
          status: "pending",
          user_id: user.id,
          creator_name: creatorName,
        },
      ]);

      if (insertError) {
        throw insertError;
      }

      setSuggestSuccess("Event submitted. It is now pending admin approval.");
      resetSuggestForm();

      setTimeout(() => {
        setSuggestSuccess(null);
      }, 3000);
    } catch (err) {
      setSuggestError(err instanceof Error ? err.message : "Failed to submit event");
    } finally {
      setSuggestSubmitting(false);
    }
  };

  return (
    <div className="events-page min-h-screen bg-[var(--surface)]">
      {/* Hero Section - Minimal & Bold */}
      <section className="relative min-h-[50vh] sm:min-h-[60vh] bg-black overflow-hidden flex flex-col justify-center">
        <motion.div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/page-images/events.jpg')" }}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/30" />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-32 md:py-40 w-full">
          <div className="max-w-2xl mt-6 sm:mt-10">
            <motion.p 
              className="text-[#CCBEB1] font-medium mb-4 sm:mb-6 tracking-wide uppercase text-xs sm:text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Community Events
            </motion.p>
            <motion.h1 
              className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              Connect, Learn & Grow Together
            </motion.h1>
            <motion.p 
              className="text-gray-200 text-base sm:text-lg mb-8 sm:mb-12 leading-relaxed max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Join local events, workshops, and meetups that bring our community together.
            </motion.p>
            
            {/* Search Bar */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <input
                type="text"
                placeholder="Search events..."
                aria-label="Search events"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                className="w-full pl-12 sm:pl-16 pr-4 sm:pr-6 py-4 sm:py-5 bg-white border border-transparent rounded-xl sm:rounded-2xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[#404E3B] focus:ring-1 focus:ring-[#404E3B] shadow-md transition text-base sm:text-lg"
              />
              <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* My Events Section */}
      {user && myEvents.length > 0 && (
        <section className="py-12 sm:py-20 px-4 sm:px-6 bg-[var(--surface)] border-b border-gray-100">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-10"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
            >
              <div>
                <h2 className="!text-black text-2xl sm:text-3xl font-bold">My Registered Events</h2>
                <p className="!text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">Events you&apos;ve signed up for</p>
              </div>
              <motion.span 
                className="px-4 py-2 bg-[#1F1F1F] text-white rounded-full text-sm font-medium w-fit"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3, type: "spring", stiffness: 200 }}
              >
                {myEvents.length} event{myEvents.length !== 1 ? "s" : ""}
              </motion.span>
            </motion.div>

            <motion.div 
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {myEvents.map((event) => (
                <motion.div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="group bg-[#F5F0EB] border border-[#E5E0DB] rounded-3xl p-6 cursor-pointer hover:border-[#997e67] transition-colors"
                  variants={fadeInUp}
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="px-3 py-1 bg-white rounded-full text-[#997e67] text-xs font-medium border border-[#E5E0DB]">
                      {CATEGORY_LABELS[event.category]}
                    </span>
                    <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                       Registered <span className="text-xs">✓</span>
                    </span>
                  </div>
                  <h3 className="text-[#1F1F1F] font-bold text-lg mb-2 group-hover:text-[#997e67] transition">
                    {event.title}
                  </h3>
                  <p className="!text-[#6b5a4e] text-xs sm:text-sm mb-2">Hosted by {getCreatorName(event.creator_name)}</p>
                  <div className="flex items-center gap-4 text-gray-500 text-sm">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {formatDate(event.event_date)}
                    </span>
                    {event.location_name && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {event.location_name}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Featured / Upcoming Events */}
      {!loading && upcomingEvents.length > 0 && (
        <section className="py-12 sm:py-20 px-4 sm:px-6 bg-[var(--surface)]">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-10"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
            >
              <div>
                <h2 className="!text-black text-2xl sm:text-3xl font-bold">Featured Events</h2>
                <p className="!text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">Don&apos;t miss out on these upcoming events</p>
              </div>
            </motion.div>

            <motion.div 
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {upcomingEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`group cursor-pointer ${index === 0 ? "sm:col-span-2 lg:col-span-2 lg:row-span-2" : ""}`}
                  variants={index === 0 ? scaleIn : fadeInUp}
                  transition={{ duration: 0.6 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                >
                  <div className={`relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow h-full flex flex-col`}>
                    <motion.div 
                      className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-[#997e67] to-[#CCBEB1] z-10"
                      initial={{ scaleX: 0, transformOrigin: "left" }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                    />
                    
                    <div className="p-5 sm:p-8 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700 text-xs font-medium">
                          {CATEGORY_LABELS[event.category]}
                        </span>
                        {event.capacity && (
                          <span className={`text-xs sm:text-sm font-medium ${event.capacity - event.spots_taken <= 5 ? "text-orange-500" : "text-gray-400"}`}>
                            {event.capacity - event.spots_taken} spots left
                          </span>
                        )}
                      </div>

                      <h3 className={`!text-black font-bold mb-2 sm:mb-3 group-hover:text-[#997e67] transition ${index === 0 ? "text-xl sm:text-2xl lg:text-3xl" : "text-base sm:text-lg"}`}>
                        {event.title}
                      </h3>
                      <p className={`!text-[#6b5a4e] ${index === 0 ? "text-sm sm:text-base" : "text-xs sm:text-sm"} mb-3`}>
                        Hosted by {getCreatorName(event.creator_name)}
                      </p>

                      {event.description && (
                        <p className={`!text-gray-500 mb-4 sm:mb-6 ${index === 0 ? "text-base sm:text-lg line-clamp-2 sm:line-clamp-3" : "text-xs sm:text-sm line-clamp-2"}`}>
                          {event.description}
                        </p>
                      )}

                      {/* Featured Event Image */}
                      {index === 0 && (
                        <motion.div 
                          className="w-full h-48 sm:h-64 md:h-80 lg:h-96 xl:h-[450px] mb-4 sm:mb-6 rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 relative shadow-inner"
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.7, delay: 0.2 }}
                        >
                           <div 
                              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                              style={{ backgroundImage: "url('/page-images/featuredevent.jpg')" }} 
                           />
                        </motion.div>
                      )}

                      <div className="mt-auto">
                        <div className="flex items-center gap-6 text-sm !text-gray-500 mb-4">
                          <span className="flex items-center gap-2">
                            <Clock size={16} className="text-[#997e67]" />
                            {formatDate(event.event_date)} • {formatTime(event.start_time)}
                          </span>
                        </div>
                        {event.location_name && (
                          <div className="flex items-center gap-2 text-sm !text-gray-500">
                            <MapPin size={16} className="text-[#997e67]" />
                            {event.location_name}
                          </div>
                        )}
                      </div>

                      <motion.div 
                        className="mt-6 flex items-center text-[#997e67] font-medium group-hover:gap-3 gap-2 transition-all"
                        whileHover={{ x: 5 }}
                      >
                        View Details <ArrowRight size={16} />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* All Events List */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h2 className="!text-black text-2xl sm:text-3xl font-bold">All Events</h2>
              <p className="!text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">{filteredEvents.length} events available (May 1 - June 30)</p>
            </div>
            <button
              onClick={() => setShowFilters(true)}
              aria-expanded={showFilters}
              aria-controls="events-filter-panel"
              className="self-start sm:self-auto px-5 py-3 bg-white border border-[#E5E0DB] rounded-2xl text-gray-900 hover:bg-gray-50 shadow-sm transition cursor-pointer flex items-center justify-center gap-2 font-semibold"
            >
              <Filter size={18} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-[#997e67] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-12 sm:py-20">
              <motion.div 
                className="w-10 h-10 border-4 border-[#997e67] border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : filteredEvents.length === 0 ? (
            <motion.div 
              className="text-center py-12 sm:py-20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <Search size={28} className="text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold !text-gray-900 mb-2">No events found</h3>
              <p className="!text-gray-500 text-sm sm:text-base">Try adjusting your search or filters</p>
            </motion.div>
          ) : (
            <>
            <motion.div 
              key={page}
              className="space-y-3 sm:space-y-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {paginatedEvents.map((event) => {
                const isSignedUp = userSignups.includes(event.id);
                return (
                  <motion.div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-white border border-gray-100 rounded-xl sm:rounded-2xl hover:border-[#CCBEB1] hover:shadow-md transition-all cursor-pointer"
                    variants={fadeInUp}
                    transition={{ duration: 0.4 }}
                    whileHover={{ x: 5, transition: { duration: 0.2 } }}
                  >
                    {/* Date Block - Hidden on mobile, shown inline */}
                    <div className="hidden md:flex flex-col items-center justify-center w-20 h-20 bg-[#F5F0EB] rounded-2xl shrink-0">
                      <span className="text-[#997e67] text-sm font-medium">
                        {new Date(event.event_date + "T00:00:00").toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-2xl font-bold !text-black">
                        {new Date(event.event_date + "T00:00:00").getDate()}
                      </span>
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium !text-gray-600">
                          {CATEGORY_LABELS[event.category]}
                        </span>
                        {isSignedUp && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                            Registered
                          </span>
                        )}
                        {/* Mobile date display */}
                        <span className="md:hidden text-xs !text-gray-500">
                          {formatDate(event.event_date)}
                        </span>
                      </div>
                      <h3 className="font-semibold !text-black group-hover:text-[#997e67] transition text-sm sm:text-base line-clamp-1">
                        {event.title}
                      </h3>
                      <p className="!text-[#6b5a4e] text-xs mt-1">Hosted by {getCreatorName(event.creator_name)}</p>
                      <div className="flex items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm !text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatTime(event.start_time)}
                        </span>
                        {event.location_name && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin size={14} />
                            {event.location_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Capacity & Arrow */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 mt-2 sm:mt-0">
                      {event.capacity && (
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-medium !text-black">{event.capacity - event.spots_taken}/{event.capacity}</p>
                          <p className="text-xs !text-gray-500">spots available</p>
                        </div>
                      )}
                      <motion.div 
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:bg-[#997e67] group-hover:border-[#997e67] transition shrink-0"
                        whileHover={{ scale: 1.1 }}
                      >
                        <ArrowRight size={16} className="text-gray-400 group-hover:text-white transition" />
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 sm:mt-12">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className={`p-3 rounded-full transition-all ${
                    page === 0 
                      ? "text-gray-300 cursor-not-allowed bg-gray-50" 
                      : "text-[#997e67] hover:bg-[#997e67] hover:text-white bg-white border border-[#997e67]"
                  }`}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <span className="text-gray-600 font-medium">
                  Page {page + 1} of {totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className={`p-3 rounded-full transition-all ${
                    page === totalPages - 1 
                      ? "text-gray-300 cursor-not-allowed bg-gray-50" 
                      : "text-[#997e67] hover:bg-[#997e67] hover:text-white bg-white border border-[#997e67]"
                  }`}
                  aria-label="Next page"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
            </>
          )}
        </div>
      </section>

      {!userLoading && (
        <section className="px-4 sm:px-6 pb-14 sm:pb-20 bg-[var(--surface)]">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-[#eae0d5]/50 relative overflow-hidden"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-120px" }}
              transition={{ duration: 0.45 }}
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-linear-to-bl from-[#997e67]/10 via-[#997e67]/5 to-transparent rounded-bl-full pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 bg-[#fdfaf7] rounded-full flex items-center justify-center border border-[#eae0d5]">
                    <Plus className="w-5 h-5 text-[#997e67]" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl text-[#4a3b32] font-bold">Suggest an Event</h3>
                </div>
                <p className="!text-[#6b5a4e] mb-8 text-base sm:text-lg">
                  Share a local event idea with NaviHub. Submissions are reviewed by the admin team before publishing.
                </p>

                {!canEditSuggest && (
                  <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-5 h-5 mt-0.5 !text-amber-700" />
                      <div>
                        <p className="font-semibold !text-amber-700">Sign in to suggest an event</p>
                        <p className="text-sm !text-amber-800">
                          You need to be signed in to edit or submit this form.
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/pages/signin"
                      className="inline-flex items-center justify-center rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 shadow-sm transition hover:bg-amber-100"
                    >
                      Sign In
                    </Link>
                  </div>
                )}

                {suggestSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 font-medium">
                    {suggestSuccess}
                  </div>
                )}

                {suggestError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">
                    {suggestError}
                  </div>
                )}

                <form onSubmit={handleSuggestEventSubmit} className="space-y-6">
                  <fieldset disabled={!canEditSuggest} className={`space-y-6 ${!canEditSuggest ? "opacity-60" : ""}`}>
                    <div className="space-y-2">
                      <label htmlFor="suggest-title" className="text-sm font-semibold !text-[#4a3b32] ml-1 block">Event Title *</label>
                      <input
                        id="suggest-title"
                        type="text"
                        value={suggestTitle}
                        onChange={(e) => setSuggestTitle(e.target.value)}
                        placeholder="Neighborhood Career Workshop"
                        className="w-full px-4 py-3.5 bg-[#fdfaf7] border border-[#eae0d5]/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#997e67]/10 focus:border-[#997e67] transition-all !text-[#4a3b32] placeholder:text-[#4a3b32]/40"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="suggest-description" className="text-sm font-semibold !text-[#4a3b32] ml-1 block">Description *</label>
                      <textarea
                        id="suggest-description"
                        value={suggestDescription}
                        onChange={(e) => setSuggestDescription(e.target.value)}
                        placeholder="Share what this event is about, who should join, and what attendees can expect."
                        rows={4}
                        className="w-full p-4 bg-[#fdfaf7] border border-[#eae0d5]/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#997e67]/10 focus:border-[#997e67] transition-all resize-none !text-[#4a3b32] placeholder:text-[#4a3b32]/40"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="suggest-category" className="text-sm font-semibold !text-[#4a3b32] ml-1 block">Category *</label>
                        <select
                          id="suggest-category"
                          value={suggestCategory}
                          onChange={(e) => setSuggestCategory(e.target.value as Category)}
                          className="w-full px-4 py-3.5 bg-[#fdfaf7] border border-[#eae0d5]/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#997e67]/10 focus:border-[#997e67] transition-all !text-[#4a3b32] appearance-none"
                        >
                          {CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                              {CATEGORY_LABELS[category]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="suggest-borough" className="text-sm font-semibold !text-[#4a3b32] ml-1 block">Borough *</label>
                        <select
                          id="suggest-borough"
                          value={suggestBorough}
                          onChange={(e) => setSuggestBorough(e.target.value as Borough)}
                          disabled={suggestVirtual}
                          className="w-full px-4 py-3.5 bg-[#fdfaf7] border border-[#eae0d5]/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#997e67]/10 focus:border-[#997e67] transition-all !text-[#4a3b32] disabled:opacity-60"
                        >
                          {BOROUGHS.map((borough) => (
                            <option key={borough} value={borough}>
                              {borough}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="suggest-date" className="text-sm font-semibold !text-[#4a3b32] ml-1 block">Date *</label>
                        <input
                          id="suggest-date"
                          type="date"
                          min={EVENT_WINDOW_START}
                          max={EVENT_WINDOW_END}
                          value={suggestDate}
                          onChange={(e) => setSuggestDate(e.target.value)}
                          className="w-full px-4 py-3.5 bg-[#fdfaf7] border border-[#eae0d5]/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#997e67]/10 focus:border-[#997e67] transition-all !text-[#4a3b32]"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="suggest-start-time" className="text-sm font-semibold !text-[#4a3b32] ml-1 block">Start *</label>
                        <input
                          id="suggest-start-time"
                          type="time"
                          value={suggestStartTime}
                          onChange={(e) => setSuggestStartTime(e.target.value)}
                          className="w-full px-4 py-3.5 bg-[#fdfaf7] border border-[#eae0d5]/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#997e67]/10 focus:border-[#997e67] transition-all !text-[#4a3b32]"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="suggest-end-time" className="text-sm font-semibold !text-[#4a3b32] ml-1 block">End *</label>
                        <input
                          id="suggest-end-time"
                          type="time"
                          value={suggestEndTime}
                          onChange={(e) => setSuggestEndTime(e.target.value)}
                          className="w-full px-4 py-3.5 bg-[#fdfaf7] border border-[#eae0d5]/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#997e67]/10 focus:border-[#997e67] transition-all !text-[#4a3b32]"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="suggest-address" className="text-sm font-semibold !text-[#4a3b32] ml-1 block">Address</label>
                      <input
                        id="suggest-address"
                        type="text"
                        value={suggestAddress}
                        onChange={(e) => setSuggestAddress(e.target.value)}
                        placeholder={suggestVirtual ? "Virtual event selected" : "123 Community St, NY"}
                        disabled={suggestVirtual}
                        className="w-full px-4 py-3.5 bg-[#fdfaf7] border border-[#eae0d5]/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#997e67]/10 focus:border-[#997e67] transition-all !text-[#4a3b32] placeholder:text-[#4a3b32]/40 disabled:opacity-60"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <label className="flex items-center gap-2 rounded-2xl border border-[#eae0d5]/80 bg-[#fdfaf7] px-4 py-3.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={suggestVirtual}
                          onChange={(e) => setSuggestVirtual(e.target.checked)}
                          className="accent-[#997e67]"
                        />
                        <span className="!text-[#4a3b32] text-sm font-semibold">This is a virtual event</span>
                      </label>

                      <div className="space-y-2">
                        <label htmlFor="suggest-capacity" className="text-sm font-semibold !text-[#4a3b32] ml-1 block">Capacity</label>
                        <input
                          id="suggest-capacity"
                          type="number"
                          min={1}
                          value={suggestCapacity}
                          onChange={(e) => setSuggestCapacity(e.target.value)}
                          placeholder="50"
                          className="w-full px-4 py-3.5 bg-[#fdfaf7] border border-[#eae0d5]/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#997e67]/10 focus:border-[#997e67] transition-all !text-[#4a3b32] placeholder:text-[#4a3b32]/40"
                        />
                      </div>
                    </div>

                    <motion.button
                      whileHover={canHoverSubmit ? { scale: 1.02 } : undefined}
                      whileTap={canHoverSubmit ? { scale: 0.98 } : undefined}
                      type="submit"
                      disabled={suggestSubmitting || !canEditSuggest}
                      className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 bg-[#997e67] hover:bg-[#8a6d5a] text-white rounded-2xl font-bold transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none disabled:translate-y-0"
                    >
                      {suggestSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Submit Event</>}
                    </motion.button>
                  </fieldset>
                </form>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Filter Pills Sidebar */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div 
              className="fixed inset-0 z-40 bg-black/60"
              onClick={() => setShowFilters(false)}
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            />
            <motion.div
              id="events-filter-panel"
              className="fixed top-0 right-0 h-full w-full max-w-[320px] sm:max-w-md bg-[#1F1F1F] z-50 p-5 sm:p-8 shadow-2xl border-l border-white/10 overflow-y-auto"
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-white">Filter Events</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  aria-label="Close filters"
                  className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-8">
                <p className="text-gray-400 text-sm mb-4 font-medium uppercase tracking-wider">Category</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setActiveCategory("all"); setPage(0); }}
                    aria-current={activeCategory === "all" ? "true" : undefined}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                      activeCategory === "all" ? "bg-[#997e67] text-white" : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                    }`}
                  >
                    All
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setActiveCategory(cat); setPage(0); }}
                      aria-current={activeCategory === cat ? "true" : undefined}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                        activeCategory === cat ? "bg-[#997e67] text-white" : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                      }`}
                    >
                      {CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <p className="text-gray-400 text-sm mb-4 font-medium uppercase tracking-wider">Location</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setActiveBorough("all"); setPage(0); }}
                    aria-current={activeBorough === "all" ? "true" : undefined}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                      activeBorough === "all" ? "bg-[#997e67] text-white" : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                    }`}
                  >
                    All Boroughs
                  </button>
                  {BOROUGHS.map((b) => (
                    <button
                      key={b}
                      onClick={() => { setActiveBorough(b); setPage(0); }}
                      aria-current={activeBorough === b ? "true" : undefined}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                        activeBorough === b ? "bg-[#997e67] text-white" : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/10">
                <button 
                  onClick={() => {
                    setActiveCategory("all");
                    setActiveBorough("all");
                    setPage(0);
                  }}
                  className="w-full py-4 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition mb-3 cursor-pointer"
                >
                  Reset Filters
                </button>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="w-full py-4 rounded-xl bg-[#997e67] text-white font-bold hover:bg-[#8a715c] transition cursor-pointer"
                >
                  Show Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Event Chat */}
      <EventChat
        eventId={chatEventId || ""}
        isOpen={!!chatEventId}
        onClose={() => setChatEventId(null)}
      />

      {/* Modal */}
      {selectedEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <EventModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            isSignedUp={userSignups.includes(selectedEvent.id)}
            onSignupChange={handleSignupChange}
            onOpenChat={(id) => setChatEventId(id)}
          />
        </motion.div>
      )}
    </div>
  );
}

export default function CommunityEvents() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#997e67]" /></div>}>
      <CommunityEventsInner />
    </Suspense>
  );
}
