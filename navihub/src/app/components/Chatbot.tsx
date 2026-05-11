'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from "../lib/supabaseClient";
import {
  BotMessageSquare,
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
} from 'lucide-react';
import type { NewsArticle } from "../lib/types";
import WeatherCard from './WeatherCard';
import { pinSubway, unpinSubway, isSubwayPinned } from '../lib/pinUtils';
import WidgetRenderer from './WidgetRenderer';
// dynamic import removed (not used here)

interface SubwayMessage {
  type: 'subway';
  data: unknown;
}

interface WeatherMessage {
  type: 'weather';
  data: unknown;
}

type ChatContent = string | Record<string, unknown> | NaviHubResponse | SubwayMessage | WeatherMessage;

interface ChatbotOptionProps {
  icon: React.ElementType<LucideProps>;
  content: string;
  action: () => void;
  setHoverText: (text: string) => void;
}

interface NaviHubResponse {
  format_version: string;
  title?: string;
  summary?: string;
  body_markdown?: string;
  actions?: Array<{ label: string; url?: string; command?: string }>;
  code_blocks?: Array<{ language: string; code: string }>;
  metadata?: Record<string, unknown> & {
    widget?: { render_in_chatbot?: boolean; sandbox?: boolean };
    widget_filename?: string;
  };
  error?: string;
  reason?: string;
}

function ChatbotOption({ icon: Icon, content, action, setHoverText }: ChatbotOptionProps) {
  return (
    <button
      onMouseEnter={() => setHoverText(content)}
      onMouseLeave={() => setHoverText("Questions? I can help!")}
      onClick={action}
      className='flex items-center gap-2 text-sm bg-white/20 hover:bg-white/40 text-white transition-colors duration-200 px-4 py-2 rounded-full shadow-sm'
    >
      <Icon className='w-4 h-4' />
      <span>{content}</span>
    </button>
  );
}

