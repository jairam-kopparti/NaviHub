"use client";
import React, { useState, useEffect } from "react";

type Category =
  | "Sports"
  | "Social"
  | "Education"
  | "Volunteer"
  | "Workshops"
  | "Community Meetings"
  | "Other";

interface Event {
  id: number;
  name: string;
  date: string; // ISO yyyy-mm-dd
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  description: string;
  category: Category;
}

// ---------- 2026 schedule with durations & status control ----------
// Designed so that (with current date 19 Jan 2026):
// - One event is Completed (18 Jan)
// - One event is Ongoing (19 Jan, 14:00–17:00)
// - One event is Upcoming within 24h (20 Jan)

const scheduleEvents: Event[] = [
  {
    id: 1,
    name: "Neighborhood Clean-Up Drive",
    date: "2026-01-18",
    startTime: "10:00",
    endTime: "12:00",
    description: "Help keep our streets and parks clean.",
    category: "Volunteer",
  },
  {
    id: 2,
    name: "Community Workshop Live",
    date: "2026-01-19",
    startTime: "14:00",
    endTime: "17:00",
    description: "Hands-on community skills and collaboration.",
    category: "Workshops",
  },
  {
    id: 3,
    name: "New Year Community Brunch",
    date: "2026-01-20",
    startTime: "10:00",
    endTime: "12:00",
    description: "Kick off the year with neighbors and friends.",
    category: "Social",
  },
  {
    id: 4,
    name: "Winter Yoga in the Park",
    date: "2026-01-25",
    startTime: "09:00",
    endTime: "10:30",
    description: "Gentle yoga session to start your weekend.",
    category: "Sports",
  },
  {
    id: 5,
    name: "STEM Kids Workshop",
    date: "2026-02-10",
    startTime: "16:00",
    endTime: "18:00",
    description: "Hands-on science and tech activities for kids.",
    category: "Education",
  },
  {
    id: 6,
    name: "Spring Book Club Meetup",
    date: "2026-03-20",
    startTime: "18:30",
    endTime: "20:00",
    description: "Discuss this month’s featured novel together.",
    category: "Education",
  },
  {
    id: 7,
    name: "Community Gardening Day",
    date: "2026-04-12",
    startTime: "09:30",
    endTime: "11:30",
    description: "Plant, water, and learn about urban gardening.",
    category: "Volunteer",
  },
  {
    id: 8,
    name: "Local Business Networking Night",
    date: "2026-05-08",
    startTime: "19:00",
    endTime: "21:00",
    description: "Meet local entrepreneurs and share ideas.",
    category: "Community Meetings",
  },
  {
    id: 9,
    name: "Summer Sports Festival",
    date: "2026-06-18",
    startTime: "14:00",
    endTime: "17:00",
    description: "Friendly matches in soccer, basketball, and more.",
    category: "Sports",
  },
  {
    id: 10,
    name: "Coding for Beginners Workshop",
    date: "2026-07-10",
    startTime: "15:00",
    endTime: "17:30",
    description: "Introductory coding session for all ages.",
    category: "Workshops",
  },
  {
    id: 11,
    name: "Community Movie Night",
    date: "2026-08-02",
    startTime: "20:00",
    endTime: "22:30",
    description: "Outdoor screening under the stars.",
    category: "Social",
  },
  {
    id: 12,
    name: "Back-to-School Supply Drive",
    date: "2026-08-25",
    startTime: "13:00",
    endTime: "15:00",
    description: "Donate supplies to support local students.",
    category: "Volunteer",
  },
  {
    id: 13,
    name: "Autumn Arts & Crafts Fair",
    date: "2026-10-05",
    startTime: "11:00",
    endTime: "14:00",
    description: "Local artists showcase and sell their work.",
    category: "Workshops",
  },
  {
    id: 14,
    name: "Community Town Hall Meeting",
    date: "2026-11-12",
    startTime: "18:00",
    endTime: "20:00",
    description: "Discuss upcoming projects and community concerns.",
    category: "Community Meetings",
  },
  {
    id: 15,
    name: "Year-Start Reflection Circle",
    date: "2026-01-01",
    startTime: "17:00",
    endTime: "19:00",
    description: "Gather to reflect and set intentions for the year.",
    category: "Other",
  },
];

