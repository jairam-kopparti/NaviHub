"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
          stroke="rgba(60,80,60,0.13)"
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
          stroke="#8aa48a"
          strokeWidth="0.8"
        />
      ))}
    </svg>
  );
}

// ─── Photo card with optional caption ─────────────────────────────────────────
function PhotoCard({
  src,
  alt,
  caption,
  className,
  style,
}: {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={className} style={style}>
      <div
        className="relative overflow-hidden"
        style={{
          width: "100%",
          paddingBottom: "115%",
          borderRadius: "14px",
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="280px"
        />
      </div>
      {caption && (
        <p
          className="mt-3 text-[#2a3a2a]"
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
export default function HomeArchSection() {
  // Refs for GSAP targets
  const outerRef = useRef<HTMLElement>(null);   // tall scroll container
  const stageRef = useRef<HTMLDivElement>(null); // pinned 100vh stage
  const photoLeftRef = useRef<HTMLDivElement>(null);
  const photoRightTopRef = useRef<HTMLDivElement>(null);
  const photoRightBotRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const outer = outerRef.current!;

      // ── Pin the stage (100vh) for the full scroll distance of the outer section ──
      ScrollTrigger.create({
        trigger: outer,
        start: "top top",
        end: "bottom bottom",
        pin: stageRef.current,
        pinSpacing: false,
      });

      // ── Left photo: rises up from below on scroll start → 40% ──
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

      // ── Left photo: exits down after 65% ──
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

      // ── Right top photo: visible at start, exits upward 30-60% ──
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

      // ── Right bottom photo: rises in from below 40-75% ──
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
    /*
     * Outer section is 280vh tall — provides the scroll distance.
     * The inner stage (100vh) is pinned by GSAP so it stays in viewport
     * while the user scrolls through the tall outer section.
     */
    <section
      ref={outerRef}
      style={{ height: "280vh", backgroundColor: "#edf0ec" }}
    >
      {/* ── Pinned 100vh stage ── */}
      <div
        ref={stageRef}
        className="relative overflow-hidden"
        style={{ height: "100vh", backgroundColor: "#edf0ec" }}
      >
        {/* Subtle off-white noise texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
            opacity: 0.4,
          }}
        />

        {/* Background concentric rings — right side */}
        <BgRings />

        {/* ── Center arch / pill shape ── */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transform: "translate(-50%, -48%)",
            width: "clamp(260px, 22vw, 320px)",
            height: "clamp(480px, 88vh, 760px)",
            borderRadius: "9999px 9999px 9999px 9999px",
            backgroundColor: "#c8d8c8",
            zIndex: 2,
            overflow: "hidden",
          }}
        >
          <ArchDots />

          {/* Heading text inside arch */}
          <div
            className="absolute inset-0 flex items-center justify-center px-6"
            style={{ paddingTop: "10%" }}
          >
            <h2
              className="text-center text-[#1a2a1a] leading-[1.1]"
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 400,
                fontSize: "clamp(22px, 2.6vw, 36px)",
              }}
            >
              When our{" "}
              <em style={{ fontStyle: "italic", fontWeight: 500 }}>
                community
              </em>{" "}
              needs something, we don&apos;t{" "}
              <em style={{ fontStyle: "italic", fontWeight: 500 }}>
                overlook
              </em>{" "}
              it, we{" "}
              <em style={{ fontStyle: "italic", fontWeight: 500 }}>
                build
              </em>{" "}
              it.
            </h2>
          </div>
        </div>

        {/* ── Left photo card ── */}
        <div
          ref={photoLeftRef}
          className="absolute"
          style={{
            left: "clamp(16px, 8vw, 120px)",
            bottom: "clamp(60px, 12vh, 130px)",
            width: "clamp(180px, 17vw, 250px)",
            zIndex: 3,
          }}
        >
          <PhotoCard
            src="/hands.jpg"
            alt="Community gathering"
            caption="NaviHub exists not to reinvent, but to respect."
          />
        </div>

        {/* ── Right top photo card ── */}
        <div
          ref={photoRightTopRef}
          className="absolute"
          style={{
            right: "clamp(16px, 8vw, 120px)",
            top: "clamp(40px, 8vh, 80px)",
            width: "clamp(180px, 17vw, 250px)",
            zIndex: 3,
          }}
        >
          <PhotoCard
            src="/hero.jpg"
            alt="NYC streets"
            caption="Purity is not created. It's preserved."
          />
        </div>

        {/* ── Right bottom photo card ── */}
        <div
          ref={photoRightBotRef}
          className="absolute"
          style={{
            right: "clamp(16px, 10vw, 160px)",
            bottom: "clamp(20px, 4vh, 60px)",
            width: "clamp(180px, 16vw, 230px)",
            zIndex: 3,
          }}
        >
          <PhotoCard
            src="/resources.jpg"
            alt="Resources"
          />
        </div>
      </div>
    </section>
  );
}