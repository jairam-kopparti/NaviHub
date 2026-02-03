"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star, BookOpen, Calendar, MessageCircle, Users } from "lucide-react";
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

export default function Home() {
  const line1 = "Building Bridges,";
  const line2 = "Not Walls";

  const [topResources, setTopResources] = useState<Resource[]>([]);
  const heroRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const section1Ref = useRef<HTMLElement | null>(null);
  const [statsStart, setStatsStart] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0);

  useEffect(() => {
    async function fetchResources() {
      const resources = await getTopResources();
      setTopResources(resources);
    }
    fetchResources();
  }, []);

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

  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return;

    let ticking = false;

    const update = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const height = rect.height || window.innerHeight;
      const bottom = rect.bottom;

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

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.text = "var stacked = false;";
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      (window as unknown as { stacked?: boolean }).stacked = slideProgress > 0;
    } catch {
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
      rating: 4.5
    }
  ];

  const [activeQuoteId, setActiveQuoteId] = useState(1);
  const activeQuote = quotes.find(q => q.id === activeQuoteId) || quotes[0];

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
          className="object-cover opacity-65"
          priority
        />
        <div className="absolute inset-0" />

        <div className="relative z-10 flex flex-col justify-center min-h-screen px-4 sm:px-8 md:px-12">
          <h1
            className="text-(--thirdary-text) font-bold leading-[1.05] max-w-3xl text-[clamp(40px,10vw,120px)]"
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

          <p className="mt-4 sm:mt-6 max-w-2xl text-[clamp(14px,3.5vw,28px)] text-white opacity-0 animate-slideUp px-1">
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
              className="group inline-flex items-center gap-3 sm:gap-4 mt-6 sm:mt-8 px-5 sm:px-7 py-3 sm:py-3.5 bg-white text-black rounded-full font-semibold shadow-md hover:shadow-lg transition w-max text-sm sm:text-base"
            >
              <span>Browse Community Resources</span>
              <span className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-black">
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-white rotate-[-45deg] transition-transform duration-300 group-hover:rotate-0" />
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
        <section ref={section1Ref} className="min-h-screen bg-(--bg) flex items-center py-12 sm:py-24 relative z-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl max-w-xl text-(--secondary-text)">
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
                  className="object-cover w-full h-64 sm:h-80 md:h-96"
                />
              </div>
            </div>

            <div className="mt-12 sm:mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10">
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


      {/*  QUOTES SECTION  */}
      <section className="w-full py-12 sm:py-24 bg-(--bg) flex flex-col items-center relative overflow-hidden">
        {/* Left Marquee - Hidden on mobile */}
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

        {/* Right Marquee - Hidden on mobile */}
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

        <div className="max-w-4xl w-full text-center px-4 sm:px-6 relative z-10">
          {/* Star Rating */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-8">
            {[...Array(5)].map((_, i) => {
              const isFilled = i < activeQuote.rating;
              const isHalf = i === Math.floor(activeQuote.rating) && activeQuote.rating % 1 !== 0;
              return (
                <div key={i} className="relative w-6 h-6">
                  <Star
                    size={24}
                    className="absolute fill-gray-300 text-gray-300"
                  />
                  {(isFilled || isHalf) && (
                    <div
                      className="absolute top-0 left-0 overflow-hidden"
                      style={{ width: isHalf ? "50%" : "100%" }}
                    >
                      <Star
                        size={24}
                        className="fill-[#997e67] text-[#997e67]"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quote Text */}
          <blockquote className="text-[clamp(16px,4vw,32px)] italic font-semibold text-(--primary-text)/95 mb-4 leading-relaxed">
            {activeQuote.text}
          </blockquote>
          <p className="text-base sm:text-lg md:text-xl font-semibold text-(--primary-text)/80 mb-8 sm:mb-12">
            — {activeQuote.name}
          </p>

          {/* Profile Pictures */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 h-10">
            {quotes.map((quote) => {
              const isActive = quote.id === activeQuoteId;
              return (
                <button
                  key={quote.id}
                  onClick={() => setActiveQuoteId(quote.id)}
                  className={`rounded-full overflow-hidden border-4 transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "w-14 h-14 sm:w-20 sm:h-20 border-[#997e67]"
                      : "w-10 h-10 sm:w-16 sm:h-16 border-gray-300 grayscale hover:grayscale-0"
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

      {/* EXPLORE PAGES SECTION */}
      <section className="w-full py-16 sm:py-24 bg-[#FFFFFA]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-[clamp(28px,5vw,48px)] font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "#1F1F1F" }}>
              Explore <span className="text-[#997E67]">NaviHub</span>
            </h2>
            <p className="text-base sm:text-lg max-w-2xl mx-auto" style={{ color: "rgba(31, 31, 31, 0.7)" }}>
              Discover all the ways we can help connect you with your community
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Resources Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="group relative bg-(--bg) rounded-2xl p-6 sm:p-8 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#997E67]/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-[#997E67]/15 flex items-center justify-center mb-5">
                  <BookOpen className="w-7 h-7 text-[#997E67]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "#1F1F1F" }}>
                  Community Resources
                </h3>
                <p className="mb-6 text-sm sm:text-base leading-relaxed" style={{ color: "rgba(31, 31, 31, 0.7)" }}>
                  Browse our curated directory of local nonprofits, health services, educational programs, and support organizations across all five boroughs.
                </p>
                <Link
                  href="/pages/resources"
                  className="inline-flex items-center gap-2 text-[#997E67] font-semibold hover:gap-3 transition-all duration-300"
                >
                  <span>Explore Resources</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            {/* Events Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="group relative bg-(--bg) rounded-2xl p-6 sm:p-8 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#997E67]/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-[#997E67]/15 flex items-center justify-center mb-5">
                  <Calendar className="w-7 h-7 text-[#997E67]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "#1F1F1F" }}>
                  Local Events
                </h3>
                <p className="mb-6 text-sm sm:text-base leading-relaxed" style={{ color: "rgba(31, 31, 31, 0.7)" }}>
                  Stay connected with community gatherings, workshops, volunteer opportunities, and social events happening near you.
                </p>
                <Link
                  href="/pages/events"
                  className="inline-flex items-center gap-2 text-[#997E67] font-semibold hover:gap-3 transition-all duration-300"
                >
                  <span>View Events</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            {/* NaviLink Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="group relative bg-(--bg) rounded-2xl p-6 sm:p-8 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#997E67]/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-[#997E67]/15 flex items-center justify-center mb-5">
                  <MessageCircle className="w-7 h-7 text-[#997E67]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "#1F1F1F" }}>
                  NaviLink Forum
                </h3>
                <p className="mb-6 text-sm sm:text-base leading-relaxed" style={{ color: "rgba(31, 31, 31, 0.7)" }}>
                  Join the conversation with fellow New Yorkers. Share experiences, ask questions, and connect with your community.
                </p>
                <Link
                  href="/pages/NaviLink"
                  className="inline-flex items-center gap-2 text-[#997E67] font-semibold hover:gap-3 transition-all duration-300"
                >
                  <span>Join Discussion</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            {/* About Us Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="group relative bg-(--bg) rounded-2xl p-6 sm:p-8 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#997E67]/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-[#997E67]/15 flex items-center justify-center mb-5">
                  <Users className="w-7 h-7 text-[#997E67]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "#1F1F1F" }}>
                  About Us
                </h3>
                <p className="mb-6 text-sm sm:text-base leading-relaxed" style={{ color: "rgba(31, 31, 31, 0.7)" }}>
                  Learn about our mission to bridge communities and create accessible pathways to support for all New Yorkers.
                </p>
                <Link
                  href="/pages/about"
                  className="inline-flex items-center gap-2 text-[#997E67] font-semibold hover:gap-3 transition-all duration-300"
                >
                  <span>Our Story</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================= CTA BANNER SECTION ================= */}
      <section className="w-full py-16 sm:py-20 bg-(--bg)">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-[#1F1F1F] to-[#2d2d2d] rounded-3xl p-8 sm:p-12 overflow-hidden"
          >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#997E67]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#997E67]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 text-center">
              <h2 className="text-[clamp(24px,4vw,40px)] font-bold text-white mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                Ready to Get Connected?
              </h2>
              <p className="text-white/70 mb-8 max-w-2xl mx-auto text-sm sm:text-base">
                Join thousands of New Yorkers who have found the resources and support they need through NaviHub. Start exploring today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/pages/resources"
                  className="group inline-flex items-center gap-3 px-6 py-3.5 bg-white text-[#1F1F1F] rounded-full font-semibold hover:bg-[#997E67] hover:text-white transition-all duration-300"
                >
                  <span>Browse Resources</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/pages/signup"
                  className="inline-flex items-center gap-3 px-6 py-3.5 border-2 border-white/30 text-white rounded-full font-semibold hover:bg-white/10 transition-all duration-300"
                >
                  <span>Create Account</span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      </div>
    </>
  );
}