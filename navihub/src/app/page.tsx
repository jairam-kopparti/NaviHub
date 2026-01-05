"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const line1 = "Building Bridges,";
  const line2 = "Not Walls";

  return (
    <>
      <main className="relative min-h-screen overflow-hidden">
        {/* Background */}
        <Image
          src="/hero.jpg"
          alt="Hero"
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-black/10" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center min-h-screen px-8 sm:px-12">
          {/* Headline */}
          <h1
            className="text-white font-bold leading-[1.05] max-w-3xl text-[clamp(64px,8vw,120px)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {/* Line 1 */}
            <span className="block overflow-hidden leading-[1.2]">
              {line1.split("").map((char, index) => (
                <span
                  key={index}
                  className="inline-block opacity-0 animate-letter"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </span>
            {/* Line 2 */}
            <span className="block overflow-hidden mt-2">
              {line2.split("").map((char, index) => (
                <span
                  key={index}
                  className="inline-block opacity-0 animate-letter"
                  style={{ animationDelay: `${(line1.length * 0.05 + index * 0.05)}s` }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </span>
          </h1>

          {/* Caption */}
          <p className="mt-6 max-w-2xl text-[clamp(18px,2.2vw,28px)] text-white opacity-0 animate-slideUp">
            A centralized hub for trusted community resources, programs, and organizations across New York City.
          </p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.55,
              ease: "easeOut",
              delay: 2,
            }}
          >
            <Link
              href="/resources"
              className="
                group
                inline-flex items-center gap-4
                mt-8
                px-7 py-3.5
                bg-white text-black
                rounded-full
                font-semibold
                shadow-md
                hover:shadow-lg
                transition
                w-max
              "
            >
              <span>Browse Community Resources</span>

              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-black">
                <ArrowRight
                  className="
                    w-4 h-4 text-white
                    rotate-[-45deg]
                    transition-transform duration-300 ease-out
                    group-hover:translate-x-1
                    group-hover:rotate-[-20deg]
                  "
                />
              </span>
            </Link>
          </motion.div>




          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
            <div className="w-6 h-6 border-b-2 border-r-2 border-white rotate-45 animate-bounce"></div>
          </div>
        </div>

        {/* Animations */}
        <style jsx>{`
          @keyframes letterReveal {
            0% { transform: translateX(-100%); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
          }
          .animate-letter {
            display: inline-block;
            transform: translateX(-100%);
            opacity: 0;
            animation: letterReveal 0.5s cubic-bezier(0.77,0,0.175,1) forwards;
          }

          @keyframes slideUp {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-slideUp {
            animation: slideUp 1s ease forwards;
            animation-delay: ${line1.length * 0.05 + line2.length * 0.05 + 0.3}s;
          }
        `}</style>
      </main>

      {/* Section 1: Intro + Image + Stats */}
      <section className="py-16 bg-(--bg)">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="mt-4 text-(--primary-text)/90 max-w-xl">
              NaviHub is dedicated to helping residents easily find local support and services. We bring together trusted non-profits, community programs, and support organizations in one place, making it simpler for New Yorkers to get the help they need.
            </p>

            {/* Statistics */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="stat-item">
                <div className="stat-number">100+</div>
                <div className="stat-label">Community Resources</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Local Organizations</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">5</div>
                <div className="stat-label">Boroughs served</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">5000+</div>
                <div className="stat-label">Residents supported</div>
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="rounded-2xl overflow-hidden">
              <Image src="/hands.jpg" alt="Community hands" width={1200} height={800} className="object-cover w-full h-72 sm:h-96" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Spacer */}
      <section className="py-24 bg-[#FFFFFA]" aria-hidden="true">
        <div className="max-w-6xl mx-auto px-6">
          {/* intentionally left blank for spacing */}
        </div>
      </section>

      {/* Section 3: Quote */}
      <section className="py-20 bg-(--bg)">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <blockquote className="text-[clamp(20px,2.2vw,28px)] italic font-semibold text-(--primary-text)/95">
            “Having access to reliable community resources in one place makes a real difference for families across the city.”
          </blockquote>
          <cite className="mt-4 block text-sm text-(--secondary-text)">— Community Partner, New York City</cite>
        </div>
      </section>
    </>
  );
}
