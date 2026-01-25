"use client";
import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../lib/useUser";

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

const CATEGORY_DISPLAY: Record<Category, string> = {
  sports: "Sports",
  social: "Social",
  education: "Education",
  volunteer: "Volunteer",
  workshops: "Workshops",
  community_meetings: "Community Meetings",
  other: "Other",
} as const;

const getCategoryColor = (category: Category): string => {
  const colors: Record<Category, string> = {
    sports: "#3b82f6",
    social: "#ef4444",
    education: "#10b981",
    volunteer: "#f59e0b",
    workshops: "#8b5cf6",
    community_meetings: "#0ea5e9",
    other: "#6b7280",
  };
  return colors[category];
};

const formatDateLabel = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
      ? "nd"
      : day % 10 === 3 && day !== 13
      ? "rd"
      : "th";
  const month = d.toLocaleString("default", { month: "long" });
  const year = d.getFullYear();
  return `${day}${suffix} ${month}, ${year}`;
};

const formatTimeRange = (startTime: string, endTime: string) => {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

// ---------- Calendar Component ----------

const Calendar = ({ signedUpDates }: { signedUpDates: string[] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthName = currentMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const hasSignup = (day: number | null) => {
    if (!day) return false;
    const dateStr = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return signedUpDates.includes(dateStr);
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  return (
    <div
      style={{
        backgroundColor: "var(--surface)",
        borderRadius: "8px",
        padding: "1rem",
        border: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h3 style={{ color: "var(--secondary-text)", margin: 0, fontSize: "1rem" }}>
          {monthName}
        </h3>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={previousMonth}
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              padding: "0.25rem 0.5rem",
              cursor: "pointer",
              color: "var(--secondary-text)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={nextMonth}
            style={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              padding: "0.25rem 0.5rem",
              cursor: "pointer",
              color: "var(--secondary-text)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "0.25rem",
          marginBottom: "0.5rem",
        }}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            style={{
              textAlign: "center",
              color: "var(--thirdary-text)",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.25rem",
            }}
          >
            {day}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "0.25rem",
        }}
      >
        {days.map((day, index) => (
          <div
            key={index}
            style={{
              aspectRatio: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
              backgroundColor: day && hasSignup(day) ? "var(--secondary-text)" : "transparent",
              color: day && hasSignup(day) ? "var(--surface)" : "var(--secondary-text)",
              fontSize: "0.85rem",
              cursor: day ? "default" : "default",
              opacity: day ? 1 : 0.3,
              border: day && isToday(day) ? "2px solid var(--secondary-text)" : "none",
            }}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- Event Detail Modal ----------

const EventDetailModal = ({
  event,
  onClose,
  userSignups,
  onSignupChange,
}: {
  event: Event;
  onClose: () => void;
  userSignups: string[];
  onSignupChange: (eventId: string, signed: boolean) => void;
}) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUserSignedUp = userSignups.includes(event.id);
  const spotsAvailable = event.capacity ? event.capacity - event.spots_taken : null;
  const isFull = spotsAvailable !== null && spotsAvailable <= 0;

  const handleSignup = async () => {
    if (!user) {
      setError("Please sign in to register for events");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isUserSignedUp) {
        // Remove signup
        const { error: deleteError } = await supabase
          .from("event_signups")
          .delete()
          .eq("user_id", user.id)
          .eq("event_id", event.id);

        if (deleteError) throw deleteError;

        // Decrement spots_taken
        await supabase
          .from("events")
          .update({ spots_taken: Math.max(0, event.spots_taken - 1) })
          .eq("id", event.id);

        onSignupChange(event.id, false);
      } else {
        // Add signup
        const { error: insertError } = await supabase
          .from("event_signups")
          .insert([{ user_id: user.id, event_id: event.id }]);

        if (insertError) throw insertError;

        // Increment spots_taken
        await supabase
          .from("events")
          .update({ spots_taken: event.spots_taken + 1 })
          .eq("id", event.id);

        onSignupChange(event.id, true);
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(err instanceof Error ? err.message : "Failed to update signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "var(--surface)",
          borderRadius: "12px",
          padding: "2rem",
          maxWidth: "600px",
          width: "90%",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
            marginBottom: "1rem",
          }}
        >
          <h2
            style={{
              color: "var(--secondary-text)",
              margin: 0,
              fontSize: "1.5rem",
              flex: 1,
            }}
          >
            {event.title}
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={24} color="var(--secondary-text)" />
          </button>
        </div>

        <span
          style={{
            backgroundColor: getCategoryColor(event.category),
            color: "#ffffff",
            padding: "0.25rem 0.75rem",
            borderRadius: "20px",
            fontSize: "0.85rem",
            fontWeight: 600,
            display: "inline-block",
            marginBottom: "1rem",
          }}
        >
          {CATEGORY_DISPLAY[event.category]}
        </span>

        <div style={{ marginBottom: "1.5rem" }}>
          <h3
            style={{
              color: "var(--secondary-text)",
              fontSize: "0.95rem",
              fontWeight: 600,
              marginBottom: "0.25rem",
            }}
          >
            Description
          </h3>
          <p
            style={{
              color: "var(--secondary-text)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {event.description || "No description provided"}
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <h3
            style={{
              color: "var(--secondary-text)",
              fontSize: "0.95rem",
              fontWeight: 600,
              marginBottom: "0.25rem",
            }}
          >
            Date & Time
          </h3>
          <p
            style={{
              color: "var(--secondary-text)",
              margin: 0,
            }}
          >
            {formatDateLabel(event.event_date)}
          </p>
          <p
            style={{
              color: "var(--secondary-text)",
              margin: "0.25rem 0 0 0",
            }}
          >
            {formatTimeRange(event.start_time, event.end_time)}
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <h3
            style={{
              color: "var(--secondary-text)",
              fontSize: "0.95rem",
              fontWeight: 600,
              marginBottom: "0.25rem",
            }}
          >
            Location
          </h3>
          <p
            style={{
              color: "var(--secondary-text)",
              margin: 0,
            }}
          >
            {event.is_virtual ? "Virtual Event" : event.location_name || "TBD"}
          </p>
          {event.address && !event.is_virtual && (
            <p
              style={{
                color: "var(--thirdary-text)",
                margin: "0.25rem 0 0 0",
                fontSize: "0.9rem",
              }}
            >
              {event.address}
            </p>
          )}
        </div>

        {event.capacity && (
          <div style={{ marginBottom: "1.5rem" }}>
            <h3
              style={{
                color: "var(--secondary-text)",
                fontSize: "0.95rem",
                fontWeight: 600,
                marginBottom: "0.25rem",
              }}
            >
              Capacity
            </h3>
            <p
              style={{
                color: "var(--secondary-text)",
                margin: 0,
              }}
            >
              {spotsAvailable !== null
                ? `${spotsAvailable} spots available (${event.spots_taken}/${event.capacity} filled)`
                : `${event.spots_taken} registered`}
            </p>
          </div>
        )}

        {error && (
          <div
            style={{
              backgroundColor: "#fee",
              color: "#c00",
              padding: "0.75rem",
              borderRadius: "4px",
              marginBottom: "1rem",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        {event.signup_required && (
          <button
            onClick={handleSignup}
            disabled={loading || (isFull && !isUserSignedUp)}
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor:
                isFull && !isUserSignedUp
                  ? "var(--thirdary-text)"
                  : isUserSignedUp
                  ? "#ef4444"
                  : "var(--secondary-text)",
              color: "var(--surface)",
              border: "none",
              borderRadius: "8px",
              cursor:
                loading || (isFull && !isUserSignedUp)
                  ? "not-allowed"
                  : "pointer",
              fontWeight: 600,
              fontSize: "1rem",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? "Processing..."
              : isFull && !isUserSignedUp
              ? "Event Full"
              : isUserSignedUp
              ? "Cancel Registration"
              : "Sign Up"}
          </button>
        )}
      </div>
    </div>
  );
};

// ---------- Mini Event Card (for signed-up events) ----------

const MiniEventCard = ({
  event,
  onClick,
}: {
  event: Event;
  onClick: (event: Event) => void;
}) => {
  return (
    <div
      onClick={() => onClick(event)}
      style={{
        backgroundColor: "var(--surface)",
        borderRadius: "6px",
        padding: "0.75rem",
        marginBottom: "0.5rem",
        cursor: "pointer",
        border: "1px solid var(--border)",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-depth)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.25rem",
        }}
      >
        <h5
          style={{
            color: "var(--secondary-text)",
            margin: 0,
            fontSize: "0.9rem",
            fontWeight: 600,
            flex: 1,
          }}
        >
          {event.title}
        </h5>
        <span
          style={{
            backgroundColor: getCategoryColor(event.category),
            color: "#ffffff",
            padding: "0.15rem 0.4rem",
            borderRadius: "10px",
            fontSize: "0.65rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {CATEGORY_DISPLAY[event.category]}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          fontSize: "0.8rem",
          color: "var(--thirdary-text)",
        }}
      >
        <span>{formatDateLabel(event.event_date)}</span>
        <span>{formatTimeRange(event.start_time, event.end_time)}</span>
      </div>

      {event.location_name && (
        <p
          style={{
            color: "var(--thirdary-text)",
            margin: "0.25rem 0 0 0",
            fontSize: "0.8rem",
          }}
        >
          {event.location_name}
        </p>
      )}
    </div>
  );
};

// ---------- Event Card ----------

const EventCard = ({
  event,
  onClick,
}: {
  event: Event;
  onClick: (event: Event) => void;
}) => {
  return (
    <div
      onClick={() => onClick(event)}
      style={{
        backgroundColor: "var(--surface)",
        borderRadius: "8px",
        padding: "1rem",
        marginBottom: "0.75rem",
        cursor: "pointer",
        border: "1px solid var(--border)",
        transition: "all 0.2s ease",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "1rem",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-depth)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.5rem",
          }}
        >
          <h4
            style={{
              color: "var(--secondary-text)",
              margin: 0,
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            {event.title}
          </h4>
          <span
            style={{
              backgroundColor: getCategoryColor(event.category),
              color: "#ffffff",
              padding: "0.2rem 0.5rem",
              borderRadius: "12px",
              fontSize: "0.7rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {CATEGORY_DISPLAY[event.category]}
          </span>
        </div>

        <p
          style={{
            color: "var(--secondary-text)",
            margin: "0 0 0.5rem 0",
            fontSize: "0.9rem",
            lineHeight: 1.4,
          }}
        >
          {event.description && event.description.length > 100
            ? event.description.substring(0, 100) + "..."
            : event.description}
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            fontSize: "0.85rem",
            color: "var(--thirdary-text)",
          }}
        >
          <span>{formatTimeRange(event.start_time, event.end_time)}</span>
          {event.location_name && <span>{event.location_name}</span>}
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
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [selectedBoroughs, setSelectedBoroughs] = useState<Borough[]>([]);
  const [selectedCapacity, setSelectedCapacity] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [userSignups, setUserSignups] = useState<string[]>([]);
  const [userSignedUpEvents, setUserSignedUpEvents] = useState<Event[]>([]);

  // Fetch user's signups
  useEffect(() => {
    if (!user || userLoading) return;

    const fetchUserSignups = async () => {
      try {
        const { data, error } = await supabase
          .from("event_signups")
          .select("event_id")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching user signups:", error);
          return;
        }

        if (data) {
          const signupIds = data.map((signup) => signup.event_id);
          setUserSignups(signupIds);
        }
      } catch (err) {
        console.error("Unexpected error fetching user signups:", err);
      }
    };

    fetchUserSignups();
  }, [user, userLoading]);

  // Fetch events and filter user's signed-up events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from("events")
          .select("*")
          .order("event_date", { ascending: true })
          .order("start_time", { ascending: true });

        // Filter by categories
        if (selectedCategories.length > 0) {
          query = query.in("category", selectedCategories);
        }

        // Filter by boroughs (matching location_name)
        if (selectedBoroughs.length > 0) {
          query = query.in("location_name", selectedBoroughs);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching events:", error);
          console.error("Error details:", error.message, error.code);
          setEvents([]);
          return;
        }

        console.log("Events fetched successfully:", data);
        if (data) {
          // Filter by capacity if needed
          let filteredEvents = data as Event[];

          if (selectedCapacity !== "all") {
            filteredEvents = filteredEvents.filter((event) => {
              if (!event.capacity) return selectedCapacity === "unlimited";
              const spotsAvailable = event.capacity - event.spots_taken;

              if (selectedCapacity === "available") {
                return spotsAvailable > 0;
              } else if (selectedCapacity === "full") {
                return spotsAvailable === 0;
              }
              return true;
            });
          }

          setEvents(filteredEvents);

          // Update user's signed-up events
          if (userSignups.length > 0) {
            const signedUpEvents = filteredEvents.filter((event) =>
              userSignups.includes(event.id)
            );
            setUserSignedUpEvents(signedUpEvents);
          } else {
            setUserSignedUpEvents([]);
          }
        }
      } catch (err) {
        console.error("Unexpected error fetching events:", err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [selectedCategories, selectedBoroughs, selectedCapacity, userSignups]);

  // Filter by search term
  const filteredEvents = events.filter((event) => {
    const queryLower = searchTerm.trim().toLowerCase();
    return (
      event.title.toLowerCase().includes(queryLower) ||
      (event.description && event.description.toLowerCase().includes(queryLower)) ||
      (event.location_name && event.location_name.toLowerCase().includes(queryLower))
    );
  });

  // Group events by date
  const groupedByDate: { [date: string]: Event[] } = {};
  filteredEvents.forEach((event) => {
    if (!groupedByDate[event.event_date]) {
      groupedByDate[event.event_date] = [];
    }
    groupedByDate[event.event_date].push(event);
  });

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const toggleCategory = (category: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleBorough = (borough: Borough) => {
    setSelectedBoroughs((prev) =>
      prev.includes(borough)
        ? prev.filter((b) => b !== borough)
        : [...prev, borough]
    );
  };

  const handleSignupChange = (eventId: string, signed: boolean) => {
    if (signed) {
      setUserSignups((prev) => [...prev, eventId]);
    } else {
      setUserSignups((prev) => prev.filter((id) => id !== eventId));
    }
  };

  const allCategories: Category[] = [
    "sports",
    "social",
    "education",
    "volunteer",
    "workshops",
    "community_meetings",
    "other",
  ];

  const signedUpDates = userSignedUpEvents.map((event) => event.event_date);

  return (
    <div
      style={{
        backgroundColor: "var(--bg)",
        minHeight: "100vh",
        fontFamily: "var(--font-body)",
        color: "var(--secondary-text)",
      }}
    >
      {/* HERO */}
      <div
        style={{
          backgroundImage: "url('/events.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          width: "100%",
          height: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "0",
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: "3rem 2rem",
            borderRadius: "12px",
            display: "inline-block",
          }}
        >
          <h1 style={{ fontSize: "2.75rem", color: "var(--primary-text)", margin: 0 }}>
            Community Events
          </h1>
          <p style={{ fontSize: "1.25rem", color: "var(--primary-text)", margin: "0.5rem 0 0 0" }}>
            Browse the schedule and sign up for events happening in your community.
          </p>
        </div>
      </div>

      {/* MY EVENTS SECTION */}
      {user && (
        <div style={{ padding: "2rem", backgroundColor: "var(--bg)" }}>
          <h2
            style={{
              color: "var(--secondary-text)",
              margin: "0 0 1.5rem 0",
              fontSize: "1.5rem",
            }}
          >
            My Events
          </h2>
          <div
            style={{
              display: "flex",
              gap: "2rem",
              backgroundColor: "var(--surface)",
              padding: "2rem",
              borderRadius: "12px",
              boxShadow: "var(--shadow-subtle)",
            }}
          >
            {/* CALENDAR (LEFT) */}
            <div style={{ width: "35%", flexShrink: 0 }}>
              <Calendar signedUpDates={signedUpDates} />
            </div>

            {/* SIGNED-UP EVENTS (RIGHT) */}
            <div
              style={{
                flex: 1,
                backgroundColor: "var(--bg)",
                padding: "1.5rem",
                borderRadius: "8px",
                border: "1px solid var(--border)",
              }}
            >
              <h3
                style={{
                  color: "var(--secondary-text)",
                  margin: "0 0 1rem 0",
                  fontSize: "1.1rem",
                }}
              >
                Registered Events ({userSignedUpEvents.length})
              </h3>
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {userSignedUpEvents.length === 0 ? (
                  <p style={{ color: "var(--thirdary-text)", textAlign: "center", padding: "2rem 0" }}>
                    No events signed up
                  </p>
                ) : (
                  userSignedUpEvents.map((event) => (
                    <MiniEventCard
                      key={event.id}
                      event={event}
                      onClick={() => setSelectedEvent(event)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EVENT SELECTION SECTION */}
      <div style={{ padding: "2rem", backgroundColor: "var(--bg)" }}>
        <div
          style={{
            display: "flex",
            gap: "2rem",
            backgroundColor: "var(--surface)",
            padding: "2rem",
            borderRadius: "12px",
            boxShadow: "var(--shadow-subtle)",
          }}
        >
          {/* FILTERS (LEFT) */}
          <div
            style={{
              width: "22%",
              backgroundColor: "var(--bg)",
              padding: "1.5rem",
              borderRadius: "8px",
              height: "fit-content",
              border: "1px solid var(--border)",
            }}
          >
            {/* Category Filter */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  color: "var(--secondary-text)",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  margin: "0 0 0.75rem 0",
                }}
              >
                Category
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {allCategories.map((cat) => (
                  <label
                    key={cat}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      color: "var(--secondary-text)",
                      fontSize: "0.9rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      style={{
                        cursor: "pointer",
                        width: "16px",
                        height: "16px",
                      }}
                    />
                    {CATEGORY_DISPLAY[cat]}
                  </label>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  color: "var(--secondary-text)",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  margin: "0 0 0.75rem 0",
                }}
              >
                Location
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {BOROUGHS.map((borough) => (
                  <label
                    key={borough}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      color: "var(--secondary-text)",
                      fontSize: "0.9rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBoroughs.includes(borough)}
                      onChange={() => toggleBorough(borough)}
                      style={{
                        cursor: "pointer",
                        width: "16px",
                        height: "16px",
                      }}
                    />
                    {borough}
                  </label>
                ))}
              </div>
            </div>

            {/* Capacity Filter */}
            <div>
              <h3
                style={{
                  color: "var(--secondary-text)",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  margin: "0 0 0.75rem 0",
                }}
              >
                Availability
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    color: "var(--secondary-text)",
                    fontSize: "0.9rem",
                  }}
                >
                  <input
                    type="radio"
                    name="capacity"
                    checked={selectedCapacity === "all"}
                    onChange={() => setSelectedCapacity("all")}
                    style={{
                      cursor: "pointer",
                      width: "16px",
                      height: "16px",
                    }}
                  />
                  All Events
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    color: "var(--secondary-text)",
                    fontSize: "0.9rem",
                  }}
                >
                  <input
                    type="radio"
                    name="capacity"
                    checked={selectedCapacity === "available"}
                    onChange={() => setSelectedCapacity("available")}
                    style={{
                      cursor: "pointer",
                      width: "16px",
                      height: "16px",
                    }}
                  />
                  Spots Available
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    color: "var(--secondary-text)",
                    fontSize: "0.9rem",
                  }}
                >
                  <input
                    type="radio"
                    name="capacity"
                    checked={selectedCapacity === "full"}
                    onChange={() => setSelectedCapacity("full")}
                    style={{
                      cursor: "pointer",
                      width: "16px",
                      height: "16px",
                    }}
                  />
                  Full Events
                </label>
              </div>
            </div>
          </div>

          {/* EVENT LIST (RIGHT) */}
          <div
            style={{
              flex: 1,
              backgroundColor: "var(--bg)",
              padding: "1.5rem",
              borderRadius: "8px",
              border: "1px solid var(--border)",
            }}
          >
            <h2
              style={{
                color: "var(--secondary-text)",
                margin: "0 0 1rem 0",
                fontSize: "1.25rem",
              }}
            >
              Upcoming Events
            </h2>

            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  color: "var(--secondary-text)",
                  backgroundColor: "var(--surface)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.95rem",
                }}
              />
            </div>

            {loading ? (
              <p style={{ color: "var(--thirdary-text)", textAlign: "center" }}>
                Loading events...
              </p>
            ) : sortedDates.length === 0 ? (
              <p style={{ color: "var(--thirdary-text)", textAlign: "center" }}>
                No events found matching your filters.
              </p>
            ) : (
              sortedDates.map((date) => (
                <div key={date} style={{ marginBottom: "2rem" }}>
                  <h3
                    style={{
                      color: "var(--secondary-text)",
                      fontSize: "1rem",
                      fontWeight: 600,
                      borderBottom: "2px solid var(--border)",
                      paddingBottom: "0.5rem",
                      margin: "0 0 1rem 0",
                    }}
                  >
                    {formatDateLabel(date)}
                  </h3>
                  {groupedByDate[date].map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onClick={() => setSelectedEvent(event)}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          userSignups={userSignups}
          onSignupChange={handleSignupChange}
        />
      )}
    </div>
  );
}
