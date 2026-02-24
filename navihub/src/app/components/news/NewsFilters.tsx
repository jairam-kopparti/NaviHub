"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Borough } from "../../lib/types";
import { NEWS_CATEGORIES } from "../../lib/types";

const BOROUGHS: Borough[] = [
  "Manhattan",
  "Brooklyn",
  "Queens",
  "Bronx",
  "Staten Island",
];

interface Props {
  borough: string;
  category: string;
  search: string;
  onBoroughChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onSearchChange: (v: string) => void;
}

export default function NewsFilters({
  borough,
  category,
  search,
  onBoroughChange,
  onCategoryChange,
  onSearchChange,
}: Props) {
  const hasFilters = borough || category || search;

  return (
    <div className="news-filters">
      {/* Search bar */}
      <div className="news-filters__search">
        <Search size={18} className="news-filters__search-icon" />
        <input
          type="text"
          placeholder="Search articles…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="news-filters__search-input"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="news-filters__clear-btn"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter pills row */}
      <div className="news-filters__row">
        <div className="news-filters__group">
          <SlidersHorizontal size={16} />
          <span className="news-filters__label">Filters</span>
        </div>

        {/* Borough pills */}
        <div className="news-filters__pills">
          <button
            className={`news-pill ${!borough ? "news-pill--active" : ""}`}
            onClick={() => onBoroughChange("")}
          >
            All Boroughs
          </button>
          {BOROUGHS.map((b) => (
            <button
              key={b}
              className={`news-pill ${borough === b ? "news-pill--active" : ""}`}
              onClick={() => onBoroughChange(borough === b ? "" : b)}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Category pills */}
        <div className="news-filters__pills">
          <button
            className={`news-pill ${!category ? "news-pill--active" : ""}`}
            onClick={() => onCategoryChange("")}
          >
            All Categories
          </button>
          {NEWS_CATEGORIES.map((c) => (
            <button
              key={c.value}
              className={`news-pill ${category === c.value ? "news-pill--active" : ""}`}
              onClick={() =>
                onCategoryChange(category === c.value ? "" : c.value)
              }
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Clear all */}
        {hasFilters && (
          <button
            className="news-filters__clear-all"
            onClick={() => {
              onBoroughChange("");
              onCategoryChange("");
              onSearchChange("");
            }}
          >
            <X size={14} /> Clear all
          </button>
        )}
      </div>
    </div>
  );
}
