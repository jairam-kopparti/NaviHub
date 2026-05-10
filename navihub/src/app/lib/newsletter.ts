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

export interface NewsletterEditorialSeed {
  headline: string;
  summary: string;
  imageUrl?: string;
  source?: string;
  category?: string;
  location?: string;
}

export interface NewsletterEditorialStory {
  headline: string;
  summary: string;
  imageUrl?: string;
  source?: string;
}

export interface NewsletterEditorial {
  kicker: string;
  headline: string;
  subhead: string;
  byline: string;
  location: string;
  paragraphs: string[];
  imageUrl: string;
  imageAlt: string;
  imageCaption: string;
  sideStories: NewsletterEditorialStory[];
}

export interface NewsletterSections {
  highlights: string[];
  events: NewsletterEventItem[];
  resources: NewsletterResourceItem[];
  topRatedResources: NewsletterResourceItem[];
  news: NewsletterNewsItem[];
  latestPosts: NewsletterPostItem[];
  editorial?: NewsletterEditorial;
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

const EDITORIAL_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
];

const EDITORIAL_CATEGORY_IMAGES: Array<{ keywords: string[]; url: string }> = [
  {
    keywords: ["volunteer", "cleanup", "community", "neighborhood"],
    url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    keywords: ["education", "workshop", "training", "leadership", "school", "class"],
    url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    keywords: ["wellness", "health", "fitness", "coaching"],
    url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
  },
  {
    keywords: ["food", "culinary", "kitchen", "market"],
    url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
  },
  {
    keywords: ["environment", "sustain", "garden", "park", "nature"],
    url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  },
  {
    keywords: ["arts", "music", "culture", "creative"],
    url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    keywords: ["housing", "home", "shelter"],
    url: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80",
  },
];

const UNSAFE_EDITORIAL_KEYWORDS = [
  "crime",
  "sexual",
  "rape",
  "shooting",
  "shoot",
  "gun",
  "knife",
  "murder",
  "assault",
  "violence",
  "abuse",
  "kidnap",
  "hostage",
  "drugs",
  "overdose",
  "death",
  "suicide",
  "war",
  "attack",
  "strike",
  "airstrike",
  "bomb",
  "bombing",
  "explosion",
  "missile",
  "military",
  "army",
  "navy",
  "blockade",
  "election",
  "vote",
  "politic",
  "president",
  "prime minister",
  "congress",
  "parliament",
  "senator",
  "governor",
  "trump",
  "biden",
  "iran",
  "ukraine",
  "russia",
  "china",
  "israel",
  "gaza",
  "hamas",
  "nato",
  "protest",
  "trial",
  "verdict",
  "court",
  "lawsuit",
  "arrest",
  "jail",
  "terror",
  "fire",
  "disaster",
  "collapse",
  "outbreak",
  "controvers",
];

const UNSAFE_EDITORIAL_CATEGORIES = new Set(["politics", "crime"]);

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

