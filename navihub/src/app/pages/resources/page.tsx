"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Check, ChevronDown, MapPin, Star, Eye, Grid3X3, SlidersHorizontal, X,
  Heart, GraduationCap, Briefcase, Scale, Home, Utensils, 
  Calendar, Users, HeartHandshake, Map as MapIcon, ArrowLeft, ArrowRight,
  Loader, FileText, Tag, Image as ImageIcon, Plus, CheckCircle
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { Resource } from "../../lib/types";
import { ResourcesCard } from "../../components/resourcepage/ResourcesCard";
import { useUser } from "../../lib/useUser";
import AddResourceModal from "../../components/resourcepage/AddResourceButton";
import AuthErrorModal from "../../components/resourcepage/AuthErrorPopup";
import ResourceDetailModal from "../../components/resourcepage/ResourceDetailModal";
import FullMapModal from "../../components/map/FullMapModal";

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

const getCategoryIcon = (cat: string) => {
  if (cat.includes("Health")) return <Heart className="w-6 h-6" />;
  if (cat.includes("Education")) return <GraduationCap className="w-6 h-6" />;
  if (cat.includes("Employment")) return <Briefcase className="w-6 h-6" />;
  if (cat.includes("Legal")) return <Scale className="w-6 h-6" />;
  if (cat.includes("Housing")) return <Home className="w-6 h-6" />;
  if (cat.includes("Food")) return <Utensils className="w-6 h-6" />;
  if (cat.includes("Events")) return <Calendar className="w-6 h-6" />;
  if (cat.includes("Youth")) return <Users className="w-6 h-6" />;
  if (cat.includes("Nonprofit")) return <HeartHandshake className="w-6 h-6" />;
  return <Grid3X3 className="w-6 h-6" />;
};

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

// Animation variants
const fadeInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 }
};

const fadeInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const slideInDrawer = {
  hidden: { x: "-100%" },
  visible: { x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
  exit: { x: "-100%", transition: { duration: 0.2 } }
};

export default function ResourcesPage() {
  const [viewMode, setViewMode] = useState<"dashboard" | "list">("dashboard");
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  
  // Inline Form States
  const [inlineTitle, setInlineTitle] = useState("");
  const [inlineCategory, setInlineCategory] = useState("");
  const [inlineLocation, setInlineLocation] = useState("Manhattan");
  const [inlineDescription, setInlineDescription] = useState("");
  const [inlineImageUrl, setInlineImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const wordCount = inlineDescription.trim().split(/\s+/).filter((w) => w.length > 0).length;

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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showFullMap, setShowFullMap] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    locations: true,
    rating: true,
    views: true,
  });
  const { user } = useUser();

  // Fetch category counts for the dashboard
  useEffect(() => {
    supabase.from('resources').select('id, category').then(({data}) => {
       if(data) {
          const counts: Record<string, number> = {};
          data.forEach(r => {
             counts[r.category] = (counts[r.category] || 0) + 1;
          });
          setCategoryCounts(counts);
       }
    })
  }, []);

  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (!inlineTitle.trim()) throw new Error("Title is required");
      if (!inlineCategory) throw new Error("Category is required");
      if (wordCount < 15) throw new Error("Description must be at least 15 words");

      const moderationResponse = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `${inlineTitle}\n${inlineDescription}` }),
      });

      const moderationResult = await moderationResponse.json();
      if (!moderationResult.safe) {
        throw new Error(moderationResult.message || "Content contains inappropriate material");
      }

      const { error: insertError } = await supabase
        .from("resources")
        .insert([
          {
            title: inlineTitle.trim(),
            category: inlineCategory,
            description: inlineDescription.trim(),
            image_url: inlineImageUrl.trim() || "",
            location: inlineLocation,
            views: 0,
          },
        ]);

      if (insertError) throw insertError;

      setShowSuccessPopup(true);
      setInlineTitle("");
      setInlineCategory("");
      setInlineLocation("Manhattan");
      setInlineDescription("");
      setInlineImageUrl("");
      handleResourcesUpdated();
      setTimeout(() => setShowSuccessPopup(false), 3000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to add resource");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let filtered = (data as any[]).map((resource) => {
            const mappedResource = {
              ...resource,
              imageUrl: resource.image_url || resource.imageUrl,
            };
            if (ratingMap[resource.id]) {
              const avg = ratingMap[resource.id].total / ratingMap[resource.id].count;
              return { ...mappedResource, avgRating: parseFloat(avg.toFixed(1)) };
            }
            return { ...mappedResource, avgRating: 0 };
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

          // Check if we need to open a specific resource from homepage carousel
          const openResourceId = sessionStorage.getItem("openResourceId");
          if (openResourceId) {
            const targetResource = sorted.find((r: Resource) => r.id === openResourceId);
            if (targetResource) {
              setSelectedCard(targetResource);
            }
            sessionStorage.removeItem("openResourceId");
          }
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let filtered = (data as any[]).map((resource) => {
            const mappedResource = {
              ...resource,
              imageUrl: resource.image_url || resource.imageUrl,
            };
            if (ratingMap[resource.id]) {
              const avg = ratingMap[resource.id].total / ratingMap[resource.id].count;
              return { ...mappedResource, avgRating: parseFloat(avg.toFixed(1)) };
            }
            return { ...mappedResource, avgRating: 0 };
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
      <section className="relative h-[40vh] sm:h-[50vh] md:h-[60vh] overflow-hidden">
        <motion.div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: 'url(/resources.jpg)' }}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h1 className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-(--font-heading) tracking-tight mb-3 flex items-center justify-center gap-4">
              Resources
            </h1>
            <p className="text-white/90 text-lg md:text-xl font-medium max-w-xl mx-auto">
              Discover and share community services across New York City
            </p>
          </motion.div>
        </div>
      </section>

      {viewMode === "dashboard" ? (
        <div className="bg-[#fcfbf9] min-h-screen relative flex">
          
          {/* Prominent Map Panel taking the full length of the dashboard */}
          <motion.div 
            animate={{ x: [0, 8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-12 md:w-16 shrink-0 bg-white shadow-[8px_0_30px_rgb(0,0,0,0.06)] border-r border-[#eae0d5]/80 relative z-20 before:absolute before:inset-y-0 before:-left-10 before:w-10 before:bg-white"
          >
            <button 
              onClick={() => setShowFullMap(true)} 
              className="sticky top-[80px] h-[calc(100vh-80px)] w-full flex flex-col items-center justify-center cursor-pointer group hover:bg-[#fdfaf7] transition-colors"
            >
              <div className="flex flex-col items-center gap-6">
                <MapIcon className="w-6 h-6 md:w-8 md:h-8 text-[#997e67] group-hover:scale-110 transition-transform drop-shadow-sm" />
                <span 
                  className="text-[#997e67] font-bold tracking-[0.2em] uppercase text-xs md:text-sm group-hover:tracking-[0.25em] transition-all"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                >
                  View Interactive Map
                </span>
              </div>
            </button>
          </motion.div>

          <div className="flex-1 container mx-auto px-4 sm:px-6 md:px-8 py-16 md:py-24">
            <div className="max-w-5xl mx-auto mb-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl !text-[#4a3b32] mb-4 font-(--font-heading) tracking-tight">
                  Explore by Category
                </h2>
                <p className="text-lg !text-[#6b5a4e] max-w-2xl mx-auto">
                  Find the exact support services and organizations tailored to your needs from our curated directory.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {CATEGORIES.map((category) => (
                  <motion.div 
                    key={category}
                    onClick={() => {
                      setSelectedCategories([category]);
                      setViewMode("list");
                    }}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-3xl p-6 md:p-8 border border-[#eae0d5]/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(153,126,103,0.12)] transition-all cursor-pointer flex flex-col group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-[#997e67] to-[#CCBEB1] z-10" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-[#997e67]/5 to-transparent rounded-bl-full pointer-events-none transition-opacity opacity-0 group-hover:opacity-100" />
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 bg-[#fdfaf7] border border-[#eae0d5]/50 rounded-2xl shadow-sm flex items-center justify-center text-[#997e67] group-hover:bg-[#997e67] group-hover:text-white transition-colors duration-300">
                        {getCategoryIcon(category)}
                      </div>
                      <div className="bg-[#fdfaf7] px-3 py-1.5 rounded-full text-xs font-semibold text-[#6b5a4e] border border-[#eae0d5]/50 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#997e67] opacity-60"></span>
                        {categoryCounts[category] || 0} resources
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-[#4a3b32] leading-tight mb-3 pr-2 group-hover:text-[#997e67] transition-colors">{category}</h3>
                    <div className="mt-auto pt-4 flex items-center text-sm font-semibold text-[#997e67]/80 group-hover:text-[#997e67] transition-colors">
                      Explore resources 
                      <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-[#eae0d5]/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-linear-to-bl from-[#997e67]/10 via-[#997e67]/5 to-transparent rounded-bl-full pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-[#fdfaf7] rounded-full flex items-center justify-center border border-[#eae0d5]">
                    <HeartHandshake className="w-6 h-6 text-[#997e67]" />
                  </div>
                  <h3 className="text-2xl md:text-3xl text-[#4a3b32] font-(--font-heading)">Suggest a Resource</h3>
                </div>
                <p className="!text-[#6b5a4e] mb-8 text-lg">Know about a helpful service? Share it with the community.</p>

              {showSuccessPopup && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 animate-in fade-in slide-in-from-top-2">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <p className="font-medium">Resource submitted successfully! It will be reviewed by our team.</p>
                </div>
              )}

              {submitError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
                  <X className="w-5 h-5 mt-0.5 shrink-0 cursor-pointer" onClick={() => setSubmitError(null)} />
                  <p className="font-medium flex-1">{submitError}</p>
                </div>
              )}

              <form onSubmit={handleInlineSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold !text-[#4a3b32] ml-1">Title *</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 !text-[#997e67]/60" />
                    <input required placeholder="e.g., Community Food Pantry" value={inlineTitle} onChange={(e) => setInlineTitle(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-[#fdfaf7] border border-[#eae0d5]/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#997e67]/10 focus:border-[#997e67] transition-all !text-[#4a3b32] placeholder:text-[#4a3b32]/40" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold !text-[#4a3b32] ml-1">Category *</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 !text-[#997e67]/60" />
                      <select required value={inlineCategory} onChange={(e) => setInlineCategory(e.target.value)} className="w-full pl-12 pr-10 py-3.5 bg-[#fdfaf7] border border-[#eae0d5]/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#997e67]/10 focus:border-[#997e67] transition-all !text-[#4a3b32] appearance-none">
                        <option value="" disabled>Select category</option>
                        {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 ! !text-[#4a3b32]/40 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold !text-[#4a3b32] ml-1">Location *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 !text-[#997e67]/60" />
                      <select required value={inlineLocation} onChange={(e) => setInlineLocation(e.target.value)} className="w-full pl-12 pr-10 py-3.5 bg-[#fdfaf7] border border-[#eae0d5]/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#997e67]/10 focus:border-[#997e67] transition-all !text-[#4a3b32] appearance-none">
                        {LOCATIONS.map((loc) => (<option key={loc} value={loc}>{loc}</option>))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4a3b32]/40 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-sm font-semibold text-[#4a3b32]">Image URL</label>
                    <span className="text-xs text-[#997e67]/60 font-medium uppercase tracking-wider">OPTIONAL</span>
                  </div>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#997e67]/60" />
                    <input type="url" placeholder="https://example.com/image.jpg" value={inlineImageUrl} onChange={(e) => setInlineImageUrl(e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-[#fdfaf7] border border-[#eae0d5]/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#997e67]/10 focus:border-[#997e67] transition-all !text-[#4a3b32] placeholder:text-[#4a3b32]/40" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-sm font-semibold !text-[#4a3b32]">Description *</label>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${wordCount >= 15 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {wordCount}/15 words
                    </span>
                  </div>
                  <textarea required placeholder="Describe the resource in detail (min 15 words)..." value={inlineDescription} onChange={(e) => setInlineDescription(e.target.value)} rows={4} className="w-full p-4 bg-[#fdfaf7] border border-[#eae0d5]/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#997e67]/10 focus:border-[#997e67] transition-all resize-none text-[#4a3b32] placeholder:text-[#4a3b32]/40" />
                </div>

                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit" 
                  disabled={isSubmitting || !inlineTitle.trim() || !inlineCategory || wordCount < 15} 
                  className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-4 bg-[#997e67] hover:bg-[#8a6d5a] text-white rounded-2xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none"
                >
                  {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <><Plus className="w-5 h-5" /> Submit Resource</>}
                </motion.button>
              </form>
            </div>
          </div>
          </div>
        </div>
      ) : (
        <>
      {/* Mobile Filter Button */}
      <motion.div 
        className="lg:hidden sticky top-0 z-30 bg-(--bg) border-b border-(--border) p-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <motion.button
          onClick={() => setMobileFiltersOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-(--surface) border border-(--border) rounded-xl font-medium text-(--secondary-text) cursor-pointer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <motion.span 
              className="px-2 py-0.5 text-xs font-medium bg-[#997e67] text-white rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              {activeFilterCount}
            </motion.span>
          )}
        </motion.button>
      </motion.div>

      {/* Mobile Filter Drawer Overlay */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
          />
        )}
      </AnimatePresence>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div
            className="fixed top-0 left-0 h-full w-[85%] max-w-87.5 z-50 bg-(--surface) shadow-2xl lg:hidden"
            variants={slideInDrawer}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
        <div className="flex flex-col h-full bg-[#fdfaf7]">
          {/* Mobile Filter Header */}
          <div className="px-5 py-5 border-b border-[#eae0d5]/60 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#997e67]/10 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4 text-[#997e67]" />
              </div>
              <h2 className="font-bold text-lg text-[#4a3b32] tracking-tight">Filters</h2>
            </div>
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="p-2 text-[#4a3b32]/60 hover:text-[#4a3b32] bg-[#fdfaf7] rounded-full transition cursor-pointer border border-[#eae0d5]/60"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mobile Filter Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {/* Categories */}
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
                          isSelected ? "bg-white/20" : "border border-(--border) group-hover:border-[#997e67]/50"
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

            {/* Locations */}
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

            {/* Rating */}
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

            {/* Views */}
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

          {/* Mobile Filter Footer */}
          <div className="p-5 border-t border-[#eae0d5]/60 bg-white space-y-3">
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="w-full px-4 py-3.5 text-sm font-bold text-[#997e67] border border-[#997e67]/30 rounded-2xl hover:bg-[#997e67]/5 transition cursor-pointer"
              >
                Clear all filters
              </button>
            )}
            <motion.button
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full px-4 py-3.5 text-sm font-bold text-white bg-[#997e67] rounded-2xl hover:bg-[#8a6d5a] transition cursor-pointer shadow-[0_4px_20px_rgb(153,126,103,0.2)]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Show {filteredResources.length} results
            </motion.button>
          </div>
        </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 2 + 3: Preferences + Resources */}
      <div className="container mx-auto px-4 py-8">
        <motion.button 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => {
            setViewMode("dashboard");
            setSelectedCategories([]);
            setSearchQuery("");
          }}
          className="mb-8 flex items-center gap-2 text-[#997e67] hover:text-[#8a6d5a] font-semibold transition-colors cursor-pointer w-fit group px-4 py-2 rounded-xl hover:bg-[#997e67]/5"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Categories
        </motion.button>
        <div className="flex flex-col lg:flex-row gap-8 pb-8">
        {/* Preferences Panel - Hidden on mobile, shown on desktop */}
        <motion.aside 
          className="hidden lg:block w-80 shrink-0"
          initial="hidden"
          animate="visible"
          variants={fadeInLeft}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="sticky top-8 bg-white border border-[#eae0d5]/60 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden max-h-[90vh] flex flex-col">
            {/* Panel Header */}
            <div className="px-6 py-5 border-b border-[#eae0d5]/60 bg-[#fdfaf7]/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#997e67]/10 flex items-center justify-center">
                    <SlidersHorizontal className="w-4 h-4 text-[#997e67]" />
                  </div>
                  <h2 className="font-bold text-lg !text-[#4a3b32] tracking-tight">Filters</h2>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#997e67] hover:text-white bg-[#997e67]/10 hover:bg-[#997e67] rounded-full transition-all cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    Clear all
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
                Showing <motion.span 
                  className="font-bold" 
                  style={{ color: "#997e67" }}
                  key={filteredResources.length}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >{filteredResources.length}</motion.span> results
              </p>
            </div>
          </div>
        </motion.aside>

        {/* Resource Cards Section */}
        <motion.div 
          className="flex-1 min-w-0"
          initial="hidden"
          animate="visible"
          variants={fadeInRight}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* Search Bar + Add Resource Button */}
          <motion.div 
            className="mb-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#997e67]/60 w-5 h-5 group-focus-within:text-[#997e67] transition-colors" />
              <input
                type="text"
                placeholder="Search resources by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-4 py-4 bg-white border border-[#eae0d5]/80 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] focus:outline-none focus:ring-4 focus:ring-[#997e67]/10 focus:border-[#997e67] placeholder:text-[#4a3b32]/40 text-[#4a3b32] font-medium transition-all"
              />
            </div>
            <motion.button 
              onClick={handleAddResourceClick}
              className="px-6 py-4 bg-[#997e67] text-white rounded-2xl font-bold hover:bg-[#8a6d5a] transition-all shadow-[0_4px_20px_rgb(153,126,103,0.2)] hover:shadow-[0_8px_30px_rgb(153,126,103,0.3)] whitespace-nowrap cursor-pointer flex items-center justify-center gap-2 text-sm sm:text-base"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5" />
              Suggest Resource
            </motion.button>
          </motion.div>

          {/* Results count - mobile only */}
          <motion.div 
            className="lg:hidden mb-4 text-sm text-(--secondary-text)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Showing <motion.span 
              className="font-semibold text-[#997e67]"
              key={filteredResources.length}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >{filteredResources.length}</motion.span> results
          </motion.div>

          {/* Cards Grid */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
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
          </motion.div>
        </motion.div>
        </div>
      </div>
      </>
      )}

      {/* Resource Detail Modal with Reviews and Favorites */}
      <AnimatePresence>
        {selectedCard && (
          <ResourceDetailModal
            resource={selectedCard}
            isOpen={!!selectedCard}
            onClose={() => setSelectedCard(null)}
            user={user}
            onJudgeOverride={judgeOverrideMode}
            onFavoriteToggled={handleResourcesUpdated}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <AddResourceModal
            isOpen={showAddModal}
            onClose={() => {
              setShowAddModal(false);
              setJudgeOverrideMode(false);
            }}
            onSuccess={handleResourcesUpdated}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAuthError && (
          <AuthErrorModal
            isOpen={showAuthError}
            onClose={() => setShowAuthError(false)}
            onJudgeOverride={handleJudgeOverride}
          />
        )}
      </AnimatePresence>

      {/* Full Map Modal */}
      <FullMapModal
        isOpen={showFullMap}
        onClose={() => setShowFullMap(false)}
        resources={resources}
        onResourceClick={(resource) => {
          setShowFullMap(false);
          handleResourceCardClick(resource);
        }}
      />
    </div>
  );
}