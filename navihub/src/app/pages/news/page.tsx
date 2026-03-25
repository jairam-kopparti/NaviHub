"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Newspaper,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import NewsCard from "../../components/news/NewsCard";
import NewsCardSkeleton from "../../components/news/NewsCardSkeleton";
import type { NewsArticle, Borough } from "../../lib/types";
import { NEWS_CATEGORIES } from "../../lib/types";
import "../../styles/news.css";

gsap.registerPlugin(ScrollTrigger);

// ── Animation variants ──────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const sidebarVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: { duration: 0.3, ease: "easeInOut" as const },
  },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const BOROUGHS: Borough[] = [
  "Manhattan",
  "Brooklyn",
  "Queens",
  "Bronx",
  "Staten Island",
];

const PAGE_SIZE = 12;

export default function NewsPage() {
  // ── State ─────────────────────────────────────────────────
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [borough, setBorough] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Refs for GSAP
  const gridRef = useRef<HTMLDivElement>(null);
  const sectionHeadingRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(0);
  }, [borough, category, debouncedSearch]);

  // ── Fetch articles from /api/news ─────────────────────────
  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(page * PAGE_SIZE));
      if (borough) params.set("borough", borough);
      if (category) params.set("category", category);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/news?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch news");
      const data = await res.json();
      setArticles(data.articles);
      setTotal(data.total);
    } catch (err) {
      console.error("News fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, borough, category, debouncedSearch]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // ── GSAP scroll animations ────────────────────────────────
  useEffect(() => {
    if (loading) return;

    const ctx = gsap.context(() => {
      if (sectionHeadingRef.current) {
        gsap.from(sectionHeadingRef.current, {
          scrollTrigger: {
            trigger: sectionHeadingRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
          opacity: 0,
          y: 40,
          duration: 0.8,
          ease: "power2.out",
        });
      }

      if (gridRef.current) {
        const cards = gridRef.current.querySelectorAll(".news-card-wrapper");
        gsap.from(cards, {
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
          opacity: 0,
          y: 50,
          scale: 0.95,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
        });
      }
    });

    return () => {
      ctx.revert();
    };
  }, [loading, articles]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (showFilters) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showFilters]);

  // ── Derived ───────────────────────────────────────────────
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const featured = articles[0];
  const rest = articles.slice(1);

  const activeFilterCount =
    (borough ? 1 : 0) + (category ? 1 : 0) + (debouncedSearch ? 1 : 0);

  return (
    <div className="news-page">
      {/* ══════════════ HERO ══════════════ */}
      <section className="relative min-h-[50vh] sm:min-h-[60vh] bg-black overflow-hidden flex flex-col justify-center">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.55 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <Image
            src="/news.jpg"
            alt="NYC News"
            fill
            className="object-cover"
            priority
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/30" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-32 md:py-40 w-full">
          <div className="max-w-2xl mt-6 sm:mt-10">
            <motion.p
              className="text-[#CCBEB1] font-medium mb-4 sm:mb-6 tracking-wide uppercase text-xs sm:text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              NYC Community News
            </motion.p>
            <motion.h1
              className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 sm:mb-8"
              style={{ fontFamily: "var(--font-heading)" }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              Stay Informed, Stay Connected
            </motion.h1>
            <motion.p
              className="text-gray-200 text-base sm:text-lg mb-8 sm:mb-12 leading-relaxed max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              The latest news across New York City&apos;s five boroughs — community
              updates, local politics, transit, and more.
            </motion.p>

            {/* Search + filter bar */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 sm:pl-16 pr-4 sm:pr-6 py-4 sm:py-5 bg-white border border-[#eae0d5]/60 rounded-xl sm:rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#CCBEB1] transition text-base sm:text-lg"
                />
                <Search
                  className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={20}
                />
              </div>
              <button
                onClick={() => setShowFilters(true)}
                className="px-6 sm:px-8 py-4 sm:py-auto bg-white border border-[#eae0d5]/60 rounded-xl sm:rounded-2xl text-gray-900 hover:bg-gray-50 transition cursor-pointer flex items-center justify-center gap-2 font-medium"
              >
                <Filter size={20} />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="ml-1 w-5 h-5 flex items-center justify-center rounded-full bg-[#997e67] text-white text-xs font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </motion.div>
          </div>
        </div>

        {/* ── Filter Sidebar ───────────────────────── */}
        <AnimatePresence>
          {showFilters && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowFilters(false)}
                variants={backdropVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              />
              <motion.div
                className="fixed top-0 right-0 h-full w-full max-w-[320px] sm:max-w-md bg-[#1F1F1F] z-50 p-5 sm:p-8 shadow-2xl border-l border-white/10 overflow-y-auto"
                variants={sidebarVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-white">
                    Filter News
                  </h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Borough */}
                <div className="mb-8">
                  <p className="text-gray-400 text-sm mb-4 font-medium uppercase tracking-wider">
                    Borough
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setBorough("")}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                        !borough
                          ? "bg-[#997e67] text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                      }`}
                    >
                      All Boroughs
                    </button>
                    {BOROUGHS.map((b) => (
                      <button
                        key={b}
                        onClick={() => setBorough(borough === b ? "" : b)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                          borough === b
                            ? "bg-[#997e67] text-white"
                            : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div className="mb-8">
                  <p className="text-gray-400 text-sm mb-4 font-medium uppercase tracking-wider">
                    Category
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setCategory("")}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                        !category
                          ? "bg-[#997e67] text-white"
                          : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                      }`}
                    >
                      All Categories
                    </button>
                    {NEWS_CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        onClick={() =>
                          setCategory(category === c.value ? "" : c.value)
                        }
                        className={`px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer ${
                          category === c.value
                            ? "bg-[#997e67] text-white"
                            : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-12 pt-8 border-t border-white/10">
                  <button
                    onClick={() => {
                      setBorough("");
                      setCategory("");
                      setSearch("");
                    }}
                    className="w-full py-4 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition mb-3 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-full py-4 rounded-xl bg-[#997e67] text-white font-bold hover:bg-[#8a715c] transition cursor-pointer"
                  >
                    Show Results
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </section>

      {/* ══════════════ ACTIVE FILTERS STRIP ══════════════ */}
      {(borough || category) && (
        <section className="bg-[var(--surface)] border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-400 font-medium mr-1">
              Active:
            </span>
            {borough && (
              <span className="news-active-tag">
                {borough}
                <button onClick={() => setBorough("")} className="ml-1 cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            )}
            {category && (
              <span className="news-active-tag">
                {NEWS_CATEGORIES.find((c) => c.value === category)?.label ??
                  category}
                <button onClick={() => setCategory("")} className="ml-1 cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setBorough("");
                setCategory("");
                setSearch("");
              }}
              className="text-xs text-[#997e67] hover:underline ml-2 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        </section>
      )}

      {/* ══════════════ FEATURED ARTICLE ══════════════ */}
      {!loading && featured && (
        <section className="bg-[var(--surface)] py-12 sm:py-20 px-4 sm:px-6 border-b border-gray-100">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[#997e67] font-medium mb-4 tracking-wide uppercase text-xs">
                Featured Story
              </p>
              <NewsCard article={featured} featured />
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════════ ARTICLES GRID ══════════════ */}
      <section className="bg-[var(--bg)] py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section heading */}
          <div ref={sectionHeadingRef} className="mb-10 sm:mb-14">
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <span className="text-[#1f1f1f]">Latest</span>{" "}
              <span className="text-[#CCBEB1]">News</span>
            </h2>
            <div className="w-[60px] h-[2px] bg-[#CCBEB1] mt-4" />
            {!loading && (
              <p className="text-sm text-gray-500 mt-3">
                {total} article{total !== 1 ? "s" : ""} found
              </p>
            )}
          </div>

          {/* Loading skeletons */}
          {loading ? (
            <div className="news-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <NewsCardSkeleton key={i} />
              ))}
            </div>
          ) : rest.length === 0 && !featured ? (
            <motion.div
              className="news-empty"
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
            >
              <Newspaper size={48} strokeWidth={1.5} />
              <h2>No articles found</h2>
              <p>
                {borough || category || debouncedSearch
                  ? "Try adjusting your filters or search."
                  : "News articles haven't been synced yet. Check back soon!"}
              </p>
            </motion.div>
          ) : (
            <>
              <div ref={gridRef} className="news-grid">
                {rest.map((article) => (
                  <div key={article.id} className="news-card-wrapper">
                    <NewsCard article={article} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="news-pagination">
                  <button
                    className="news-pagination__btn"
                    disabled={page === 0}
                    onClick={() => {
                      setPage((p) => Math.max(0, p - 1));
                      window.scrollTo({ top: 400, behavior: "smooth" });
                    }}
                  >
                    <ChevronLeft size={18} /> Previous
                  </button>
                  <span className="news-pagination__info">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    className="news-pagination__btn"
                    disabled={page >= totalPages - 1}
                    onClick={() => {
                      setPage((p) => p + 1);
                      window.scrollTo({ top: 400, behavior: "smooth" });
                    }}
                  >
                    Next <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {/* Result count */}
              <p className="news-result-count">
                Showing {page * PAGE_SIZE + 1}–
                {Math.min((page + 1) * PAGE_SIZE, total)} of {total} articles
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
