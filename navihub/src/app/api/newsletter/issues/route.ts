import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/src/app/lib/newsletter";

export async function GET(request: NextRequest) {
  const supabase = createSupabaseAdminClient();

  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? "8"), 20);
  const offset = Number(request.nextUrl.searchParams.get("offset") ?? "0");
  const slug = request.nextUrl.searchParams.get("slug");

  let query = supabase
    .from("newsletter_issues")
    .select("id, issue_date, slug, title, summary, hero_image_url, sections, stats, published_at", {
      count: "exact",
    })
    .order("issue_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (slug) {
    query = query.eq("slug", slug).limit(1);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    issues: data ?? [],
    total: count ?? 0,
    limit,
    offset,
  });
}
