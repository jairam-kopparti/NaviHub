"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HighlightCard from "./HighlightCard";

type Resource = {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  views: number;
};

type Props = {
  resources: Resource[];
};

export default function HighlightsCarousel({ resources }: Props) {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const total = resources.length;

  /* ---------------- AUTO SLIDE ---------------- */
  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setDirection(1);
      setIndex((prev) => (prev + 1) % total);
    }, 4500);

    return () => clearInterval(interval);
  }, [isHovered, total]);

  /* ---------------- NAV CONTROLS ---------------- */
  const next = () => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % total);
  };

  const prev = () => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + total) % total);
  };

  /* ---------------- ANIMATION VARIANTS ---------------- */
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  if (total === 0) return null; // nothing to show

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Card Area */}
      <div
        className="relative w-full flex justify-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={resources[index].id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            <HighlightCard {...resources[index]} />
          </motion.div>
        </AnimatePresence>

        {/* Left Arrow */}
        <button
          aria-label="Previous highlight"
          onClick={prev}
          className="
            absolute
            left-0
            top-1/2
            -translate-y-1/2
            -translate-x-1/2
            w-10 h-10
            rounded-full
            bg-(--bg)
            border
            border-(--primary-text)/20
            flex items-center justify-center
            hover:bg-(--primary-text)/5
            transition
          "
        >
          <ChevronLeft className="w-5 h-5 text-(--primary-text)" />
        </button>

        {/* Right Arrow */}
        <button
          aria-label="Next highlight"
          onClick={next}
          className="
            absolute
            right-0
            top-1/2
            -translate-y-1/2
            translate-x-1/2
            w-10 h-10
            rounded-full
            bg-(--bg)
            border
            border-(--primary-text)/20
            flex items-center justify-center
            hover:bg-(--primary-text)/5
            transition
          "
        >
          <ChevronRight className="w-5 h-5 text-(--primary-text)" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex gap-2 mt-6">
        {resources.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to highlight ${i + 1}`}
            onClick={() => {
              setDirection(i > index ? 1 : -1);
              setIndex(i);
            }}
            className={`w-2.5 h-2.5 rounded-full transition ${
              i === index
                ? "bg-(--primary-text)"
                : "bg-(--primary-text)/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}