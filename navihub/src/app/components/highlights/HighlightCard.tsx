"use client";

import Image from "next/image";
import { Eye } from "lucide-react";

type HighlightCardProps = {
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  views: number;
};

export default function HighlightCard({
  title,
  category,
  description,
  imageUrl,
  views,
}: HighlightCardProps) {
  return (
    <div
        className="
            flex
            w-full
            max-w-4xl
            h-[260px]
            bg-(--bg)
            rounded-2xl
            overflow-hidden
            shadow-sm
            transition
            duration-300
            hover:shadow-md
            hover:-translate-y-1
        "
    >

      {/* Image (Left) */}
      <div className="relative w-[40%] h-full">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
        />
      </div>

      {/* Content (Right) */}
      <div className="flex flex-col justify-between p-6 w-[60%]">
        {/* Top content */}
        <div>
          <h3 className="text-2xl font-semibold text-(--primary-text)">
            {title}
          </h3>

          <p className="mt-1 text-sm uppercase tracking-wide text-(--secondary-text)">
            {category}
          </p>

          <p className="mt-3 text-(--primary-text)/80 line-clamp-3">
            {description}
          </p>
        </div>

        {/* Views */}
        <div className="flex items-center justify-end gap-2 text-sm text-(--secondary-text)">
          <Eye className="w-4 h-4" />
          <span>{views.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
