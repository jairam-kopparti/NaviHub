"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cpu, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

const Chatbot = dynamic(() => import("./Chatbot"), { ssr: false, loading: () => null });

export default function ChatbotLoader() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldOpen, setShouldOpen] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const pathname = usePathname() ?? "";
  const hideChatbot = pathname.startsWith("/pages/signin") || pathname.startsWith("/pages/signup");
  const [showLauncher, setShowLauncher] = useState<boolean>(() => {
    try {
      // Default true; if a session flag exists we'll hide until a full page refresh
      const hidden = sessionStorage.getItem("navihub_chatbot_hidden") === "1";
      return !hidden;
    } catch (e) {
      return true;
    }
  });

  useEffect(() => {
    const handleOpenRequest = () => {
      if (!isLoaded) {
        setIsLoaded(true);
        setShouldOpen(true);
      } else {
        window.dispatchEvent(new Event("open-chatbot"));
      }
    };

    window.addEventListener("open-chatbot", handleOpenRequest);
    return () => window.removeEventListener("open-chatbot", handleOpenRequest);
  }, [isLoaded]);

  useEffect(() => {
    if (isLoaded && shouldOpen) {
      return;
    }
  }, [isLoaded, shouldOpen]);

  useEffect(() => {
    const handleCloseRequest = () => {
      // Only restore the launcher if the user hasn't launched/hidden it in this session.
      try {
        const hidden = sessionStorage.getItem("navihub_chatbot_hidden") === "1";
        if (!hidden) setShowLauncher(true);
      } catch (e) {
        setShowLauncher(true);
      }
      setIsLaunching(false);
    };

    window.addEventListener("close-chatbot", handleCloseRequest);
    return () => window.removeEventListener("close-chatbot", handleCloseRequest);
  }, []);

  useEffect(() => {
    if (!isLaunching) return;

    const timer = window.setTimeout(() => {
      // Keep a persistent flag so the launcher stays hidden until a full page refresh.
      try {
        sessionStorage.setItem("navihub_chatbot_hidden", "1");
      } catch (e) {
        // ignore
      }
      setShowLauncher(false);
      setIsLaunching(false);
      setShouldOpen(false);
      window.dispatchEvent(new Event("open-chatbot"));
    }, 680);

    return () => window.clearTimeout(timer);
  }, [isLaunching]);

  const handleLaunch = () => {
    try {
      // mark as hidden immediately so page navigation won't bring it back
      sessionStorage.setItem("navihub_chatbot_hidden", "1");
    } catch (e) {
      // ignore
    }
    if (!isLoaded) {
      setIsLoaded(true);
      setIsLaunching(true);
      return;
    }

    setIsLaunching(true);
  };

  // Clear the hidden flag if this load is the result of a full page refresh
  useEffect(() => {
    try {
      const entries = performance.getEntriesByType("navigation");
      const navType = (entries && entries[0] && (entries[0] as PerformanceNavigationTiming).type) ||
        // fallback for older browsers
        (performance as any).navigation?.type === 1 ? "reload" : undefined;

      if (navType === "reload") {
        sessionStorage.removeItem("navihub_chatbot_hidden");
        setShowLauncher(true);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  if (hideChatbot) return null;

  return (
    <>
      <AnimatePresence>
        {showLauncher && (
          <motion.div
            key="chatbot-launcher-button"
            initial={{ opacity: 0, scale: 0.85, y: 18 }}
            animate={isLaunching ? { opacity: 0, scale: 0.98, y: 18 } : { opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 24 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed right-6 bottom-6 z-50 flex flex-col items-end gap-3"
          >
            <button
              onClick={handleLaunch}
              className="relative flex min-w-[17rem] items-center gap-3 overflow-hidden rounded-full bg-[#404E3B] text-white shadow-lg hover:bg-[#7B9669] hover:shadow-xl transition-all focus:outline-none border border-white/10 px-4 py-3"
              aria-label="Ask NaviBot"
            >
              <motion.span
                className="pointer-events-none absolute left-2 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-2xl bg-white/10 text-[#F5F1E8]"
                animate={isLaunching ? { x: [0, 38, 108, 180, 236], rotate: [0, 140, 280, 420, 720] } : { x: 0, rotate: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <Cpu className="h-5 w-5" />
              </motion.span>

              {/* left-to-right wipe overlay: grows to cover the button while the icon rolls */}
              <motion.div
                className="pointer-events-none absolute left-0 top-0 h-full rounded-full bg-white z-[15]"
                initial={{ width: "0%" }}
                animate={isLaunching ? { width: "100%", opacity: 1 } : { width: "0%", opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />

              <motion.div
                className="relative z-10 flex flex-col text-left leading-tight pl-10"
                animate={isLaunching ? { opacity: [1, 0.8, 0.45, 0], x: [-2, -6, -10, -14] } : { opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <span className="text-[11px] uppercase tracking-[0.3em] text-[#CCBEB1]">AI & UTILITIES</span>
                <span className="text-sm font-semibold">Ask NaviBot</span>
              </motion.div>
              <motion.span
                className="relative z-10 ml-auto text-[#CCBEB1]"
                animate={isLaunching ? { opacity: [1, 0.7, 0.35, 0], x: [0, 2, 5, 8] } : { opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <Sparkles className="h-4 w-4" />
              </motion.span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {isLoaded ? <Chatbot /> : null}
    </>
  );
}
