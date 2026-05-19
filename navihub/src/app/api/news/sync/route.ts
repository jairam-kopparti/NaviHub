import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ── Server-only Supabase client (uses service role key) ─────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── GNews search queries for NYC-related news ───────────────
const LOCAL_QUERIES = [
  "New York City",
  "NYC community",
  "NYC transit",
  "NYC housing",
  "NYC education",
  "NYC public health",
];

const NATIONAL_QUERIES = [
  "United States",
  "US economy",
  "US policy",
  "US healthcare",
  "US education",
  "US infrastructure",
];

const INTERNATIONAL_QUERIES = [
  "World news",
  "global economy",
  "international relations",
  "climate summit",
  "global health",
  "humanitarian aid",
];

// ── Borough detection helper ────────────────────────────────
const BOROUGH_KEYWORDS: Record<string, string> = {
  manhattan: "Manhattan",
  brooklyn: "Brooklyn",
  bronx: "Bronx",
  queens: "Queens",
  "staten island": "Staten Island",
};

function detectBorough(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [keyword, borough] of Object.entries(BOROUGH_KEYWORDS)) {
    if (lower.includes(keyword)) return borough;
  }
  return null;
}

// ── Category detection helper ───────────────────────────────
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  community: ["community", "nonprofit", "volunteer", "neighborhood", "mutual aid"],
  politics: ["mayor", "council", "governor", "election", "legislation", "policy"],
  education: ["school", "university", "education", "student", "teacher", "college"],
  health: ["health", "hospital", "medical", "covid", "mental health", "clinic"],
  environment: ["climate", "environment", "park", "green", "sustainability", "pollution"],
  housing: ["housing", "rent", "apartment", "landlord", "tenant", "eviction", "shelter"],
  transit: ["subway", "mta", "bus", "transit", "commute", "traffic", "bridge", "tunnel"],
};

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "general";
}

// ── GNews article shape ─────────────────────────────────────
interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: { name: string; url: string };
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

// ── Rate-limit: simple in-memory tracker ────────────────────
let lastSyncAt = 0;
const SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 min cooldown

const TARGET_PER_TYPE = Math.max(
  10,
  Number(process.env.NEWS_SYNC_TARGET_PER_TYPE ?? "12")
);

const TARGET_TOTAL = Math.max(
  30,
  Number(process.env.NEWS_SYNC_TARGET ?? String(TARGET_PER_TYPE * 3))
);

function isAuthorized(request: Request): boolean {
  const cronHeader = request.headers.get("x-vercel-cron");
  if (cronHeader === "1") return true;

  const syncSecret = process.env.NEWS_SYNC_SECRET;
  if (!syncSecret) return true;

  const authHeader = request.headers.get("x-sync-secret");
  const querySecret = new URL(request.url).searchParams.get("secret");
  return authHeader === syncSecret || querySecret === syncSecret;
}

async function runNewsSync(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate-limit guard
  const now = Date.now();
  if (now - lastSyncAt < SYNC_COOLDOWN_MS) {
    const waitSec = Math.ceil((SYNC_COOLDOWN_MS - (now - lastSyncAt)) / 1000);
    return NextResponse.json(
      { error: `Rate limited. Try again in ${waitSec}s.` },
      { status: 429 }
    );
  }
  lastSyncAt = now;

  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GNEWS_API_KEY not configured" }, { status: 500 });
  }

  // Delete articles older than 14 days to keep the database fresh
  const deleteThreshold = new Date();
  deleteThreshold.setDate(deleteThreshold.getDate() - 14);
  const { error: deleteError } = await supabaseAdmin
    .from("news")
    .delete()
    .lt("published_at", deleteThreshold.toISOString());

  if (deleteError) {
    console.error("Failed to delete old articles:", deleteError);
  }

  // Date range: last 7 days
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);
  const fromISO = fromDate.toISOString().split("T")[0];

  let totalFetched = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  const QUERY_GROUPS: Array<{ type: "local" | "national" | "international"; queries: string[] }> = [
    { type: "local", queries: LOCAL_QUERIES },
    { type: "national", queries: NATIONAL_QUERIES },
    { type: "international", queries: INTERNATIONAL_QUERIES },
  ];

  for (const group of QUERY_GROUPS) {
    let insertedForType = 0;

    for (const query of group.queries) {
      if (insertedForType >= TARGET_PER_TYPE || totalInserted >= TARGET_TOTAL) break;

      try {
        const url = new URL("https://gnews.io/api/v4/search");
        url.searchParams.set("q", query);
        url.searchParams.set("lang", "en");
        if (group.type !== "international") {
          url.searchParams.set("country", "us");
        }

        const remainingForType = Math.max(TARGET_PER_TYPE - insertedForType, 1);
        const remainingTotal = Math.max(TARGET_TOTAL - totalInserted, 1);
        const perQueryLimit = Math.min(12, remainingForType, remainingTotal);

        url.searchParams.set("max", String(perQueryLimit));
        url.searchParams.set("from", fromISO);
        url.searchParams.set("apikey", apiKey);

        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok) {
          errors.push(`GNews query "${query}" failed: ${res.status}`);
          continue;
        }

        const data: GNewsResponse = await res.json();
        totalFetched += data.articles?.length ?? 0;

        if (!data.articles?.length) continue;

        const rows = data.articles.map((a) => {
          const combined = `${a.title} ${a.description} ${a.content ?? ""}`;
          return {
            title: a.title,
            description: a.description,
            content: a.content || null,
            url: a.url,
            image_url: a.image || null,
            source_name: a.source?.name || null,
            published_at: a.publishedAt,
            borough: detectBorough(combined),
            category: detectCategory(combined),
            news_type: group.type,
          };
        });

        const { data: inserted, error: upsertErr } = await supabaseAdmin
          .from("news")
          .upsert(rows, { onConflict: "url", ignoreDuplicates: true })
          .select("id");

        if (upsertErr) {
          errors.push(`Upsert error for "${query}": ${upsertErr.message}`);
          continue;
        }

        const insertedCount = inserted?.length ?? 0;
        totalInserted += insertedCount;
        insertedForType += insertedCount;
        totalSkipped += rows.length - insertedCount;

        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err) {
        errors.push(`Exception for "${query}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  return NextResponse.json({
    success: true,
    fetched: totalFetched,
    inserted: totalInserted,
    skipped: totalSkipped,
    targetTotal: TARGET_TOTAL,
    targetPerType: TARGET_PER_TYPE,
    errors: errors.length ? errors : undefined,
    syncedAt: new Date().toISOString(),
  });
}

// ── POST /api/news/sync ─────────────────────────────────────
export async function POST(request: Request) {
  return runNewsSync(request);
}

// ── GET /api/news/sync (cron-friendly) ──────────────────────
export async function GET(request: Request) {
  return runNewsSync(request);
}
