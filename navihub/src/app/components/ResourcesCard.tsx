"use client";

import { Eye } from "lucide-react";

interface ResourcesCardProps {
  category: string;
  title: string;
  description: string;
  imageUrl?: string;
  views?: number;
}

export function ResourcesCard({
  category,
  title,
  description,
  imageUrl,
  views,
}: ResourcesCardProps) {
  return (
    <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] p-4 flex flex-col gap-3 hover:shadow-sm transition">
      {/* Image or Placeholder */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-[120px] object-cover rounded-lg"
        />
      ) : (
        <div className="w-full h-[120px] bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
          <span className="text-gray-500 text-sm font-medium">Image Not Available</span>
        </div>
      )}

      {/* Category */}
      <span className="text-xs font-semibold uppercase tracking-wide text-(--secondary-text)">
        {category}
      </span>

      {/* Title */}
      <h3 className="text-(--secondary-text) font-semibold">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-(--secondary-text) line-clamp-3">
        {description}
      </p>

      {/* Footer */}
      <div className="mt-auto flex items-center gap-2 text-(--secondary-text)">
        <Eye className="w-4 h-4" />
        <span>{views}</span>
      </div>
    </div>
  );
}
