"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HighlightsCarousel from "./components/highlights/HighlightsCarousel";
import { getTopResources } from "./lib/getTopResources";
import { Resource } from "./lib/types";
import "./styles/home.css";

function HomeMissionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const imgTLRef = useRef<HTMLDivElement>(null);
  const imgBLRef = useRef<HTMLDivElement>(null);
  const imgTRRef = useRef<HTMLDivElement>(null);
  const imgBRRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    // We already registered ScrollTrigger in Home
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%", // Waits until the user scrolls down to show 30% of the section
          toggleActions: "play none none none", // Only plays once when entering
        },
      });

      // Images float in from opposite sides
      tl.from(imgTLRef.current, { x: -80, y: -40, opacity: 0, duration: 1.2, ease: "power3.out" })
        .from(imgBLRef.current, { x: -80, y: 40, opacity: 0, duration: 1.2, ease: "power3.out" }, "<0.1")
        .from(imgTRRef.current, { x: 80, y: -40, opacity: 0, duration: 1.2, ease: "power3.out" }, "<0.1")
        .from(imgBRRef.current, { x: 80, y: 40, opacity: 0, duration: 1.2, ease: "power3.out" }, "<0.1")
        .from(headingRef.current, { opacity: 0, y: 40, duration: 1, ease: "power3.out" }, "<0.15")
        .from(bodyRef.current, { opacity: 0, y: 24, duration: 0.9, ease: "power2.out" }, "<0.2");
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="mission-section relative w-full overflow-hidden">
      {/* ── Topographic contour SVG background ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none select-none" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">
        {/* Left cluster of contour rings */}
        <g strokeWidth="0.8" className="mission-svg-path-1">
          <path d="M-60,200 C20,120 140,100 200,180 C260,260 240,360 160,400 C80,440 -20,400 -60,340 C-100,280 -80,220 -60,200Z" />
          <path d="M-90,190 C10,95 160,70 230,165 C300,260 275,380 180,425 C85,470 -30,425 -75,355 C-120,285 -100,210 -90,190Z" />
          <path d="M-120,178 C0,68 180,38 260,148 C340,258 310,400 200,452 C90,504 -40,452 -90,370 C-140,288 -125,200 -120,178Z" />
          <path d="M-150,164 C-8,40 200,5 290,130 C380,255 344,418 218,478 C92,538 -52,480 -106,384 C-160,288 -148,190 -150,164Z" />
          <path d="M-180,148 C-18,8 222,-28 322,112 C422,252 378,438 236,504 C94,570 -64,508 -122,398 C-180,288 -172,178 -180,148Z" />
          <path d="M-30,240 C60,170 170,155 220,220 C270,285 252,365 185,398 C118,431 30,398 -8,345 C-46,292 -40,255 -30,240Z" />
          <path d="M10,270 C80,215 175,202 218,255 C261,308 246,375 192,402 C138,429 62,402 28,356 C-6,310 -2,278 10,270Z" />
        </g>
        {/* Center-left lighter rings */}
        <g strokeWidth="0.7" className="mission-svg-path-2">
          <path d="M120,340 C200,280 320,268 380,330 C440,392 420,480 345,515 C270,550 170,518 130,462 C90,406 88,368 120,340Z" />
          <path d="M90,320 C185,248 330,234 400,308 C470,382 446,486 360,525 C274,564 154,530 108,466 C62,402 56,362 90,320Z" />
          <path d="M55,298 C168,212 340,196 422,284 C504,372 476,494 376,538 C276,582 136,544 84,472 C32,400 22,354 55,298Z" />
        </g>
        {/* Right side subtle ring */}
        <g strokeWidth="0.7" className="mission-svg-path-3">
          <path d="M1200,100 C1320,60 1480,80 1520,180 C1560,280 1490,400 1380,430 C1270,460 1160,400 1150,310 C1140,220 1150,120 1200,100Z" />
          <path d="M1175,75 C1315,25 1510,50 1555,165 C1600,280 1520,420 1394,455 C1268,490 1138,422 1124,322 C1110,222 1118,95 1175,75Z" />
          <path d="M1148,48 C1308,-8 1540,20 1590,150 C1640,280 1550,440 1408,480 C1266,520 1116,444 1098,334 C1080,224 1086,70 1148,48Z" />
        </g>
      </svg>
      {/* ── Main layout ── */}
      <div className="relative z-10 min-h-[40vh] py-16 flex flex-col items-center justify-center px-6">
        <div className="relative w-full max-w-6xl flex items-center justify-center min-h-85">
          
          {/* Top Left: Resources */}
          <div ref={imgTLRef} className="mission-img-tl">
            <span className="mb-2 font-heading font-semibold text-lg text-[var(--secondary-text)] tracking-wide relative z-10">Resources</span>
            <div className="w-full aspect-4/5 bg-white/40 rounded-2xl border border-[var(--secondary-text)]/10 flex items-center justify-center shadow-md relative overflow-hidden group">
              <span className="text-[var(--secondary-text)]/40 text-sm text-center px-4">resources-img.jpg</span>
              {/* Optional: <Image src="/resources-img.jpg" alt="Resources" fill className="object-cover opacity-0 group-hover:opacity-100 transition-opacity" /> */}
            </div>
          </div>

          {/* Bottom Left: Events */}
          <div ref={imgBLRef} className="mission-img-bl">
            <span className="mb-2 font-heading font-semibold text-lg text-[var(--secondary-text)] tracking-wide relative z-10">Events</span>
            <div className="w-full aspect-4/5 bg-white/40 rounded-2xl border border-[var(--secondary-text)]/10 flex items-center justify-center shadow-md relative overflow-hidden group">
              <span className="text-[var(--secondary-text)]/40 text-sm text-center px-4">events-img.jpg</span>
              {/* Optional: <Image src="/events-img.jpg" alt="Events" fill className="object-cover opacity-0 group-hover:opacity-100 transition-opacity" /> */}
            </div>
          </div>

          {/* Top Right: NaviLink */}
          <div ref={imgTRRef} className="mission-img-tr">
            <span className="mb-2 font-heading font-semibold text-lg text-[var(--secondary-text)] tracking-wide relative z-10">NaviLink</span>
            <div className="w-full aspect-4/5 bg-white/40 rounded-2xl border border-[var(--secondary-text)]/10 flex items-center justify-center shadow-md relative overflow-hidden group">
              <span className="text-[var(--secondary-text)]/40 text-sm text-center px-4">navilink-img.jpg</span>
              {/* Optional: <Image src="/navilink-img.jpg" alt="NaviLink" fill className="object-cover opacity-0 group-hover:opacity-100 transition-opacity" /> */}
            </div>
          </div>

          {/* Bottom Right: News */}
          <div ref={imgBRRef} className="mission-img-br">
            <span className="mb-2 font-heading font-semibold text-lg text-[var(--secondary-text)] tracking-wide relative z-10">News</span>
            <div className="w-full aspect-4/5 bg-white/40 rounded-2xl border border-[var(--secondary-text)]/10 flex items-center justify-center shadow-md relative overflow-hidden group">
              <span className="text-[var(--secondary-text)]/40 text-sm text-center px-4">news-img.jpg</span>
              {/* Optional: <Image src="/news-img.jpg" alt="News" fill className="object-cover opacity-0 group-hover:opacity-100 transition-opacity" /> */}
            </div>
          </div>

          <h2 ref={headingRef} className="mission-heading relative z-10 text-center font-heading">
            We bring communities <br className="hidden sm:block" />
            <em>closer</em>, focusing on <br className="hidden sm:block" />
            what truly <em>matters</em>.
          </h2>
        </div>
        {/* ── Bottom copy ── */}
        <div ref={bodyRef} className="text-center mt-6 max-w-130 relative z-20">
          <p className="mission-subheading mb-4 font-body">No barriers. No noise.</p>
          <p className="mission-body-text font-body">
            In a world of overwhelming information, we choose clarity. No endless searching. 
            No hidden agendas. Just genuine connections built with care. It&apos;s not about 
            complex systems, it&apos;s about simplifying access, removing what isn&apos;t necessary, 
            and helping the community thrive.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Dotted concentric circles SVG (inside the arch) ─────────────────────────
