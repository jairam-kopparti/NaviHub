"use client";

import { useEffect, useState } from "react";
import { Search, Check, ChevronDown, MapPin, Star, Eye, Grid3X3, SlidersHorizontal, X } from "lucide-react";
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
  const [showFilterScrollIndicator, setShowFilterScrollIndicator] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    locations: true,
    rating: true,
    views: true,
  });
  const { user } = useUser();

  const handleFilterScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) < 10;
    setShowFilterScrollIndicator(!isAtBottom);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedLocations([]);
    setSelectedRating(0);
    setSelectedView("Most Viewed");
  };

  const activeFilterCount = selectedCategories.length + selectedLocations.length + (selectedRating > 0 ? 1 : 0);

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
    setShowAddModal(true);
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
    // Refetch resources after adding a new one or favoriting
    const fetchResources = async () => {
      // Re-fetch favorites as well
      if (user || judgeOverrideMode) {
        try {
          const userId = judgeOverrideMode ? "judge-override" : user?.id;
          if (userId) {
            const { data } = await supabase
              .from("favorites")
              .select("resource_id")
              .eq("user_id", userId);
            
            const favoriteIds = new Set(data?.map(f => f.resource_id) || []);
            setUserFavorites(favoriteIds);
          }
        } catch (err) {
          console.error("Error refetching favorites:", err);
        }
      }

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

          // IMPORTANT: Re-sort to apply favorite sorting with new favorite data
          // We need access to the UPDATED userFavorites here, but state update is async
          // So we re-fetch favorites above and use that promise chain or effect, 
          // but for now let's rely on the useEffect dependency on userFavorites to trigger a re-sort
          // OR manually sort here if we had the new set locally. 
          // Since we update userFavorites state above, the main useEffect will run again.
          // However, to be safe and immediate, let's just let the main useEffect handle it
          // by triggering a re-run via some state change or just this function updates the resources directly.
          
          // Actually, the main useEffect depends on [userFavorites]. 
          // So updating userFavorites state is enough to trigger a re-fetch/re-sort!
          // But we also want to keep the current filters.
          
          // Let's just update the favorites state, and let the main useEffect do the work?
          // The issue is that handleResourcesUpdated is called for "adding a resource" too where we might need to fetch new data.
          
          // Let's manually sort here using the LOCAL data we just fetched for favorites if possible, or just rely on state update.
          // To simplify: we updated `setUserFavorites` above. React will trigger the main effect.
          // BUT, we also want to ensure the list is updated immediately if we added a resource.
          
          // Let's just setResources here with the data we have, and let the next effect cycle fix the sort if needed.
          setResources(filtered);
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
        {/* Preferences Panel - Modern Redesign */}
        <aside className="w-80 shrink-0">
          <div className="sticky top-8 bg-(--surface) rounded-2xl shadow-lg overflow-hidden max-h-[90vh] flex flex-col">
            {/* Panel Header */}
            <div className="px-6 py-5 border-b border-(--border) bg-linear-to-r from-[#997e67] to-[#8a6d5a]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="w-5 h-5 text-white" />
                  <h2 className="font-semibold text-lg text-white tracking-wide">Filters</h2>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/90 hover:text-white bg-white/20 hover:bg-white/30 rounded-full transition-all cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    Clear all ({activeFilterCount})
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Filter Content */}
            <div 
              className="flex-1 overflow-y-auto p-5 space-y-1 scroll-smooth"
              onScroll={handleFilterScroll}
            >
              {/* Categories Section */}
              <div className="rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('categories')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-(--bg)/50 hover:bg-(--bg) transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Grid3X3 className="w-4 h-4 text-[#997e67]" />
                    <span className="font-medium text-(--secondary-text) text-sm">Categories</span>
                    {selectedCategories.length > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-[#997e67] text-white rounded-full">
                        {selectedCategories.length}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-(--secondary-text)/60 transition-transform duration-200 ${expandedSections.categories ? 'rotate-180' : ''}`} />
                </button>
                
                {expandedSections.categories && (
                  <div className="px-3 pb-3 pt-2 space-y-1.5">
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
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group ${
                            isSelected
                              ? "bg-[#997e67] text-white shadow-md"
                              : "bg-(--surface) hover:bg-(--bg) text-(--secondary-text) border border-(--border) hover:border-[#997e67]/30"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                            isSelected 
                              ? "bg-white/20" 
                              : "border border-(--border) group-hover:border-[#997e67]/50"
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <span className="text-xs leading-tight text-left flex-1">{category}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Locations Section */}
              <div className="rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('locations')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-(--bg)/50 hover:bg-(--bg) transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-[#997e67]" />
                    <span className="font-medium text-(--secondary-text) text-sm">Location</span>
                    {selectedLocations.length > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-[#997e67] text-white rounded-full">
                        {selectedLocations.length}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-(--secondary-text)/60 transition-transform duration-200 ${expandedSections.locations ? 'rotate-180' : ''}`} />
                </button>
                
                {expandedSections.locations && (
                  <div className="px-3 pb-3 pt-2">
                    <div className="flex flex-wrap gap-2">
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
                            className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? "bg-[#997e67] text-white shadow-md"
                                : "bg-(--surface) text-(--secondary-text) border border-(--border) hover:border-[#997e67] hover:text-[#997e67]"
                            }`}
                          >
                            {location}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Rating Section */}
              <div className="rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('rating')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-(--bg)/50 hover:bg-(--bg) transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Star className="w-4 h-4 text-[#997e67]" />
                    <span className="font-medium text-(--secondary-text) text-sm">Rating</span>
                    {selectedRating > 0 && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-[#997e67] text-white rounded-full">
                        {selectedRating}+
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-(--secondary-text)/60 transition-transform duration-200 ${expandedSections.rating ? 'rotate-180' : ''}`} />
                </button>
                
                {expandedSections.rating && (
                  <div className="px-3 pb-3 pt-2">
                    <div className="flex flex-wrap gap-2">
                      {RATING_OPTIONS.map((option) => {
                        const isSelected = selectedRating === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => setSelectedRating(option.value)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? "bg-[#997e67] text-white shadow-md"
                                : "bg-(--surface) text-(--secondary-text) border border-(--border) hover:border-[#997e67] hover:text-[#997e67]"
                            }`}
                          >
                            {option.value > 0 && (
                              <Star className={`w-3 h-3 ${isSelected ? 'fill-white' : 'fill-amber-400 text-amber-400'}`} />
                            )}
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort by Views Section */}
              <div className="rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleSection('views')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-(--bg)/50 hover:bg-(--bg) transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Eye className="w-4 h-4 text-[#997e67]" />
                    <span className="font-medium text-(--secondary-text) text-sm">Sort by Views</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-(--secondary-text)/60 transition-transform duration-200 ${expandedSections.views ? 'rotate-180' : ''}`} />
                </button>
                
                {expandedSections.views && (
                  <div className="px-3 pb-3 pt-2">
                    <div className="flex gap-2">
                      {VIEWS_OPTIONS.map((option) => {
                        const isSelected = selectedView === option;
                        return (
                          <button
                            key={option}
                            onClick={() => setSelectedView(option)}
                            className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? "bg-[#997e67] text-white shadow-md"
                                : "bg-(--surface) text-(--secondary-text) border border-(--border) hover:border-[#997e67] hover:text-[#997e67]"
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scroll Indicator */}
            {showFilterScrollIndicator && (
              <div className="absolute bottom-14 left-0 right-0 flex justify-center pointer-events-none z-10 opacity-80">
                <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm border border-gray-200/50 animate-bounce">
                  <ChevronDown className="w-4 h-4 text-[#997e67]" />
                </div>
              </div>
            )}

            {/* Panel Footer - Results Count */}
            <div className="px-6 py-4 border-t border-(--border) bg-(--bg)/30">
              <p className="text-sm font-medium text-center" style={{ color: "#000000" }}>
                Showing <span className="font-bold" style={{ color: "#997e67" }}>{filteredResources.length}</span> results
              </p>
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
                  isFavorited={userFavorites.has(resource.id)}
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
        onFavoriteToggled={handleResourcesUpdated}
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