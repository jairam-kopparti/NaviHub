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
      className="relative w-full h-[22rem] md:h-[26rem] lg:h-[28rem] bg-[#FFFFFA] rounded-3xl p-6 border border-[#eae0d5]/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(153,126,103,0.12)] transition-all cursor-pointer flex flex-col group overflow-hidden"
      onClick={handleClick}
    >
      {/* Category Card Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#997e67] to-[#CCBEB1] z-10" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#997e67]/5 to-transparent rounded-bl-full pointer-events-none transition-opacity opacity-0 group-hover:opacity-100" />

      <h3 className="text-sm md:text-base font-bold uppercase tracking-wider mb-4 text-[#997e67] z-10 relative">{category}</h3>

      <div className="mb-4 relative z-10">
        {imageUrl ? (
          <div className="relative w-full h-[8rem] sm:h-[9rem] md:h-[12rem] lg:h-[13rem]">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover rounded-2xl border border-[#eae0d5]/50"
              sizes="(max-width: 768px) 100vw, 300px" 
            />
          </div>
        ) : (
          <div className="w-full h-[8rem] sm:h-[9rem] md:h-[12rem] lg:h-[13rem] bg-[#fdfaf7] border border-[#eae0d5]/50 rounded-2xl flex items-center justify-center">
            <span className="text-gray-500 text-sm md:text-base font-medium">Image Not Available</span>
          </div>
        )}
      </div>

      <h4 className="text-lg md:text-xl font-bold text-[#4a3b32] leading-snug line-clamp-2 z-10 relative group-hover:text-[#997e67] transition-colors">
        {title}
      </h4>

      <div className="mt-auto flex items-center justify-between z-10 relative pt-3">
        <div className="flex items-center gap-1.5 bg-[#fdfaf7] px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-[#eae0d5]/50">
          <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#997e67]" />
          <span className="text-xs md:text-sm font-semibold text-[#6b5a4e]">
            {views} Views
          </span>
        </div>
      </div>
    </div>
  );
}
