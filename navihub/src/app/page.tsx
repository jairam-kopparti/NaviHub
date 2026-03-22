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

// ─── Aupale-inspired Mission Section ─────────────────────────────────────────
function HomeMissionSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const subsections = gsap.utils.toArray<HTMLElement>(".ms-sub");

      subsections.forEach((sub) => {
        // ── Line-by-line text reveals (Aupale's signature) ──
        sub.querySelectorAll<HTMLElement>(".ms-line-inner").forEach((inner, i) => {
          gsap.from(inner, {
            yPercent: 120,
            duration: 1.4,
            ease: "expo.out",
            delay: i * 0.1,
            scrollTrigger: {
              trigger: sub,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        });

        // ── Tag / label fade ──
        sub.querySelectorAll(".ms-tag").forEach((tag) => {
          gsap.from(tag, {
            opacity: 0,
            y: 15,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sub,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        });

        // ── Body text fade up ──
        sub.querySelectorAll(".ms-body").forEach((body) => {
          gsap.from(body, {
            y: 35,
            opacity: 0,
            duration: 1.4,
            ease: "power3.out",
            delay: 0.35,
            scrollTrigger: {
              trigger: sub,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        });

        // ── Rule scales from left ──
        sub.querySelectorAll(".ms-rule").forEach((rule) => {
          gsap.from(rule, {
            scaleX: 0,
            duration: 1.6,
            ease: "expo.out",
            transformOrigin: "left center",
            scrollTrigger: {
              trigger: sub,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          });
        });

        // ── Image: slide in from side + inner parallax ──
        sub.querySelectorAll<HTMLElement>(".ms-img-outer").forEach((outer) => {
          const fromLeft = outer.dataset.from === "left";
          gsap.from(outer, {
            x: fromLeft ? -50 : 50,
            y: 30,
            opacity: 0,
            duration: 1.8,
            ease: "expo.out",
            scrollTrigger: {
              trigger: sub,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          });

          const inner = outer.querySelector<HTMLElement>(".ms-img-inner");
          if (inner) {
            gsap.fromTo(
              inner,
              { yPercent: 8, scale: 1.12 },
              {
                yPercent: -8,
                scale: 1.12,
                ease: "none",
                scrollTrigger: {
                  trigger: outer,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: 1.6,
                },
              }
            );
          }
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden">

      {/* ════════════════════════════
          SUB 1 — bg: #FFDBBB (peach)
          Text Left · Image Right
          ════════════════════════════ */}
      <div className="ms-sub relative bg-[#FFDBBB]">
        {/* Subtle contour lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
          viewBox="0 0 1440 800"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          aria-hidden="true"
        >
          <g strokeWidth="0.8" stroke="rgba(31,31,31,0.07)">
            <path d="M-60,200 C20,120 140,100 200,180 C260,260 240,360 160,400 C80,440 -20,400 -60,340Z" />
            <path d="M-120,178 C0,68 180,38 260,148 C340,258 310,400 200,452 C90,504 -40,452 -90,370Z" />
            <path d="M1200,100 C1320,60 1480,80 1520,180 C1560,280 1490,400 1380,430 C1270,460 1150,310Z" />
          </g>
        </svg>

        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-20 pt-28 pb-20 lg:pt-40 lg:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1px_1fr] gap-0 items-start">

            {/* Left: Text */}
            <div className="lg:pr-16 xl:pr-24 flex flex-col gap-5 lg:pt-10">
              <span className="ms-tag block text-[10px] uppercase tracking-[0.32em] !text-[#1F1F1F]/50 font-medium mb-2">
                Our Philosophy
              </span>

              <h2 className="ms-heading !text-[#1F1F1F] font-heading">
                <span className="ms-line-wrap"><span className="ms-line-inner">We bring communities</span></span>
                <span className="ms-line-wrap"><span className="ms-line-inner"><em>closer,</em> focusing on</span></span>
                <span className="ms-line-wrap"><span className="ms-line-inner">what truly <em>matters.</em></span></span>
              </h2>

              <div className="ms-rule h-px w-10 bg-[#1F1F1F]/20 my-3" />

              <p className="ms-body text-[11px] leading-[1.9] !text-[#1F1F1F]/60 uppercase tracking-[0.14em] max-w-xs">
                No additives. No artifice. In a world of shortcuts, we choose restraint.
                Fewer, better elements handled with care.
              </p>

              {/* Counter row */}
              <div className="ms-body flex gap-10 mt-6 pt-6 border-t border-[#1F1F1F]/10">
                {[["9+", "Categories"], ["90+", "Resources"], ["5", "Boroughs"]].map(([num, label]) => (
                  <div key={label}>
                    <p className="text-2xl font-heading font-semibold !text-[#1F1F1F]">{num}</p>
                    <p className="text-[9px] uppercase tracking-[0.2em] !text-[#1F1F1F]/45 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vertical divider */}
            <div className="hidden lg:block w-px bg-[#1F1F1F]/10 self-stretch mx-4" />

            {/* Right: Image */}
            <div className="ms-img-outer lg:pl-16 xl:pl-24 mt-14 lg:mt-0" data-from="right">
              <div className="ms-img-inner relative overflow-hidden rounded-xl" style={{ aspectRatio: "3/4" }}>
                <Image
                  src="/home-mission-resources.jpg"
                  alt="Community Resources"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <p className="mt-4 text-[9px] uppercase tracking-[0.28em] !text-[#1F1F1F]/40">
                Community Resources Hub
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════
          SUB 2 — bg: #FFFFFA (cream)
          Image Left · Text Right
          ════════════════════════════ */}
      <div className="ms-sub relative bg-[#FFFFFA] border-t border-[#1F1F1F]/6">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-20 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-28 items-center">

            {/* Left: Image */}
            <div className="ms-img-outer order-2 lg:order-1" data-from="left">
              <div className="ms-img-inner relative overflow-hidden rounded-xl" style={{ aspectRatio: "4/3" }}>
                <Image
                  src="/home-mission-events.jpg"
                  alt="Community Events"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <p className="mt-4 text-[9px] uppercase tracking-[0.28em] !text-black/40">
                Local Events &amp; Programs
              </p>
            </div>

            {/* Right: Text */}
            <div className="flex flex-col gap-5 order-1 lg:order-2">
              <span className="ms-tag block text-[10px] uppercase tracking-[0.32em] !text-black/45 font-medium mb-2">
                What We Do
              </span>

              <h2 className="ms-heading !text-black font-heading">
                <span className="ms-line-wrap"><span className="ms-line-inner">When our community</span></span>
                <span className="ms-line-wrap"><span className="ms-line-inner">needs something,</span></span>
                <span className="ms-line-wrap"><span className="ms-line-inner">we don&apos;t overlook it,</span></span>
                <span className="ms-line-wrap"><span className="ms-line-inner">we <em>build</em> it.</span></span>
              </h2>

              <div className="ms-rule h-px w-10 bg-black/20 my-3" />

              <p className="ms-body text-[11px] leading-[1.9] !text-black/55 uppercase tracking-[0.14em] max-w-xs">
                It&apos;s not about complex systems. It&apos;s about simplifying access,
                removing what isn&apos;t necessary, and letting the community thrive.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════
          SUB 3 — bg: #FFDBBB (peach)
          Two images · Closing text
          ════════════════════════════ */}
      <div className="ms-sub relative bg-[#FFDBBB] border-t border-[#1F1F1F]/6">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-20 py-20 lg:py-32">

          {/* Two-image editorial row */}
          <div className="grid grid-cols-2 lg:grid-cols-[5fr_3fr_5fr] gap-6 lg:gap-10 items-end mb-20 lg:mb-28">

            {/* Image A */}
            <div className="ms-img-outer" data-from="left">
              <div className="ms-img-inner relative overflow-hidden rounded-xl" style={{ aspectRatio: "2/3" }}>
                <Image
                  src="/home-mission-navilink.jpg"
                  alt="NaviLink Community Forum"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 30vw"
                />
              </div>
            </div>

            {/* Center label — desktop only */}
            <div className="hidden lg:flex flex-col items-center justify-end pb-6 gap-3">
              <div className="ms-rule h-px w-full bg-[#1F1F1F]/12" />
              <p className="text-center text-[8px] uppercase tracking-[0.3em] !text-[#1F1F1F]/35 leading-loose">
                NaviHub<br />New York City<br />Est. 2025
              </p>
            </div>

            {/* Image B — offset lower */}
            <div className="ms-img-outer mt-8 lg:mt-0" data-from="right">
              <div className="ms-img-inner relative overflow-hidden rounded-xl" style={{ aspectRatio: "2/3" }}>
                <Image
                  src="/home-mission-news.jpg"
                  alt="NYC News"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 30vw"
                />
              </div>
            </div>
          </div>

          {/* Closing statement */}
          <div className="flex flex-col items-center text-center gap-6">
            <div className="ms-rule w-10 h-px bg-[#1F1F1F]/20" />
            <p className="ms-body text-[11px] leading-[1.9] !text-[#1F1F1F]/60 uppercase tracking-[0.14em] max-w-xl">
              In a world of overwhelming information, we choose clarity. No endless searching.
              No hidden agendas. Just genuine connections built with care.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Dotted concentric circles (arch interior) ────────────────────────────────
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
          stroke="rgba(31,31,31,0.07)"
          strokeWidth="1"
          strokeDasharray="2.5 8"
        />
      ))}
    </svg>
  );
}

// ─── Background rings (right side of arch section) ───────────────────────────
function BgRings() {
  const rings = [80, 130, 180, 230, 280, 330, 380, 430, 480, 530];
  return (
    <svg
      className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none select-none"
      style={{ width: "42vw", height: "90vh", opacity: 0.2 }}
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
          stroke="#1F1F1F"
          opacity="0.15"
          strokeWidth="0.8"
        />
      ))}
    </svg>
  );
}

// ─── Arch Section — bg: #FFFFFA (cream), arch pill: #FFDBBB ──────────────────
function HomeArchSection() {
  const outerRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const archTextRef = useRef<HTMLDivElement>(null);
  const photoLeftRef = useRef<HTMLDivElement>(null);
  const photoRightTopRef = useRef<HTMLDivElement>(null);
  const photoRightBotRef = useRef<HTMLDivElement>(null);
  const photoLeftBotRef = useRef<HTMLDivElement>(null);

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

      // Arch text line reveals
      if (archTextRef.current) {
        const lines = archTextRef.current.querySelectorAll(".arch-line-inner");
        gsap.from(lines, {
          yPercent: 120,
          rotate: 2,
          stagger: 0.1,
          duration: 1.4,
          opacity: 0,
          ease: "expo.out",
          scrollTrigger: {
            trigger: outer,
            start: "top top",
            end: "8% top",
            toggleActions: "play none none none",
          },
        });
      }

      // Photo LEFT — enters from bottom with CCW rotation that normalises
      gsap.fromTo(
        photoLeftRef.current,
        { y: "65vh", opacity: 0, rotate: -8, scale: 0.95 },
        {
          y: "0vh", opacity: 1, rotate: 0, scale: 1, ease: "power3.out",
          scrollTrigger: { trigger: outer, start: "3% top", end: "30% top", scrub: 1.8 },
        }
      );
      gsap.to(photoLeftRef.current, {
        y: "-30vh", opacity: 0, rotate: 5, scale: 0.95, ease: "power3.in",
        scrollTrigger: { trigger: outer, start: "65% top", end: "85% top", scrub: 1.8 },
      });

      // Photo RIGHT TOP — enters from upper-right
      gsap.fromTo(
        photoRightTopRef.current,
        { y: "-40vh", x: "12vw", opacity: 0, rotate: 10, scale: 0.95 },
        {
          y: "0vh", x: "0vw", opacity: 1, rotate: 0, scale: 1, ease: "power3.out",
          scrollTrigger: { trigger: outer, start: "6% top", end: "35% top", scrub: 1.8 },
        }
      );
      gsap.to(photoRightTopRef.current, {
        y: "-45vh", opacity: 0, scale: 0.95, ease: "power3.in",
        scrollTrigger: { trigger: outer, start: "32% top", end: "60% top", scrub: 1.8 },
      });

      // Photo LEFT BOTTOM
      gsap.fromTo(
        photoLeftBotRef.current,
        { y: "55vh", opacity: 0, rotate: 6, scale: 0.95 },
        {
          y: "0vh", opacity: 1, rotate: 0, scale: 1, ease: "power3.out",
          scrollTrigger: { trigger: outer, start: "35% top", end: "60% top", scrub: 1.8 },
        }
      );
      gsap.to(photoLeftBotRef.current, {
        y: "-35vh", opacity: 0, rotate: -4, scale: 0.95, ease: "power3.in",
        scrollTrigger: { trigger: outer, start: "72% top", end: "92% top", scrub: 1.8 },
      });

      // Photo RIGHT BOTTOM
      gsap.fromTo(
        photoRightBotRef.current,
        { y: "60vh", x: "8vw", opacity: 0, rotate: -8, scale: 0.95 },
        {
          y: "0vh", x: "0vw", opacity: 1, rotate: 0, scale: 1, ease: "power3.out",
          scrollTrigger: { trigger: outer, start: "48% top", end: "75% top", scrub: 1.8 },
        }
      );
      gsap.to(photoRightBotRef.current, {
        y: "-28vh", opacity: 0, scale: 0.95, ease: "power3.in",
        scrollTrigger: { trigger: outer, start: "82% top", end: "96% top", scrub: 1 },
      });
    }, outerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={outerRef} style={{ height: "280vh", backgroundColor: "#FFFFFA" }}>
      <div
        ref={stageRef}
        className="relative overflow-hidden"
        style={{ height: "100vh", backgroundColor: "#FFFFFA" }}
      >
        {/* Noise texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
          }}
        />
        <BgRings />

        {/* ── Central arch pill — filled with peach (#FFDBBB) ── */}
        <div
          className="absolute left-1/2 top-1/2 border border-[#1F1F1F]/8 shadow-sm"
          style={{
            transform: "translate(-50%, -48%)",
            width: "clamp(240px, 21vw, 300px)",
            height: "clamp(460px, 86vh, 740px)",
            borderRadius: "9999px",
            backgroundColor: "#FFDBBB",
            zIndex: 2,
            overflow: "hidden",
          }}
        >
          <ArchDots />
          <div
            ref={archTextRef}
            className="absolute inset-0 flex items-center justify-center px-7"
            style={{ paddingTop: "8%" }}
          >
            <h2
              className="text-center leading-[1.12] !text-[#1F1F1F]"
              style={{ fontFamily: "var(--font-heading)", fontWeight: 400, fontSize: "clamp(18px, 2.2vw, 30px)" }}
            >
              {[
                "When our",
                <><em key="c" style={{ fontStyle: "italic", fontWeight: 500 }}>community</em></>,
                "needs something,",
                "we don\u2019t",
                <><em key="o" style={{ fontStyle: "italic", fontWeight: 500 }}>overlook</em> it,</>,
                <>we <em key="b" style={{ fontStyle: "italic", fontWeight: 500 }}>build</em> it.</>,
              ].map((line, i) => (
                <span key={i} className="arch-line-wrap block overflow-hidden">
                  <span className="arch-line-inner block">{line}</span>
                </span>
              ))}
            </h2>
          </div>
        </div>

        {/* Photo: Left center */}
        <div
          ref={photoLeftRef}
          className="arch-photo"
          style={{ left: "clamp(12px, 6vw, 100px)", bottom: "clamp(70px, 14vh, 150px)", width: "clamp(160px, 15vw, 220px)", zIndex: 3 }}
        >
          <div className="arch-photo-inner overflow-hidden rounded-xl" style={{ aspectRatio: "3/4" }}>
            <div className="relative w-full h-full">
              <Image src="/home-arch-about.jpg" alt="NaviHub community" fill className="object-cover" sizes="220px" />
            </div>
          </div>
          <p className="arch-photo-caption !text-[#1F1F1F]/40">
            NaviHub exists not to reinvent, but to respect.
          </p>
        </div>

        {/* Photo: Right top */}
        <div
          ref={photoRightTopRef}
          className="arch-photo"
          style={{ right: "clamp(12px, 6vw, 100px)", top: "clamp(30px, 6vh, 70px)", width: "clamp(150px, 14vw, 210px)", zIndex: 3 }}
        >
          <div className="arch-photo-inner overflow-hidden rounded-xl" style={{ aspectRatio: "3/4" }}>
            <div className="relative w-full h-full">
              <Image src="/home-arch-resources.jpg" alt="Community resources" fill className="object-cover" sizes="210px" />
            </div>
          </div>
          <p className="arch-photo-caption !text-[#1F1F1F]/40">
            Connections are not forced. They are fostered.
          </p>
        </div>

        {/* Photo: Left top (second entrance) */}
        <div
          ref={photoLeftBotRef}
          className="arch-photo"
          style={{ left: "clamp(12px, 9vw, 140px)", top: "clamp(30px, 6vh, 60px)", width: "clamp(120px, 11vw, 170px)", zIndex: 3 }}
        >
          <div className="arch-photo-inner overflow-hidden rounded-xl" style={{ aspectRatio: "4/5" }}>
            <div className="relative w-full h-full">
              <Image src="/home-arch-events.jpg" alt="Community events" fill className="object-cover" sizes="170px" />
            </div>
          </div>
        </div>

        {/* Photo: Right bottom */}
        <div
          ref={photoRightBotRef}
          className="arch-photo"
          style={{ right: "clamp(12px, 9vw, 150px)", bottom: "clamp(20px, 4vh, 55px)", width: "clamp(140px, 13vw, 200px)", zIndex: 3 }}
        >
          <div className="arch-photo-inner overflow-hidden rounded-xl" style={{ aspectRatio: "4/5" }}>
            <div className="relative w-full h-full">
              <Image src="/home-arch-navilink.jpg" alt="NaviLink forum" fill className="object-cover" sizes="200px" />
            </div>
          </div>
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
    const heroCtx = gsap.context(() => {
      gsap.to(".hero-video", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom top", scrub: true },
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
      let progress = 1 - rect.bottom / height;
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
    if (typeof window === "undefined") return;
    try {
      (window as unknown as { stacked?: boolean }).stacked = slideProgress > 0;
    } catch {}
  }, [slideProgress]);

  const quotes = [
    {
      id: 1,
      text: "“This site feels like a true home base. Everything is clear, organized, and built with real people in mind.”",
      name: "Alex Rivera",
      image: "/person1.jpg",
      rating: 5,
    },
    {
      id: 2,
      text: "“Finding resources has never been simpler. It turns overwhelming information into something approachable and straightforward.”",
      name: "Jordan Lee",
      image: "/person2.jpg",
      rating: 4,
    },
    {
      id: 3,
      text: "“More than just a list of links, it’s a guided experience that genuinely connects you to support and opportunities.”",
      name: "Emily Chen",
      image: "/person3.jpg",
      rating: 5,
    },
    {
      id: 4,
      text: "“A deeply reliable platform. It highlights community events and services in a way that feels trustworthy and very accessible.”",
      name: "Michael Torres",
      image: "/person4.jpg",
      rating: 4.5,
    },
  ];

  const [activeQuoteId, setActiveQuoteId] = useState(1);
  const activeQuote = quotes.find((q) => q.id === activeQuoteId) || quotes[0];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveQuoteId((prevId) => (prevId === quotes.length ? 1 : prevId + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  return (
    <main className="font-sans overflow-x-hidden w-full">

      {/* ═══════════ HERO — black bg, white text ═══════════ */}
      <section
        ref={heroRef}
        className="hero-section relative w-full h-screen overflow-hidden bg-black flex items-center justify-center"
      >
        <div className="absolute inset-0 z-0 hero-video scale-110 w-full h-full">
          <div className="absolute inset-0 bg-black/60 z-10" />
          <Image src="/home-hero-bg.jpg" alt="Hero Background" fill className="object-cover opacity-80" priority />
        </div>
        <div className="relative z-30 text-center flex flex-col items-center justify-center px-4 w-full h-full pointer-events-auto">
          <h1
            className="!text-white font-bold leading-none tracking-tight uppercase max-w-5xl"
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(40px, 8vw, 120px)", perspective: "1000px" }}
          >
            <motion.span
              className="block"
              initial={{ y: 80, opacity: 0, rotateX: 15, filter: "blur(12px)" }}
              animate={{ y: 0, opacity: 1, rotateX: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0 }}
            >
              Building Bridges,
            </motion.span>
            <motion.span
              className="block"
              initial={{ y: 80, opacity: 0, rotateX: 15, filter: "blur(12px)" }}
              animate={{ y: 0, opacity: 1, rotateX: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            >
              Not Walls
            </motion.span>
          </h1>
          <motion.p
            className="!text-white/80 mt-6 max-w-lg text-[clamp(14px,2vw,20px)] font-light tracking-wide"
            initial={{ y: 30, opacity: 0, filter: "blur(8px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.2, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            A centralized hub for trusted community resources, programs, and organizations across New York City.
          </motion.p>
          <motion.div
            initial={{ y: 30, opacity: 0, filter: "blur(8px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10"
          >
            <Link
              href="/pages/resources"
              className="group inline-flex border border-white/50 !text-white hover:bg-white hover:!text-black uppercase tracking-widest text-xs font-semibold px-8 py-4 transition-all duration-500 items-center justify-center"
            >
              Explore The Hub
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Mission: sub1=#FFDBBB · sub2=#FFFFFA · sub3=#FFDBBB */}
      <HomeMissionSection />

      {/* Arch: bg=#FFFFFA, arch pill=#FFDBBB */}
      <HomeArchSection />

      {/* ═══════════ HIGHLIGHTS — dark bg, white text ═══════════ */}
      <section className="w-full bg-[#1F1F1F] py-24 overflow-hidden relative">
        <div className="absolute inset-0 mix-blend-overlay opacity-5 pointer-events-none bg-[url('/noise.png')]" />
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
            <div className="text-center py-12 !text-white/50 uppercase tracking-widest text-sm">
              Loading highlights...
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ QUOTES — bg: #FFDBBB (peach), dark text ═══════════ */}
      <section className="w-full py-32 bg-[#FFDBBB] flex flex-col items-center justify-center relative">
        <div className="max-w-4xl w-full text-center px-6 relative z-10">
          <motion.blockquote
            key={activeQuoteId}
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(20px,3vw,36px)] font-light !text-[#1F1F1F] mb-12 leading-relaxed"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {activeQuote.text}
          </motion.blockquote>

          <div className="flex items-center justify-center gap-1.5 mb-4">
            {[...Array(5)].map((_, i) => {
              const isFilled = i < activeQuote.rating;
              const isHalf = i === Math.floor(activeQuote.rating) && activeQuote.rating % 1 !== 0;
              return (
                <div key={i} className="relative w-5 h-5">
                  <Star size={20} className="absolute fill-[#1F1F1F]/15 text-[#1F1F1F]/15" />
                  {(isFilled || isHalf) && (
                    <div className="absolute top-0 left-0 overflow-hidden" style={{ width: isHalf ? "50%" : "100%" }}>
                      <Star size={20} className="fill-[#997e67] text-[#997e67]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-sm font-semibold uppercase tracking-widest !text-[#1F1F1F]/55 mb-12">
            {activeQuote.name}
          </p>

          <div className="flex items-center justify-center gap-6 h-12">
            {quotes.map((quote) => {
              const isActive = quote.id === activeQuoteId;
              return (
                <button
                  key={quote.id}
                  onClick={() => setActiveQuoteId(quote.id)}
                  className={`rounded-full overflow-hidden transition-all duration-500 cursor-pointer ${
                    isActive
                      ? "w-20 h-20 border-2 border-[#997e67]"
                      : "w-14 h-14 border border-[#1F1F1F]/20 grayscale opacity-50 hover:opacity-100"
                  }`}
                >
                  <Image src={quote.image} alt={quote.name} width={80} height={80} className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}