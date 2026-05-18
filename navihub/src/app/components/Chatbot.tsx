'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from "../lib/supabaseClient";
import { useUser } from '../lib/useUser'
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BotMessageSquare,
  CloudSun,
  Train,
  Newspaper,
  CircleQuestionMark,
  LucideProps,
  SendHorizontal,
  X,
  Loader2,
  MapPin,
  BookOpen,
  Users,
  Navigation,
  ExternalLink,
  Clipboard,
} from 'lucide-react';
import type { NewsArticle } from "../lib/types";

enum From {
  You,
  Chat
}

interface Message {
  id: string;
  content: MessageContent;
  from: From;
}

type NaviBotAction = {
  label: string;
  url?: string;
  command?: string;
};

type NaviBotCodeBlock = {
  language: string;
  code: string;
};

type NaviHubResponse = {
  format_version: "1.0";
  title: string;
  summary: string;
  body_markdown: string;
  actions?: NaviBotAction[];
  code_blocks?: NaviBotCodeBlock[];
  metadata?: Record<string, unknown>;
};

type MessageContent = string | NaviHubResponse;

type ChatbotIntent = "weather" | "metro" | "event_weather" | "event_metro" | null;

type WeatherApiResponse = {
  borough: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
  days: Array<{
    date: string;
    tempMaxF: number | null;
    tempMinF: number | null;
    condition: string | null;
    precipitationMm: number | null;
    precipitationChance: number | null;
  }>;
};

type MetroStop = {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
};

type MetroArrival = {
  tripId: string;
  routeId: string | null;
  startStopId: string;
  endStopId: string | null;
  startTime: string | null;
  endTime: string | null;
  minutesAway: number | null;
  durationMinutes: number | null;
  status: string;
};

type MetroApiResponse = {
  line: string;
  startStopId: string;
  endStopId: string | null;
  direction: string | null;
  arrivals: MetroArrival[];
  updatedAt: string;
  message?: string | null;
};

type EventRecord = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  location_name: string | null;
  address: string | null;
  is_virtual: boolean;
  category?: string | null;
};

type GeocodeResult = {
  latitude: number;
  longitude: number;
  placeName: string;
};

type SpecializedContext = {
  intent: ChatbotIntent;
  prompt: string;
  actionHints: NaviBotAction[];
};

const MTA_LINE_OPTIONS = [
  'A', 'C', 'E',
  'B', 'D', 'F', 'M',
  'G',
  'J', 'Z',
  'L',
  'N', 'Q', 'R', 'W',
  '1', '2', '3',
  '4', '5', '6',
  '7',
  'S',
  'SI',
];

const inferLineFromStopId = (stopId: string) => {
  const normalized = stopId.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (normalized.startsWith('SI')) return 'SI';
  for (const option of MTA_LINE_OPTIONS) {
    if (normalized.startsWith(option)) return option;
  }
  if (/^[1234567]/.test(normalized)) return normalized[0];
  return null;
};

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const splitKeywords = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3);

