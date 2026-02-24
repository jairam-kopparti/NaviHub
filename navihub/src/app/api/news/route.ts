import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── GET /api/news ───────────────────────────────────────────
// Query cached news from Supabase with optional filters.
//
// Query params:
//   borough   – filter by borough name
//   category  – filter by category
//   limit     – articles per page (default 20, max 100)
//   offset    – pagination offset (default 0)
//   search    – full-text search on title/description
// ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const borough = searchParams.get("borough");
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
  const offset = Number(searchParams.get("offset")) || 0;

  let query = supabaseAdmin
    .from("news")
    .select("*", { count: "exact" })
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (borough) {
    query = query.eq("borough", borough);
  }

  if (category) {
    query = query.eq("category", category);
  }

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    articles: data ?? [],
    total: count ?? 0,
    limit,
    offset,
  });
}