const allCategories: Category[] = [
  "Sports",
  "Social",
  "Education",
  "Volunteer",
  "Workshops",
  "Community Meetings",
  "Other",
];

const getCategoryColor = (category: Category): string => {
  const colors: Record<Category, string> = {
    Sports: "#3b82f6",
    Social: "#ef4444",
    Education: "#10b981",
    Volunteer: "#f59e0b",
    Workshops: "#8b5cf6",
    "Community Meetings": "#0ea5e9",
    Other: "#6b7280",
  };
  return colors[category];
};

// ---------- Helpers ----------

const formatDateWithSuffix = (date: Date) => {
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
      ? "nd"
      : day % 10 === 3 && day !== 13
      ? "rd"
      : "th";

  const weekday = date.toLocaleString("default", { weekday: "long" });
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();

  return `${weekday}, ${day}${suffix} ${month}, ${year}`;
};

const formatDateLabel = (iso: string) => {
  const d = new Date(iso);
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

const getEventStatus = (
  event: Event
): "Upcoming" | "Ongoing" | "Completed" | "" => {
  const now = new Date();

  const start = new Date(`${event.date}T${event.startTime}:00`);
  const end = new Date(`${event.date}T${event.endTime}:00`);

  if (now > end) return "Completed";

  const diffMs = start.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (now >= start && now <= end) return "Ongoing";
  if (diffHours > 0 && diffHours <= 24) return "Upcoming";

  return "";
};

// ---------- Calendar ----------

interface CalendarProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  events: Event[]; // events in *your* calendar
  onReset: () => void;
}

