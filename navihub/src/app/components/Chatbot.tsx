'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from "../lib/supabaseClient";
import {
  BotMessageSquare,
  Newspaper,
  CircleQuestionMark,
  LucideProps,
  SendHorizontal,
  X,
  Loader2
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

  const handleSendMessage = useCallback(async (messageText: string, openEnded: boolean = true) => {
    if (!messageText.trim() || isLoading) return;

    addMessage(messageText, From.You);
    setInputValue("");
    setIsLoading(true);

    try {
      const modRes = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageText }),
      });
      const modData = await modRes.json();

      if (!modData.safe) {
        addMessage("I'm sorry. Your message included inappropriate language. Please word your question with more appropriate language. Thank you!", From.Chat);
        setIsLoading(false);
        return;
      }

      let toSend = messageText;
      if (openEnded) {
        const [articles, resources, events] = await Promise.all([
          fetchArticles(),
          fetchResources(),
          fetchEvents()
        ]);
        toSend = `You are a helpful community hub assistant for the citizens of New York City. These are the resources on our community hub: ${JSON.stringify(resources)}. These are the news articles: ${JSON.stringify(articles)}. These are the events: ${JSON.stringify(events)}. User's question: ${messageText}. You may use google if needed. Do not hallucinate. Steer conversation to the hub if irrelevant.`;
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
          weeklyNews += article.content + "\\n";
        }
      });

      if (weeklyNews) {
        await handleSendMessage(`Summarize ${weeklyNews}. Include important dates and highlights. Categorize them.`, false);
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
    let text = "Welcome to Navihub! On our homepage, you can see our most popular resources and features.";
    if (url.includes("resources")) text = "This is the resources page, where you can browse, filter, suggest, and locate resources on a map.";
    else if (url.includes("news")) text = "This is the news page, where you can browse and filter through New York City's news.";
    else if (url.includes("events")) text = "This is the events page, where you can see everything that's going on in New York City.";
    else if (url.includes("NaviLink")) text = "This is navihub's forum, where you can talk about anything that matters to you in the community.";
    else if (url.includes("about")) text = "This page tells you about navihub and its goals. It also answers questions asked by many users.";

    addMessage("Tell me about this page.", From.You);
    setTimeout(() => addMessage(text, From.Chat), 500);
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 p-4 rounded-full bg-[#404E3B] text-white shadow-lg hover:bg-[#7B9669] hover:shadow-xl transition-all z-50 focus:outline-none"
            aria-label="Open Chatbot"
          >
            <BotMessageSquare size={32} />
          </motion.button>
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
            <div className="bg-[#7B9669] px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
              <ChatbotOption icon={Newspaper} content="Summarize News" action={handleSummarizeNews} setHoverText={setHoverText} />
              <ChatbotOption icon={CircleQuestionMark} content="About Page" action={handlePageInfo} setHoverText={setHoverText} />
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