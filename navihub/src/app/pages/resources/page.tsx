"use client";

import { useEffect, useState } from "react";
import { Search, Check } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { Resource } from "../../lib/types";
import { ResourcesCard } from "../../components/ResourcesCard";

const CATEGORIES = [
  "Nonprofit & Charitable Organizations",
  "Health & Wellness Services",
  "Education & Learning",
  "Employment & Career Support",
  "Housing & Utilities Assistance",
  "Food & Basic Needs",
  "Community Events & Programs",
  "Youth, Family & Senior Services",
];

const VIEWS_OPTIONS = ["Most Viewed", "Least Viewed"];

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedView, setSelectedView] = useState<string>("Most Viewed");

  // Fetch resources from Supabase
  useEffect(() => {
    const fetchResources = async () => {
      let query = supabase.from("resources").select("*");

      // Filter by categories if selected
      if (selectedCategories.length > 0) {
        query = query.in("category", selectedCategories);
      }

      // Sort by views
      if (selectedView === "Most Viewed") query = query.order("views", { ascending: false });
      else query = query.order("views", { ascending: true });

      const { data, error } = await query;
      if (!error && data) setResources(data as Resource[]);
    };

    fetchResources();
  }, [selectedCategories, selectedView]);

  // Filter search locally
  const filteredResources = resources.filter(
    (res) =>
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Section 1: Hero Image */}
      <section className="relative h-[60vh] border-b border-(--border) overflow-hidden">
        <img
          src="/resources.jpg"
          alt="Resources"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-6xl font-(--font-heading)">
            RESOURCES
          </h1>
        </div>
      </section>

      {/* Section 2 + 3: Preferences + Resources */}
      <div className="container mx-auto px-4 py-8 flex gap-8 border-b border-[var(--border)]">
        {/* Preferences Panel */}
        <aside className="w-72 flex-shrink-0 relative left-[-1rem]">
          <div className="sticky top-8 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col gap-6">
            {/* Categories */}
            <div>
              <h3 className="font-semibold text-xl mb-4">Filter by Category</h3>
              <div className="flex flex-col gap-2">
                {CATEGORIES.map((category) => {
                  const isSelected = selectedCategories.includes(category);
                  return (
                    <button
                      key={category}
                      onClick={() =>
                        isSelected
                          ? setSelectedCategories(selectedCategories.filter((c) => c !== category))
                          : setSelectedCategories([...selectedCategories, category])
                      }
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors border ${
                        isSelected
                          ? "bg-[#997e67] text-white border-[#997e67]"
                          : "border-[var(--border)] hover:bg-[var(--bg)] text-[var(--primary-text)]"
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4" />}
                      <span className="text-sm">{category}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Views Dropdown */}
            <div>
              <h3 className="font-semibold text-xl mb-2">Sort by Views</h3>
              <select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--primary-text)] focus:outline-none focus:ring-2 focus:ring-[#997e67]"
              >
                {VIEWS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* Resource Cards Section */}
        <div className="flex-1">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-4xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#997e67] focus:border-transparent"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <ResourcesCard
                key={resource.id}
                title={resource.title}
                description={resource.description}
                imageUrl={resource.imageUrl}
                views={resource.views}
                category={resource.category}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
