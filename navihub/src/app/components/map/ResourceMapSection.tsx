"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { MapPin, Locate, Maximize2, Filter, X, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import { Resource, Borough } from "../../lib/types";
import { useGeolocation } from "../../lib/useGeolocation";
import { BoroughName } from "../../lib/nycBoroughs";

const MapboxMap = dynamic(() => import("./MapboxMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-100 lg:h-125 bg-(--surface) flex items-center justify-center">
      <div className="flex items-center gap-2 text-(--secondary-text)/40">
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

interface ResourceMapSectionProps {
  resources: Resource[];
  onResourceClick?: (resource: Resource) => void;
  onOpenFullMap?: () => void;
}

export default function ResourceMapSection({
  resources,
  onResourceClick,
  onOpenFullMap,
}: ResourceMapSectionProps) {
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

  const mappableCount = resources.filter(
    (r) => r.latitude != null && r.longitude != null
  ).length;

  const activeFilters = (filterBorough ? 1 : 0) + (filterType ? 1 : 0);

  const clearMapFilters = useCallback(() => {
    setFilterBorough("");
    setFilterType("");
  }, []);

  return (
    <section className="bg-(--bg)">
      <div className="container mx-auto px-3 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          className="flex flex-col gap-4 mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#997e67] rounded-xl flex items-center justify-center shadow-sm">
                <MapPin className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2
                  className="text-xl sm:text-2xl font-bold tracking-tight"
                  style={{ color: "#1F1F1F", fontFamily: "var(--font-heading)" }}
                >
                  Explore Resources Near You
                </h2>
                <p className="text-xs sm:text-sm mt-0.5" style={{ color: "#888" }}>
                  {mappableCount} locations across NYC
                  {activeFilters > 0 && (
                    <span className="text-[#997e67] font-medium"> · {mapResources.length} shown</span>
                  )}
                </p>
              </div>
            </div>

            {/* Action buttons */}
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
                Filters
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
                {geoLoading ? "Locating..." : "My Location"}
              </button>

              {onOpenFullMap && (
                <button
                  onClick={onOpenFullMap}
                  className="flex items-center gap-1.5 pl-3 pr-3.5 py-2 text-xs font-semibold rounded-full bg-white text-[#555] border border-gray-200 hover:border-[#997e67] hover:text-[#997e67] transition-all cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  Expand
                </button>
              )}
            </div>
          </div>

          {/* Filters bar */}
          {showFilters && (
            <motion.div
              className="flex flex-col sm:flex-row gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
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
            </motion.div>
          )}
        </motion.div>

        {/* Map Container */}
        <motion.div
          className="rounded-2xl overflow-hidden border border-gray-200/60 shadow-lg bg-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <MapboxMap
            resources={mapResources}
            userLocation={userLocation}
            onMarkerClick={onResourceClick}
            showBoroughs
          />
        </motion.div>
      </div>
    </section>
  );
}
