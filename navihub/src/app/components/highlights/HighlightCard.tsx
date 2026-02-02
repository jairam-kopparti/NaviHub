import { Eye } from "lucide-react";
import Image from "next/image";

interface HighlightsCardProps {
  category: string;
  title: string;
  description: string;
  imageUrl?: string;
  views?: number;
}

export default function HighlightsCard({
  category,
  title,
  description,
  imageUrl,
  views,

}: HighlightsCardProps) {
  return (
    <div className="relative w-[336px] p-2">
      <div className="absolute inset-0 rounded-[36px] bg-gray-300" />

      <div className="relative rounded-[32px] bg-(--surface) shadow-lg p-6 flex flex-col">
        <h3 className="text-xl font-semibold mb-4 text-(--secondary-text)">{category}</h3>

        <div className="mb-4">
          {imageUrl ? (
            <div className="relative w-full h-[160px]">
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover rounded-2xl"
                sizes="(max-width: 768px) 100vw, 300px" 
              />
            </div>
          ) : (
            <div className="w-full h-[160px] bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center">
              <span className="text-gray-500 text-sm font-medium">Image Not Available</span>
            </div>
          )}
        </div>

        <h4 className="text-lg font-semibold mb-2 text-(--secondary-text)">{title}</h4>

        <div className="mt-auto flex items-center gap-2">
          <Eye className="w-5 h-5 text-(--secondary-text)" />
          <span className="text-sm font-medium text-(--secondary-text)">
            {views}
          </span>
        </div>
      </div>
    </div>
  );
}
