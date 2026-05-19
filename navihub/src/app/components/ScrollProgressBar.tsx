"use client";

import { useEffect, useState, useRef } from "react";

export default function ScrollProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

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
      if (ticking || isDragging) return;
      ticking = true;
      requestAnimationFrame(updateScrollProgress);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isDragging]);

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
  const fillHeight = Math.max(4, Math.round(thumbTop + thumbHeight / 2));

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackRef.current) return;
      const trackRect = trackRef.current.getBoundingClientRect();
      const relativeY = e.clientY - trackRect.top;
      const clampedY = Math.max(0, Math.min(relativeY, trackHeight));
      const newProgress = clampedY / trackHeight;
      // update local state so UI (thumb + fill) follows immediately while dragging
      setScrollProgress(newProgress);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, newProgress * docHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    // prevent text selection while dragging
    const prevSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = prevSelect || "";
    };
  }, [isDragging, trackHeight]);

  return (
    <div
      ref={trackRef}
      className="fixed right-3 top-1/2 w-1.5 rounded-full bg-[rgba(153,126,103,0.18)] z-50 transition-opacity duration-300 cursor-pointer user-select-none"
      style={{
        height: `${trackHeight}px`,
        opacity: 1,
        transform: "translateY(-50%)",
      }}
    >
      <div
        aria-hidden
        className="absolute left-0 top-0 w-full rounded-full bg-[rgba(153,126,103,0.28)] transition-all duration-150"
        style={{ height: `${fillHeight}px` }}
      />
      <div
        onMouseDown={handleMouseDown}
        className="absolute left-0 w-full rounded-full bg-[#997e67] shadow-[0_0_8px_rgba(153,126,103,0.35)] transition-transform duration-300 cursor-grab active:cursor-grabbing user-select-none"
        style={{ height: `${thumbHeight}px`, transform: `translateY(${thumbTop}px)` }}
      />
    </div>
  );
}