const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  setSelectedDate,
  events,
  onReset,
}) => {
  const today = new Date();
  const [year, setYear] = useState<number>(selectedDate.getFullYear());
  const [month, setMonth] = useState<number>(selectedDate.getMonth());

  // keep the calendar month/year in sync when `selectedDate` changes
  useEffect(() => {
    setYear(selectedDate.getFullYear());
    setMonth(selectedDate.getMonth());
  }, [selectedDate]);

  const getDaysInMonth = (y: number, m: number) =>
    new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) =>
    new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const isPastDate = (y: number, m: number, d: number) => {
    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const dateMidnight = new Date(y, m, d);
    return dateMidnight < todayMidnight;
  };

  const handleDateClick = (day: number) => {
    if (isPastDate(year, month, day)) return;
    const newSelected = new Date(year, month, day);
    setSelectedDate(newSelected);
  };

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const monthLabel = new Date(year, month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{ width: 320 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "0.5rem",
          alignItems: "center",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={handlePrevMonth}
            title="Previous month"
            aria-label="Previous month"
            style={{
              width: 36,
              height: 36,
              padding: 0,
              borderRadius: 10,
              backgroundColor: "#ffffff",
              border: "1px solid #eef2ff",
              boxShadow: "0 2px 6px rgba(99,102,241,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ backgroundColor: "#eef2ff", padding: "4px 10px", borderRadius: 999, boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.02)" }}>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "#111827" }}>{new Date(year, month).toLocaleString("default", { month: "long" })}</div>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{year}</div>
          </div>

          <button
            onClick={handleNextMonth}
            title="Next month"
            aria-label="Next month"
            style={{
              width: 36,
              height: 36,
              padding: 0,
              borderRadius: 10,
              backgroundColor: "#ffffff",
              border: "1px solid #eef2ff",
              boxShadow: "0 2px 6px rgba(99,102,241,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 6l6 6-6 6" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <button
          onClick={onReset}
          style={{
            padding: "0.3rem 0.7rem",
            backgroundColor: "#ef4444",
            color: "#ffffff",
            borderRadius: "9999px",
            border: "none",
            cursor: "pointer",
            fontSize: "0.8rem",
          }}
        >
          Reset Calendar
        </button>
      </div>

      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "0.85rem" }}>
        <thead>
          <tr>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <th
                key={day}
                style={{
                  padding: "0.35rem",
                  border: "1px solid #ccc",
                  backgroundColor: "#e5e7eb",
                }}
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({
            length: Math.ceil((daysInMonth + firstDay) / 7),
          }).map((_, weekIndex) => (
            <tr key={weekIndex}>
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const day = weekIndex * 7 + dayIndex - firstDay + 1;
                const isValid = day > 0 && day <= daysInMonth;

                const past = isValid && isPastDate(year, month, day);

                const isSelected =
                  isValid &&
                  !past &&
                  selectedDate.getFullYear() === year &&
                  selectedDate.getMonth() === month &&
                  selectedDate.getDate() === day;

                // mark a day only if the day has an event in the user's calendar
                const hasEvent =
                  isValid &&
                  events.some((event) => {
                    const d = new Date(event.date);
                    return (
                      d.getFullYear() === year &&
                      d.getMonth() === month &&
                      d.getDate() === day
                    );
                  });

                return (
                  <td
                    key={dayIndex}
                    style={{
                      padding: "0.45rem",
                      border: "1px solid #d1d5db",
                      textAlign: "center",
                      backgroundColor: past
                        ? "#e5e7eb"
                        : isSelected
                        ? "#3b82f6"
                        : hasEvent
                        ? "#dbeafe"
                        : "#ffffff",
                      color: past
                        ? "#9ca3af"
                        : isSelected
                        ? "#ffffff"
                        : "#1f2937",
                      cursor: isValid && !past ? "pointer" : "default",
                      position: "relative",
                      minWidth: "2rem",
                    }}
                    onClick={() => isValid && !past && handleDateClick(day)}
                  >
                    {isValid ? day : ""}
                    {hasEvent && !past && (
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          backgroundColor: "#3b82f6",
                          borderRadius: "50%",
                          position: "absolute",
                          bottom: 6,
                          left: "50%",
                          transform: "translateX(-50%)",
                        }}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ---------- Selected Day Panel (your calendar) ----------

const SelectedDayPanel = ({
  selectedDate,
  events,
  onToggleEvent,
}: {
  selectedDate: Date;
  events: Event[]; // events in *your* calendar
  onToggleEvent: (id: number) => void;
}) => {
  const formatted = formatDateWithSuffix(selectedDate);

  const todaysEvents = events.filter((event) => {
    const d = new Date(event.date);
    return (
      d.getFullYear() === selectedDate.getFullYear() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getDate() === selectedDate.getDate()
    );
  });

  return (
    <div style={{ flex: 1 }}>
      <h2 style={{ color: "#000000", marginBottom: "0.5rem" }}>{formatted}</h2>

      {todaysEvents.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No events in your calendar for this day.</p>
      ) : (
        todaysEvents.map((event) => {
          const status = getEventStatus(event);
          const isCompleted = status === "Completed";
          return (
            <div
              key={event.id}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                padding: "1rem",
                marginBottom: "1rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.25rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {isCompleted && (
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "#6b7280",
                        fontWeight: 600,
                      }}
                    >
                      Completed
                    </span>
                  )}
                  {status && !isCompleted && (
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color:
                          status === "Upcoming"
                            ? "#2563eb"
                            : status === "Ongoing"
                            ? "#16a34a"
                            : "#6b7280",
                        fontWeight: 600,
                      }}
                    >
                      {status}
                    </span>
                  )}
                  <h3
                    style={{
                      color: "#000000",
                      margin: 0,
                    }}
                  >
                    {event.name}
                  </h3>
                </div>
                <button
                  onClick={() => onToggleEvent(event.id)}
                  style={{
                    padding: "0.3rem 0.7rem",
                    backgroundColor: "#ef4444",
                    color: "#ffffff",
                    borderRadius: "9999px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  Remove
                </button>
              </div>
              <p style={{ color: "#4b5563", marginBottom: "0.25rem" }}>
                {event.description}
              </p>
              <p style={{ color: "#6b7280", marginBottom: "0.25rem" }}>
                {event.startTime} – {event.endTime}
              </p>
              <span
                style={{
                  backgroundColor: getCategoryColor(event.category),
                  color: "#ffffff",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                }}
              >
                {event.category}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
};

// ---------- Main Component ----------

export default function CommunityEvents() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // IDs of events that are in "your calendar"
  const [myEventIds, setMyEventIds] = useState<number[]>([]);

  // Search term for schedule
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Category filter for schedule
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">(
    "All"
  );

  const myEvents = scheduleEvents.filter((e) => myEventIds.includes(e.id));

  const handleToggleEventInCalendar = (id: number) => {
    setMyEventIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleResetCalendar = () => {
    setMyEventIds([]);
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredSchedule = scheduleEvents.filter((event) => {
    if (selectedCategory !== "All" && event.category !== selectedCategory) {
      return false;
    }
    if (!normalizedSearch) return true;
    const haystack =
      `${event.name} ${event.description} ${event.category}`.toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  const handleAddAllCategoryToCalendar = () => {
    if (selectedCategory === "All") return;
    const idsToAdd = scheduleEvents
      .filter((e) => e.category === selectedCategory)
      .map((e) => e.id);
    setMyEventIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const handleRemoveAllCategoryFromCalendar = () => {
    if (selectedCategory === "All") return;
    const idsToRemove = scheduleEvents
      .filter((e) => e.category === selectedCategory)
      .map((e) => e.id);
    setMyEventIds((prev) => prev.filter((id) => !idsToRemove.includes(id)));
  };

  // Category button state logic
  const categoryEvents =
    selectedCategory === "All"
      ? []
      : scheduleEvents.filter((e) => e.category === selectedCategory);
  const allCategoryAdded =
    selectedCategory !== "All" &&
    categoryEvents.length > 0 &&
    categoryEvents.every((e) => myEventIds.includes(e.id));

  const addCategoryDisabled =
    selectedCategory === "All" || allCategoryAdded || categoryEvents.length === 0;
  const removeCategoryDisabled =
    selectedCategory === "All" || !allCategoryAdded || categoryEvents.length === 0;

  // Group schedule events by date for display
  const groupedByDate: { [date: string]: Event[] } = {};
  filteredSchedule.forEach((event) => {
    if (!groupedByDate[event.date]) groupedByDate[event.date] = [];
    groupedByDate[event.date].push(event);
  });

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div
      style={{
        backgroundColor: "#f0f4f8",
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        color: "#1f2937",
      }}
    >
      {/* HERO */}
      <div
        style={{
          backgroundImage: "url('/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: "5rem 2rem",
          borderRadius: "12px",
          marginBottom: "2rem",
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: "2rem",
            borderRadius: "12px",
            display: "inline-block",
          }}
        >
          <h1 style={{ fontSize: "2.75rem", color: "#ffffff" }}>
            Community Events
          </h1>
          <p style={{ fontSize: "1.25rem", color: "#ffffff" }}>
            Browse the schedule and add events to your calendar.
          </p>
        </div>
      </div>

      {/* CALENDAR + SELECTED DAY */}
      <div style={{ display: "flex", gap: "2rem", marginBottom: "2rem" }}>
        <Calendar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          events={myEvents}
          onReset={handleResetCalendar}
        />
        <SelectedDayPanel
          selectedDate={selectedDate}
          events={myEvents}
          onToggleEvent={handleToggleEventInCalendar}
        />
      </div>

      {/* CATEGORY FILTER + SCHEDULE */}
      <div style={{ display: "flex", gap: "2rem" }}>
        {/* CATEGORY FILTER PANE (LEFT) */}
        <div
          style={{
            width: "20%",
            backgroundColor: "#ffffff",
            padding: "1rem",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            height: "fit-content",
          }}
        >
          <h3 style={{ color: "#000000", marginBottom: "0.75rem" }}>
            Filter by Category
          </h3>
          <button
            onClick={() => setSelectedCategory("All")}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "0.4rem 0.6rem",
              marginBottom: "0.25rem",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              backgroundColor:
                selectedCategory === "All" ? "#e5e7eb" : "transparent",
              color: "#000000",
            }}
          >
            All
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "0.4rem 0.6rem",
                marginBottom: "0.25rem",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                backgroundColor:
                  selectedCategory === cat ? "#e5e7eb" : "transparent",
                color: "#000000",
              }}
            >
              {cat}
            </button>
          ))}

          <button
            onClick={handleAddAllCategoryToCalendar}
            disabled={addCategoryDisabled}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 0.75rem",
              backgroundColor: addCategoryDisabled ? "#9ca3af" : "#2563eb",
              color: "#ffffff",
              borderRadius: "8px",
              border: "none",
              cursor: addCategoryDisabled ? "not-allowed" : "pointer",
              fontSize: "0.9rem",
              width: "100%",
            }}
          >
            Add Category
          </button>

          <button
            onClick={handleRemoveAllCategoryFromCalendar}
            disabled={removeCategoryDisabled}
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem 0.75rem",
              backgroundColor: removeCategoryDisabled ? "#9ca3af" : "#ef4444",
              color: "#ffffff",
              borderRadius: "8px",
              border: "none",
              cursor: removeCategoryDisabled ? "not-allowed" : "pointer",
              fontSize: "0.9rem",
              width: "100%",
            }}
          >
            Remove Category
          </button>
        </div>

        {/* EVENT SCHEDULE (RIGHT) */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#ffffff",
            padding: "1.5rem",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ color: "#000000", marginBottom: "1rem" }}>
            Event Schedule (2026)
          </h2>

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <input
              type="text"
              placeholder="Search events by keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                color: "#000000",
              }}
            />
          </div>

          {sortedDates.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No events match your filters.</p>
          ) : (
            sortedDates.map((date) => (
              <div key={date} style={{ marginBottom: "1.5rem" }}>
                <h3
                  style={{
                    color: "#000000",
                    marginBottom: "0.5rem",
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: "0.25rem",
                  }}
                >
                  {formatDateLabel(date)}
                </h3>
                {groupedByDate[date].map((event) => {
                  const inCalendar = myEventIds.includes(event.id);
                  const status = getEventStatus(event);
                  const isCompleted = status === "Completed";
                  const isOngoing = status === "Ongoing";

                  const now = new Date();
                  const start = new Date(
                    `${event.date}T${event.startTime}:00`
                  );
                  const isFuture = now < start;

                  const showButton = !isCompleted && !isOngoing && isFuture;

                  return (
                    <div
                      key={event.id}
                      style={{
                        backgroundColor: "#f9fafb",
                        borderRadius: "10px",
                        padding: "0.75rem 1rem",
                        marginBottom: "0.5rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "0.25rem",
                          }}
                        >
                          {isCompleted && (
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "#6b7280",
                                fontWeight: 600,
                              }}
                            >
                              Completed
                            </span>
                          )}
                          {isOngoing && (
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "#16a34a",
                                fontWeight: 600,
                              }}
                            >
                              Ongoing
                            </span>
                          )}
                          {status === "Upcoming" && (
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "#2563eb",
                                fontWeight: 600,
                              }}
                            >
                              Upcoming
                            </span>
                          )}
                          <h4
                            style={{
                              margin: 0,
                              color: "#000000",
                            }}
                          >
                            {event.name}
                          </h4>
                          <span
                            style={{
                              backgroundColor: getCategoryColor(
                                event.category
                              ),
                              color: "#ffffff",
                              padding: "0.15rem 0.5rem",
                              borderRadius: "9999px",
                              fontSize: "0.7rem",
                              textTransform: "uppercase",
                            }}
                          >
                            {event.category}
                          </span>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            color: "#4b5563",
                            fontSize: "0.9rem",
                          }}
                        >
                          {event.description}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            color: "#6b7280",
                            fontSize: "0.85rem",
                          }}
                        >
                          {event.startTime} – {event.endTime}
                        </p>
                      </div>
                      {showButton && (
                        <button
                          onClick={() =>
                            handleToggleEventInCalendar(event.id)
                          }
                          style={{
                            padding: "0.4rem 0.8rem",
                            backgroundColor: inCalendar
                              ? "#ef4444"
                              : "#10b981",
                            color: "#ffffff",
                            borderRadius: "9999px",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {inCalendar ? "Remove" : "Add Event"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}