"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import HighlightsCarousel from "./components/highlights/HighlightsCarousel";
import { getTopResources } from "./lib/getTopResources";

type Resource = {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  views: number;
};
/* ---------------- STAT COMPONENT ---------------- */

function Stat({
  value,
  suffix = "",
  label,
}: {
  value: number;
  suffix?: string;
  label: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let current = 0;
    const duration = 1200;
    const step = 16;
    const increment = value / (duration / step);

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, step);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div>
      <div className="h-px w-full bg-(--primary-text)/20 mb-4" />
      <div className="text-4xl font-semibold text-(--primary-text)">
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-1 text-sm text-(--secondary-text)">
        {label}
      </div>
    </div>
  );
}

/* ---------------- PAGE ---------------- */

export default function Home() {
  const line1 = "Building Bridges,";
  const line2 = "Not Walls";

  const [topResources, setTopResources] = useState<Resource[]>([]);

  useEffect(() => {
    async function fetchResources() {
      const resources = await getTopResources();
      setTopResources(resources);
    }
    fetchResources();
  }, []);

  const quotes = [
    {
      id: 1,
      text: "Having access to reliable community resources in one place makes a real difference for families across the city.",
      name: "Alex Rivera",
      image: "https://images.unsplash.com/photo-1623594675959-02360202d4d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80"
    },
    {
      id: 2,
      text: "NaviHub helped me connect with local programs that truly support my neighborhood.",
      name: "Jordan Lee",
      image: "https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80"
    },
    {
      id: 3,
      text: "Centralizing resources has made it so much easier for our organization to reach those who need help most.",
      name: "Emily Chen",
      image: "https://images.unsplash.com/photo-1655249493799-9cee4fe983bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80"
    },
    {
      id: 4,
      text: "From nonprofits to local support, this hub ensures no resident feels left behind.",
      name: "Michael Torres",
      image: "https://images.unsplash.com/photo-1617386124435-9eb3935b1e11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080&q=80"
    }
  ];

  const [activeQuoteId, setActiveQuoteId] = useState(1);
  const activeQuote = quotes.find(q => q.id === activeQuoteId) || quotes[0];

  return (
    <>
      {/* ================= HERO ================= */}

      <main className="relative min-h-screen overflow-hidden">
        <Image
          src="/hero.jpg"
          alt="Hero"
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-black/10" />

        <div className="relative z-10 flex flex-col justify-center min-h-screen px-8 sm:px-12">
          <h1
            className="text-white font-bold leading-[1.05] max-w-3xl text-[clamp(64px,8vw,120px)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <span className="block overflow-hidden leading-[1.2]">
              {line1.split("").map((char, i) => (
                <span
                  key={i}
                  className="inline-block opacity-0 animate-letter"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </span>

            <span className="block overflow-hidden mt-2">
              {line2.split("").map((char, i) => (
                <span
                  key={i}
                  className="inline-block opacity-0 animate-letter"
                  style={{
                    animationDelay: `${
                      line1.length * 0.05 + i * 0.05
                    }s`,
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-[clamp(18px,2.2vw,28px)] text-white opacity-0 animate-slideUp">
            A centralized hub for trusted community resources, programs, and
            organizations across New York City.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 2 }}
          >
            <Link
              href="/resources"
              className="group inline-flex items-center gap-4 mt-8 px-7 py-3.5 bg-white text-black rounded-full font-semibold shadow-md hover:shadow-lg transition w-max"
            >
              <span>Browse Community Resources</span>
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-black">
                <ArrowRight className="w-4 h-4 text-white rotate-[-45deg] transition-transform duration-300 group-hover:translate-x-1 group-hover:rotate-[-20deg]" />
              </span>
            </Link>
          </motion.div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <div className="w-6 h-6 border-b-2 border-r-2 border-white rotate-45 animate-bounce" />
          </div>
        </div>

        <style jsx>{`
          @keyframes letterReveal {
            0% {
              transform: translateX(-100%);
              opacity: 0;
            }
            100% {
              transform: translateX(0);
              opacity: 1;
            }
          }
          .animate-letter {
            animation: letterReveal 0.5s cubic-bezier(0.77, 0, 0.175, 1)
              forwards;
          }

          @keyframes slideUp {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-slideUp {
            animation: slideUp 1s ease forwards;
            animation-delay: ${line1.length * 0.05 +
            line2.length * 0.05 +
            0.3}s;
          }
        `}</style>
      </main>

      {/* ================= SECTION 1 ================= */}
      <section className="min-h-screen bg-(--bg) flex items-center py-24">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <p className="text-(--primary-text) text-lg sm:text-xl md:text-2xl max-w-xl">
              NaviHub is dedicated to helping residents easily find local support
              and services. We bring together trusted non-profits, community
              programs, and support organizations in one place, making it simpler
              for New Yorkers to get the help they need.
            </p>

            <div className="rounded-2xl overflow-hidden">
              <Image
                src="/hands.jpg"
                alt="Community hands"
                width={1200}
                height={800}
                className="object-cover w-full h-96"
              />
            </div>
          </div>

          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-10">
            <Stat value={100} suffix="+" label="Community Resources" />
            <Stat value={50} suffix="+" label="Local Organizations" />
            <Stat value={5} label="Boroughs Served" />
            <Stat value={5000} suffix="+" label="Residents Supported" />
          </div>
        </div>
      </section>

      {/* ================= SECTION 2 ================= */}
      <section className="relative bg-[#FFFFFA] pt-4 overflow-hidden">
        {/* ===== Marquee (Top) ===== */}
        <div className="w-full overflow-hidden">
          <div className="marquee flex gap-12 text-[64px] font-bold uppercase whitespace-nowrap">
            {Array.from({ length: 30 }).map((_, i) => (
              <span key={i} className={i % 2 === 0 ? "filled" : "outlined"}>
                HIGHLIGHTS
              </span>
            ))}
          </div>
        </div>

        {/* ===== Carousel ===== */}
        <div className="mt-12 flex justify-center">
          {topResources.length > 0 ? (
            <HighlightsCarousel resources={topResources} />
          ) : (
            <div className="text-center py-12 text-(--secondary-text)">
              Loading highlights...
            </div>
          )}
        </div>

        <style jsx>{`
          .marquee {
            animation: scroll-left 30s linear infinite;
          }

          @keyframes scroll-left {
            0% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(-50%);
            }
          }

          .filled {
            color: black;
          }

          .outlined {
            color: transparent;
            -webkit-text-stroke: 1px black;
          }
        `}</style>
      </section>


      {/* ================= QUOTES SECTION ================= */}
      <section className="w-full py-24 bg-(--bg) flex flex-col items-center">
        <div className="max-w-4xl w-full text-center px-6">
          {/* Quote Text */}
          <blockquote className="text-[clamp(22px,2.2vw,32px)] italic font-semibold text-(--primary-text)/95 mb-4">
            "{activeQuote.text}"
          </blockquote>
          <p className="text-lg md:text-xl font-semibold text-(--primary-text)/80 mb-12">
            — {activeQuote.name}
          </p>

          {/* Profile Pictures */}
          <div className="flex items-center justify-center gap-6">
            {quotes.map((quote) => {
              const isActive = quote.id === activeQuoteId;
              return (
                <button
                  key={quote.id}
                  onClick={() => setActiveQuoteId(quote.id)}
                  className={`rounded-full overflow-hidden border-4 transition-all duration-300 ${
                    isActive
                      ? "w-20 h-20 border-blue-500"
                      : "w-16 h-16 border-gray-300 grayscale hover:grayscale-0"
                  }`}
                >
                  <img
                    src={quote.image}
                    alt={quote.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </section>

    </>
  );
}