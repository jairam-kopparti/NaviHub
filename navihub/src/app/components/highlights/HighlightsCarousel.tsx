"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HighlightsCard from "./HighlightCard";

type Resource = {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  views: number;
};

interface Props {
  resources: Resource[];
}

export default function HighlightsCarousel({ resources }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const total = resources.length;

  /* ---------- AUTO SLIDE ---------- */
  useEffect(() => {
    if (total <= 0 || isHovered || total <= 3) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 3500);

    return () => clearInterval(interval);
  }, [isHovered, total]);

  /* ---------- NAVIGATION ---------- */
  const next = () => setActiveIndex((prev) => (prev + 1) % total);
  const prev = () =>
    setActiveIndex((prev) => (prev - 1 + total) % total);

  /* ---------- VISIBLE CARDS ---------- */
  const getIndex = (i: number) => (i + total) % total;
  const leftIndex = getIndex(activeIndex - 1);
  const rightIndex = getIndex(activeIndex + 1);

  const visibleCards =
    total > 0
      ? [
          { resource: resources[leftIndex], position: "left" },
          { resource: resources[activeIndex], position: "center" },
          { resource: resources[rightIndex], position: "right" },
        ]
      : [];

  /* ---------- ANIMATION VARIANTS ---------- */
  const variants = {
    left: { x: "-130%", scale: 0.85, opacity: 0.5, zIndex: 0 },
    center: { x: "0%", scale: 1, opacity: 1, zIndex: 2 },
    right: { x: "130%", scale: 0.85, opacity: 0.5, zIndex: 0 },
  };

  if (total === 0) return null;

  return (
    <div
      className="relative w-full max-w-7xl mx-auto mt-8 sm:mt-12 px-4 sm:px-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ---------- CAROUSEL TRACK ---------- */}
      <div className="relative h-[26.25rem] sm:h-[30rem] md:h-[32.5rem] flex items-center justify-center overflow-visible pb-12 sm:pb-16">
        {visibleCards.map(({ resource, position }) => (
          <motion.div
            key={resource.id}
            className="absolute w-[15rem] sm:w-[16.25rem] md:w-[17.5rem]"
            variants={variants}
            animate={position}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <HighlightsCard {...resource} />
          </motion.div>
        ))}
      </div>

      {/* ---------- DOTS ---------- */}
      <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-wrap justify-center items-center gap-2 max-w-[90vw]">
        {resources.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            style={{ width: "8px", height: "8px", flexShrink: 0, borderRadius: "50%", padding: 0 }}
            className={`transition ${
              i === activeIndex
                ? "bg-black scale-125"
                : "bg-black/30 hover:bg-black/50"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* ---------- ARROWS ---------- */}
      <button
        onClick={prev}
        className="absolute left-0 sm:left-4 md:left-10 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-white shadow-md hover:scale-110 sm:hover:scale-125 hover:border-2 hover:border-black transition-all cursor-pointer"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
      </button>

      <button
        onClick={next}
        className="absolute right-0 sm:right-4 md:right-10 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-white shadow-md hover:scale-110 sm:hover:scale-125 hover:border-2 hover:border-black transition-all cursor-pointer"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
      </button>
    </div>
  );
}
