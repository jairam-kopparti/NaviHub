"use client";

import { useEffect, useState } from "react";
import { Search, Check, X, Eye } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { Resource } from "../../lib/types";
import { ResourcesCard } from "../../components/ResourcesCard";
import { useRouter } from "next/navigation";
import { useUser } from "../../lib/useUser";

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
  const [selectedCard, setSelectedCard] = useState<Resource | null>(null);

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

  // Filter search locally (null-safe)
  const queryLower = searchQuery.trim().toLowerCase();
  const filteredResources = resources.filter((res) => {
    const title = res.title ?? "";
    const description = res.description ?? "";
    return (
      title.toLowerCase().includes(queryLower) ||
      description.toLowerCase().includes(queryLower)
    );
  });

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
              <h3 className="font-semibold text-xl mb-4 text-(--secondary-text)">Filter by Category</h3>
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
                          ? "bg-[#997e67] text-(--secondary-text) border-[#997e67]"
                          : "border-[var(--border)] hover:bg-[var(--bg)] text-(--secondary-text)"
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
              <h3 className="font-semibold text-xl mb-2 text-(--secondary-text)">Sort by Views</h3>
              <select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-(--secondary-text) focus:outline-none focus:ring-2 focus:ring-[#997e67]"
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
          {/* Search Bar + Add Resource Button */}
          <div className="mb-6 flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-(--secondary-text) w-5 h-5" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#997e67] focus:border-transparent placeholder:text-(--secondary-text)"
              />
            </div>
            <button className="px-6 py-4 bg-[#997e67] text-white rounded-lg font-semibold hover:bg-[#8a6d5a] transition-colors whitespace-nowrap">
              Add resource
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <div
                key={resource.id}
                onClick={() => setSelectedCard(resource)}
                className="cursor-pointer"
              >
                <ResourcesCard
                  title={resource.title}
                  description={resource.description}
                  imageUrl={resource.imageUrl}
                  views={resource.views}
                  category={resource.category}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {selectedCard && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCard(null)}
        >
          {/* Modal Card */}
          <div
            className="relative bg-[var(--surface)] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-zoomIn"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: "zoomIn 0.4s cubic-bezier(.34,.1,.68,1) forwards",
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-6 right-6 z-10 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors shadow-md"
            >
              <X className="w-5 h-5 text-black" />
            </button>

            {/* Image Section */}
            {selectedCard.imageUrl ? (
              <div className="relative w-full h-[35%] min-h-[240px] overflow-hidden rounded-t-3xl">
                <img
                  src={selectedCard.imageUrl}
                  alt={selectedCard.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="relative w-full h-[35%] min-h-[240px] bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-3xl flex items-center justify-center">
                <span className="text-gray-500 text-lg font-medium">Image Not Available</span>
              </div>
            )}

            {/* Content Section */}
            <div className="p-8">
              {/* Category */}
              <div className="inline-block mb-4">
                <span className="text-sm font-semibold px-4 py-2 bg-[#997e67]/10 text-[#997e67] rounded-full">
                  {selectedCard.category}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-3xl font-semibold text-(--primary-text) mb-4">
                {selectedCard.title}
              </h2>

              {/* Description */}
              <p className="text-lg text-(--secondary-text) mb-6 leading-relaxed">
                {selectedCard.description}
              </p>

              {/* Views */}
              <div className="flex items-center gap-2 text-(--secondary-text)">
                <Eye className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {selectedCard.views} views
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Animation Styles */}
      <style jsx>{`
        @keyframes zoomIn {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
