import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type NewsletterMode = "universal" | "personalized";
export type DeliveryChannel = "email" | "web" | "both";

export interface NewsletterSubscriptionRow {
  id: string;
  user_id: string | null;
  email: string;
  display_name: string | null;
  status: "active" | "paused" | "unsubscribed";
  frequency: "weekly_monday";
  newsletter_mode: NewsletterMode;
  delivery_channel: DeliveryChannel;
}

export interface NewsletterPreferenceInput {
  favoriteBoroughs?: string[];
  favoriteCategories?: string[];
  wantsEvents?: boolean;
  wantsResources?: boolean;
  wantsReviews?: boolean;
  wantsNews?: boolean;
  wantsLatestPosts?: boolean;
}

export interface NewsletterPreferenceRow {
  subscription_id: string;
  favorite_boroughs: string[];
  favorite_categories: string[];
  wants_events: boolean;
  wants_resources: boolean;
  wants_reviews: boolean;
  wants_news: boolean;
  wants_latest_posts: boolean;
}

export interface NewsletterEventItem {
  id: string;
  title: string;
  description: string;
  category: string;
  eventDate: string;
  startTime: string;
  locationName: string;
  href: string;
}

export interface NewsletterResourceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  imageUrl: string;
  views: number;
  avgRating: number;
  reviewCount: number;
  href: string;
}

export interface NewsletterNewsItem {
  id: string;
  title: string;
  description: string;
  category: string;
  borough: string;
  sourceName: string;
  publishedAt: string;
  url: string;
  imageUrl: string;
}

export interface NewsletterPostItem {
  title: string;
  postType: "event" | "resource" | "news";
  publishedAt: string;
  href: string;
}

export interface NewsletterSections {
  highlights: string[];
  events: NewsletterEventItem[];
  resources: NewsletterResourceItem[];
  topRatedResources: NewsletterResourceItem[];
  news: NewsletterNewsItem[];
  latestPosts: NewsletterPostItem[];
}

interface NewsletterBaseContent {
  events: NewsletterEventItem[];
  resources: NewsletterResourceItem[];
  news: NewsletterNewsItem[];
  latestPosts: NewsletterPostItem[];
}

export interface PersonalizationSignals {
  categories: string[];
  boroughs: string[];
}

const PAGE_EVENTS_HREF = "/pages/events";
const PAGE_RESOURCES_HREF = "/pages/resources";
const PAGE_NEWS_HREF = "/pages/news";

const DEFAULT_PREFERENCES: Required<NewsletterPreferenceInput> = {
  favoriteBoroughs: [],
  favoriteCategories: [],
  wantsEvents: true,
  wantsResources: true,
  wantsReviews: true,
  wantsNews: true,
  wantsLatestPosts: true,
};

function safeString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeSet(values: string[] | undefined): Set<string> {
  return new Set(
    (values ?? [])
      .map((value) => value.toLowerCase().trim())
      .filter((value) => value.length > 0)
  );
}

function toIsoDate(input: Date): string {
  return input.toISOString().split("T")[0];
}

export function getIssueDateForWeek(baseDate = new Date()): string {
  const date = new Date(baseDate);
  const weekday = date.getUTCDay();
  const diffToMonday = (weekday + 6) % 7;
  date.setUTCDate(date.getUTCDate() - diffToMonday);
  return toIsoDate(date);
}

