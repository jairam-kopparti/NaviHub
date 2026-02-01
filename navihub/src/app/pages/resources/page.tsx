"use client";

import { useEffect, useState } from "react";
import { Search, Check } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { Resource } from "../../lib/types";
import { ResourcesCard } from "../../components/resourcepage/ResourcesCard";
import { useUser } from "../../lib/useUser";
import AddResourceModal from "../../components/resourcepage/AddResourceButton";
import AuthErrorModal from "../../components/resourcepage/AuthErrorPopup";
import ResourceDetailModal from "../../components/resourcepage/ResourceDetailModal";

const CATEGORIES = [
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

const LOCATIONS = [
  "Manhattan",
  "Brooklyn",
  "Queens",
  "Bronx",
  "Staten Island",
];

const RATING_OPTIONS = [
  { label: "5 Stars", value: 5 },
  { label: "4+ Stars", value: 4 },
  { label: "3+ Stars", value: 3 },
  { label: "All Ratings", value: 0 },
];

const VIEWS_OPTIONS = ["Most Viewed", "Least Viewed"];

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedView, setSelectedView] = useState<string>("Most Viewed");
  const [selectedCard, setSelectedCard] = useState<Resource | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAuthError, setShowAuthError] = useState(false);
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set());
  const [judgeOverrideMode, setJudgeOverrideMode] = useState(false);
  const { user } = useUser();

  // Fetch user's favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user && !judgeOverrideMode) {
        setUserFavorites(new Set());
        return;
      }

      try {
        const userId = judgeOverrideMode ? "judge-override" : user?.id;
        if (!userId) return;

        const { data, error } = await supabase
          .from("favorites")
          .select("resource_id")
          .eq("user_id", userId);

        if (error) throw error;
        const favoriteIds = new Set(data?.map(f => f.resource_id) || []);
        setUserFavorites(favoriteIds);
      } catch (err) {
        console.error("Error fetching favorites:", err);
      }
    };

    fetchFavorites();
  }, [user, judgeOverrideMode]);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        let query = supabase.from("resources").select("*");

        // Filter by categories if selected
        if (selectedCategories.length > 0) {
          query = query.in("category", selectedCategories);
        }

        // Filter by locations if selected
        if (selectedLocations.length > 0) {
          query = query.in("location", selectedLocations);
        }

        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching resources:", error);
          setResources([]);
          return;
        }
        
        if (data) {
          // Fetch reviews to calculate average ratings
          const { data: reviews, error: reviewsError } = await supabase
            .from("reviews")
            .select("resource_id, rating");

          if (reviewsError) {
            console.error("Error fetching reviews:", reviewsError);
          }

          // Calculate average rating for each resource
          const ratingMap: { [key: string]: { total: number; count: number } } = {};
          if (reviews) {
            reviews.forEach((review) => {
              if (!ratingMap[review.resource_id]) {
                ratingMap[review.resource_id] = { total: 0, count: 0 };
              }
              ratingMap[review.resource_id].total += review.rating;
              ratingMap[review.resource_id].count += 1;
            });
          }

          // Add average rating to resources
          let filtered = (data as Resource[]).map((resource) => {
            if (ratingMap[resource.id]) {
              const avg = ratingMap[resource.id].total / ratingMap[resource.id].count;
              return { ...resource, avgRating: parseFloat(avg.toFixed(1)) };
            }
            return { ...resource, avgRating: 0 };
          });

          // Filter by rating
          if (selectedRating > 0) {
            filtered = filtered.filter((resource) => {
              const avgRating = resource.avgRating ?? 0;
              return avgRating >= selectedRating;
            });
          }

          // Sort by views
          if (selectedView === "Most Viewed") {
            filtered.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
          } else {
            filtered.sort((a, b) => (a.views ?? 0) - (b.views ?? 0));
          }

          // Sort favorites to top
          const sorted = filtered.sort((a, b) => {
            const aFavorited = userFavorites.has(a.id);
            const bFavorited = userFavorites.has(b.id);
            if (aFavorited && !bFavorited) return -1;
            if (!aFavorited && bFavorited) return 1;
            return 0;
          });

          setResources(sorted);
        }
      } catch (err) {
        console.error("Unexpected error fetching resources:", err);
        setResources([]);
      }
    };

    fetchResources();
  }, [selectedCategories, selectedLocations, selectedRating, selectedView, userFavorites]);

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

  const handleAddResourceClick = () => {
    if (!user) {
      setShowAuthError(true);
    } else {
      setShowAddModal(true);
    }
  };

  const handleResourceCardClick = async (resource: Resource) => {
    // Increment view count
    try {
      const { error } = await supabase
        .from("resources")
        .update({ views: (resource.views || 0) + 1 })
        .eq("id", resource.id);

      if (error) {
        console.error("Error incrementing views:", error);
        setSelectedCard(resource);
        return;
      }

      // Update local state
      setResources(resources.map(r =>
        r.id === resource.id ? { ...r, views: (r.views || 0) + 1 } : r
      ));
      // Update selected card
      setSelectedCard({ ...resource, views: (resource.views || 0) + 1 });
    } catch (err) {
      console.error("Error incrementing views:", err);
      setSelectedCard(resource);
    }
  };

  const handleResourcesUpdated = () => {
    // Refetch resources after adding a new one
    const fetchResources = async () => {
      try {
        let query = supabase.from("resources").select("*");

        if (selectedCategories.length > 0) {
          query = query.in("category", selectedCategories);
        }

        if (selectedLocations.length > 0) {
          query = query.in("location", selectedLocations);
        }

        const { data, error } = await query;
        
        if (error) {
          console.error("Error refetching resources:", error);
          return;
        }
        
        if (data) {
          // Fetch reviews to calculate average ratings
          const { data: reviews, error: reviewsError } = await supabase
            .from("reviews")
            .select("resource_id, rating");

          if (reviewsError) {
            console.error("Error fetching reviews:", reviewsError);
          }

          // Calculate average rating for each resource
          const ratingMap: { [key: string]: { total: number; count: number } } = {};
          if (reviews) {
            reviews.forEach((review) => {
              if (!ratingMap[review.resource_id]) {
                ratingMap[review.resource_id] = { total: 0, count: 0 };
              }
              ratingMap[review.resource_id].total += review.rating;
              ratingMap[review.resource_id].count += 1;
            });
          }

          // Add average rating to resources
          let filtered = (data as Resource[]).map((resource) => {
            if (ratingMap[resource.id]) {
              const avg = ratingMap[resource.id].total / ratingMap[resource.id].count;
              return { ...resource, avgRating: parseFloat(avg.toFixed(1)) };
            }
            return { ...resource, avgRating: 0 };
          });

          if (selectedRating > 0) {
            filtered = filtered.filter((resource) => {
              const avgRating = resource.avgRating ?? 0;
              return avgRating >= selectedRating;
            });
          }

          if (selectedView === "Most Viewed") {
            filtered.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
          } else {
            filtered.sort((a, b) => (a.views ?? 0) - (b.views ?? 0));
          }

          const sorted = filtered.sort((a, b) => {
            const aFavorited = userFavorites.has(a.id);
            const bFavorited = userFavorites.has(b.id);
            if (aFavorited && !bFavorited) return -1;
            if (!aFavorited && bFavorited) return 1;
            return 0;
          });
          setResources(sorted);
        }
      } catch (err) {
        console.error("Unexpected error refetching resources:", err);
      }
    };

    fetchResources();
  };

  const handleJudgeOverride = () => {
    setJudgeOverrideMode(true);
    setShowAddModal(true);
  };

  return (
    <div className="min-h-screen bg-(--bg)">
      {/* Section 1: Hero Image */}
      <section className="relative h-[60vh] border-b border-(--border) overflow-hidden">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: 'url(/resources.jpg)' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white text-6xl font-(--font-heading)">
            RESOURCES
          </h1>
        </div>
      </section>

      {/* Section 2 + 3: Preferences + Resources */}
      <div className="container mx-auto px-4 py-8 flex gap-8 border-b border-(--border)">
        {/* Preferences Panel */}
        <aside className="w-96 shrink-0">
          <div className="sticky top-8 bg-(--surface) border border-(--border) rounded-2xl p-6 shadow-sm flex flex-col gap-6 max-h-[95vh] overflow-y-auto">
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
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors border cursor-pointer ${
                        isSelected
                          ? "bg-[#997e67] text-(--secondary-text) border-[#997e67]"
                          : "border-(--border) hover:bg-(--bg) text-(--secondary-text)"
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4" />}
                      <span className="text-sm">{category}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Locations Filter */}
            <div className="border-t border-(--border) pt-6">
              <h3 className="font-semibold text-xl mb-4 text-(--secondary-text)">Filter by Location</h3>
              <div className="flex flex-col gap-2">
                {LOCATIONS.map((location) => {
                  const isSelected = selectedLocations.includes(location);
                  return (
                    <button
                      key={location}
                      onClick={() =>
                        isSelected
                          ? setSelectedLocations(selectedLocations.filter((l) => l !== location))
                          : setSelectedLocations([...selectedLocations, location])
                      }
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors border cursor-pointer ${
                        isSelected
                          ? "bg-[#997e67] text-(--secondary-text) border-[#997e67]"
                          : "border-(--border) hover:bg-(--bg) text-(--secondary-text)"
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4" />}
                      <span className="text-sm">{location}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rating Filter */}
            <div className="border-t border-(--border) pt-6">
              <h3 className="font-semibold text-xl mb-2 text-(--secondary-text)">Filter by Rating</h3>
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(Number(e.target.value))}
                className="w-full px-4 py-2 border border-(--border) rounded-lg bg-(--surface) text-(--secondary-text) focus:outline-none focus:ring-2 focus:ring-[#997e67] cursor-pointer"
              >
                {RATING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Views Dropdown */}
            <div className="border-t border-(--border) pt-6">
              <h3 className="font-semibold text-xl mb-2 text-(--secondary-text)">Sort by Views</h3>
              <select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
                className="w-full px-4 py-2 border border-(--border) rounded-lg bg-(--surface) text-(--secondary-text) focus:outline-none focus:ring-2 focus:ring-[#997e67] cursor-pointer"
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
                className="w-full pl-12 pr-4 py-4 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#997e67] placeholder:text-(--secondary-text)"
                style={{ color: "#4a4a4a" }}
              />
            </div>
            <button 
              onClick={handleAddResourceClick}
              className="px-6 py-4 bg-[#997e67] text-white rounded-lg font-semibold hover:bg-[#8a6d5a] transition-colors whitespace-nowrap cursor-pointer">
              Add resource
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <div
                key={resource.id}
                onClick={() => handleResourceCardClick(resource)}
                className="cursor-pointer"
              >
                <ResourcesCard
                  title={resource.title}
                  imageUrl={resource.imageUrl}
                  views={resource.views}
                  category={resource.category}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resource Detail Modal with Reviews and Favorites */}
      <ResourceDetailModal
        resource={selectedCard}
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        user={user}
        onJudgeOverride={judgeOverrideMode}
      />

      {/* Modals */}
      <AddResourceModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setJudgeOverrideMode(false);
        }}
        onSuccess={handleResourcesUpdated}
      />
      <AuthErrorModal
        isOpen={showAuthError}
        onClose={() => setShowAuthError(false)}
        onJudgeOverride={handleJudgeOverride}
      />
    </div>
  );
}