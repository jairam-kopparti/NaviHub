"use client";

import { useEffect, useState } from "react";

export default function ScrollProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    let ticking = false;
    const updateScrollProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = docHeight > 0 ? scrollTop / docHeight : 0;
      setScrollProgress(scrolled);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateScrollProgress);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const updateViewport = () => setViewportHeight(window.innerHeight);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const safeHeight = viewportHeight || 1;
  const trackHeight = Math.min(160, Math.max(120, Math.round(safeHeight * 0.22)));
  const thumbHeight = Math.max(20, Math.round(trackHeight * 0.25));
  const maxTop = Math.max(trackHeight - thumbHeight, 0);
  const thumbTop = Math.round(maxTop * scrollProgress);

  return (
    <div
      className="fixed right-3 top-1/2 w-1.5 rounded-full bg-[rgba(153,126,103,0.18)] z-50 transition-opacity duration-300"
      style={{
        height: `${trackHeight}px`,
        opacity: 1,
        transform: "translateY(-50%)",
      }}
    >
      <div
        className="absolute left-0 w-full rounded-full bg-[#997e67] shadow-[0_0_8px_rgba(153,126,103,0.35)] transition-transform duration-300"
        style={{ height: `${thumbHeight}px`, transform: `translateY(${thumbTop}px)` }}
      />
    </div>
  );
}

