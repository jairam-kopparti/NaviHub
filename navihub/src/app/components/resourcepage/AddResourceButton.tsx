"use client";

import { useState } from "react";
import { X, Loader, FileText, Tag, MapPin, Image as ImageIcon, AlignLeft, Plus, CheckCircle } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

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

const BOROUGHS = [
  "Manhattan",
  "Brooklyn",
  "Queens",
  "Bronx",
  "Staten Island",
];

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddResourceModal({
  isOpen,
  onClose,
  onSuccess,
}: AddResourceModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("Manhattan");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  const wordCount = description.trim().split(/\s+/).filter(w => w.length > 0).length;
  const isDescriptionValid = wordCount >= 15;
  const isFormValid = title.trim() !== "" && category !== "" && isDescriptionValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!title.trim()) {
        throw new Error("Title is required");
      }
      if (!category) {
        throw new Error("Category is required");
      }
      if (wordCount < 15) {
        throw new Error("Description must be at least 15 words");
      }

      const { error: insertError, data } = await supabase
        .from("resources")
        .insert([
          {
            title: title.trim(),
            category,
            description: description.trim(),
            image_url: imageUrl.trim() || "",
            location: location,
            views: 0,
          },
        ]);

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        console.error("Error message:", insertError.message);
        console.error("Error details:", insertError.details);
        console.error("Error hint:", insertError.hint);
        console.error("Error code:", insertError.code);
        throw insertError;
      }
      console.log("Insert successful, data:", data);

      setSuccess(true);
      setTimeout(() => {
        setTitle("");
        setCategory("");
        setLocation("Manhattan");
        setDescription("");
        setImageUrl("");
        setSuccess(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add resource";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "modalSlideIn 0.3s cubic-bezier(.16,1,.3,1) forwards",
        }}
      >
        <div className="px-6 py-5 border-b border-gray-100 bg-linear-to-r from-[#997e67] to-[#8a6d5a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Add Resource</h2>
                <p className="text-white/70 text-sm">Share a helpful resource with the community</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div 
          className="flex-1 overflow-y-auto p-6"
          onScroll={(e) => {
            const element = e.currentTarget;
            const hasMoreContent = element.scrollHeight > element.clientHeight;
            const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 10;
            setShowScrollIndicator(hasMoreContent && !isAtBottom);
          }}
        >
          {success ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
              <p className="text-gray-600">
                Your resource has been added successfully.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: "#000000" }}>
                  <FileText className="w-4 h-4 text-[#997e67]" />
                  Resource Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a descriptive title"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#997e67] focus:border-transparent placeholder:text-gray-400 bg-gray-50 hover:bg-white transition-colors"
                  style={{ color: "#000000" }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: "#000000" }}>
                    <Tag className="w-4 h-4 text-[#997e67]" />
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#997e67] focus:border-transparent bg-gray-50 hover:bg-white transition-colors cursor-pointer appearance-none"
                    style={{ color: category ? "#000000" : "#9ca3af", backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em', paddingRight: '2.5rem' }}
                  >
                    <option value="" className="text-gray-400">Select a category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} style={{ color: "#000000" }}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: "#000000" }}>
                    <MapPin className="w-4 h-4 text-[#997e67]" />
                    Borough
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#997e67] focus:border-transparent bg-gray-50 hover:bg-white transition-colors cursor-pointer appearance-none"
                    style={{ color: "#000000", backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em', paddingRight: '2.5rem' }}
                  >
                    {BOROUGHS.map((borough) => (
                      <option key={borough} value={borough} style={{ color: "#000000" }}>
                        {borough}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: "#000000" }}>
                  <ImageIcon className="w-4 h-4 text-[#997e67]" />
                  Image URL
                  <span className="text-xs font-normal text-gray-500 ml-1">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#997e67] focus:border-transparent placeholder:text-gray-400 bg-gray-50 hover:bg-white transition-colors"
                  style={{ color: "#000000" }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#000000" }}>
                    <AlignLeft className="w-4 h-4 text-[#997e67]" />
                    Description
                  </label>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      isDescriptionValid 
                        ? "bg-emerald-100 text-emerald-700" 
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {wordCount}/15 words
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this resource and how it can help community members (minimum 15 words)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#997e67] focus:border-transparent resize-none placeholder:text-gray-400 bg-gray-50 hover:bg-white transition-colors h-32"
                  style={{ color: "#000000" }}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <X className="w-3 h-3 text-red-600" />
                  </div>
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!isFormValid || loading}
                className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                  isFormValid && !loading
                    ? "bg-[#997e67] text-white hover:bg-[#8a6d5a] hover:shadow-lg active:scale-[0.98]"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Adding Resource...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add Resource
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {showScrollIndicator && !success && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-white via-white/80 to-transparent pointer-events-none flex items-end justify-center pb-3">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-gray-500 text-xs font-medium animate-bounce">
              <span>Scroll for more</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7" />
              </svg>
            </div>
          </div>
        )}
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
      `}</style>
    </div>
  );
}

