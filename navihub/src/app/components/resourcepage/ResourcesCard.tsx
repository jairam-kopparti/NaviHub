"use client";

import { Eye, Heart } from "lucide-react";

interface ResourcesCardProps {
  category: string;
  title: string;
  description?: string;
  imageUrl?: string;
  views?: number;
  isFavorited?: boolean;
}

export function ResourcesCard({
  category,
  title,
  description,
  imageUrl,
  views,
  isFavorited = false,
}: ResourcesCardProps) {
  return (
    <div className="relative border border-(--border) rounded-xl bg-(--surface) p-4 flex flex-col gap-3 hover:shadow-sm transition h-full">
      <div className="relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-30 object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-30 bg-linear-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
            <span className="text-gray-500 text-sm font-medium">Image Not Available</span>
          </div>
        )}
        {isFavorited && (
          <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow-md z-10">
            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
          </div>
        )}
      </div>

      <span className="text-xs font-semibold uppercase tracking-wide text-(--secondary-text)">
        {category}
      </span>

      <h3 className="text-(--secondary-text) font-semibold">
        {title}
      </h3>

      {description && (
        <p className="text-sm line-clamp-3" style={{ color: "#1F1F1F" }}>
          {description}
        </p>
      )}

      <div className="mt-auto flex items-center gap-2 text-(--secondary-text)">
        <Eye className="w-4 h-4" />
        <span>{views}</span>
      </div>
    </div>
  );
}

