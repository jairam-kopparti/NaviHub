import { Resource } from "./types"; 
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getTopResources(): Promise<Resource[]> {
  const { data, error } = await supabase
    .from("resources")
    .select("id, title, category, description, image_url, views")
    .order("views", { ascending: false })
    .limit(9);

  if (error) return [];

  return data?.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    description: r.description ?? "",
    imageUrl: r.image_url ?? "",
    views: r.views ?? 0,
  })) ?? [];
}