function pickEditorialFallbackImage(seed?: NewsletterEditorialSeed, index = 0): string {
  const tag = `${safeString(seed?.category)} ${safeString(seed?.headline)} ${safeString(seed?.summary)}`.toLowerCase();
  for (const entry of EDITORIAL_CATEGORY_IMAGES) {
    if (entry.keywords.some((keyword) => tag.includes(keyword))) {
      return entry.url;
    }
  }

  return EDITORIAL_FALLBACK_IMAGES[index % EDITORIAL_FALLBACK_IMAGES.length];
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

function isSafeEditorialSeed(seed: NewsletterEditorialSeed): boolean {
  const category = safeString(seed.category).toLowerCase();
  if (category && UNSAFE_EDITORIAL_CATEGORIES.has(category)) return false;

  const text = `${safeString(seed.headline)} ${safeString(seed.summary)} ${safeString(seed.location)}`.toLowerCase();
  return !UNSAFE_EDITORIAL_KEYWORDS.some((keyword) => text.includes(keyword));
}

function scoreEditorialSeed(seed: NewsletterEditorialSeed): number {
  let score = 0;
  if (safeString(seed.imageUrl)) score += 2;
  if (safeString(seed.summary)) score += 1;
  if (safeString(seed.source)) score += 0.5;
  if (safeString(seed.category)) score += 0.25;
  return score;
}

export function selectEditorialSeeds(
  seeds: NewsletterEditorialSeed[],
  limit = 4
): NewsletterEditorialSeed[] {
  const safeItems = seeds.filter(isSafeEditorialSeed);
  return [...safeItems]
    .map((item) => ({ item, score: scoreEditorialSeed(item) }))
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
    .slice(0, limit);
}

export function buildEditorialSeeds(content: NewsletterBaseContent): NewsletterEditorialSeed[] {
  const eventSeeds = content.events.slice(0, 4).map((event, index) => {
    const seedBase: NewsletterEditorialSeed = {
      headline: event.title,
      summary: event.description,
      category: event.category,
      location: event.locationName,
      source: "Events Desk",
    };
    return {
      ...seedBase,
      imageUrl: pickEditorialFallbackImage(seedBase, index),
    };
  });

  const resourceSeeds = content.resources.slice(0, 4).map((resource, index) => {
    const seedBase: NewsletterEditorialSeed = {
      headline: resource.title,
      summary: resource.description,
      category: resource.category,
      location: resource.location,
      source: "Resource Desk",
      imageUrl: resource.imageUrl,
    };
    return {
      ...seedBase,
      imageUrl: resource.imageUrl || pickEditorialFallbackImage(seedBase, index + 2),
    };
  });

  const combined = [...eventSeeds, ...resourceSeeds];
  const unique = new Map<string, NewsletterEditorialSeed>();
  for (const seed of combined) {
    if (!unique.has(seed.headline)) unique.set(seed.headline, seed);
  }

  return Array.from(unique.values());
}

export function buildEditorialFallback(args: {
  issueDate: string;
  seeds: NewsletterEditorialSeed[];
}): NewsletterEditorial {
  const safeSeeds = args.seeds.filter(isSafeEditorialSeed);
  const primary = safeSeeds[0];
  const imageUrl = safeString(primary?.imageUrl) || pickEditorialFallbackImage(primary, 0);
  const imageAlt = safeString(primary?.headline, "Neighborhood helpers sharing a city story");

  const fallbackParagraphs = [
    "This week in NaviHub, neighbors across the city shared bright ideas, helpful guides, and small wins that make everyday life easier. The biggest theme: people are finding simple ways to support one another.",
    "From community centers to local events, new programs are popping up that focus on learning, wellness, and creative projects. Families and teens are exploring these spaces together and building new connections.",
    "Looking ahead, the city calendar is full of gentle, welcoming gatherings. Keep an eye out for events that match your interests, and invite a friend to join you.",
  ];

  const fallbackSideStories: NewsletterEditorialStory[] = [
    {
      headline: "Neighborhood helpers team up",
      summary: "Local volunteers are sharing resources to make everyday tasks simpler for families.",
      imageUrl: EDITORIAL_FALLBACK_IMAGES[1],
      source: "Community Desk",
    },
    {
      headline: "After-school clubs grow",
      summary: "New programs focus on creativity, sports, and science for kids and teens.",
      imageUrl: EDITORIAL_FALLBACK_IMAGES[2],
      source: "Youth Beat",
    },
    {
      headline: "Weekend events to watch",
      summary: "A calm guide to local meetups, markets, and community celebrations.",
      imageUrl: EDITORIAL_FALLBACK_IMAGES[3],
      source: "City Notes",
    },
  ];

  const seedStories = (safeSeeds.slice(1, 4).length > 0
    ? safeSeeds.slice(1, 4)
    : safeSeeds
  ).map((seed, index) => ({
    headline: safeString(seed.headline, `Community Spotlight ${index + 1}`),
    summary: truncate(
      safeString(seed.summary, "A quick update from across the city, focused on everyday wins."),
      120
    ),
    imageUrl: safeString(seed.imageUrl) || pickEditorialFallbackImage(seed, index + 1),
    source: safeString(seed.source, "Community Desk"),
  }));

  const sideStories = seedStories.length > 0 ? seedStories : fallbackSideStories;

  return {
    kicker: "NaviHub Youth Press",
    headline: safeString(primary?.headline, "A Friendly Week of City Highlights"),
    subhead:
      "A calm, kid-friendly recap of the people, places, and programs shaping the week ahead.",
    byline: "NaviHub Newsroom",
    location: "New York City",
    paragraphs: fallbackParagraphs,
    imageUrl,
    imageAlt,
    imageCaption: safeString(primary?.summary, "Neighbors sharing resources and community updates.") ||
      "Neighbors sharing resources and community updates.",
    sideStories,
  };
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
  const news: NewsletterNewsItem[] = [];

  const reviews = (filters?.wantsReviews ?? true)
    ? (topRatedResources.length > 0 ? topRatedResources : fallbackTopRated)
    : [];

  const latestPosts = (filters?.wantsLatestPosts ?? true)
    ? content.latestPosts.filter((post) => post.postType !== "news").slice(0, 6)
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

function splitEmailParagraphs(text?: string): string[] {
  if (!text) return [];
  const raw = text.trim();
  const newlineParagraphs = raw
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (newlineParagraphs.length > 1) return newlineParagraphs;

  const sentences = raw
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length <= 1) return newlineParagraphs;

  const targetCount = Math.min(4, Math.max(2, Math.ceil(sentences.length / 2)));
  const chunkSize = Math.ceil(sentences.length / targetCount);
  const chunks: string[] = [];

  for (let index = 0; index < sentences.length; index += chunkSize) {
    chunks.push(sentences.slice(index, index + chunkSize).join(" "));
  }

  return chunks;
}

function resolveEmailEditorial(args: {
  issueTitle: string;
  summary: string;
  sections: NewsletterSections;
}): {
  headline: string;
  subhead: string;
  byline: string;
  paragraphs: string[];
  imageUrl?: string;
  imageCaption?: string;
} {
  const provided = args.sections.editorial;
  if (provided) {
    return {
      headline: provided.headline,
      subhead: provided.subhead,
      byline: provided.byline,
      paragraphs: provided.paragraphs?.length ? provided.paragraphs : splitEmailParagraphs(args.summary),
      imageUrl: provided.imageUrl,
      imageCaption: provided.imageCaption,
    };
  }

  return {
    headline: args.issueTitle,
    subhead: "A calm, kid-friendly recap of the people, places, and programs shaping the week ahead.",
    byline: "NaviHub Newsroom",
    paragraphs: splitEmailParagraphs(args.summary),
  };
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

  const latestRows = args.sections.latestPosts.map((item) => ({
    label: `${item.postType.toUpperCase()} | ${formatDate(item.publishedAt)}`,
    value: item.title,
  }));

  const highlightsHtml = args.sections.highlights.length
    ? `<p style="margin: 0 0 14px; color: #4d4035; font-size: 15px; line-height: 1.5;"><strong>This week:</strong> ${escapeHtml(args.sections.highlights.join(" • "))}</p>`
    : "";

  const modeBadge = args.mode === "personalized" ? "Personalized Weekly" : "Universal Weekly";
  const editorial = resolveEmailEditorial({
    issueTitle: args.issueTitle,
    summary: args.summary,
    sections: args.sections,
  });

  const editorialParagraphs = (editorial.paragraphs ?? [])
    .slice(0, 4)
    .map(
      (paragraph) =>
        `<p style="margin: 0 0 12px; color: #4d4035; font-size: 14px; line-height: 1.6;">${escapeHtml(
          paragraph
        )}</p>`
    )
    .join("");

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
                  <td style="padding:10px 30px 0;">
                    <h2 style="margin:0 0 6px; font-family:'Petrona', Georgia, serif; font-size:22px; color:#1f1f1f;">${escapeHtml(
                      editorial.headline
                    )}</h2>
                    <p style="margin:0 0 8px; color:#6f645a; font-size:14px; font-style:italic;">${escapeHtml(
                      editorial.subhead
                    )}</p>
                    <p style="margin:0 0 14px; color:#997e67; font-size:11px; text-transform:uppercase; letter-spacing:1px;">${escapeHtml(
                      editorial.byline
                    )}</p>
                    ${
                      editorial.imageUrl
                        ? `<img src="${escapeHtml(
                            editorial.imageUrl
                          )}" alt="${escapeHtml(
                            editorial.headline
                          )}" style="width:100%; border-radius:16px; display:block; margin:0 0 12px;" />`
                        : ""
                    }
                    ${editorialParagraphs}
                    ${
                      editorial.imageCaption
                        ? `<p style="margin:0 0 12px; color:#8a7868; font-size:12px; font-style:italic;">${escapeHtml(
                            editorial.imageCaption
                          )}</p>`
                        : ""
                    }
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
