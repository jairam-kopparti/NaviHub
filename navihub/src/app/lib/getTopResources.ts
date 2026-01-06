import { supabase } from "./supabaseClient";

export async function getTopResources() {
  const { data, error } = await supabase
    .from("resources")
    .select("id, title, category, description, image_url, views")
    .order("views", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Error fetching top resources:", error);
    return [];
  }

  // Map to frontend-friendly shape
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    description: r.description,
    imageUrl: r.image_url,
    views: r.views,
  }));
}