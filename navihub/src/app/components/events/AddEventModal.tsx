"use client";

import { useState, useEffect } from "react";
import { X, Loader, Calendar, Clock, MapPin, Tag, Users, CheckCircle, AlignLeft } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../lib/useUser";

const CATEGORIES = [
  { value: "sports", label: "Sports" },
  { value: "social", label: "Social" },
  { value: "education", label: "Education" },
  { value: "volunteer", label: "Volunteer" },
  { value: "workshops", label: "Workshops" },
  { value: "community_meetings", label: "Community" },
  { value: "other", label: "Other" },
];

const BOROUGHS = [
  "Manhattan",
  "Brooklyn",
  "Queens",
  "Bronx",
  "Staten Island",
];

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddEventModal({
  isOpen,
  onClose,
  onSuccess,
}: AddEventModalProps) {
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [borough, setBorough] = useState("Manhattan");
  const [capacity, setCapacity] = useState("");
  const [isVirtual, setIsVirtual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const wordCount = description.trim().split(/\s+/).filter(w => w.length > 0).length;
  const isFormValid = title.trim() !== "" && category !== "" && date !== "" && startTime !== "" && endTime !== "" && wordCount >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!title.trim()) throw new Error("Title is required");
      if (!category) throw new Error("Category is required");
      if (!date || !startTime || !endTime) throw new Error("Date and times are required");
      if (wordCount < 10) throw new Error("Description must be at least 10 words");

      const creatorName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Community Member";

      const moderationResponse = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `${title}\n${description}` }),
      });
      const moderationResult = await moderationResponse.json();

      if (!moderationResult.safe) {
        throw new Error(moderationResult.message || "Content contains inappropriate material");
      }

      const { error: insertError } = await supabase
        .from("events")
        .insert([
          {
            title: title.trim(),
            category,
            description: description.trim(),
            event_date: date,
            start_time: startTime,
            end_time: endTime,
            location_name: isVirtual ? "Virtual" : locationName.trim(),
            address: isVirtual ? "" : `${locationName.trim()}, ${borough}, NY`,
            is_virtual: isVirtual,
            capacity: capacity ? parseInt(capacity) : null,
            spots_taken: 0,
            signup_required: true,
            status: "pending",
            user_id: user?.id,
            creator_name: creatorName
          },
        ]);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        setTitle("");
        setCategory("");
        setDate("");
        setStartTime("");
        setEndTime("");
        setDescription("");
        setLocationName("");
        setBorough("Manhattan");
        setCapacity("");
        setIsVirtual(false);
        setSuccess(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add event");
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
        role="dialog"
        className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "modalSlideIn 0.3s cubic-bezier(.16,1,.3,1) forwards",
        }}
      >
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-[#997e67] to-[#8a6d5a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">Create an Event</h2>
                <p className="text-white/70 text-sm">Host an activity for your community</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {success ? (
             <div className="text-center py-16">
               <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                 <CheckCircle className="w-10 h-10 text-emerald-500" />
               </div>
               <h3 className="text-xl font-bold !text-gray-900 mb-2">Success!</h3>
               <p className="!text-gray-600">Your event has been submitted and is pending approval.</p>
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-black" style={{ color: "#000000" }}>
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Central Park Cleanup"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#997e67] focus:border-transparent text-black"
                  style={{ color: "#000000" }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-black" style={{ color: "#000000" }}>
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#997e67] focus:border-transparent text-black"
                    style={{ color: "#000000" }}
                  >
                    <option value="" style={{ color: "#000000" }}>Select Category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value} style={{ color: "#000000" }}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-black" style={{ color: "#000000" }}>
                    Max Capacity (Optional)
                  </label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="e.g. 50"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#997e67] focus:border-transparent text-black"
                    style={{ color: "#000000" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-black" style={{ color: "#000000" }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#997e67] focus:border-transparent text-black"
                    style={{ color: "#000000" }}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-black" style={{ color: "#000000" }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#997e67] focus:border-transparent text-black"
                    style={{ color: "#000000" }}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-black" style={{ color: "#000000" }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#997e67] focus:border-transparent text-black"
                    style={{ color: "#000000" }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="isVirtual"
                  checked={isVirtual}
                  onChange={(e) => setIsVirtual(e.target.checked)}
                  className="w-4 h-4 text-[#997e67] focus:ring-[#997e67] border-gray-300 rounded"
                />
                <label htmlFor="isVirtual" className="text-sm font-semibold text-black cursor-pointer" style={{ color: "#000000" }}>
                  This is a virtual event
                </label>
              </div>

              {!isVirtual && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-black" style={{ color: "#000000" }}>
                    Location / Venue Name
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. Central Park"
                    required={!isVirtual}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#997e67] focus:border-transparent text-black"
                    style={{ color: "#000000" }}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-black" style={{ color: "#000000" }}>
                    Borough
                  </label>
                  <select
                    value={borough}
                    onChange={(e) => setBorough(e.target.value)}
                    required={!isVirtual}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#997e67] focus:border-transparent text-black"
                    style={{ color: "#000000" }}
                  >
                    {BOROUGHS.map((b) => (
                      <option key={b} value={b} style={{ color: "#000000" }}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-black" style={{ color: "#000000" }}>
                <AlignLeft className="w-4 h-4 text-[#997e67]" />
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail your event..."
                required
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#997e67] focus:border-transparent text-black resize-none"
                style={{ color: "#000000" }}
              />
            </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <div className="pt-2 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-[#997e67] to-[#8a6d5a] hover:opacity-90 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : "Submit for Approval"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const AlertCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
)