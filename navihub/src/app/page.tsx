"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, BookOpen, Calendar, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
      <div className="h-px w-full bg-[#1F1F1F]/20 mb-4" />
      <div className="text-4xl font-semibold text-[#1F1F1F]">
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-1 text-sm text-[#1F1F1F]/70">
        {label}
      </div>
    </div>
  );
} 

export default function Home() {
  const [topResources, setTopResources] = useState<Resource[]>([]);
  const heroRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Parallax Background
    const heroCtx = gsap.context(() => {
      gsap.to(".hero-video", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      // Feature Images Inner Parallax Setup
      const imageWrappers = gsap.utils.toArray(".image-parallax-wrap");
      imageWrappers.forEach((wrapper: unknown) => {
        const wrapElement = wrapper as HTMLElement;
        const img = wrapElement.querySelector("img");
        if (img) {
          gsap.fromTo(img, 
            { yPercent: -15, scale: 1.15 },
            {
              yPercent: 15,
              ease: "none",
              scrollTrigger: {
                trigger: wrapElement,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            }
          );
        }
      });
    });

    return () => heroCtx.revert();
  }, []);

  const section1Ref = useRef<HTMLDivElement | null>(null);
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
  }, [quotes.length]);

  return (
    <main className="bg-[#FFFFFA] text-[#1F1F1F] font-sans overflow-x-hidden w-full">
      {/* ================= HERO ================= */}
      <section ref={heroRef} className="hero-section relative w-full h-screen overflow-hidden bg-black flex items-center justify-center">
        {/* Background Parallax Layer */}
        <div className="absolute inset-0 z-0 hero-video scale-110 w-full h-full">
          {/* Placeholder Dark overlay with image if no video */}
          <div className="absolute inset-0 bg-black/60 z-10" />
          <Image
            src="/hero.jpg"
            alt="Hero Background"
            fill
            className="object-cover opacity-80"
            priority
          />
        </div>

        {/* Marquees (Framing - Aupale Style) */}
        {/* Left Vertical Marquee */}
        <div className="absolute left-0 top-0 h-full w-24 overflow-hidden z-10 hidden md:flex items-center justify-center mix-blend-overlay opacity-30 select-none">
          <div className="marquee-vertical-stacked flex flex-col gap-12 text-[48px] font-bold uppercase text-white">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-0 leading-none text-white outline-text">
                <span className={i % 2 === 0 ? "fill-white text-white" : "outlined text-transparent"}>NEW</span>
                <span className={i % 2 === 0 ? "outlined text-transparent" : "fill-white text-white"}>YORK</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Vertical Marquee */}
        <div className="absolute right-0 top-0 h-full w-24 overflow-hidden z-10 hidden md:flex items-center justify-center mix-blend-overlay opacity-30 select-none">
          <div className="marquee-vertical-stacked flex flex-col gap-12 text-[48px] font-bold uppercase text-white">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-0 leading-none">
                <span className={i % 2 !== 0 ? "fill-white text-white" : "outlined text-transparent"}>NAVI</span>
                <span className={i % 2 !== 0 ? "outlined text-transparent" : "fill-white text-white"}>HUB</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Horizontal Marquee Boundary */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden z-20 mix-blend-overlay opacity-20 select-none h-16 pointer-events-none">
          <div className="marquee flex gap-12 text-[40px] font-bold uppercase whitespace-nowrap text-white items-center h-full pb-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <span key={i} className="outlined text-transparent">BUILDING BRIDGES NOT WALLS</span>
            ))}
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-30 text-center flex flex-col items-center justify-center px-4 w-full h-full pointer-events-auto">
          <motion.h1
            className="text-white font-bold leading-none tracking-tight uppercase max-w-5xl"
            style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(40px, 8vw, 120px)' }}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            Building Bridges,<br />Not Walls
          </motion.h1>
          <motion.p
            className="text-white/80 mt-6 max-w-lg text-[clamp(14px, 2vw, 20px)] font-light tracking-wide"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            A centralized hub for trusted community resources, programs, and organizations across New York City.
          </motion.p>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10"
          >
            <Link href="/pages/resources" className="group inline-flex border border-white/50 text-white hover:bg-white hover:text-black uppercase tracking-widest text-xs font-semibold px-8 py-4 transition-all duration-500 items-center justify-center">
              Explore The Hub
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ================= MISSION STATEMENT ================= */}
      <section className="py-24 sm:py-40 px-6 flex flex-col items-center justify-center bg-[#FFFFFA] relative z-10 w-full">
        <motion.p
          className="text-[clamp(24px,4vw,48px)] font-light text-center max-w-5xl !text-[#1F1F1F] leading-tight"
          style={{ fontFamily: 'var(--font-heading)' }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          NaviHub is dedicated to helping residents easily find local support and services. We bring together trusted non-profits, community programs, and organizations in one place.
        </motion.p>

        {/* STATS */}
        <div className="mt-20 w-full max-w-6xl" ref={section1Ref}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 text-left">
            <Stat value={100} suffix="+" label="Community Resources" start={statsStart} />
            <Stat value={50} suffix="+" label="Local Organizations" start={statsStart} />
            <Stat value={5} label="Boroughs Served" start={statsStart} />
            <Stat value={5000} suffix="+" label="Residents Supported" start={statsStart} />
          </div>
        </div>
      </section>

      {/* ================= FEATURE SECTIONS (Aupale Alternating Style) ================= */}
      
      {/* 1. Map & Suggesting */}
      <section className="flex flex-col md:flex-row min-h-[70vh] w-full bg-[#1F1F1F] text-white">
        <div className="w-full md:w-1/2 h-[50vh] md:h-auto relative overflow-hidden image-parallax-wrap border-r border-white/10">
           <Image src="/hands.jpg" fill className="object-cover scale-110 opacity-70" alt="Resource Map" />
        </div>
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-24">
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 1, ease: "easeOut" }}
             className="max-w-md w-full"
           >
             <MapPin className="mb-8 w-10 h-10 text-[#997E67]" strokeWidth={1.5} />
             <h2 className="text-[clamp(32px,3.5vw,56px)] leading-[1.1] mb-6 font-bold uppercase tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Interactive Resource Map</h2>
             <p className="text-base md:text-lg text-white/70 mb-10 font-light leading-relaxed">Pinpoint the exact support you need. Find community kitchens, shelters, and educational programs near you through an interactive spatial experience. Know a missing resource? Help build the directory by suggesting it.</p>
             <Link href="/pages/resources" className="inline-block border-b border-white/30 pb-1 hover:text-[#997E67] hover:border-[#997E67] transition-all uppercase tracking-widest text-xs font-semibold">
               View Directory
             </Link>
           </motion.div>
        </div>
      </section>

      {/* 2. Events & Chats */}
      <section className="flex flex-col md:flex-row-reverse min-h-[70vh] w-full bg-[#FFFFFA] !text-[#1F1F1F]">
        <div className="w-full md:w-1/2 h-[50vh] md:h-auto relative overflow-hidden image-parallax-wrap border-l border-black/10">
           <Image src="/hands.jpg" fill className="object-cover scale-110 grayscale" alt="Local Events" />
        </div>
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-24">
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 1, ease: "easeOut" }}
             className="max-w-md w-full"
           >
             <Calendar className="mb-8 w-10 h-10 text-[#997E67]" strokeWidth={1.5} />
             <h2 className="text-[clamp(32px,3.5vw,56px)] leading-[1.1] mb-6 font-bold uppercase tracking-tight !text-[#1F1F1F]" style={{ fontFamily: 'var(--font-heading)' }}>Local Events & Groups</h2>
             <p className="text-base md:text-lg !text-[#1F1F1F]/70 mb-10 font-light leading-relaxed">Stay connected to the heartbeat of your borough. Explore local gatherings, confirm your attendance, and automatically join localized event group chats to converse with other attendees.</p>
             <Link href="/pages/events" className="inline-block border-b border-[#1F1F1F]/30 pb-1 text-[#1F1F1F] hover:text-[#997E67] hover:border-[#997E67] transition-all uppercase tracking-widest text-xs font-semibold">
               Discover Events
             </Link>
           </motion.div>
        </div>
      </section>

      {/* 3. Forums */}
      <section className="flex flex-col md:flex-row min-h-[70vh] w-full bg-[#1F1F1F] text-white">
        <div className="w-full md:w-1/2 h-[50vh] md:h-auto relative overflow-hidden image-parallax-wrap border-r border-white/10">
           <Image src="/hands.jpg" fill className="object-cover scale-110 opacity-70 grayscale" alt="NaviLink Forums" />
        </div>
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-24">
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 1, ease: "easeOut" }}
             className="max-w-md w-full"
           >
             <MessageCircle className="mb-8 w-10 h-10 text-[#997E67]" strokeWidth={1.5} />
             <h2 className="text-[clamp(32px,3.5vw,56px)] leading-[1.1] mb-6 font-bold uppercase tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>NaviLink Forums</h2>
             <p className="text-base md:text-lg text-white/70 mb-10 font-light leading-relaxed">Engage in meaningful conversations regarding community topics, ask questions, and share firsthand experiences with your fellow New Yorkers in an open digital town square.</p>
             <Link href="/pages/NaviLink" className="inline-block border-b border-white/30 pb-1 hover:text-[#997E67] hover:border-[#997E67] transition-all uppercase tracking-widest text-xs font-semibold">
               Join Discussion
             </Link>
           </motion.div>
        </div>
      </section>

      {/* 4. Chatbot Assist & Moderation (Combined block for clean flow) */}
      <section className="flex flex-col md:flex-row-reverse min-h-[70vh] w-full bg-[#FFFFFA] !text-[#1F1F1F]">
        <div className="w-full md:w-1/2 h-[50vh] md:h-auto relative overflow-hidden image-parallax-wrap border-l border-black/10">
           <Image src="/hands.jpg" fill className="object-cover scale-110" alt="Intelligent Assistant" />
        </div>
        <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-24">
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 1, ease: "easeOut" }}
             className="max-w-md w-full"
           >
             <div className="flex gap-4 mb-8">
               <BookOpen className="w-10 h-10 text-[#997E67]" strokeWidth={1.5} />
             </div>
             <h2 className="text-[clamp(32px,3.5vw,56px)] leading-[1.1] mb-6 font-bold uppercase tracking-tight !text-[#1F1F1F]" style={{ fontFamily: 'var(--font-heading)' }}>Intelligent Guidance & Trust</h2>
             <p className="text-base md:text-lg !text-[#1F1F1F]/70 mb-10 font-light leading-relaxed">Not sure where to look? Our integrated intelligent assistant is available 24/7 to guide you towards the most relevant resources based on your queries. To ensure a safe environment, all community-submitted resources and forum engagements are actively moderated.</p>
             <Link href="/pages/references" className="inline-block border-b border-[#1F1F1F]/30 pb-1 text-[#1F1F1F] hover:text-[#997E67] hover:border-[#997E67] transition-all uppercase tracking-widest text-xs font-semibold">
               Learn More
             </Link>
           </motion.div>
        </div>
      </section>

      {/* ================= HIGHLIGHTS CAROUSEL ================= */}
      <section className="w-full bg-[#1F1F1F] py-24 overflow-hidden relative">
        <div className="absolute inset-0 mix-blend-overlay opacity-5 pointer-events-none bg-[url('/noise.png')]"></div>
        <div className="w-full overflow-hidden mb-12">
          <div className="marquee flex gap-12 text-[64px] md:text-[100px] font-bold uppercase whitespace-nowrap text-white/5 selection:bg-transparent">
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i} className={i % 2 === 0 ? "fill-white text-white/20" : "outlined text-transparent"}>
                HIGHLIGHTS
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex justify-center relative z-10">
          {topResources.length > 0 ? (
            <HighlightsCarousel resources={topResources} />
          ) : (
            <div className="text-center py-12 text-white/50 uppercase tracking-widest text-sm">
              Loading highlights...
            </div>
          )}
        </div>
      </section>

      {/* ================= QUOTES ================= */}
      <section className="w-full py-32 bg-[#FFFFFA] flex flex-col items-center justify-center relative">
        <div className="max-w-4xl w-full text-center px-6 relative z-10">
          {/* Quote Text */}
          <motion.blockquote 
            key={activeQuoteId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[clamp(20px,3vw,36px)] font-light text-[#1F1F1F] mb-12 leading-relaxed"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {activeQuote.text}
          </motion.blockquote>
          
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {[...Array(5)].map((_, i) => {
              const isFilled = i < activeQuote.rating;
              const isHalf = i === Math.floor(activeQuote.rating) && activeQuote.rating % 1 !== 0;
              return (
                <div key={i} className="relative w-5 h-5">
                  <Star size={20} className="absolute fill-gray-200 text-gray-200" />
                  {(isFilled || isHalf) && (
                    <div className="absolute top-0 left-0 overflow-hidden" style={{ width: isHalf ? "50%" : "100%" }}>
                      <Star size={20} className="fill-[#997e67] text-[#997e67]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-sm font-semibold uppercase tracking-widest text-[#1F1F1F]/60 mb-12">
            {activeQuote.name}
          </p>

          {/* Profile Pictures */}
          <div className="flex items-center justify-center gap-6 h-12">
            {quotes.map((quote) => {
              const isActive = quote.id === activeQuoteId;
              return (
                <button
                  key={quote.id}
                  onClick={() => setActiveQuoteId(quote.id)}
                  className={`rounded-full overflow-hidden transition-all duration-500 cursor-pointer ${
                    isActive
                      ? "w-16 h-16 border-2 border-[#997e67]"
                      : "w-10 h-10 border border-gray-300 grayscale opacity-50 hover:opacity-100"
                  }`}
                >
                  <Image src={quote.image} alt={quote.name} width={64} height={64} className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}