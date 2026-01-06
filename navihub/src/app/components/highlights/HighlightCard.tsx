import { Eye } from "lucide-react";

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
      {/* Gray background layer */}
      <div className="absolute inset-0 rounded-[36px] bg-gray-300" />

      {/* Main card */}
      <div className="relative rounded-[32px] bg-black shadow-lg p-6 flex flex-col">
        {/* Category */}
        <h3 className="text-xl font-semibold mb-4">{category}</h3>

        {/* Image */}
        {imageUrl && (
          <div className="mb-4">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-[120px] object-cover rounded-2xl"
            />
          </div>
        )}

        {/* Title */}
        <h4 className="text-lg font-semibold mb-2">{title}</h4>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-6 text-left min-h-[80px]">
          {description}
        </p>

        {/* Footer */}
        <div className="mt-auto flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-white">
            {views}
          </span>
        </div>
      </div>
    </div>
  );
}