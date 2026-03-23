"use client";

import { Eye } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface HighlightsCardProps {
  id: string;
  category: string;
  title: string;
  description: string;
  imageUrl?: string;
  views?: number;
}

export default function HighlightsCard({
  id,
  category,
  title,
  description,
  imageUrl,
  views,
}: HighlightsCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (id) {
      sessionStorage.setItem("openResourceId", id);
      router.push("/pages/resources");
    }
  };

  return (
    <div 
      className="relative w-full p-2 cursor-pointer transition-transform hover:scale-[1.02]"
      onClick={handleClick}
    >
      <div className="absolute inset-0 rounded-[2.25rem] bg-gray-300" />

      <div className="relative rounded-[2rem] bg-(--surface) shadow-lg p-6 flex flex-col">
        <h3 className="text-xl font-semibold mb-4 text-(--secondary-text)">{category}</h3>

        <div className="mb-4">
          {imageUrl ? (
            <div className="relative w-full h-[10rem]">
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover rounded-2xl"
                sizes="(max-width: 768px) 100vw, 300px" 
              />
            </div>
          ) : (
            <div className="w-full h-[10rem] bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center">
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