export function issueTitleFromDate(issueDate: string): string {
  const label = new Date(`${issueDate}T00:00:00.000Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return `NaviHub Weekly Digest - ${label}`;
}

export function issueSlugFromDate(issueDate: string): string {
  return `weekly-${issueDate}`;
}

export function getNewsletterSummary(mode: NewsletterMode): string {
  if (mode === "personalized") {
    return "Personalized highlights from NaviHub based on your interests and activity.";
  }
  return "A weekly look at community events, top resources, and NYC news highlights.";
}

function matchesCategory(category: string, categoryFilters: Set<string>): boolean {
  if (categoryFilters.size === 0) return true;
  return categoryFilters.has(category.toLowerCase());
}

function matchesBorough(locationOrBorough: string, boroughFilters: Set<string>): boolean {
  if (boroughFilters.size === 0) return true;
  return boroughFilters.has(locationOrBorough.toLowerCase());
}

function formatDate(dateIso: string): string {
  const dt = new Date(dateIso);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function extractTimeLabel(startTime: string): string {
  if (!startTime) return "";
  const [hourRaw, minuteRaw] = startTime.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw ?? "0");
  if (Number.isNaN(hour) || Number.isNaN(minute)) return startTime;

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function truncate(input: string, maxChars: number): string {
  if (input.length <= maxChars) return input;
  return `${input.slice(0, maxChars - 1).trim()}...`;
}

function toPreferenceRow(
  subscriptionId: string,
  input?: NewsletterPreferenceInput
): NewsletterPreferenceRow {
  const merged = { ...DEFAULT_PREFERENCES, ...(input ?? {}) };
  return {
    subscription_id: subscriptionId,
    favorite_boroughs: merged.favoriteBoroughs,
    favorite_categories: merged.favoriteCategories,
    wants_events: merged.wantsEvents,
    wants_resources: merged.wantsResources,
    wants_reviews: merged.wantsReviews,
    wants_news: merged.wantsNews,
    wants_latest_posts: merged.wantsLatestPosts,
  };
}

export function buildPreferencePayload(
  subscriptionId: string,
  input?: NewsletterPreferenceInput
): NewsletterPreferenceRow {
  return toPreferenceRow(subscriptionId, input);
}

export function createSupabaseAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function fetchWeeklyBaseContent(
  supabase: SupabaseClient
): Promise<NewsletterBaseContent> {
  const today = toIsoDate(new Date());

  const [eventsRes, resourcesRes, newsRes] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, description, category, event_date, start_time, location_name")
      .eq("status", "approved")
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(24),
    supabase
      .from("resources")
      .select("id, title, description, category, location, image_url, views, created_at")
      .eq("status", "approved")
      .order("views", { ascending: false })
      .limit(24),
    supabase
      .from("news")
      .select("id, title, description, category, borough, source_name, published_at, url, image_url")
      .order("published_at", { ascending: false })
      .limit(24),
  ]);

  const eventsRows = (eventsRes.data ?? []) as Array<Record<string, unknown>>;
  const resourceRows = (resourcesRes.data ?? []) as Array<Record<string, unknown>>;
  const newsRows = (newsRes.data ?? []) as Array<Record<string, unknown>>;

  const resourceIds = resourceRows
    .map((row) => safeString(row.id))
    .filter((id) => id.length > 0);

  let reviewRows: Array<Record<string, unknown>> = [];
  if (resourceIds.length > 0) {
    const reviewsRes = await supabase
      .from("reviews")
      .select("resource_id, rating")
      .in("resource_id", resourceIds);

    reviewRows = (reviewsRes.data ?? []) as Array<Record<string, unknown>>;
  }

  const reviewStats = new Map<string, { total: number; count: number }>();
  for (const row of reviewRows) {
    const resourceId = safeString(row.resource_id);
    const rating = Number(row.rating ?? 0);
    if (!resourceId || Number.isNaN(rating) || rating <= 0) continue;

    const current = reviewStats.get(resourceId) ?? { total: 0, count: 0 };
    current.total += rating;
    current.count += 1;
    reviewStats.set(resourceId, current);
  }

  const events: NewsletterEventItem[] = eventsRows.map((row) => ({
    id: safeString(row.id),
    title: safeString(row.title, "Community Event"),
    description: truncate(safeString(row.description, "No description provided."), 180),
    category: safeString(row.category, "community"),
    eventDate: safeString(row.event_date),
    startTime: safeString(row.start_time),
    locationName: safeString(row.location_name, "New York City"),
    href: PAGE_EVENTS_HREF,
  }));

  const resources: NewsletterResourceItem[] = resourceRows.map((row) => {
    const id = safeString(row.id);
    const stats = reviewStats.get(id) ?? { total: 0, count: 0 };
    const avgRating = stats.count > 0 ? Number((stats.total / stats.count).toFixed(1)) : 0;

    return {
      id,
      title: safeString(row.title, "Community Resource"),
      description: truncate(safeString(row.description, "No description provided."), 180),
      category: safeString(row.category, "general"),
      location: safeString(row.location, "New York City"),
      imageUrl: safeString(row.image_url),
      views: Number(row.views ?? 0),
      avgRating,
      reviewCount: stats.count,
      href: PAGE_RESOURCES_HREF,
    };
  });

  const news: NewsletterNewsItem[] = newsRows.map((row) => ({
    id: safeString(row.id),
    title: safeString(row.title, "NYC Update"),
    description: truncate(safeString(row.description, "No description provided."), 220),
    category: safeString(row.category, "general"),
    borough: safeString(row.borough, "New York City"),
    sourceName: safeString(row.source_name, "Community Source"),
    publishedAt: safeString(row.published_at),
    url: safeString(row.url, PAGE_NEWS_HREF),
    imageUrl: safeString(row.image_url),
  }));

  const latestPosts: NewsletterPostItem[] = [
    ...events.slice(0, 4).map((event) => ({
      title: event.title,
      postType: "event" as const,
      publishedAt: event.eventDate,
      href: PAGE_EVENTS_HREF,
    })),
    ...resources.slice(0, 4).map((resource) => ({
      title: resource.title,
      postType: "resource" as const,
      publishedAt: safeString((resourceRows.find((row) => safeString(row.id) === resource.id)?.created_at) ?? ""),
      href: PAGE_RESOURCES_HREF,
    })),
    ...news.slice(0, 4).map((item) => ({
      title: item.title,
      postType: "news" as const,
      publishedAt: item.publishedAt,
      href: item.url || PAGE_NEWS_HREF,
    })),
  ]
    .filter((post) => post.title.length > 0)
    .sort((a, b) => {
      const aTime = new Date(a.publishedAt).getTime();
      const bTime = new Date(b.publishedAt).getTime();
      return bTime - aTime;
    })
    .slice(0, 8);

  return {
    events,
    resources,
    news,
    latestPosts,
  };
}

export function buildNewsletterSections(
  content: NewsletterBaseContent,
  filters?: {
    categories?: string[];
    boroughs?: string[];
    wantsEvents?: boolean;
    wantsResources?: boolean;
    wantsReviews?: boolean;
    wantsNews?: boolean;
    wantsLatestPosts?: boolean;
  }
): NewsletterSections {
  const categoryFilters = normalizeSet(filters?.categories);
  const boroughFilters = normalizeSet(filters?.boroughs);

  const filteredEvents = content.events
    .filter((event) => matchesCategory(event.category, categoryFilters))
    .filter((event) => matchesBorough(event.locationName, boroughFilters));

  const filteredResources = content.resources
    .filter((resource) => matchesCategory(resource.category, categoryFilters))
    .filter((resource) => matchesBorough(resource.location, boroughFilters));

  const filteredNews = content.news
    .filter((item) => matchesCategory(item.category, categoryFilters))
    .filter((item) => matchesBorough(item.borough, boroughFilters));

  const topRatedResources = [...filteredResources]
    .sort((a, b) => {
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      return b.reviewCount - a.reviewCount;
    })
    .filter((resource) => resource.reviewCount > 0)
    .slice(0, 4);

  const fallbackTopRated = [...content.resources]
    .sort((a, b) => {
      if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
      return b.reviewCount - a.reviewCount;
    })
    .filter((resource) => resource.reviewCount > 0)
    .slice(0, 4);

  const events = (filters?.wantsEvents ?? true) ? filteredEvents.slice(0, 5) : [];
  const resources = (filters?.wantsResources ?? true) ? filteredResources.slice(0, 5) : [];
  const news = (filters?.wantsNews ?? true) ? filteredNews.slice(0, 5) : [];

  const reviews = (filters?.wantsReviews ?? true)
    ? (topRatedResources.length > 0 ? topRatedResources : fallbackTopRated)
    : [];

  const latestPosts = (filters?.wantsLatestPosts ?? true)
    ? content.latestPosts.slice(0, 6)
    : [];

  const highlights: string[] = [];
  if (events.length > 0) highlights.push(`${events.length} upcoming event picks`);
  if (resources.length > 0) highlights.push(`${resources.length} high-impact resources`);
  if (reviews.length > 0) highlights.push(`${reviews.length} top-rated resources from community reviews`);
  if (news.length > 0) highlights.push(`${news.length} latest NYC headline highlights`);

  return {
    highlights,
    events,
    resources,
    topRatedResources: reviews,
    news,
    latestPosts,
  };
}

export async function getPersonalizationSignals(
  supabase: SupabaseClient,
  args: {
    userId: string | null;
    email: string;
    preferenceCategories: string[];
    preferenceBoroughs: string[];
  }
): Promise<PersonalizationSignals> {
  const categorySet = normalizeSet(args.preferenceCategories);
  const boroughSet = normalizeSet(args.preferenceBoroughs);

  const safeEmail = args.email.trim().toLowerCase();

  if (args.userId) {
    const [favoritesRes, signupsRes] = await Promise.all([
      supabase.from("favorites").select("resource_id").eq("user_id", args.userId).limit(50),
      supabase.from("event_signups").select("event_id").eq("user_id", args.userId).limit(50),
    ]);

    const favoriteIds = ((favoritesRes.data ?? []) as Array<{ resource_id: string }>)
      .map((row) => row.resource_id)
      .filter((id) => typeof id === "string" && id.length > 0);

    const signupIds = ((signupsRes.data ?? []) as Array<{ event_id: string }>)
      .map((row) => row.event_id)
      .filter((id) => typeof id === "string" && id.length > 0);

    if (favoriteIds.length > 0) {
      const resourcesRes = await supabase
        .from("resources")
        .select("category, location")
        .in("id", favoriteIds)
        .limit(50);

      for (const row of (resourcesRes.data ?? []) as Array<Record<string, unknown>>) {
        const category = safeString(row.category).toLowerCase();
        const location = safeString(row.location).toLowerCase();
        if (category) categorySet.add(category);
        if (location) boroughSet.add(location);
      }
    }

    if (signupIds.length > 0) {
      const eventsRes = await supabase
        .from("events")
        .select("category, location_name")
        .in("id", signupIds)
        .limit(50);

      for (const row of (eventsRes.data ?? []) as Array<Record<string, unknown>>) {
        const category = safeString(row.category).toLowerCase();
        const location = safeString(row.location_name).toLowerCase();
        if (category) categorySet.add(category);
        if (location) boroughSet.add(location);
      }
    }
  }

  const activityRows: Array<Record<string, unknown>> = [];

  if (args.userId) {
    const { data: byUserRows } = await supabase
      .from("newsletter_activity")
      .select("page_key, metadata")
      .eq("user_id", args.userId)
      .order("created_at", { ascending: false })
      .limit(80);

    activityRows.push(...((byUserRows ?? []) as Array<Record<string, unknown>>));
  }

  if (safeEmail) {
    const { data: byEmailRows } = await supabase
      .from("newsletter_activity")
      .select("page_key, metadata")
      .ilike("email", safeEmail)
      .order("created_at", { ascending: false })
      .limit(80);

    activityRows.push(...((byEmailRows ?? []) as Array<Record<string, unknown>>));
  }

  for (const row of activityRows) {
    const pageKey = safeString(row.page_key).toLowerCase();
    const metadata = row.metadata;

    if (pageKey.includes("resource")) categorySet.add("community events & programs");
    if (pageKey.includes("event")) categorySet.add("community");
    if (pageKey.includes("news")) categorySet.add("general");

    if (metadata && typeof metadata === "object") {
      const possibleCategory = safeString((metadata as Record<string, unknown>).category).toLowerCase();
      const possibleBorough = safeString((metadata as Record<string, unknown>).borough).toLowerCase();
      if (possibleCategory) categorySet.add(possibleCategory);
      if (possibleBorough) boroughSet.add(possibleBorough);
    }
  }

  return {
    categories: Array.from(categorySet),
    boroughs: Array.from(boroughSet),
  };
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderListRows(items: Array<{ label: string; value: string }>): string {
  if (items.length === 0) {
    return `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #efe8e1;">
          <div style="font-size: 14px; color: #6f645a; line-height: 1.5;">No highlights available in this section yet. Check the full NaviHub page for more updates.</div>
        </td>
      </tr>
    `;
  }

  return items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #efe8e1;">
          <div style="font-size: 12px; color: #997e67; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 4px;">${escapeHtml(item.label)}</div>
          <div style="font-size: 15px; color: #1f1f1f; line-height: 1.4;">${escapeHtml(item.value)}</div>
        </td>
      </tr>
    `
    )
    .join("");
}

