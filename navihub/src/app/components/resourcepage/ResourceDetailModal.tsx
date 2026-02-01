"use client";

import { useState, useEffect } from "react";
import { X, Heart, Star, ChevronDown } from "lucide-react";
import { Resource, Review } from "../../lib/types";
import { supabase } from "../../lib/supabaseClient";

interface ResourceDetailModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
  user: { id: string } | null;
  onJudgeOverride?: boolean;
}

export default function ResourceDetailModal({
  resource,
  isOpen,
  onClose,
  user,
  onJudgeOverride = false,
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
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Modal Card */}
      <div
        className="relative bg-(--surface) rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "zoomIn 0.4s cubic-bezier(.34,.1,.68,1) forwards",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors shadow-md cursor-pointer"
        >
          <X className="w-5 h-5 text-black" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {/* Image */}
          {resource.imageUrl ? (
            <div
              className="w-full h-64 bg-cover bg-center"
              style={{ backgroundImage: `url(${resource.imageUrl})` }}
            />
          ) : (
            <div className="w-full h-64 bg-linear-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <span className="text-gray-500 text-sm font-medium">Image Not Available</span>
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            {/* Header with Title and Favorite Button */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-(--secondary-text) block mb-2">
                  {resource.category}
                </span>
                <h2 className="text-3xl font-semibold" style={{ color: "#1F1F1F" }}>
                  {resource.title}
                </h2>
              </div>
              {(user || onJudgeOverride) && (
                <button
                  onClick={handleToggleFavorite}
                  className="mt-2 p-3 rounded-full hover:bg-gray-100 transition-colors shrink-0"
                >
                  <Heart
                    className="w-6 h-6"
                    fill={isFavorited ? "#d32f2f" : "none"}
                    stroke={isFavorited ? "#d32f2f" : "currentColor"}
                  />
                </button>
              )}
            </div>

            {/* Location and Stats */}
            <div className="flex gap-4 mb-6 text-sm">
              {resource.location && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                  📍 {resource.location}
                </span>
              )}
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
                👁️ {resource.views} views
              </span>
            </div>

            {/* Description */}
            <p className="text-base mb-6" style={{ color: "#333" }}>
              {resource.description}
            </p>

            {/* Reviews Section */}
            <div className="mt-8 pt-8 border-t border-(--border)">
              <h3 className="text-2xl font-semibold mb-4" style={{ color: "#1F1F1F" }}>
                Reviews ({reviews.length})
              </h3>

              {/* Rating Summary */}
              {reviews.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.round(Number(avgRating))
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold">{avgRating}/5</span>
                    <span className="text-gray-600">({reviews.length} reviews)</span>
                  </div>
                </div>
              )}

              {/* Add Review Form */}
              {(user || onJudgeOverride) && !hasUserReviewed && (
                <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="mb-3">
                    <label className="block text-sm font-semibold mb-2" style={{ color: "#1F1F1F" }}>
                      Your Rating
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="p-1"
                        >
                          <Star
                            className={`w-6 h-6 cursor-pointer transition ${
                              star <= newRating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-semibold mb-2" style={{ color: "#1F1F1F" }}>
                      Your Review
                    </label>
                    <textarea
                      value={newReview}
                      onChange={(e) => setNewReview(e.target.value)}
                      placeholder="Share your experience with this resource (min. 10 characters)"
                      className="w-full px-3 py-2 border border-(--border) rounded-lg focus:outline-none focus:ring-2 focus:ring-[#997e67] resize-none h-24"
                      style={{ color: "#1F1F1F" }}
                    />
                  </div>

                  {error && (
                    <p className="text-sm font-medium mb-3" style={{ color: "#d32f2f" }}>
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loadingSubmit || newReview.trim().length < 10}
                    className={`w-full py-2 rounded-lg font-semibold transition ${
                      loadingSubmit || newReview.trim().length < 10
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-[#997e67] text-white hover:bg-[#8a6d5a]"
                    }`}
                  >
                    {loadingSubmit ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              )}

              {(user || onJudgeOverride) && hasUserReviewed && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm font-semibold" style={{ color: "#1976d2" }}>
                    ✓ You&apos;ve already reviewed this resource
                  </p>
                </div>
              )}

              {/* Reviews List */}
              <div
                className="space-y-4 max-h-96 overflow-y-auto pr-2 relative"
                onScroll={handleScrollReviews}
              >
                {/* Scroll Indicator */}
                {showScrollIndicator && reviews.length > 2 && (
                  <div className="sticky top-0 left-0 right-0 flex justify-center py-2 bg-linear-to-b from-(--surface) to-transparent z-10">
                    <div className="flex flex-col items-center gap-1 text-gray-500">
                      <span className="text-xs font-medium">Scroll for reviews</span>
                      <ChevronDown className="w-4 h-4 animate-bounce" />
                    </div>
                  </div>
                )}

                {loadingReviews ? (
                  <p className="text-center text-gray-500 py-4">Loading reviews...</p>
                ) : reviews.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No reviews yet. Be the first to review!</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="p-4 border border-(--border) rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#997e67] rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {review.user_email?.charAt(0).toUpperCase() || "J"}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "#1F1F1F" }}>
                              {review.user_email || "Anonymous"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm" style={{ color: "#333" }}>
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
