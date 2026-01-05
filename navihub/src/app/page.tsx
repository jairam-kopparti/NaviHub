"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

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
        {/* Marquee at the very top */}
        <div className="w-full overflow-hidden">
          <div className="marquee flex gap-12 text-[80px] font-bold uppercase whitespace-nowrap">
            {Array.from({ length: 30 }).map((_, i) => (
              <span key={i} className={i % 2 === 0 ? "filled" : "outlined"}>
                HIGHLIGHTS
              </span>
            ))}
          </div>
        </div>

        {/* Spacer content can go here */}
        <div className="max-w-6xl mx-auto px-6 py-24">
          {/* intentionally blank or other content */}
        </div>

        <style jsx>{`
          .marquee {
            display: inline-flex;
            animation: scroll-left 30s linear infinite; /* slower scroll */
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
            text-stroke: 1px black;
          }
        `}</style>
      </section>



      {/* ================= QUOTE ================= */}
      <section className="py-20 bg-(--bg)">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <blockquote className="text-[clamp(20px,2.2vw,28px)] italic font-semibold text-(--primary-text)/95">
            “Having access to reliable community resources in one place makes a
            real difference for families across the city.”
          </blockquote>
          <cite className="mt-4 block text-sm text-(--secondary-text)">
            — Community Partner, New York City
          </cite>
        </div>
      </section>
    </>
  );
}