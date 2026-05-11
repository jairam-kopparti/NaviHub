"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Cpu, Sparkles } from "lucide-react";

const Chatbot = dynamic(() => import("./Chatbot"), { ssr: false, loading: () => null });

export default function ChatbotLoader() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldOpen, setShouldOpen] = useState(false);

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
      setShouldOpen(false);
      window.dispatchEvent(new Event("open-chatbot"));
    }
  }, [isLoaded, shouldOpen]);

  return (
    <>
      <div className="fixed right-6 bottom-6 z-50 flex flex-col items-end gap-3">
        <button
          onClick={() => {
            if (!isLoaded) {
              setIsLoaded(true);
              setShouldOpen(true);
            } else {
              window.dispatchEvent(new Event("open-chatbot"));
            }
          }}
          className="flex items-center gap-3 rounded-full bg-[#404E3B] text-white shadow-lg hover:bg-[#7B9669] hover:shadow-xl transition-all focus:outline-none border border-white/10 px-4 py-3"
          aria-label="Ask NaviBot"
        >
          <span className="grid place-items-center h-10 w-10 rounded-2xl bg-white/10 text-[#F5F1E8]">
            <Cpu className="h-5 w-5" />
          </span>
          <div className="flex flex-col text-left leading-tight">
            <span className="text-[11px] uppercase tracking-[0.3em] text-[#CCBEB1]">AI & UTILITIES</span>
            <span className="text-sm font-semibold">Ask NaviBot</span>
          </div>
          <Sparkles className="h-4 w-4 text-[#CCBEB1]" />
        </button>
      </div>
      {isLoaded ? <Chatbot /> : null}
    </>
  );
}
