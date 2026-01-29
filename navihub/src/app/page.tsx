"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { motion } from "framer-motion";
import HighlightsCarousel from "./components/highlights/HighlightsCarousel";
import { getTopResources } from "./lib/getTopResources";
import { Resource } from "./lib/types";
import "./styles/home.css";

function Stat({
  value,
  suffix = "",
  label,
  start = false,
}: {
  value: number;
  suffix?: string;
  label: string;
  start?: boolean;
}) {
  const [count, setCount] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!start || startedRef.current) return;
    startedRef.current = true;

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
  }, [start, value]);

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
  const heroRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const section1Ref = useRef<HTMLElement | null>(null);
  const [statsStart, setStatsStart] = useState(false);
  // slideProgress ranges 0..1 based on how far the user has scrolled past the hero
  const [slideProgress, setSlideProgress] = useState(0);

  useEffect(() => {
    async function fetchResources() {
      const resources = await getTopResources();
      setTopResources(resources);
    }
    fetchResources();
  }, []);

  // Trigger stats when Section 1 becomes visible in the viewport
  useEffect(() => {
    const el = section1Ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStatsStart(true);
          }
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Update slide progress (0 → 1) while the user scrolls down from the hero
  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return;

    let ticking = false;

    const update = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const height = rect.height || window.innerHeight;
      const bottom = rect.bottom;

      // progress: 0 when hero bottom is at bottom of hero, 1 when it's gone
      let progress = 1 - bottom / height;
      progress = Math.min(Math.max(progress, 0), 1);

      setSlideProgress(progress);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    // Init and attach
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Add a safe global shim for `stacked` in case other scripts reference it (prevents ReferenceError)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.text = "var stacked = false;"; // creates a global var in page scope
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Keep global `stacked` in sync with local slideProgress (so external scripts can read current state)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      (window as unknown as { stacked?: boolean }).stacked = slideProgress > 0;
    } catch {
      // ignore
    }
  }, [slideProgress]);

  const quotes = [
    {
      id: 1,
      text: "“From the moment I landed on this website, it felt like a true home base for the community. Everything is organized in a way that makes sense, from nonprofits to support services to local programs, and I never feel lost while browsing. The layout is clean, the information is clear, and it genuinely feels like the site was built with real people in mind, not just to look nice but to actually help.”",
      name: "Alex Rivera",
      image: "/person1.jpg",
      rating: 5
    },
    {
      id: 2,
      text: "“What stands out most about this community resource hub is how much effort clearly went into making resources easy to find and understand. Whether I am looking for help, trying to learn about organizations in the area, or just exploring what is available nearby, the site makes the process simple and welcoming. It turns what could be overwhelming information into something approachable and useful.”",
      name: "Jordan Lee",
      image: "/person2.jpg",
      rating: 4
    },
    {
      id: 3,
      text: "“This website does an amazing job of connecting people to opportunities and support within the community. The way resources are grouped, explained, and presented shows that the creators deeply understand what residents need. It feels less like a random list of links and more like a guided experience that encourages people to get involved and actually use what is offered.”",
      name: "Emily Chen",
      image: "/person3.jpg",
      rating: 5
    },
    {
      id: 4,
      text: "“What I appreciate most about this site is that it feels reliable and thoughtfully built. The structure, design, and content all work together to highlight events, organizations, and services in a way that feels trustworthy and up to date. It gives the impression of a living hub that grows with the community and truly supports the goal of bringing people together through accessible information.”",
      name: "Michael Torres",
      image: "/person4.jpg",
      rating: 5
    }
  ];

  const [activeQuoteId, setActiveQuoteId] = useState(1);
  const activeQuote = quotes.find(q => q.id === activeQuoteId) || quotes[0];

  // Auto-cycle through quotes every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveQuoteId((prevId) => {
        const nextId = prevId === quotes.length ? 1 : prevId + 1;
        return nextId;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* ================= HERO ================= */}

      <main ref={heroRef} className="relative min-h-screen overflow-hidden bg-black">
        <Image
          src="/hero.jpg"
          alt="Hero"
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0" />

        <div className="relative z-10 flex flex-col justify-center min-h-screen px-8 sm:px-12">
          <h1
            className="text-(--thirdary-text) font-bold leading-[1.05] max-w-3xl text-[clamp(64px,8vw,120px)]"
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
              href="/pages/resources"
              className="group inline-flex items-center gap-4 mt-8 px-7 py-3.5 bg-white text-black rounded-full font-semibold shadow-md hover:shadow-lg transition w-max"
            >
              <span>Browse Community Resources</span>
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-black">
                <ArrowRight className="w-4 h-4 text-white rotate-[-45deg] transition-transform duration-300 group-hover:rotate-0" />
              </span>
            </Link>
          </motion.div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <div className="w-6 h-6 border-b-2 border-r-2 border-white rotate-45 animate-bounce" />
          </div>
        </div>

        <style jsx>{`
          .animate-slideUp {
            animation-delay: ${line1.length * 0.05 +
            line2.length * 0.05 +
            0.3}s;
          }
        `}</style>
      </main>

      {/* ================= CONTENT WRAPPER (will slide/stack over hero) ================= */}
      <div
        ref={contentRef}
        className="relative z-30"
        style={{
          transform: `translateY(-${slideProgress * 100}vh)`,
          transition: "transform 0.05s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          willChange: "transform",
          zIndex: slideProgress > 0 ? 40 : undefined,
          marginBottom: "-100vh",
        }}
      >
        {/* ================= SECTION 1 ================= */}
        <section ref={section1Ref} className="min-h-screen bg-(--bg) flex items-center py-24 relative z-20">
          <div className="max-w-6xl mx-auto px-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <p className="text-lg sm:text-xl md:text-2xl max-w-xl text-(--secondary-text)">
                NaviHub is dedicated to helping residents easily find local support
                and services. We bring together trusted non-profits, community
                programs, and organizations in one place, making it simpler
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
              <Stat value={100} suffix="+" label="Community Resources" start={statsStart} />
              <Stat value={50} suffix="+" label="Local Organizations" start={statsStart} />
              <Stat value={5} label="Boroughs Served" start={statsStart} />
              <Stat value={5000} suffix="+" label="Residents Supported" start={statsStart} />
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
        <div className="mt-0 flex justify-center">
          {topResources.length > 0 ? (
            <HighlightsCarousel resources={topResources} />
          ) : (
            <div className="text-center py-12 text-(--secondary-text)">
              Loading highlights...
            </div>
          )}
        </div>
      </section>


      {/* ================= QUOTES SECTION ================= */}
      <section className="w-full py-24 bg-(--bg) flex flex-col items-center relative">
        {/* Left Marquee */}
        <div className="absolute left-0 top-0 h-full w-32 overflow-hidden hidden lg:flex items-center justify-center">
          <div className="marquee-vertical-stacked flex flex-col gap-12 text-[48px] font-bold uppercase">
            {Array.from({ length: 30 }).map((_, i) => {
              const words = ["New", "York", "City"];
              const phraseIsFilled = i % 2 === 0;
              return (
                <div key={i} className="flex flex-col gap-0 leading-none">
                  {words.map((word, wordIdx) => {
                    const isYork = wordIdx === 1;
                    const shouldFill = isYork ? !phraseIsFilled : phraseIsFilled;
                    return word.split("").map((letter, letterIdx) => (
                      <span key={`${wordIdx}-${letterIdx}`} className={shouldFill ? "filled" : "outlined"}>
                        {letter}
                      </span>
                    ));
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Marquee */}
        <div className="absolute right-0 top-0 h-full w-40 overflow-hidden hidden lg:flex items-center justify-center">
          <div className="marquee-vertical-stacked flex flex-col gap-12 text-[48px] font-bold uppercase">
            {Array.from({ length: 30 }).map((_, i) => {
              const words = ["Building", "Bridges"];
              const phraseIsFilled = i % 2 === 0;
              return (
                <div key={i} className="flex flex-col gap-0 leading-none">
                  {words.map((word, wordIdx) => {
                    const isBridges = wordIdx === 1;
                    const shouldFill = isBridges ? !phraseIsFilled : phraseIsFilled;
                    return word.split("").map((letter, letterIdx) => (
                      <span key={`${wordIdx}-${letterIdx}`} className={shouldFill ? "filled" : "outlined"}>
                        {letter}
                      </span>
                    ));
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-w-4xl w-full text-center px-6 relative z-10">
          {/* Star Rating */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={24}
                className={i < activeQuote.rating ? "fill-[#997e67] text-[#997e67]" : "fill-gray-300 text-gray-300"}
              />
            ))}
          </div>

          {/* Quote Text */}
          <blockquote className="text-[clamp(22px,2.2vw,32px)] italic font-semibold text-(--primary-text)/95 mb-4">
            {activeQuote.text}
          </blockquote>
          <p className="text-lg md:text-xl font-semibold text-(--primary-text)/80 mb-12">
            — {activeQuote.name}
          </p>

          {/* Profile Pictures */}
          <div className="flex items-center justify-center gap-6 h-10">
            {quotes.map((quote) => {
              const isActive = quote.id === activeQuoteId;
              return (
                <button
                  key={quote.id}
                  onClick={() => setActiveQuoteId(quote.id)}
                  className={`rounded-full overflow-hidden border-4 transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "w-20 h-20 border-[#997e67]"
                      : "w-16 h-16 border-gray-300 grayscale hover:grayscale-0"
                  }`}
                >
                  <div className="relative w-full h-full">
                    <img
                      src={quote.image}
                      alt={quote.name}
                      className="w-full h-full object-cover"
                    />
                    {isActive && (
                      <img
                        src={quote.image}
                        alt={quote.name}
                        className="absolute inset-0 w-full h-full object-cover animate-colorReveal"
                        style={{
                          filter: "grayscale(100%)"
                        }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
      </div>
    </>
  );
}