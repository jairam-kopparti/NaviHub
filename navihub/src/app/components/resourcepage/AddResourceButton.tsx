"use client";

import { useState } from "react";
import { X, Loader } from "lucide-react";
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
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Modal Card */}
      <div
        className="relative bg-[var(--surface)] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "zoomIn 0.4s cubic-bezier(.34,.1,.68,1) forwards",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors shadow-md"
        >
          <X className="w-5 h-5 text-black" />
        </button>

        {/* Content */}
        <div className="p-8">
          <h2 className="text-3xl font-semibold mb-6" style={{ color: "#1F1F1F" }}>
            Add Resource
          </h2>

          {success ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">✓</div>
              <p className="text-lg font-semibold" style={{ color: "#997e67" }}>
                Resource added successfully!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "#1F1F1F" }}>
                  Resource Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter resource title"
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#997e67] placeholder:text-gray-400"
                  style={{ color: "#1F1F1F" }}
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "#1F1F1F" }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#997e67] bg-white"
                  style={{ color: "#1F1F1F" }}
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image URL Input */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "#1F1F1F" }}>
                  Image URL <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#997e67] placeholder:text-gray-400"
                  style={{ color: "#1F1F1F" }}
                />
              </div>

              {/* Description Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold" style={{ color: "#1F1F1F" }}>
                    Description
                  </label>
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: isDescriptionValid ? "#997e67" : "#999",
                    }}
                  >
                    {wordCount} words (min. 15)
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter resource description (minimum 15 words)"
                  className="w-full px-4 py-3 border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#997e67] resize-none placeholder:text-gray-400 h-32"
                  style={{ color: "#1F1F1F" }}
                />
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-sm font-medium" style={{ color: "#d32f2f" }}>
                  {error}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || loading}
                className={`w-full py-3 rounded-xl font-semibold transition-all mt-4 ${
                  isFormValid && !loading
                    ? "bg-[#997e67] text-white hover:bg-[#8a6d5a]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    Adding...
                  </div>
                ) : (
                  "Add Resource"
                )}
              </button>
            </form>
          )}
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
