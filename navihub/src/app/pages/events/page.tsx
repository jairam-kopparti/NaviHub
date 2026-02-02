"use client";
import React, { useState, useEffect } from "react";
import { X, MapPin, Clock, Users, Search, Filter, ArrowRight, Calendar } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../lib/useUser";
import "../../styles/events.css";

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
      <div className="absolute inset-0 bg-black/70" />
      <div 
        className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="bg-[#997e67] p-8 text-white">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition cursor-pointer">
            <X size={20} />
          </button>
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium mb-4">
            {CATEGORY_LABELS[event.category]}
          </span>
          <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
          <p className="text-white/90 text-sm">{formatDate(event.event_date)}</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {event.description && (
            <p className="!text-gray-600 mb-6 leading-relaxed">{event.description}</p>
          )}

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#f4f1ee] flex items-center justify-center">
                <Clock size={18} className="text-[#997e67]" />
              </div>
              <div>
                <p className="!text-gray-400 text-xs uppercase tracking-wide">Time</p>
                <p className="!text-gray-800 font-medium">{formatTime(event.start_time)} - {formatTime(event.end_time)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#f4f1ee] flex items-center justify-center">
                <MapPin size={18} className="text-[#997e67]" />
              </div>
              <div>
                <p className="!text-gray-400 text-xs uppercase tracking-wide">Location</p>
                <p className="!text-gray-800 font-medium">{event.is_virtual ? "Virtual Event" : event.location_name || "TBD"}</p>
                {event.address && !event.is_virtual && <p className="!text-gray-500 text-sm">{event.address}</p>}
              </div>
            </div>

            {event.capacity && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#f4f1ee] flex items-center justify-center">
                  <Users size={18} className="text-[#997e67]" />
                </div>
                <div>
                  <p className="!text-gray-400 text-xs uppercase tracking-wide">Availability</p>
                  <p className="!text-gray-800 font-medium">{spotsAvailable} of {event.capacity} spots available</p>
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          {event.signup_required && (
            <button
              onClick={handleSignup}
              disabled={loading || (isFull && !isSignedUp)}
              className={`w-full py-4 rounded-2xl font-semibold transition-all cursor-pointer ${
                isFull && !isSignedUp
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : isSignedUp
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-[#1F1F1F] text-white hover:bg-black"
              } ${loading ? "opacity-60" : ""}`}
            >
              {loading ? "Processing..." : isFull && !isSignedUp ? "Fully Booked" : isSignedUp ? "Cancel Registration" : "Register Now"}
            </button>
          )}
        </div>
      </div>
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
      <section className="relative min-h-[60vh] bg-black overflow-hidden flex flex-col justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: "url('/events.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/30" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-32 md:py-40 w-full">
          <div className="max-w-2xl mt-10">
            <p className="text-[#CCBEB1] font-medium mb-6 tracking-wide uppercase text-sm">Community Events</p>
            <h1 className="text-white text-5xl md:text-6xl font-bold leading-tight mb-8">
              Connect, Learn & Grow Together
            </h1>
            <p className="text-gray-200 text-lg mb-12 leading-relaxed max-w-xl">
              Join local events, workshops, and meetups that bring our community together.
            </p>
            
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder:text-gray-300 focus:outline-none focus:border-[#CCBEB1] transition text-lg"
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="px-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white hover:bg-white/20 transition cursor-pointer flex items-center gap-2 font-medium"
              >
                <Filter size={20} />
                <span className="hidden md:inline">Filters</span>
              </button>
            </div>

            {/* Filter Pills Sidebar */}
            {showFilters && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                  onClick={() => setShowFilters(false)}
                />
                <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[#1F1F1F] z-50 p-8 shadow-2xl border-l border-white/10 overflow-y-auto">
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
        <section className="py-20 px-6 bg-[var(--surface)] border-b border-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="!text-black text-3xl font-bold">My Registered Events</h2>
                <p className="!text-gray-500 mt-2">Events you&apos;ve signed up for</p>
              </div>
              <span className="px-4 py-2 bg-[#1F1F1F] text-white rounded-full text-sm font-medium">
                {myEvents.length} event{myEvents.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="group bg-[#F5F0EB] border border-[#E5E0DB] rounded-3xl p-6 cursor-pointer hover:border-[#997e67] transition-colors"
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
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured / Upcoming Events */}
      {!loading && upcomingEvents.length > 0 && (
        <section className="py-20 px-6 bg-[var(--surface)]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="!text-black text-3xl font-bold">Featured Events</h2>
                <p className="!text-gray-500 mt-2">Don&apos;t miss out on these upcoming events</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {upcomingEvents.map((event, index) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`group cursor-pointer ${index === 0 ? "lg:col-span-2 lg:row-span-2" : ""}`}
                >
                  <div className={`relative bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow h-full flex flex-col`}>
                    <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-[#997e67] to-[#CCBEB1] z-10" />
                    
                    <div className="p-8 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700 text-xs font-medium">
                          {CATEGORY_LABELS[event.category]}
                        </span>
                        {event.capacity && (
                          <span className={`text-sm font-medium ${event.capacity - event.spots_taken <= 5 ? "text-orange-500" : "text-gray-400"}`}>
                            {event.capacity - event.spots_taken} spots left
                          </span>
                        )}
                      </div>

                      <h3 className={`!text-black font-bold mb-3 group-hover:text-[#997e67] transition ${index === 0 ? "text-3xl" : "text-lg"}`}>
                        {event.title}
                      </h3>

                      {event.description && (
                        <p className={`!text-gray-500 mb-6 ${index === 0 ? "text-lg line-clamp-3" : "text-sm line-clamp-2"}`}>
                          {event.description}
                        </p>
                      )}

                      {/* Featured Event Image */}
                      {index === 0 && (
                        <div className="w-full h-96 xl:h-[450px] mb-6 rounded-2xl overflow-hidden bg-gray-100 relative shadow-inner">
                           <div 
                              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
                              style={{ backgroundImage: "url('/featuredevent.jpg')" }} 
                           />
                        </div>
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

                      <div className="mt-6 flex items-center text-[#997e67] font-medium group-hover:gap-3 gap-2 transition-all">
                        View Details <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Events List */}
      <section className="py-20 px-6 bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <h2 className="!text-black text-3xl font-bold">All Events</h2>
            <p className="!text-gray-500 mt-2">{filteredEvents.length} events available</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#997e67] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <Search size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold !text-gray-900 mb-2">No events found</h3>
              <p className="!text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => {
                const isSignedUp = userSignups.includes(event.id);
                return (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="group flex items-center gap-6 p-6 bg-white border border-gray-100 rounded-2xl hover:border-[#CCBEB1] hover:shadow-md transition-all cursor-pointer"
                  >
                    {/* Date Block */}
                    <div className="hidden md:flex flex-col items-center justify-center w-20 h-20 bg-[#F5F0EB] rounded-2xl">
                      <span className="text-[#997e67] text-sm font-medium">
                        {new Date(event.event_date + "T00:00:00").toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-2xl font-bold !text-black">
                        {new Date(event.event_date + "T00:00:00").getDate()}
                      </span>
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium !text-gray-600">
                          {CATEGORY_LABELS[event.category]}
                        </span>
                        {isSignedUp && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                            Registered
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold !text-black group-hover:text-[#997e67] transition truncate">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm !text-gray-500">
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
                    <div className="hidden sm:flex items-center gap-6">
                      {event.capacity && (
                        <div className="text-right">
                          <p className="text-sm font-medium !text-black">{event.capacity - event.spots_taken}/{event.capacity}</p>
                          <p className="text-xs !text-gray-500">spots available</p>
                        </div>
                      )}
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:bg-[#997e67] group-hover:border-[#997e67] transition">
                        <ArrowRight size={18} className="text-gray-400 group-hover:text-white transition" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          isSignedUp={userSignups.includes(selectedEvent.id)}
          onSignupChange={handleSignupChange}
        />
      )}
    </div>
  );
}
