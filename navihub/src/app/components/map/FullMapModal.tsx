"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Locate, Filter, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import { Resource, Borough } from "../../lib/types";
import { useGeolocation } from "../../lib/useGeolocation";
import { BoroughName } from "../../lib/nycBoroughs";

const MapboxMap = dynamic(() => import("./MapboxMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-white">
      <div className="flex items-center gap-2 text-gray-400">
        <MapPin className="w-5 h-5 animate-pulse" />
        <span className="text-sm font-medium">Loading map...</span>
      </div>
    </div>
  ),
});

const BOROUGHS: BoroughName[] = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];

const RESOURCE_TYPES = [
  "Nonprofit & Charitable Organizations",
  "Health & Wellness Services",
  "Education & Learning",
  "Employment & Career Support",
  "Legal, Civic & Government Services",
  "Housing & Utilities Assistance",
  "Food & Basic Needs",
  "Community Events & Programs",
  "Youth, Family & Senior Services",
];

interface FullMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: Resource[];
  onResourceClick?: (resource: Resource) => void;
}

export default function FullMapModal({
  isOpen,
  onClose,
  resources,
  onResourceClick,
}: FullMapModalProps) {
  const [filterBorough, setFilterBorough] = useState<Borough | "">("");
  const [filterType, setFilterType] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const {
    latitude,
    longitude,
    loading: geoLoading,
    requestLocation,
  } = useGeolocation();

  const userLocation = useMemo(() => {
    if (latitude != null && longitude != null) {
      return { latitude, longitude };
    }
    return null;
  }, [latitude, longitude]);

  const mapResources = useMemo(() => {
    return resources.filter((r) => {
      if (r.latitude == null || r.longitude == null) return false;
      if (filterBorough && r.location !== filterBorough) return false;
      if (filterType && r.category !== filterType) return false;
      return true;
    });
  }, [resources, filterBorough, filterType]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKey);
    }
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const activeFilters = (filterBorough ? 1 : 0) + (filterType ? 1 : 0);

  const clearMapFilters = useCallback(() => {
    setFilterBorough("");
    setFilterType("");
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-white"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white border-b border-gray-100 z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#997e67] rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2
                  className="text-base sm:text-lg font-bold"
                  style={{ color: "#1F1F1F", fontFamily: "var(--font-heading)" }}
                >
                  NYC Resource Map
                </h2>
                <p className="text-[11px] hidden sm:block" style={{ color: "#999" }}>
                  {mapResources.length} locations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 pl-3 pr-3.5 py-2 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                  showFilters || activeFilters > 0
                    ? "bg-[#997e67] text-white border-[#997e67] shadow-sm"
                    : "bg-white text-[#555] border-gray-200 hover:border-[#997e67] hover:text-[#997e67]"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilters > 0 && (
                  <span className="ml-0.5 w-5 h-5 text-[10px] bg-white/25 rounded-full flex items-center justify-center font-bold">
                    {activeFilters}
                  </span>
                )}
              </button>

              <button
                onClick={requestLocation}
                disabled={geoLoading}
                className="flex items-center gap-1.5 pl-3 pr-3.5 py-2 text-xs font-semibold rounded-full bg-white text-[#555] border border-gray-200 hover:border-[#997e67] hover:text-[#997e67] transition-all cursor-pointer disabled:opacity-50"
              >
                <Locate className={`w-3.5 h-3.5 ${geoLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">{geoLoading ? "Locating..." : "My Location"}</span>
              </button>

              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                className="px-4 sm:px-6 py-3 bg-white border-b border-gray-100 z-10"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "#999" }}>
                      Borough
                    </label>
                    <div className="relative">
                      <select
                        value={filterBorough}
                        onChange={(e) => setFilterBorough(e.target.value as Borough | "")}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-[#333] focus:outline-none focus:ring-2 focus:ring-[#997e67]/30 focus:border-[#997e67] cursor-pointer appearance-none pr-8"
                      >
                        <option value="">All Boroughs</option>
                        {BOROUGHS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "#999" }}>
                      Resource Type
                    </label>
                    <div className="relative">
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-[#333] focus:outline-none focus:ring-2 focus:ring-[#997e67]/30 focus:border-[#997e67] cursor-pointer appearance-none pr-8"
                      >
                        <option value="">All Types</option>
                        {RESOURCE_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  {activeFilters > 0 && (
                    <div className="flex items-end">
                      <button
                        onClick={clearMapFilters}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#997e67] border border-[#997e67]/20 rounded-xl hover:bg-[#997e67]/5 transition cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Map */}
          <div className="flex-1 relative">
            <MapboxMap
              resources={mapResources}
              userLocation={userLocation}
              onMarkerClick={onResourceClick}
              showBoroughs
              isFullView
              initialZoom={11}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
