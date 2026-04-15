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
  CalendarDays,
  BookOpen,
  Users,
} from 'lucide-react';
import type { NewsArticle } from "../lib/types";

enum From {
  You,
  Chat
}

interface Message {
  id: string;
  content: string;
  from: From;
}

interface ChatbotOptionProps {
  icon: React.ElementType<LucideProps>;
  content: string;
  action: () => void;
  setHoverText: (text: string) => void;
}

function Loader() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <Loader2 className="w-5 h-5 text-white" />
    </motion.div>
  );
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [hoverText, setHoverText] = useState("Questions? I can help!");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  const addMessage = (content: string, from: From) => {
    setMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      content: typeof content === "string" ? content : "There was an error. Please try again.",
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
      const { data, error } = await supabase.from("resources").select("*");
      if (error) return [];
      return data;
    } catch {
      return [];
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: true });
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
      if (openEnded) {
        const [articles, resources, events] = await Promise.all([
          fetchArticles(),
          fetchResources(),
          fetchEvents()
        ]);

        const safeStringify = (arr: any, limit: number) => {
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

      const chatRes = await fetch(`/api/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSend)
      });
      const chatData = await chatRes.json();
      addMessage(chatData, From.Chat);
    } catch (error) {
      console.error(error);
      addMessage("Sorry, I encountered an error fulfilling your request.", From.Chat);
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
        addMessage("I'm sorry. Looks like there is no recent news to summarize.", From.Chat);
        setIsLoading(false);
      }
    } catch (e) {
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

    addMessage("Tell me about this page.", From.You);
    setTimeout(() => addMessage(text, From.Chat), 600);
  };

  // ── Page-specific handlers ──

  const handleTopResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const resources = await fetchResources();
      if (!resources || resources.length === 0) {
        addMessage("No resources found right now. Try browsing the full directory!", From.Chat);
        setIsLoading(false);
        return;
      }
      const sorted = [...resources].sort((a: any, b: any) => (b.views || 0) - (a.views || 0));
      const top = sorted.slice(0, 5);
      const list = top.map((r: any) => `• ${r.name} — ${r.category}, ${r.location}`).join('\n');
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
    setIsLoading(true);
    try {
      const events = await fetchEvents();
      const now = new Date();
      const upcoming = (events || [])
        .filter((e: any) => new Date(e.event_date) >= now)
        .slice(0, 4);
      if (upcoming.length === 0) {
        addMessage("No upcoming events found right now. Check back soon!", From.Chat);
        setIsLoading(false);
        return;
      }
      const list = upcoming.map((e: any) => {
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
      { icon: CalendarDays, content: 'Upcoming Events', action: handleUpcomingEvents },
      { icon: CircleQuestionMark, content: 'How to RSVP', action: handleHowToRSVP },
    ];
    if (pathname?.includes('navilink')) return [
      { icon: Users, content: 'NaviLink Guide', action: handleNaviLinkGuide },
    ];
    if (pathname?.includes('news')) return [
      { icon: Newspaper, content: 'News Categories', action: handleNewsCategories },
    ];
    return [];
  })();

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
            className="fixed bottom-6 right-6 w-[90vw] sm:w-[400px] h-[600px] max-h-[80vh] flex flex-col bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#404E3B] text-white">
              <div className="flex items-center gap-3">
                <BotMessageSquare size={24} />
                <h2 id="chatbot-title" className="text-xl font-semibold">NaviBot</h2>
              </div>
              <button onClick={() => setIsOpen(false)} aria-label="Close chatbot" className="text-white/80 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
                  <BotMessageSquare size={48} className="opacity-20" />
                  <p className="text-sm font-medium">{hoverText}</p>
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
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.from === From.You 
                      ? 'bg-[#404E3B] text-white rounded-br-none' 
                      : 'bg-[#E2E8F0] text-gray-800 rounded-bl-none'
                  } whitespace-pre-line`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
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
                <ChatbotOption icon={Newspaper} content="Summarize News" action={handleSummarizeNews} setHoverText={setHoverText} />
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