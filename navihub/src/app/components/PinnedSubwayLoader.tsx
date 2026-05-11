"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const PinnedSubway = dynamic(() => import("./PinnedSubway"), { ssr: false, loading: () => null });

export default function PinnedSubwayLoader() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedSubway = window.sessionStorage.getItem("pinnedSubway");
    const storedWeather = window.sessionStorage.getItem("pinnedWeather");
    if (storedSubway || storedWeather) {
      setShouldLoad(true);
      return;
    }

    const handler = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail) setShouldLoad(true);
    };

    window.addEventListener("pin-subway", handler as EventListener);
    window.addEventListener("pin-weather", handler as EventListener);
    window.addEventListener("open-subway", handler as EventListener);

    return () => {
      window.removeEventListener("pin-subway", handler as EventListener);
      window.removeEventListener("pin-weather", handler as EventListener);
      window.removeEventListener("open-subway", handler as EventListener);
    };
  }, []);

  return shouldLoad ? <PinnedSubway /> : null;
}
