// lib/types.ts
export type Resource = {
  id: string;
  title: string;
  category: string;
  description: string; // always string
  imageUrl: string;     // always string
  views: number;
  location?: "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island";
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