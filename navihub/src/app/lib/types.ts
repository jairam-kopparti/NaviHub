// lib/types.ts
export type Resource = {
  id: string;
  title: string;
  category: string;
  description: string; // always string
  imageUrl: string;     // always string
  views: number;
};