import { supabase } from "./supabaseClient";

type Resource = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  imageUrl: string | null;
  views: number;
};

export async function getTopResources(): Promise<Resource[]> {
  const { data, error } = await supabase
    .from("resources")
    .select("id, title, category, description, image_url, views")
    .order("views", { ascending: false });

  if (error || !data) {
    console.error("Error fetching resources:", error);
    return [];
  }

  const byCategory = new Map<string, Resource>();

  for (const resource of data) {
    if (!byCategory.has(resource.category)) {
      byCategory.set(resource.category, {
        id: resource.id,
        title: resource.title,
        category: resource.category,
        description: resource.description,
        imageUrl: resource.image_url,
        views: resource.views,
      });
    }
  }

  return Array.from(byCategory.values()).slice(0, 9);
}