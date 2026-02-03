"use client";
import React, { useState, useEffect } from "react";
import { X, MapPin, Clock, Users, Search, Filter, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../lib/useUser";
import "../../styles/events.css";

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

// ---------- Event Detail Modal ----------

const EventModal = ({
  event,
  onClose,
  isSignedUp,
  onSignupChange,
}: {
  event: Event;
  onClose: () => void;
  isSignedUp: boolean;
  onSignupChange: (eventId: string, signed: boolean) => void;
}) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      } else {
        await supabase.from("event_signups").insert([{ user_id: user.id, event_id: event.id }]);
        await supabase.from("events").update({ spots_taken: event.spots_taken + 1 }).eq("id", event.id);
        onSignupChange(event.id, true);
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
        className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Header with gradient */}
        <div className="bg-[#997e67] p-8 text-white">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition cursor-pointer">
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

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

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
        </motion.div>
      </motion.div>
    </div>
  );
};

// ---------- Main Component ----------

export default function CommunityEvents() {
  const { user, loading: userLoading } = useUser();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [activeBorough, setActiveBorough] = useState<Borough | "all">("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [userSignups, setUserSignups] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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
      let query = supabase.from("events").select("*").order("event_date", { ascending: true });
      if (activeCategory !== "all") query = query.eq("category", activeCategory);
      if (activeBorough !== "all") query = query.eq("location_name", activeBorough);
      const { data } = await query;
      setEvents((data as Event[]) || []);
      setLoading(false);
    };
    fetchEvents();
  }, [activeCategory, activeBorough]);

  const filteredEvents = events.filter((e) => {
    const q = searchTerm.toLowerCase();
    return e.title.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q) || e.location_name?.toLowerCase().includes(q);
  });

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

  return (
    <div className="events-page min-h-screen bg-[var(--surface)]">
      {/* Hero Section - Minimal & Bold */}
      <section className="relative min-h-[50vh] sm:min-h-[60vh] bg-black overflow-hidden flex flex-col justify-center">
        <motion.div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/events.jpg')" }}
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
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 sm:pl-16 pr-4 sm:pr-6 py-4 sm:py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-2xl text-white placeholder:text-gray-300 focus:outline-none focus:border-[#CCBEB1] transition text-base sm:text-lg"
                />
                <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 sm:px-8 py-4 sm:py-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-2xl text-white hover:bg-white/20 transition cursor-pointer flex items-center justify-center gap-2 font-medium"
              >
                <Filter size={20} />
                <span>Filters</span>
              </button>
            </motion.div>

            {/* Filter Pills Sidebar */}
            {showFilters && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                  onClick={() => setShowFilters(false)}
                />
                <div className="fixed top-0 right-0 h-full w-full max-w-[320px] sm:max-w-md bg-[#1F1F1F] z-50 p-5 sm:p-8 shadow-2xl border-l border-white/10 overflow-y-auto">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-white">Filter Events</h3>
                    <button 
                      onClick={() => setShowFilters(false)}
                      className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="mb-8">
                    <p className="text-gray-400 text-sm mb-4 font-medium uppercase tracking-wider">Category</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setActiveCategory("all")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                          activeCategory === "all" ? "bg-[#997e67] text-white" : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                        }`}
                      >
                        All
                      </button>
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
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
                        onClick={() => setActiveBorough("all")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                          activeBorough === "all" ? "bg-[#997e67] text-white" : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                        }`}
                      >
                        All Boroughs
                      </button>
                      {BOROUGHS.map((b) => (
                        <button
                          key={b}
                          onClick={() => setActiveBorough(b)}
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
                </div>
              </>
            )}
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
                              style={{ backgroundImage: "url('/featuredevent.jpg')" }} 
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
            className="mb-6 sm:mb-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <h2 className="!text-black text-2xl sm:text-3xl font-bold">All Events</h2>
            <p className="!text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">{filteredEvents.length} events available</p>
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
            <motion.div 
              className="space-y-3 sm:space-y-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {filteredEvents.map((event) => {
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
          )}
        </div>
      </section>

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
          />
        </motion.div>
      )}
    </div>
  );
}