export function renderNewsletterEmail(args: {
  issueTitle: string;
  issueDate: string;
  recipientName?: string | null;
  summary: string;
  sections: NewsletterSections;
  siteUrl: string;
  unsubscribeUrl: string;
  mode: NewsletterMode;
}): string {
  const recipientLabel = safeString(args.recipientName, "NaviHub Member");

  const eventRows = args.sections.events.map((event) => ({
    label: `${formatDate(event.eventDate)} ${extractTimeLabel(event.startTime)}`.trim(),
    value: `${event.title} | ${event.locationName}`,
  }));

  const resourceRows = args.sections.resources.map((resource) => ({
    label: `${resource.category} | ${resource.location}`,
    value: `${resource.title} (${resource.views.toLocaleString()} views)`,
  }));

  const reviewRows = args.sections.topRatedResources.map((resource) => ({
    label: `${resource.avgRating.toFixed(1)} stars from ${resource.reviewCount} reviews`,
    value: resource.title,
  }));

  const newsRows = args.sections.news.map((item) => ({
    label: `${item.sourceName} | ${formatDate(item.publishedAt)}`,
    value: item.title,
  }));

  const latestRows = args.sections.latestPosts.map((item) => ({
    label: `${item.postType.toUpperCase()} | ${formatDate(item.publishedAt)}`,
    value: item.title,
  }));

  const highlightsHtml = args.sections.highlights.length
    ? `<p style="margin: 0 0 14px; color: #4d4035; font-size: 15px; line-height: 1.5;"><strong>This week:</strong> ${escapeHtml(args.sections.highlights.join(" • "))}</p>`
    : "";

  const modeBadge = args.mode === "personalized" ? "Personalized Weekly" : "Universal Weekly";

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(args.issueTitle)}</title>
      </head>
      <body style="margin:0; padding:0; background:#f5f0eb; font-family: 'Open Sans', Arial, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb; padding:28px 14px;">
          <tr>
            <td align="center">
              <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%; max-width:640px; background:#ffffff; border-radius:24px; overflow:hidden; border:1px solid #eee3d8;">
                <tr>
                  <td style="padding:30px; background: linear-gradient(135deg, #1f1f1f 0%, #463729 100%);">
                    <div style="display:inline-block; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#f0e8df; border:1px solid rgba(255,255,255,0.2); border-radius:999px; padding:6px 12px; margin-bottom:14px;">${escapeHtml(modeBadge)}</div>
                    <h1 style="font-family:'Petrona', Georgia, serif; font-size:30px; line-height:1.2; color:#ffffff; margin:0 0 8px;">${escapeHtml(args.issueTitle)}</h1>
                    <p style="margin:0; color:#d9cabc; font-size:14px;">Week of ${escapeHtml(formatDate(args.issueDate))}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:26px 30px 10px;">
                    <p style="margin:0 0 10px; color:#1f1f1f; font-size:16px;">Hello ${escapeHtml(recipientLabel)},</p>
                    <p style="margin:0 0 16px; color:#4d4035; font-size:15px; line-height:1.6;">${escapeHtml(args.summary)}</p>
                    ${highlightsHtml}
                  </td>
                </tr>

                <tr>
                  <td style="padding:8px 30px 0;">
                    <h2 style="margin:0 0 8px; font-family:'Petrona', Georgia, serif; font-size:22px; color:#1f1f1f;">Upcoming Events</h2>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${renderListRows(eventRows)}</table>
                    <p style="margin:12px 0 0;"><a href="${escapeHtml(`${args.siteUrl}${PAGE_EVENTS_HREF}`)}" style="color:#997e67; text-decoration:none; font-weight:600;">View all events</a></p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:18px 30px 0;">
                    <h2 style="margin:0 0 8px; font-family:'Petrona', Georgia, serif; font-size:22px; color:#1f1f1f;">Best Resources</h2>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${renderListRows(resourceRows)}</table>
                    <p style="margin:12px 0 0;"><a href="${escapeHtml(`${args.siteUrl}${PAGE_RESOURCES_HREF}`)}" style="color:#997e67; text-decoration:none; font-weight:600;">Explore resources</a></p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:18px 30px 0;">
                    <h2 style="margin:0 0 8px; font-family:'Petrona', Georgia, serif; font-size:22px; color:#1f1f1f;">Top Community Reviews</h2>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${renderListRows(reviewRows)}</table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:18px 30px 0;">
                    <h2 style="margin:0 0 8px; font-family:'Petrona', Georgia, serif; font-size:22px; color:#1f1f1f;">Latest News Highlights</h2>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${renderListRows(newsRows)}</table>
                    <p style="margin:12px 0 0;"><a href="${escapeHtml(`${args.siteUrl}${PAGE_NEWS_HREF}`)}" style="color:#997e67; text-decoration:none; font-weight:600;">Read latest news</a></p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:18px 30px 8px;">
                    <h2 style="margin:0 0 8px; font-family:'Petrona', Georgia, serif; font-size:22px; color:#1f1f1f;">Latest Posts</h2>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${renderListRows(latestRows)}</table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:24px 30px 28px; text-align:center; border-top:1px solid #efe8e1; background:#fcf9f5;">
                    <p style="margin:0 0 10px; color:#5f5146; font-size:13px;">You are receiving this because you subscribed on NaviHub.</p>
                    <p style="margin:0 0 10px;">
                      <a href="${escapeHtml(`${args.siteUrl}/pages/newsletter`)}" style="color:#1f1f1f; text-decoration:none; font-size:13px; font-weight:600;">View newsletter archive</a>
                    </p>
                    <p style="margin:0;">
                      <a href="${escapeHtml(args.unsubscribeUrl)}" style="color:#997e67; text-decoration:none; font-size:13px;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function createIssuePayload(args: {
  issueDate: string;
  mode: NewsletterMode;
  sections: NewsletterSections;
}): {
  issue_date: string;
  slug: string;
  title: string;
  mode: NewsletterMode;
  summary: string;
  sections: NewsletterSections;
  stats: Record<string, number>;
} {
  return {
    issue_date: args.issueDate,
    slug: slugify(issueSlugFromDate(args.issueDate)),
    title: issueTitleFromDate(args.issueDate),
    mode: args.mode,
    summary: getNewsletterSummary(args.mode),
    sections: args.sections,
    stats: {
      events: args.sections.events.length,
      resources: args.sections.resources.length,
      reviewed_resources: args.sections.topRatedResources.length,
      news: args.sections.news.length,
      latest_posts: args.sections.latestPosts.length,
    },
  };
}