export default function Chatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [hoverText, setHoverText] = useState("Questions? I can help!");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [, setPinTick] = useState(0);
  const [messages, setMessages] = useState<Array<{ id: string; content: string | ChatContent; from: 'you' | 'chat'; timestamp: number }>>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Minimal markdown -> JSX renderer for headings, lists, and links
  const renderMarkdown = (md?: string) => {
    if (!md) return null;
    const lines = md.split(/\r?\n/);
    const elements: React.ReactNode[] = [];
    let listBuffer: string[] | null = null;
    const flushList = () => {
      if (listBuffer && listBuffer.length > 0) {
        elements.push(
          <ul className="list-disc ml-5 mb-3" key={elements.length}>
            {listBuffer.map((li, i) => (
              <li key={i} className="mb-2 text-black !text-black text-sm leading-relaxed">{renderInlineMarkdown(li)}</li>
            ))}
          </ul>
        );
        listBuffer = null;
      }
    };

    const renderInlineMarkdown = (text: string): React.ReactNode => {
      const inlineRegex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\))/g;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let m: RegExpExecArray | null;

      while ((m = inlineRegex.exec(text)) !== null) {
        if (m.index > lastIndex) {
          parts.push(text.slice(lastIndex, m.index));
        }

        if (m[2] !== undefined) {
          // Bold text **bold**
          parts.push(
            <strong key={parts.length} className="font-semibold">
              {renderInlineMarkdown(m[2])}
            </strong>
          );
        } else if (m[3] !== undefined) {
          // Italic text *italic*
          parts.push(
            <em key={parts.length} className="not-italic italic">
              {renderInlineMarkdown(m[3])}
            </em>
          );
        } else if (m[4] !== undefined && m[5] !== undefined) {
          // Link [text](url)
          parts.push(
            <a
              key={parts.length}
              href={m[5]}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              {renderInlineMarkdown(m[4])}
            </a>
          );
        } else {
          parts.push(m[0]);
        }

        lastIndex = m.index + m[0].length;
      }

      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }

      return <>{parts}</>;
    };

    for (const line of lines) {
      if (!line.trim()) {
        flushList();
        elements.push(<div className="my-3" key={elements.length} />);
        continue;
      }
      if (line.startsWith('### ')) { flushList(); elements.push(<h3 className="text-base font-semibold mb-2 text-black !text-black" key={elements.length}>{renderInlineMarkdown(line.slice(4))}</h3>); continue; }
      if (line.startsWith('## ')) { flushList(); elements.push(<h2 className="text-lg font-semibold mb-2 text-black !text-black" key={elements.length}>{renderInlineMarkdown(line.slice(3))}</h2>); continue; }
      if (line.startsWith('# ')) { flushList(); elements.push(<h1 className="text-xl font-semibold mb-3 text-black !text-black" key={elements.length}>{renderInlineMarkdown(line.slice(2))}</h1>); continue; }
      if (line.startsWith('- ')) {
        if (!listBuffer) listBuffer = [];
        listBuffer.push(line.slice(2));
        continue;
      }
      // default paragraph
      flushList();
      elements.push(<p className="mb-2 text-sm leading-relaxed text-black !text-black" key={elements.length}>{renderInlineMarkdown(line)}</p>);
    }
    flushList();
    return <div className="space-y-2 text-sm text-black !text-black">{elements}</div>;
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
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  useEffect(() => {
    const h = () => setPinTick(t => t + 1);
    window.addEventListener('pin-subway', h as EventListener);
    return () => window.removeEventListener('pin-subway', h as EventListener);
  }, []);

  const addMessage = (content: string | ChatContent, from: 'you' | 'chat') => {
    setMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      content: content,
      from,
      timestamp: Date.now()
    }]);
  };

  const replaceLastMessage = (newContent: ChatContent) => {
    setMessages(prev => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      copy[copy.length - 1] = { ...copy[copy.length - 1], content: newContent };
      return copy;
    });
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

    addMessage(displayText, 'you');
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
        addMessage("I'm sorry. Your message included inappropriate language. Please word your question with more appropriate language. Thank you!", 'chat');
        setIsLoading(false);
        return;
      }

      let toSend = hiddenPrompt || displayText;
      if (openEnded) {
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
Use the available local resources, recent news, and events information when it is relevant, but do not restrict your answer only to those items.
If the user asks about New York City generally, answer using broader NYC context and web-aware knowledge.
Resources available: ${safeStringify(resources, 5)}.
Recent News: ${safeStringify(articles, 3)}.
Events: ${safeStringify(events, 3)}.
User's question: ${displayText}.
Instructions: Do not hallucinate. Answer accurately with NYC context where possible. If the question is only loosely related to Navihub, answer generally and concisely (2-3 sentences), while still mentioning relevant hub resources when helpful.
Use markdown formatting when appropriate, including *italics* and **bold** for emphasis.`;
      }

      const chatRes = await fetch(`/api/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSend)
      });
      const chatData = await chatRes.json();
      addMessage(chatData, 'chat');
    } catch (error) {
      console.error(error);
      addMessage("Sorry, I encountered an error fulfilling your request.", 'chat');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, fetchArticles, fetchResources, fetchEvents]);

  const handleSummarizeNews = async () => {
    setIsLoading(true);
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
        addMessage("I'm sorry. Looks like there is no recent news to summarize.", 'chat');
        setIsLoading(false);
      }
    } catch {
      addMessage("Failed to load news.", 'chat');
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

    addMessage("Tell me about this page.", 'you');
    setTimeout(() => addMessage(text, 'chat'), 600);
  };

  // ── Page-specific handlers ──

  const handleTopResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const resources = await fetchResources();
      if (!resources || resources.length === 0) {
        addMessage("No resources found right now. Try browsing the full directory!", 'chat');
        setIsLoading(false);
        return;
      }
      const sorted = [...resources].sort((a: { views?: number }, b: { views?: number }) => (b.views || 0) - (a.views || 0));
      const top = sorted.slice(0, 5);
      const list = top.map((r: { name: string; category: string; location: string }) => `• ${r.name} — ${r.category}, ${r.location}`).join('\n');
      const prompt = `Briefly introduce these top NaviHub community resources in 1 line each, in a friendly tone:\n${list}\nKeep it concise.`;
      await handleSendMessage("What are the top resources on NaviHub?", false, prompt);
    } catch {
      addMessage("Failed to load resources.", 'chat');
      setIsLoading(false);
    }
  }, [fetchResources, handleSendMessage]);

  const handleFindResourceByNeed = () => {
    addMessage("What kind of help are you looking for?", 'you');
    setTimeout(() => addMessage(
      "I can help you find resources for:\n• 🍎 Food & basic needs\n• 🏠 Housing & utilities\n• 💼 Jobs & career support\n• ⚕️ Health & wellness\n• 📚 Education & learning\n• ⚖️ Legal & government services\n\nJust type what you need and I'll point you in the right direction!",
      'chat'
    ), 500);
  };

  const handleUpcomingEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const events = await fetchEvents();
      const now = new Date();
      const upcoming = (events || [])
        .filter((e: { event_date: string }) => new Date(e.event_date) >= now)
        .slice(0, 4);
      if (upcoming.length === 0) {
        addMessage("No upcoming events found right now. Check back soon!", 'chat');
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
      addMessage("Failed to load events.", 'chat');
      setIsLoading(false);
    }
  }, [fetchEvents, handleSendMessage]);

  const handleEventsNearMe = useCallback(async () => {
    addMessage("Finding events near you...", 'you');
    setIsLoading(true);
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
        addMessage("No upcoming events found right now. Check back soon!", 'chat');
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
      addMessage(msg, 'chat');
      setIsLoading(false);
    }
  }, [fetchEvents, handleSendMessage]);

  const handleHowToRSVP = () => {
    addMessage("How do I RSVP to an event?", 'you');
    setTimeout(() => addMessage(
      "RSVPing is easy!\n\n1. Browse the events list and click on any event card\n2. Sign in if you haven't already\n3. Click the RSVP button in the event details\n4. Check your email — you'll receive a confirmation with the event date, time, and location\n\nYou can cancel your RSVP at any time from the event page. 🎉",
      'chat'
    ), 500);
  };

  const handleNaviLinkGuide = () => {
    addMessage("How does NaviLink work?", 'you');
    setTimeout(() => addMessage(
      "NaviLink is NaviHub's community forum!\n\n• 📝 Create posts to share resources, ask questions, or start discussions\n• 🏷️ Browse by category: Sports, Education, Careers, Community, Wellness\n• 💬 Reply to others and build connections\n• 🔒 Sign in required to post — keeps the community authentic\n• 🛡️ All content is auto-moderated to keep things respectful\n\nWhat would you like to discuss?",
      'chat'
    ), 500);
  };

  const handleShowWeather = async () => {
    addMessage('Loading weather for NYC...', 'chat');
    try {
      const lat = '40.7128';
      const lon = '-74.0060';
      const res = await fetch(`/api/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`);
      if (!res.ok) {
        const text = await res.text().catch(() => 'no body');
        console.error('Weather fetch failed', res.status, text);
        throw new Error('Weather fetch failed');
      }
      const data = await res.json();
      replaceLastMessage({ type: 'weather', data });
    } catch (err) {
      console.error('handleShowWeather error', err);
      replaceLastMessage('Failed to load weather for NYC.');
    }
  };

  const handleShowSubway = async () => {
    addMessage('Loading live subway status...', 'chat');
    try {
      const res = await fetch('/api/subway/status');
      if (!res.ok) {
        const text = await res.text().catch(() => 'no body');
        console.error('Subway fetch failed', res.status, text);
        replaceLastMessage('Failed to load live subway status.');
        return;
      }
      const data = await res.json();
      // render as a subway message object so Chatbot displays a full SubwayCard in-chat
      replaceLastMessage({ type: 'subway', data });
    } catch (err) {
      console.error('handleShowSubway error', err);
      replaceLastMessage('Failed to load live subway status.');
    }
  };

  const handleNewsCategories = () => {
    addMessage("What news categories are available?", 'you');
    setTimeout(() => addMessage(
      "NaviHub covers NYC news across multiple categories:\n\n🗳️ Politics & Government\n🏘️ Community & Neighborhoods\n⚕️ Health & Public Safety\n🏠 Real Estate & Housing\n📚 Education\n🌱 Environment\n🚇 Transportation\n💰 Economy & Business\n\nUse the Filters button on the news page to narrow down to what matters to you!",
      'chat'
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

  // Global quick actions (left-most row)
  const globalQuickActions = [
    { icon: CircleQuestionMark, content: 'About this Page', action: handlePageInfo },
    { icon: MapPin, content: 'Show Weather', action: handleShowWeather },
    { icon: Navigation, content: 'Live Subway Status', action: handleShowSubway },
  ];

  return (
    <>
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
            className={`fixed right-6 top-6 bottom-6 ${isExpanded ? 'w-[min(48rem,calc(100%-3rem))]' : 'w-[clamp(20rem,34vw,36rem)]'} ${isExpanded ? '' : ''} min-h-[18rem] flex flex-col bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#404E3B] text-white">
              <div className="flex items-center gap-3">
                <BotMessageSquare size={24} />
                <h2 id="chatbot-title" className="text-xl font-semibold">NaviBot</h2>
              </div>
              <div className="flex items-center">
                <button onClick={() => setIsExpanded(s => !s)} aria-label={isExpanded ? "Collapse chat" : "Expand chat"} className="text-white/80 hover:text-white transition-colors mr-3">
                  {isExpanded ? '⤡' : '⤢'}
                </button>
                <button onClick={() => setIsOpen(false)} aria-label="Close chatbot" className="text-white/80 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Chat Area */}

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4 selection:text-black selection:bg-[#fff9c4]">
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                  <BotMessageSquare size={48} className="opacity-20" />
                  <p className="text-sm font-medium text-gray-600!">{hoverText}</p>
                </div>
              )}
              {messages.map((msg) => {
                const content = msg.content;
                const isSubwayMsg = typeof content === 'object' && content !== null && 'type' in content && content.type === 'subway';
                const normalized = isSubwayMsg ? ((content as SubwayMessage).data as { data?: unknown })?.data ?? (content as SubwayMessage).data : null;
                const subPinnedLocal = isSubwayMsg ? isSubwayPinned(normalized) : false;
                return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  key={msg.id}
                  className={`flex ${msg.from === 'you' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`${isSubwayMsg ? 'w-full' : 'max-w-[80%]'} rounded-2xl px-5 py-3 text-sm ${
                    msg.from === 'you'
                      ? 'bg-[#404E3B] text-white rounded-br-none'
                      : 'bg-white !text-black text-black border border-gray-200 rounded-bl-none shadow-sm'
                  }`}>
                    {(() => {
                      const content = msg.content;
                      if (typeof content === 'object') {
                        const rec = content as Record<string, unknown>;
                        if (rec.type === 'weather') {
                          const data = rec.data as unknown;
                          return <WeatherCard data={data} onPin={() => window.dispatchEvent(new CustomEvent('pin-weather', { detail: data }))} />;
                        }
                      }

                      const contentObj = (typeof content === 'object' && content) ? (content as Record<string, unknown>) : null;
                      const aiResp = contentObj && contentObj['format_version'] === '1.0' ? (contentObj as unknown as NaviHubResponse) : null;
                      if (aiResp) {
                        if (aiResp.error === 'cannot_comply') {
                          return (
                            <div>
                              <div className="font-semibold">Error</div>
                              <div className="text-sm text-black">{aiResp.reason || 'The AI could not comply with the requested format.'}</div>
                            </div>
                          );
                        }
                        return (
                          <div className="space-y-4 text-black !text-black">
                            {aiResp.title && <div className="font-semibold text-xl mb-2 text-black !text-black">{aiResp.title}</div>}
                            {aiResp.summary && <div className="text-base text-black !text-black mb-3 leading-7">{aiResp.summary}</div>}
                            {renderMarkdown(aiResp.body_markdown)}
                            {Array.isArray(aiResp.actions) && aiResp.actions.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-4">
                                {aiResp.actions.map((a, i) => (
                                  <button
                                    key={i}
                                    onClick={() => {
                                      try {
                                        if (a.url) {
                                          window.location.href = a.url;
                                        } else if (a.command) {
                                          window.dispatchEvent(new CustomEvent(a.command));
                                        }
                                      } catch {}
                                    }}
                                    className="bg-[#404E3B] hover:bg-[#7B9669] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                  >
                                    {a.label}
                                  </button>
                                ))}
                              </div>
                            )}
                            {/* Render chat-only widget with runtime compilation */}
                            {aiResp.metadata?.widget?.render_in_chatbot && Array.isArray(aiResp.code_blocks) && aiResp.code_blocks.length > 0 && (
                              <div className="mt-4">
                                <WidgetRenderer
                                  code={aiResp.code_blocks[0].code}
                                  onAction={(cmd, url) => {
                                    try {
                                      if (cmd) window.dispatchEvent(new CustomEvent(cmd));
                                      if (url) window.open(url, '_blank');
                                    } catch (e) {
                                      console.error('Widget action error:', e);
                                    }
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      }

                      if (isSubwayMsg) {
                        return (
                          <div className="w-full flex items-center justify-between gap-3">
                            <div className="text-sm text-black">{(normalized as { summary?: string })?.summary || 'Live subway status available'}</div>
                            <div className="flex gap-2">
                              <button onClick={() => window.dispatchEvent(new CustomEvent('open-subway', { detail: normalized }))} className="bg-[#404E3B] text-white px-3 py-1 rounded text-sm">Open Subway Status</button>
                              <button onClick={() => { if (subPinnedLocal) { unpinSubway(); } else { pinSubway(normalized); } }} className="bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded text-sm">{subPinnedLocal ? 'Unpin' : 'Pin'}</button>
                            </div>
                          </div>
                        );
                      }
                      return (<div className={`whitespace-pre-line ${msg.from === 'you' ? 'text-white' : 'text-black'}`}>{String(content)}</div>);
                    })()}
                  </div>
                </motion.div>
              )})}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#E2E8F0] rounded-2xl rounded-bl-none px-4 py-2">
                    <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="bg-[#7B9669] px-4 pt-3 pb-2 flex flex-col gap-2">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {globalQuickActions.map((g) => (
                  <ChatbotOption key={g.content} icon={g.icon} content={g.content} action={g.action} setHoverText={setHoverText} />
                ))}
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
                  className="p-3 bg-[#404E3B] text-white rounded-full hover:bg-[#7B9669] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#404E3B]"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendHorizontal className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