function ArchDots() {
  const radii = [55, 100, 145, 190, 235, 280, 325, 370, 415];
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 320 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {radii.map((r) => (
        <circle
          key={r}
          cx="160"
          cy="300"
          r={r}
          fill="none"
          stroke="rgba(31, 31, 31, 0.08)"
          strokeWidth="1"
          strokeDasharray="2.5 7"
        />
      ))}
    </svg>
  );
}

// ─── Background concentric rings (right side) ─────────────────────────────────
function BgRings() {
  const rings = [80, 130, 180, 230, 280, 330, 380, 430, 480, 530];
  return (
    <svg
      className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none select-none"
      style={{ width: "42vw", height: "90vh", opacity: 0.28 }}
      viewBox="0 0 600 800"
      fill="none"
      aria-hidden
    >
      {rings.map((r) => (
        <ellipse
          key={r}
          cx="580"
          cy="400"
          rx={r}
          ry={r * 0.75}
          stroke="var(--secondary-text, #1F1F1F)"
          opacity="0.15"
          strokeWidth="0.8"
        />
      ))}
    </svg>
  );
}

// ─── Photo card with optional caption ─────────────────────────────────────────
function PhotoCard({
  src,
  caption,
  className,
  style,
}: {
  src: string;
  caption?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={className} style={style}>
      <div
        className="relative overflow-hidden border border-[var(--secondary-text)]/10 bg-white/40 flex items-center justify-center"
        style={{
          width: "100%",
          paddingBottom: "115%",
          borderRadius: "14px",
        }}
      >
        <span className="absolute inset-0 flex items-center justify-center text-[var(--secondary-text)]/40 text-xs text-center px-4 font-body">{src}</span>
        {/* Placeholder for the image */}
        {/* <Image src={src} alt={alt} fill className="object-cover" sizes="280px" /> */}
      </div>
      {caption && (
        <p
          className="mt-3 text-[var(--secondary-text)]"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "10.5px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            lineHeight: 1.6,
            fontWeight: 500,
            maxWidth: "220px",
          }}
        >
          {caption}
        </p>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
function HomeArchSection() {
  const outerRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const photoLeftRef = useRef<HTMLDivElement>(null);
  const photoRightTopRef = useRef<HTMLDivElement>(null);
  const photoRightBotRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const outer = outerRef.current;
      if (!outer) return;

      ScrollTrigger.create({
        trigger: outer,
        start: "top top",
        end: "bottom bottom",
        pin: stageRef.current,
        pinSpacing: false,
      });

      gsap.fromTo(
        photoLeftRef.current,
        { y: "52vh", opacity: 0 },
        {
          y: "0vh",
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: outer,
            start: "top top",
            end: "38% top",
            scrub: 1.4,
          },
        }
      );

      gsap.to(photoLeftRef.current, {
        y: "-30vh",
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: outer,
          start: "68% top",
          end: "90% top",
          scrub: 1.4,
        },
      });

      gsap.to(photoRightTopRef.current, {
        y: "-38vh",
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: outer,
          start: "28% top",
          end: "58% top",
          scrub: 1.4,
        },
      });

      gsap.fromTo(
        photoRightBotRef.current,
        { y: "55vh", opacity: 0 },
        {
          y: "0vh",
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: outer,
            start: "40% top",
            end: "76% top",
            scrub: 1.4,
          },
        }
      );
    }, outerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={outerRef} style={{ height: "280vh", backgroundColor: "var(--bg)" }}>
      <div ref={stageRef} className="relative overflow-hidden" style={{ height: "100vh", backgroundColor: "var(--bg)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")", opacity: 0.4 }} />
        <BgRings />

        <div className="absolute left-1/2 top-1/2 border border-[#1F1F1F]/10 shadow-sm" style={{ transform: "translate(-50%, -48%)", width: "clamp(260px, 22vw, 320px)", height: "clamp(480px, 88vh, 760px)", borderRadius: "9999px 9999px 9999px 9999px", backgroundColor: "var(--surface)", zIndex: 2, overflow: "hidden" }}>
          <ArchDots />
          <div className="absolute inset-0 flex items-center justify-center px-6" style={{ paddingTop: "10%" }}>
            <h2 className="text-center text-[var(--secondary-text)] leading-[1.1]" style={{ fontFamily: "var(--font-heading)", fontWeight: 400, fontSize: "clamp(22px, 2.6vw, 36px)", color: "var(--secondary-text)" }}>
              When our <em style={{ fontStyle: "italic", fontWeight: 500 }}>community</em> needs something, we don&apos;t <em style={{ fontStyle: "italic", fontWeight: 500 }}>overlook</em> it, we <em style={{ fontStyle: "italic", fontWeight: 500 }}>build</em> it.
            </h2>
          </div>
        </div>

        <div ref={photoLeftRef} className="absolute" style={{ left: "clamp(16px, 8vw, 120px)", bottom: "clamp(60px, 12vh, 130px)", width: "clamp(180px, 17vw, 250px)", zIndex: 3 }}>
          <PhotoCard src="arch-left.jpg" caption="NaviHub exists not to reinvent, but to respect." />
        </div>

        <div ref={photoRightTopRef} className="absolute" style={{ right: "clamp(16px, 8vw, 120px)", top: "clamp(40px, 8vh, 80px)", width: "clamp(180px, 17vw, 250px)", zIndex: 3 }}>
          <PhotoCard src="arch-top-rt.jpg" caption="Connections are not forced. They are fostered." />
        </div>

        <div ref={photoRightBotRef} className="absolute" style={{ right: "clamp(16px, 10vw, 160px)", bottom: "clamp(20px, 4vh, 60px)", width: "clamp(180px, 16vw, 230px)", zIndex: 3 }}>
          <PhotoCard src="arch-bot-rt.jpg" />
        </div>
      </div>
    </section>
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

  const [slideProgress, setSlideProgress] = useState(0);

  useEffect(() => {
    async function fetchResources() {
      const resources = await getTopResources();
      setTopResources(resources);
    }
    fetchResources();
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
      
      <HomeMissionSection />
      <HomeArchSection />

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