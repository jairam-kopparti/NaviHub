"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Heart, Star, ChevronDown, MapPin, Eye, MessageSquare, Calendar } from "lucide-react";
import { Resource, Review } from "../../lib/types";
import { supabase } from "../../lib/supabaseClient";

interface ResourceDetailModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
  user: { id: string } | null;
  onJudgeOverride?: boolean;
  onFavoriteToggled?: () => void;
}

export default function ResourceDetailModal({
  resource,
  isOpen,
  onClose,
  user,
  onJudgeOverride = false,
  onFavoriteToggled,
}: ResourceDetailModalProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);

  // Check if user has favorited this resource
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user && !onJudgeOverride) return;
      if (!resource) return;

      try {
        if (user) {
          const { data } = await supabase
            .from("favorites")
            .select("id")
            .eq("user_id", user.id)
            .eq("resource_id", resource.id)
            .single();

          setIsFavorited(!!data);
        }
      } catch (err) {
        console.error("Error checking favorite status:", err);
      }
    };

    checkFavorite();
  }, [resource, user, onJudgeOverride]);

  // Fetch reviews for this resource
  useEffect(() => {
    const fetchReviews = async () => {
      if (!resource) return;
      setLoadingReviews(true);
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .eq("resource_id", resource.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setReviews(data || []);

        // Check if current user has already reviewed this resource
        if (user && data) {
          const userReview = data.find((review) => review.user_id === user.id);
          setHasUserReviewed(!!userReview);
        } else if (onJudgeOverride && data) {
          const judgeReview = data.find((review) => review.user_id === "judge-override");
          setHasUserReviewed(!!judgeReview);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [resource, user, onJudgeOverride]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleModalClose(); };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  // Handle browser back button (prevents closing the entire site)
  useEffect(() => {
    if (!isOpen) {
      if (typeof window !== "undefined" && window.location.hash === "#resource") {
        // cleanup hash if closed without back button somehow
        // though we prefer utilizing back()
      }
      return;
    }

    if (typeof window !== "undefined") {
      if (window.location.hash !== "#resource") {
        window.history.pushState(null, "", window.location.pathname + window.location.search + "#resource");
      }
    }

    const handlePopState = () => {
      if (window.location.hash !== "#resource") {
        onClose();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isOpen, onClose]);

  const handleModalClose = () => {
    if (typeof window !== "undefined" && window.location.hash === "#resource") {
      window.history.back(); // This triggers popstate and closes it via our effect!
    } else {
      onClose();
    }
  };


  if (!isOpen || !resource) return null;

  const handleToggleFavorite = async () => {
    if (!user && !onJudgeOverride) {
      alert("Please sign in to favorite resources");
      return;
    }

    try {
      if (isFavorited && user) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("resource_id", resource?.id || "");

        if (error) throw error;
      } else if (user) {
        const { error } = await supabase.from("favorites").insert([
          {
            user_id: user.id,
            resource_id: resource?.id || "",
          },
        ]);

        if (error) throw error;
      }

      setIsFavorited(!isFavorited);
      if (onFavoriteToggled) {
        onFavoriteToggled();
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      setError("Failed to update favorite status");
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user && !onJudgeOverride) {
      alert("Please sign in to leave reviews");
      return;
    }

    if (newReview.trim().length < 10) {
      setError("Review must be at least 10 characters");
      return;
    }

    setLoadingSubmit(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("reviews").insert([
        {
          resource_id: resource.id,
          user_id: user?.id || "judge-override",
          rating: newRating,
          comment: newReview.trim(),
        },
      ]);

      if (insertError) throw insertError;

      // Refetch reviews
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("resource_id", resource.id)
        .order("created_at", { ascending: false });

      setReviews(data || []);
      setNewReview("");
      setNewRating(5);
      setHasUserReviewed(true);
    } catch (err) {
      console.error("Error submitting review:", err);
      setError("Failed to submit review");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleScrollReviews = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget as HTMLDivElement;
    // Hide indicator once user starts scrolling in the reviews section
    if (element.scrollTop > 10) {
      setShowScrollIndicator(false);
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={handleModalClose}
    >
      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resource-detail-title"
        className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "modalSlideIn 0.3s cubic-bezier(.16,1,.3,1) forwards",
        }}
      >
        {/* Hero Image Section */}
        <div className="relative">
          {resource.imageUrl ? (
            <div className="relative w-full h-48 sm:h-72">
              <Image
                src={resource.imageUrl}
                alt={resource.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px" 
                priority
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            </div>
          ) : (
            <div className="w-full h-48 sm:h-72 bg-linear-to-br from-[#997e67] to-[#8a6d5a] flex items-center justify-center">
              <span className="text-white/70 text-sm font-medium">No Image Available</span>
            </div>
          )}
          
          {/* Floating Close Button */}
          <button
            onClick={handleModalClose}
            aria-label="Close resource details"
            className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2.5 hover:bg-white transition-all shadow-lg cursor-pointer group"
          >
            <X className="w-5 h-5 text-gray-700 group-hover:text-gray-900 transition-colors" />
          </button>

          {/* Favorite Button - Floating */}
          {(user || onJudgeOverride) && (
            <button
              onClick={handleToggleFavorite}
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
              className={`absolute top-4 left-4 z-10 backdrop-blur-sm rounded-full p-2.5 transition-all shadow-lg cursor-pointer ${
                isFavorited 
                  ? "bg-red-500 hover:bg-red-600" 
                  : "bg-white/90 hover:bg-white"
              }`}
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isFavorited 
                    ? "fill-white text-white" 
                    : "text-gray-700 hover:text-red-500"
                }`}
              />
            </button>
          )}

          {/* Category Badge - Floating on Image */}
          <div className="absolute bottom-4 left-4 sm:left-6">
            <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-white/95 backdrop-blur-sm text-[#997e67] text-[10px] sm:text-xs font-semibold uppercase tracking-wider rounded-full shadow-md">
              {resource.category}
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {/* Content */}
          <div className="p-4 sm:p-6 md:p-8">
            {/* Title */}
            <h2 id="resource-detail-title" className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 leading-tight" style={{ color: "#000000" }}>
              {resource.title}
            </h2>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
              {resource.location && (
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 text-blue-700 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {resource.location}
                </div>
              )}
              {resource.address && (
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-50 text-emerald-700 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {resource.address}
                </div>
              )}
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium">
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {resource.views?.toLocaleString() || 0} views
              </div>
              {reviews.length > 0 && (
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-50 text-amber-700 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-500" />
                  {avgRating} ({reviews.length})
                </div>
              )}
            </div>

            {/* Directions Buttons */}
            {resource.latitude != null && resource.longitude != null && (
              <div className="flex gap-2 mb-6">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${resource.address ? encodeURIComponent(`${resource.address}, ${resource.location || 'New York'}, NY`) : `${resource.latitude},${resource.longitude}`}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#34A853] text-white rounded-lg text-sm font-bold shadow-md hover:bg-[#2c8d46] transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Google Maps Directions
                </a>
              </div>
            )}

            {/* Description Card */}
            <div className="bg-gray-50 rounded-xl p-4 sm:p-5 mb-6 sm:mb-8">
              <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2 sm:mb-3" style={{ color: "#000000" }}>About this resource</h3>
              <p className="leading-relaxed text-sm sm:text-base" style={{ color: "#000000" }}>
                {resource.description}
              </p>
            </div>

            {/* Reviews Section */}
            <div className="border-t border-gray-200 pt-4 sm:pt-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#997e67] flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold" style={{ color: "#000000" }}>Reviews</h3>
                    <p className="text-xs sm:text-sm" style={{ color: "#000000" }}>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
                  </div>
                </div>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-50 rounded-lg sm:rounded-xl">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 sm:w-4 sm:h-4 ${
                            i < Math.round(Number(avgRating))
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-sm sm:text-base" style={{ color: "#000000" }}>{avgRating}</span>
                  </div>
                )}
              </div>

              {/* Add Review Form */}
              {(user || onJudgeOverride) && !hasUserReviewed && (
                <form onSubmit={handleSubmitReview} className="mb-4 sm:mb-6 p-4 sm:p-5 bg-linear-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200">
                  <div className="mb-3 sm:mb-4">
                    <label className="block text-xs sm:text-sm font-semibold mb-2 sm:mb-3" style={{ color: "#000000" }}>
                      Your Rating
                    </label>
                    <div className="flex gap-0.5 sm:gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                          aria-pressed={star <= newRating}
                          className="p-1 sm:p-1.5 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 sm:w-7 sm:h-7 transition-all duration-200 ${
                              star <= newRating
                                ? "fill-amber-400 text-amber-400 scale-110"
                                : "text-gray-300 hover:text-amber-200"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-3" style={{ color: "#000000" }}>
                      Your Review
                    </label>
                    <textarea
                      value={newReview}
                      onChange={(e) => setNewReview(e.target.value)}
                      placeholder="Share your experience with this resource (min. 10 characters)"
                      aria-label="Write your review"
                      style={{ color: "#000000" }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#997e67] focus:border-transparent resize-none h-28 placeholder:text-gray-400 transition-shadow"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <span className="text-red-600 text-sm font-medium">{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loadingSubmit || newReview.trim().length < 10}
                    className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer ${
                      loadingSubmit || newReview.trim().length < 10
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-[#997e67] text-white hover:bg-[#8a6d5a] hover:shadow-lg active:scale-[0.98]"
                    }`}
                  >
                    {loadingSubmit ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              )}

              {(user || onJudgeOverride) && hasUserReviewed && (
                <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-emerald-700">
                    You&apos;ve already reviewed this resource
                  </p>
                </div>
              )}

              {/* Reviews List */}
              <div
                className="space-y-3 max-h-80 overflow-y-auto pr-1 relative"
                onScroll={handleScrollReviews}
              >
                {/* Scroll Indicator */}
                {showScrollIndicator && reviews.length > 2 && (
                  <div className="sticky top-0 left-0 right-0 flex justify-center py-2 bg-linear-to-b from-white to-transparent z-10">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-gray-500">
                      <span className="text-xs font-medium">Scroll for more</span>
                      <ChevronDown className="w-3 h-3 animate-bounce" />
                    </div>
                  </div>
                )}

                {loadingReviews ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-[#997e67] border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-gray-500 text-sm">Loading reviews...</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="font-medium mb-1" style={{ color: "#000000" }}>No reviews yet</p>
                    <p className="text-sm" style={{ color: "#000000" }}>Be the first to share your experience!</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-gray-50 hover:bg-gray-100/80 rounded-xl transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-linear-to-br from-[#997e67] to-[#8a6d5a] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                            {review.user_email?.charAt(0).toUpperCase() || "A"}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "#000000" }}>
                              {review.user_email || "Anonymous"}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(review.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg shadow-sm">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed pl-13" style={{ color: "#000000" }}>
                        {review.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalSlideIn {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .pl-13 {
          padding-left: 3.25rem;
        }
      `}</style>
    </div>
  );
}
