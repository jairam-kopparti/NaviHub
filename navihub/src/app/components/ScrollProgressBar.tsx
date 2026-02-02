"use client";

import { useEffect, useState } from "react";

export default function ScrollProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);

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

  return (
    <div 
      className="fixed right-0 top-0 w-1.5 h-screen bg-gray-200 z-50 transition-opacity duration-300"
      style={{ opacity: scrollProgress > 0.01 ? 1 : 0 }}
    >
      <div
        className="w-full bg-gradient-to-b from-[#997e67] to-[#c9a876] transition-all duration-300"
        style={{ height: `${scrollProgress * 100}%` }}
      />
    </div>
  );
}

