
export type Borough = "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island";

export type Resource = {
  id: string;
  title: string;
  category: string;
  description: string; 
  imageUrl: string;     
  views: number;
  location?: Borough;
  address?: string;
  latitude?: number;
  longitude?: number;
  resource_type?: string;
  isFavorited?: boolean;
  reviewCount?: number;
  avgRating?: number;
};

export type Review = {
  id: string;
  resource_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
};

export type Favorite = {
  id: string;
  user_id: string;
  resource_id: string;
  created_at: string;
};

// ── News Article (GNews cache) ──────────────────────────────
export type NewsArticle = {
  id: string;
  title: string;
  description: string;
  content: string | null;
  url: string;
  image_url: string | null;
  source_name: string | null;
  published_at: string;
  borough: Borough | null;
  category: string | null;
  created_at: string;
};

export type NewsCategory =
  | "general"
  | "community"
  | "politics"
  | "education"
  | "health"
  | "environment"
  | "housing"
  | "transit";

export const NEWS_CATEGORIES: { value: NewsCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "community", label: "Community" },
  { value: "politics", label: "Politics" },
  { value: "education", label: "Education" },
  { value: "health", label: "Health" },
  { value: "environment", label: "Environment" },
  { value: "housing", label: "Housing" },
  { value: "transit", label: "Transit" },
];