const geocodePlace = async (query: string): Promise<GeocodeResult | null> => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const trimmed = query.trim();
  if (!token || !trimmed) return null;

  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json?access_token=${token}&limit=1`
  );
  if (!res.ok) return null;

  const data = await res.json();
  const feature = data?.features?.[0];
  if (!feature?.center || feature.center.length < 2) return null;

  return {
    longitude: Number(feature.center[0]),
    latitude: Number(feature.center[1]),
    placeName: feature.place_name || trimmed,
  };
};

const fetchUpcomingEventsForChatbot = async () => {
  const { data } = await supabase
    .from("events")
    .select("id, title, description, event_date, start_time, end_time, location_name, address, is_virtual, category")
    .eq("status", "approved")
    .order("event_date", { ascending: true });

  return (data || []) as EventRecord[];
};

const findRelevantEvent = (question: string, events: EventRecord[]) => {
  const today = new Date();
  const upcoming = events.filter((event) => !event.is_virtual && new Date(event.event_date) >= today);
  if (upcoming.length === 0) return null;

  const questionTokens = splitKeywords(question);

  const scored = upcoming
    .map((event) => {
      const haystack = [event.title, event.description, event.location_name, event.address]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      let score = 0;

      questionTokens.forEach((token) => {
        if (haystack.includes(token)) score += 1;
      });

      if (question.toLowerCase().includes(event.title.toLowerCase())) score += 5;
      if (question.toLowerCase().includes("this event")) score += 1;
      if (question.toLowerCase().includes("that event")) score += 1;

      return { event, score };
    })
    .sort((left, right) => right.score - left.score);

  return scored[0]?.event || upcoming[0];
};

const buildWeatherContext = async (question: string): Promise<SpecializedContext> => {
  try {
    const location = await getCurrentPosition();
    const params = new URLSearchParams({ lat: String(location.latitude), lon: String(location.longitude) });
    const res = await fetch(`/api/weather?${params.toString()}`);
    if (!res.ok) throw new Error("Weather request failed");
    const data = (await res.json()) as WeatherApiResponse;

    return {
      intent: "weather",
      prompt: JSON.stringify({
        kind: "weather",
        question,
        instructions: "Answer the weather question using the supplied forecast data. If relevant, mention that the user can open the weather widget. Do not add resource or events page links.",
        allowed_actions: [{ label: "Open Weather Widget", command: "open-weather-widget" }],
        location,
        forecast: {
          borough: data.borough,
          updatedAt: data.updatedAt,
          days: Array.isArray(data.days)
            ? data.days.slice(0, 5).map((day) => ({
                date: day.date,
                condition: day.condition,
                tempMaxF: day.tempMaxF,
                tempMinF: day.tempMinF,
                precipitationMm: day.precipitationMm,
              }))
            : [],
        },
      }),
      actionHints: [{ label: "Open Weather Widget", command: "open-weather-widget" }],
    };
  } catch {
    const res = await fetch('/api/weather?borough=Manhattan');
    if (!res.ok) throw new Error('Weather request failed');
    const data = (await res.json()) as WeatherApiResponse;

    return {
      intent: "weather",
      prompt: JSON.stringify({
        kind: "weather",
        question,
        instructions: "Answer the weather question using the supplied forecast data. If relevant, mention that the user can open the weather widget. Do not add resource or events page links.",
        allowed_actions: [{ label: "Open Weather Widget", command: "open-weather-widget" }],
        location: { borough: 'Manhattan' },
        forecast: {
          borough: data.borough,
          updatedAt: data.updatedAt,
          days: Array.isArray(data.days)
            ? data.days.slice(0, 5).map((day) => ({
                date: day.date,
                condition: day.condition,
                tempMaxF: day.tempMaxF,
                tempMinF: day.tempMinF,
                precipitationMm: day.precipitationMm,
              }))
            : [],
        },
      }),
      actionHints: [{ label: "Open Weather Widget", command: "open-weather-widget" }],
    };
  }
};

const buildMetroContext = async (question: string): Promise<SpecializedContext> => {
  const location = await getCurrentPosition();
  const stopsRes = await fetch('/api/metro/stops?all=1');
  if (!stopsRes.ok) throw new Error('Stops request failed');

  const stopsData = await stopsRes.json();
  const stops = (Array.isArray(stopsData.stops) ? stopsData.stops : []) as MetroStop[];
  if (stops.length === 0) {
    return {
      intent: "metro",
      prompt: JSON.stringify({ kind: 'metro', question, location, recommendedStops: [], arrivals: [] }),
      actionHints: [{ label: "Open Metro Planner", command: "open-metro-widget" }],
    };
  }

  const nearestStops = [...stops]
    .map((stop) => ({
      ...stop,
      distanceKm: haversineDistance(location.latitude, location.longitude, stop.stop_lat, stop.stop_lon),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3);

  const bestStop = nearestStops[0];
  let arrivals: MetroApiResponse['arrivals'] = [];
  let routeSummary: MetroApiResponse | null = null;

  if (bestStop) {
    const inferredLine = inferLineFromStopId(bestStop.stop_id);
    if (inferredLine) {
      const params = new URLSearchParams({ line: inferredLine, startStopId: bestStop.stop_id });
      const metroRes = await fetch(`/api/metro?${params.toString()}`);
      if (metroRes.ok) {
        routeSummary = (await metroRes.json()) as MetroApiResponse;
        arrivals = Array.isArray(routeSummary.arrivals) ? routeSummary.arrivals.slice(0, 4) : [];
      }
    }
  }

  return {
    intent: "metro",
    prompt: JSON.stringify({
      kind: 'metro',
      question,
        instructions: "Answer the metro question using the supplied station and arrival data. If relevant, mention that the user can open the metro planner. Do not add resource or events page links.",
        allowed_actions: [{ label: "Open Metro Planner", command: "open-metro-widget" }],
      location,
      recommendedStops: nearestStops.map(({ distanceKm, ...stop }) => ({
        ...stop,
        distanceMiles: Number((distanceKm * 0.621371).toFixed(2)),
        inferredLine: inferLineFromStopId(stop.stop_id),
      })),
      routeSummary: routeSummary
        ? {
            line: routeSummary.line,
            startStopId: routeSummary.startStopId,
            updatedAt: routeSummary.updatedAt,
            message: routeSummary.message || null,
          }
        : null,
      arrivals: arrivals.map((arrival) => ({
        routeId: arrival.routeId,
        startStopId: arrival.startStopId,
        minutesAway: arrival.minutesAway,
        startTime: arrival.startTime,
        status: arrival.status,
      })),
    }),
    actionHints: [{ label: "Open Metro Planner", command: "open-metro-widget" }],
  };
};

const buildEventWeatherContext = async (question: string): Promise<SpecializedContext> => {
  const events = await fetchUpcomingEventsForChatbot();
  const event = findRelevantEvent(question, events);

  if (!event) {
    return buildWeatherContext(question);
  }

  const locationQuery = event.address || event.location_name || event.title;
  const geocoded = await geocodePlace(locationQuery);
  const forecast = geocoded
    ? await fetch(`/api/weather?lat=${geocoded.latitude}&lon=${geocoded.longitude}`).then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as WeatherApiResponse;
      })
    : null;

  return {
    intent: "event_weather",
    prompt: JSON.stringify({
      kind: 'event_weather',
      question,
    instructions: "Answer about weather for the selected in-person event using the event and forecast data. If relevant, mention the weather widget. Do not add resource or events page links.",
    allowed_actions: [{ label: "Open Weather Widget", command: "open-weather-widget" }],
      event: {
        id: event.id,
        title: event.title,
        event_date: event.event_date,
        start_time: event.start_time,
        location_name: event.location_name,
        address: event.address,
        is_virtual: event.is_virtual,
      },
      venue: geocoded,
      forecast: forecast
        ? {
            borough: forecast.borough,
            updatedAt: forecast.updatedAt,
            days: forecast.days.slice(0, 5).map((day) => ({
              date: day.date,
              condition: day.condition,
              tempMaxF: day.tempMaxF,
              tempMinF: day.tempMinF,
              precipitationMm: day.precipitationMm,
            })),
          }
        : null,
    }),
    actionHints: [{ label: "Open Weather Widget", command: "open-weather-widget" }],
  };
};

const buildEventMetroContext = async (question: string): Promise<SpecializedContext> => {
  const events = await fetchUpcomingEventsForChatbot();
  const event = findRelevantEvent(question, events);

  if (!event) {
    return buildMetroContext(question);
  }

  const locationQuery = event.address || event.location_name || event.title;
  const geocoded = await geocodePlace(locationQuery);
  const stopsRes = await fetch('/api/metro/stops?all=1');
  if (!stopsRes.ok) throw new Error('Stops request failed');

  const stopsData = await stopsRes.json();
  const stops = (Array.isArray(stopsData.stops) ? stopsData.stops : []) as MetroStop[];
  const userLocation = await getCurrentPosition().catch(() => null);

  const eventNearestStops = geocoded
    ? [...stops]
        .map((stop) => ({
          ...stop,
          distanceKm: haversineDistance(geocoded.latitude, geocoded.longitude, stop.stop_lat, stop.stop_lon),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 3)
    : [];

  const userNearestStops = userLocation
    ? [...stops]
        .map((stop) => ({
          ...stop,
          distanceKm: haversineDistance(userLocation.latitude, userLocation.longitude, stop.stop_lat, stop.stop_lon),
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 1)
    : [];

  let routeSummary: MetroApiResponse | null = null;
  if (userNearestStops[0] && eventNearestStops[0]) {
    const startStop = userNearestStops[0];
    const endStop = eventNearestStops[0];
    const inferredLine = inferLineFromStopId(startStop.stop_id);

    if (inferredLine) {
      const params = new URLSearchParams({
        line: inferredLine,
        startStopId: startStop.stop_id,
        endStopId: endStop.stop_id,
      });
      const metroRes = await fetch(`/api/metro?${params.toString()}`);
      if (metroRes.ok) {
        routeSummary = (await metroRes.json()) as MetroApiResponse;
      }
    }
  }

  return {
    intent: "event_metro",
    prompt: JSON.stringify({
      kind: 'event_metro',
      question,
    instructions: "Answer about metro transit for the selected in-person event using the event and station data. If relevant, mention the metro planner. Do not add resource or events page links.",
    allowed_actions: [{ label: "Open Metro Planner", command: "open-metro-widget" }],
      event: {
        id: event.id,
        title: event.title,
        event_date: event.event_date,
        start_time: event.start_time,
        location_name: event.location_name,
        address: event.address,
        is_virtual: event.is_virtual,
      },
      venue: geocoded,
      userLocation,
      recommendedStops: eventNearestStops.map(({ distanceKm, ...stop }) => ({
        ...stop,
        distanceMiles: Number((distanceKm * 0.621371).toFixed(2)),
        inferredLine: inferLineFromStopId(stop.stop_id),
      })),
      routeSummary: routeSummary
        ? {
            line: routeSummary.line,
            startStopId: routeSummary.startStopId,
            endStopId: routeSummary.endStopId,
            updatedAt: routeSummary.updatedAt,
            message: routeSummary.message || null,
          }
        : null,
    }),
    actionHints: [{ label: "Open Metro Planner", command: "open-metro-widget" }],
  };
};

const getCurrentPosition = () =>
  new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      reject,
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  });

const buildSpecializedContext = async (question: string): Promise<SpecializedContext | null> => {
  const normalized = question.toLowerCase();
  const weatherKeywords = ['weather', 'forecast', 'temperature', 'rain', 'umbrella', 'hot', 'cold'];
  const metroKeywords = ['metro', 'subway', 'train', 'station', 'stop', 'arrivals', 'commute', 'transit', 'route'];
  const eventKeywords = ['event', 'events', 'venue', 'location', 'where', 'there', 'this event', 'that event', 'concert', 'festival', 'workshop', 'rsvp'];

  const isEventRelated = eventKeywords.some((keyword) => normalized.includes(keyword));

  if (weatherKeywords.some((keyword) => normalized.includes(keyword)) && isEventRelated) {
    return buildEventWeatherContext(question);
  }

  if (metroKeywords.some((keyword) => normalized.includes(keyword)) && isEventRelated) {
    return buildEventMetroContext(question);
  }

  if (weatherKeywords.some((keyword) => normalized.includes(keyword))) {
    return buildWeatherContext(question);
  }

  if (metroKeywords.some((keyword) => normalized.includes(keyword))) {
    return buildMetroContext(question);
  }

  return null;
};

const isNaviHubResponse = (value: unknown): value is NaviHubResponse => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    record.format_version === "1.0" &&
    typeof record.title === "string" &&
    typeof record.summary === "string" &&
    typeof record.body_markdown === "string"
  );
};

const parseNaviBotResponse = (payload: unknown): MessageContent => {
  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (isNaviHubResponse(parsed)) return parsed;
      } catch {
        // Fall back to plain text.
      }
    }
    return payload;
  }

  if (isNaviHubResponse(payload)) return payload;
  if (payload && typeof payload === "object") return JSON.stringify(payload, null, 2);
  return String(payload ?? "");
};

interface ChatbotOptionProps {
  icon: React.ElementType<LucideProps>;
  content: string;
  action: () => void;
  setHoverText: (text: string) => void;
}

function ChatbotOption({ icon: Icon, content, action, setHoverText }: ChatbotOptionProps) {
  return (
    <button
      onMouseEnter={() => setHoverText(content)}
      onMouseLeave={() => setHoverText("Questions? I can help!")}
      onClick={action}
      className='flex items-center gap-2 text-sm bg-white/20 hover:bg-white/40 text-white transition-colors duration-200 px-4 py-2 rounded-full shadow-sm cursor-pointer'
    >
      <Icon className='w-4 h-4' />
      <span>{content}</span>
    </button>
  );
}

export default function Chatbot() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [hoverText, setHoverText] = useState("Questions? I can help!");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-chatbot', handleOpen);
    return () => window.removeEventListener('open-chatbot', handleOpen);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        window.dispatchEvent(new Event("close-chatbot"));
      }
    };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  const addMessage = (content: MessageContent, from: From) => {
    setMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      content: content || "There was an error. Please try again.",
      from
    }]);
  };

  // Hoisted data fetchers natively
  const fetchArticles = useCallback(async () => {
    const params = new URLSearchParams({ limit: "50" });
    const res = await fetch(`/api/news?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch news");
    const data = await res.json();
    return data.articles;
  }, []);

  const fetchResources = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("resources").select("*").eq("status", "approved");
      if (error) return [];
      return data;
    } catch {
      return [];
    }
  }, []);

  const fetchUserContext = useCallback(async (userId: string) => {
    try {
      // Get the current session access token from the client-side supabase instance
      const sessionRes = await supabase.auth.getSession();
      // @ts-ignore
      const token = sessionRes?.data?.session?.access_token;
      if (!token) return { signedUpEvents: [], resourceSubmissions: [], posts: [] };

      const res = await fetch('/api/user/context', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (!res.ok) return { signedUpEvents: [], resourceSubmissions: [], posts: [] };
      const payload = await res.json();
      return {
        signedUpEvents: payload.signedUpEvents ?? [],
        resourceSubmissions: payload.resourceSubmissions ?? [],
        posts: payload.posts ?? [],
      };
    } catch (err) {
      return { signedUpEvents: [], resourceSubmissions: [], posts: [] };
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("status", "approved")
      .order("event_date", { ascending: true });
    return data;
  }, []);

  const handleSendMessage = useCallback(async (displayText: string, openEnded: boolean = true, hiddenPrompt?: string) => {
    if (!displayText.trim() || isLoading) return;

    addMessage(displayText, From.You);
    setInputValue("");
    setIsLoading(true);

    try {
      const modRes = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: displayText }),
      });
      const modData = await modRes.json();

      if (!modData.safe) {
        addMessage("I'm sorry. Your message included inappropriate language. Please word your question with more appropriate language. Thank you!", From.Chat);
        setIsLoading(false);
        return;
      }

      let toSend = hiddenPrompt || displayText;
      let specializedKind: ChatbotIntent = null;
      let specializedActionHints: NaviBotAction[] | null = null;
      if (openEnded) {
        const specializedContext = await buildSpecializedContext(displayText);
        if (specializedContext) {
          specializedKind = specializedContext.intent;
          toSend = specializedContext.prompt;
          specializedActionHints = specializedContext.actionHints;
        } else {
          const [articles, resources, events] = await Promise.all([
            fetchArticles(),
            fetchResources(),
            fetchEvents()
          ]);

          const safeStringify = (arr: unknown, limit: number) => {
            if (!Array.isArray(arr)) return "None";
            // Only take top items to save tokens & prevent timeouts
            return JSON.stringify(arr.slice(0, limit)).substring(0, 2000);
          };

          toSend = `You are a helpful community hub assistant for NYC. 
Resources available: ${safeStringify(resources, 5)}. 
Recent News: ${safeStringify(articles, 3)}. 
Events: ${safeStringify(events, 3)}. 
User's question: ${displayText}. 
Instructions: Do not hallucinate. Steer conversation to the hub if irrelevant. Be extremely concise (max 2-3 sentences).`;
        }
      }

      // If the user is signed in, attach a brief sanitized snapshot of their personal data
      if (user && user.id) {
        try {
          const uctx = await fetchUserContext(user.id);
          // If the outgoing payload is JSON text (specialized contexts), merge userContext into it.
          try {
            const parsed = JSON.parse(typeof toSend === 'string' ? toSend : String(toSend));
            if (parsed && typeof parsed === 'object') {
              parsed.userContext = {
                signedUpEvents: uctx.signedUpEvents?.slice(0, 5) ?? [],
                resourceSubmissions: uctx.resourceSubmissions?.slice(0, 10) ?? [],
                posts: uctx.posts?.slice(0, 10) ?? [],
              };
              toSend = JSON.stringify(parsed);
            } else {
              toSend = `${toSend}\nUserContext: ${JSON.stringify(uctx)}`;
            }
          } catch (e) {
            // Not JSON, append as short string
            toSend = `${toSend}\nUserContext: ${JSON.stringify({
              signedUpEvents: uctx.signedUpEvents?.slice(0, 5) ?? [],
              resourceSubmissions: uctx.resourceSubmissions?.slice(0, 10) ?? [],
              posts: uctx.posts?.slice(0, 10) ?? [],
            })}`;
          }
        } catch (err) {
          // silently continue without user context
        }
      }

      const chatRes = await fetch(`/api/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSend)
      });
      const chatData = await chatRes.json();
      const parsed = parseNaviBotResponse(chatData);
      const fallbackTitle =
        specializedKind === "weather"
          ? "Weather Update"
          : specializedKind === "event_weather"
            ? "Event Weather"
            : specializedKind === "metro"
              ? "Metro Update"
              : specializedKind === "event_metro"
                ? "Event Transit"
                : "NaviBot";

      if (parsed && typeof parsed === "object" && isNaviHubResponse(parsed)) {
        const actions = parsed.actions && parsed.actions.length > 0
          ? parsed.actions
          : specializedActionHints && specializedActionHints.length > 0
            ? specializedActionHints
            : undefined;

        addMessage(
          actions ? { ...parsed, actions } : parsed,
          From.Chat
        );
      } else if (specializedActionHints && specializedActionHints.length > 0) {
        addMessage(
          {
            format_version: "1.0",
            title: fallbackTitle,
            summary: displayText,
            body_markdown: typeof parsed === "string" ? parsed : JSON.stringify(parsed),
            actions: specializedActionHints,
          },
          From.Chat
        );
      } else {
        addMessage(parsed, From.Chat);
      }
    } catch (error) {
      console.error(error);
      addMessage("Sorry, I encountered an error fulfilling your request.", From.Chat);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, fetchArticles, fetchResources, fetchEvents]);

  const handleSummarizeNews = async () => {
    try {
      const data = await fetchArticles();
      let weeklyNews = "";
      const today = new Date();
      
      data.forEach((article: NewsArticle) => {
        const articleDate = new Date(article.published_at);
        const msDifference = today.getTime() - articleDate.getTime();
        const daysDifference = Math.floor(msDifference / (1000 * 60 * 60 * 24));
        if (daysDifference < 25) { 
          // Truncate to just title and a short snippet to dramatically shorten payload
          const snippet = article.content ? article.content.substring(0, 120) : "";
          weeklyNews += `- ${article.title || 'News'}: ${snippet}...\n`;
        }
      });

      if (weeklyNews) {
        const prompt = `Provide a very brief 3-bullet summary of this week's news highlights:\n${weeklyNews}\nFocus on the top events. Keep it extremely short.`;
        await handleSendMessage("Summarize this week's news.", false, prompt);
      } else {
        addMessage("I'm sorry. Looks like there is no recent news to summarize.", From.Chat);
        setIsLoading(false);
      }
    } catch {
      addMessage("Failed to load news.", From.Chat);
      setIsLoading(false);
    }
  };

  const handlePageInfo = () => {
    const url = window.location.href;
    let text = "Welcome to Navihub!\n\nHere on our Homepage, you get a bird's-eye view of our platform's mission to bridge communities across New York City.\n\nSpecial Features:\n• Browse our top highlighted tools and resources\n• Jump straight into any section of the site\n• Learn about our core philosophy and what drives us";
    
    if (url.toLowerCase().includes("resources")) {
      text = "You are currently on the Resources page, the core directory of Navihub!\n\nSpecial Features:\n• Map View: Toggle the interactive map to find location-based resources visually.\n• Category Filters: Sort resources easily out of dozens of categories (Housing, Food, Legal, etc.) and by NYC borough.\n• Suggest a Resource: Know a community initiative? Click 'Suggest a Resource' to propose it for our database.\n• Direct Links: Click any resource card to view detailed contact info or go straight to their official page.";
    }
    else if (url.toLowerCase().includes("news")) {
      text = "You are on the NYC Local News page.\n\nSpecial Features:\n• Live Updates: Stay updated with real-time news pulled straight from community channels.\n• Category Filters: Toggle between Politics, Community, Health, Real Estate, and more to read what matters to you.\n• Quick Briefs: Read a quick snippet of the story directly on the card before digging deeper.";
    }
    else if (url.toLowerCase().includes("events")) {
      text = "You are on the Events page!\n\nSpecial Features:\n• RSVP System: View upcoming local community events and easily secure your spot.\n• Email Confirmations: Upon RSVPing, you'll receive a detailed confirmation email highlighting your specific spot, time, location, and the event details. Have it prepared on the day!\n• Shared Chat: All events feature a live discussion board you can join if you're signed in to talk with other attendees.\n• Organized Directory: Easily view upcoming dates, times, and exact locations so you never miss out on NYC gatherings.";
    }
    else if (url.toLowerCase().includes("navilink")) {
      text = "Welcome to NaviLink, our community forum page!\n\nSpecial Features:\n• Categorized Posts: Filter discussions by Sports & Recreation, Education, Careers, Community Events, and Wellness.\n• Global Chat: Engage with others, share resources, and reply to posts in real-time.\n• Protected Community: You must be signed in to post and reply, which keeps our community safe, localized, and authentic.\n• Active Moderation: Our robust moderation algorithm automatically prevents profanity, spam, hate speech, and explicit content so this space thrives on positivity.";
    }
    else if (url.toLowerCase().includes("about")) {
      text = "You are on the About Us page.\n\nHere you can learn all about Navihub's mission to create genuine, barrier-free connections in NYC. Scroll down to see our philosophy, meet our development goals, and check out our platform roadmap.";
    }
    else if (url.toLowerCase().includes("account")) {
      text = "You are on your Account Dashboard.\n\nThis is your personal space to manage your NaviHub experience.\n\nSpecial Features:\n• Profile Settings: Update your name and change your password securely.\n• My Posts: Keep track of all the resources and events you've shared with the community.\n• Signed-Up Events: Easily view the local NYC events you've registered for.\n• Approvals & Notifications: Check the status of your submitted posts and stay updated with your event groups.";
    }

    addMessage("Tell me about this page.", From.You);
    setTimeout(() => addMessage(text, From.Chat), 600);
  };

  // ── Page-specific handlers ──

  const handleTopResources = useCallback(async () => {
    try {
      const resources = await fetchResources();
      if (!resources || resources.length === 0) {
        addMessage("No resources found right now. Try browsing the full directory!", From.Chat);
        setIsLoading(false);
        return;
      }
      const sorted = [...resources].sort((a: { views?: number }, b: { views?: number }) => (b.views || 0) - (a.views || 0));
      const top = sorted.slice(0, 5);
      const list = top.map((r: { name: string; category: string; location: string }) => `• ${r.name} — ${r.category}, ${r.location}`).join('\n');
      const prompt = `Briefly introduce these top NaviHub community resources in 1 line each, in a friendly tone:\n${list}\nKeep it concise.`;
      await handleSendMessage("What are the top resources on NaviHub?", false, prompt);
    } catch {
      addMessage("Failed to load resources.", From.Chat);
      setIsLoading(false);
    }
  }, [fetchResources, handleSendMessage]);

  const handleFindResourceByNeed = () => {
    addMessage("What kind of help are you looking for?", From.You);
    setTimeout(() => addMessage(
      "I can help you find resources for:\n• 🍎 Food & basic needs\n• 🏠 Housing & utilities\n• 💼 Jobs & career support\n• ⚕️ Health & wellness\n• 📚 Education & learning\n• ⚖️ Legal & government services\n\nJust type what you need and I'll point you in the right direction!",
      From.Chat
    ), 500);
  };

  const handleUpcomingEvents = useCallback(async () => {
    try {
      const events = await fetchEvents();
      const now = new Date();
      const upcoming = (events || [])
        .filter((e: { event_date: string }) => new Date(e.event_date) >= now)
        .slice(0, 4);
      if (upcoming.length === 0) {
        addMessage("No upcoming events found right now. Check back soon!", From.Chat);
        setIsLoading(false);
        return;
      }
      const list = upcoming.map((e: { title: string; event_date: string; location?: string }) => {
        const d = new Date(e.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `• ${e.title} — ${d}${e.location ? ', ' + e.location : ''}`;
      }).join('\n');
      const prompt = `Briefly describe these upcoming NYC community events in 1 line each, keeping it exciting and friendly:\n${list}\nBe concise.`;
      await handleSendMessage("What events are coming up?", false, prompt);
    } catch {
      addMessage("Failed to load events.", From.Chat);
      setIsLoading(false);
    }
  }, [fetchEvents, handleSendMessage]);

  const handleEventsNearMe = useCallback(async () => {
    addMessage("Finding events near you...", From.You);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        });
      });
      const coords = pos.coords;

      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const geoRes = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.longitude},${coords.latitude}.json?access_token=${token}&types=neighborhood,place`
      );
      const geoData = await geoRes.json();
      const neighborhood =
        geoData.features?.[0]?.text ||
        geoData.features?.[0]?.place_name?.split(',')[0] ||
        "your area";

      const events = await fetchEvents();
      const now = new Date();
      const upcoming = (events || [])
        .filter((e: { event_date: string }) => new Date(e.event_date) >= now)
        .slice(0, 8);

      if (upcoming.length === 0) {
        addMessage("No upcoming events found right now. Check back soon!", From.Chat);
        setIsLoading(false);
        return;
      }

      const list = upcoming
        .map((e: { title: string; event_date: string; location_name?: string; address?: string }) => {
          const d = new Date(e.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return `• ${e.title} — ${d}, ${e.location_name || e.address || 'NYC'}`;
        })
        .join('\n');

      const prompt = `The user is near ${neighborhood}, NYC. From this list of upcoming events, highlight the most relevant ones for someone in their area. Be friendly and concise (3–4 sentences max):\n${list}`;
      await handleSendMessage(`Find events near me in ${neighborhood}`, false, prompt);
    } catch (err: unknown) {
      const msg =
        (err as { code?: number })?.code === 1
          ? "Location access was denied. Please enable location permissions and try again."
          : "Couldn't get your location. Please try again.";
      addMessage(msg, From.Chat);
      setIsLoading(false);
    }
  }, [fetchEvents, handleSendMessage]);

  const handleHowToRSVP = () => {
    addMessage("How do I RSVP to an event?", From.You);
    setTimeout(() => addMessage(
      "RSVPing is easy!\n\n1. Browse the events list and click on any event card\n2. Sign in if you haven't already\n3. Click the RSVP button in the event details\n4. Check your email — you'll receive a confirmation with the event date, time, and location\n\nYou can cancel your RSVP at any time from the event page. 🎉",
      From.Chat
    ), 500);
  };

  const handleNaviLinkGuide = () => {
    addMessage("How does NaviLink work?", From.You);
    setTimeout(() => addMessage(
      "NaviLink is NaviHub's community forum!\n\n• 📝 Create posts to share resources, ask questions, or start discussions\n• 🏷️ Browse by category: Sports, Education, Careers, Community, Wellness\n• 💬 Reply to others and build connections\n• 🔒 Sign in required to post — keeps the community authentic\n• 🛡️ All content is auto-moderated to keep things respectful\n\nWhat would you like to discuss?",
      From.Chat
    ), 500);
  };

  const handleNewsCategories = () => {
    addMessage("What news categories are available?", From.You);
    setTimeout(() => addMessage(
      "NaviHub covers NYC news across multiple categories:\n\n🗳️ Politics & Government\n🏘️ Community & Neighborhoods\n⚕️ Health & Public Safety\n🏠 Real Estate & Housing\n📚 Education\n🌱 Environment\n🚇 Transportation\n💰 Economy & Business\n\nUse the Filters button on the news page to narrow down to what matters to you!",
      From.Chat
    ), 500);
  };

  // ── Page-specific quick action buttons ──
  const pageButtons: { icon: React.ElementType<LucideProps>; content: string; action: () => void }[] = (() => {
    if (pathname?.includes('resources')) return [
      { icon: MapPin, content: 'Top Resources', action: handleTopResources },
      { icon: BookOpen, content: 'Find by Need', action: handleFindResourceByNeed },
    ];
    if (pathname?.includes('events')) return [
      { icon: Navigation, content: 'Upcoming Events', action: handleUpcomingEvents },
      { icon: Navigation, content: 'Events Near Me', action: handleEventsNearMe },
      { icon: CircleQuestionMark, content: 'How to RSVP', action: handleHowToRSVP },
    ];
    if (pathname?.includes('navilink')) return [
      { icon: Users, content: 'NaviLink Guide', action: handleNaviLinkGuide },
    ];
    if (pathname?.includes('news')) return [
      { icon: Newspaper, content: 'Summarize News', action: handleSummarizeNews },
      { icon: BookOpen, content: 'News Categories', action: handleNewsCategories },
    ];
    return [];
  })();

  const handleAction = (action: NaviBotAction) => {
    if (action.url) {
      if (action.url.startsWith("/")) {
        router.push(action.url);
      } else {
        window.open(action.url, "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (action.command === "open-weather-widget") {
      window.dispatchEvent(new Event("open-weather-widget"));
      return;
    }

    if (action.command === "open-metro-widget") {
      window.dispatchEvent(new Event("open-metro-widget"));
      return;
    }

    if (action.command && navigator?.clipboard) {
      navigator.clipboard.writeText(action.command).catch(() => undefined);
    }
  };

  const renderStructuredResponse = (response: NaviHubResponse) => {
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="!text-sm !font-semibold !text-gray-900">{response.title}</div>
          <div className="!text-xs !text-gray-600">{response.summary}</div>
        </div>
        <div className="!text-sm !text-gray-800">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h3: ({ children }) => (
                <h3 className="!text-sm !font-semibold !text-gray-900 mb-2">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="!text-sm !text-gray-800 leading-6 mb-2 last:mb-0">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-5 space-y-1 !text-sm !text-gray-800">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-5 space-y-1 !text-sm !text-gray-800">{children}</ol>
              ),
              li: ({ children }) => <li className="!text-sm !text-gray-800">{children}</li>,
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="!text-[#404E3B] underline underline-offset-4"
                >
                  {children}
                </a>
              ),
              strong: ({ children }) => <strong className="font-semibold !text-gray-900">{children}</strong>,
              em: ({ children }) => <em className="italic !text-gray-700">{children}</em>,
                  code: (props: any) => {
                    const { inline, children } = props;
                    if (inline) return <code className="px-1 bg-gray-100 rounded text-xs">{children}</code>;
                    return null;
                  },
            }}
          >
            {response.body_markdown}
          </ReactMarkdown>
        </div>

        {response.actions && response.actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {response.actions.map((action, index) => (
              <button
                key={`${action.label}-${index}`}
                onClick={() => handleAction(action)}
                className="inline-flex items-center gap-2 rounded-full !bg-[#404E3B] px-4 py-2 text-xs font-semibold !text-white shadow-md hover:!bg-[#7B9669] transition cursor-pointer"
              >
                <span>{action.label}</span>
                {action.url ? <ExternalLink className="h-3.5 w-3.5" /> : null}
                {action.command === "open-weather-widget" ? <CloudSun className="h-3.5 w-3.5" /> : null}
                {action.command === "open-metro-widget" ? <Train className="h-3.5 w-3.5" /> : null}
                {action.command && action.command !== "open-weather-widget" && action.command !== "open-metro-widget" ? <Clipboard className="h-3.5 w-3.5" /> : null}
              </button>
            ))}
          </div>
        )}

      </div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
          >
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="bg-white text-[#404E3B] px-4 py-2 rounded-lg shadow-md border border-gray-100 text-sm font-medium relative mr-2 cursor-pointer" 
              onClick={() => setIsOpen(true)}
            >
              Need help? Ask NaviBot!
              <div className="absolute -bottom-1.5 right-4 w-3 h-3 bg-white border-b border-r border-gray-100 transform rotate-45"></div>
            </motion.div>
            <button
              onClick={() => setIsOpen(true)}
              className="p-4 rounded-full bg-[#404E3B] text-white shadow-lg hover:bg-[#7B9669] hover:shadow-xl transition-all focus:outline-none"
              aria-label="Open Chatbot"
            >
              <BotMessageSquare size={32} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chatbot-title"
            className="fixed bottom-6 right-6 w-[90vw] sm:w-[400px] sm:max-w-[95vw] h-150 max-h-[80vh] flex flex-col bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#404E3B] text-white">
              <div className="flex items-center gap-3">
                <BotMessageSquare size={24} />
                <h2 id="chatbot-title" className="text-xl font-semibold">NaviBot</h2>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.dispatchEvent(new Event("close-chatbot"));
                }}
                aria-label="Close chatbot"
                className="text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                  <BotMessageSquare size={48} className="opacity-20" />
                  <p className="!text-sm !font-medium !text-gray-600">{hoverText}</p>
                </div>
              )}
              {messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  key={msg.id}
                  className={`flex ${msg.from === From.You ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      msg.from === From.You
                        ? 'bg-[#404E3B] text-white rounded-br-none'
                        : 'bg-[#E2E8F0] text-gray-800 rounded-bl-none'
                    } ${typeof msg.content === "string" ? "whitespace-pre-line" : ""}`}
                  >
                    {typeof msg.content === "string"
                      ? msg.content
                      : renderStructuredResponse(msg.content)}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#E2E8F0] rounded-2xl rounded-bl-none px-4 py-2">
                    <Loader2 className="w-5 h-5 !text-gray-500 !animate-[spin_1.6s_linear_infinite]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="bg-[#7B9669] px-4 pt-3 pb-2 flex flex-col gap-2">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                <ChatbotOption icon={CircleQuestionMark} content="About this Page" action={handlePageInfo} setHoverText={setHoverText} />
              </div>
              {pageButtons.length > 0 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {pageButtons.map((btn) => (
                    <ChatbotOption key={btn.content} icon={btn.icon} content={btn.content} action={btn.action} setHoverText={setHoverText} />
                  ))}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a question..."
                  aria-label="Type your message"
                  className="flex-1 bg-gray-100 border-none outline-none focus:ring-2 focus:ring-[#404E3B] rounded-full px-5 py-3 text-sm text-gray-700"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  aria-label="Send message"
                  className="p-3 bg-[#404E3B] text-white rounded-full hover:bg-[#7B9669] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#404E3B] cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 !text-white !animate-[spin_1.6s_linear_infinite]" />
                  ) : (
                    <SendHorizontal className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}