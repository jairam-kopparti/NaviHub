"use client";

import { useCallback, useEffect, useState, Suspense, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CalendarDays, Star, CalendarClock, X, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

interface IssueSections {
  highlights?: string[];
  editorial?: NewsletterEditorial;
  events?: Array<{
    id: string;
    title: string;
    description?: string;
    category?: string;
    eventDate?: string;
    startTime?: string;
    locationName?: string;
    image_url?: string;
  }>;
  resources?: Array<{
    id: string;
    title: string;
    description?: string;
    category?: string;
    location?: string;
    views?: number;
    avgRating?: number;
    reviewCount?: number;
    imageUrl?: string;
  }>;
  topRatedResources?: Array<{ id: string; title: string; avgRating?: number; reviewCount?: number }>;
  news?: Array<{ title: string; sourceName?: string; description?: string; imageUrl?: string; url?: string; publishedAt?: string }>;
  latestPosts?: Array<{ title: string; postType?: string; publishedAt?: string; href?: string }>;
}

interface NewsletterEditorialStory {
  headline: string;
  summary: string;
  imageUrl?: string;
  source?: string;
}

interface NewsletterEditorial {
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

interface NewsletterIssue {
  id: string;
  issue_date: string;
  slug: string;
  title: string;
  summary: string;
  sections: IssueSections;
  stats: Record<string, number>;
  published_at: string;
}

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

const pickEditorialImage = (category?: string, hint?: string, index = 0) => {
  const tag = `${category ?? ""} ${hint ?? ""}`.toLowerCase();
  for (const entry of EDITORIAL_CATEGORY_IMAGES) {
    if (entry.keywords.some((keyword) => tag.includes(keyword))) {
      return entry.url;
    }
  }

  return EDITORIAL_FALLBACK_IMAGES[index % EDITORIAL_FALLBACK_IMAGES.length];
};

const splitIntoParagraphs = (text?: string) => {
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

  const targetCount = Math.min(4, Math.max(3, Math.ceil(sentences.length / 2)));
  const chunkSize = Math.ceil(sentences.length / targetCount);
  const chunks: string[] = [];

  for (let index = 0; index < sentences.length; index += chunkSize) {
    chunks.push(sentences.slice(index, index + chunkSize).join(" "));
  }

  return chunks;
};

const buildIssueEditorial = (issue: NewsletterIssue): NewsletterEditorial => {
  const provided = issue.sections?.editorial;
  if (provided) return provided;

  const events = issue.sections?.events ?? [];
  const resources = issue.sections?.resources ?? [];
  const primaryEvent = events[0];
  const primaryResource = resources[0];
  const primaryTitle = primaryEvent?.title || primaryResource?.title || issue.title;
  const primaryDescription = primaryEvent?.description || primaryResource?.description;
  const primaryCategory = primaryEvent?.category || primaryResource?.category;
  const imageUrl = primaryResource?.imageUrl || pickEditorialImage(primaryCategory, primaryTitle, 0);
  const paragraphs = splitIntoParagraphs(issue.summary);

  const sideStories: NewsletterEditorialStory[] = [
    ...events.slice(0, 2).map((event, index) => ({
      headline: event.title,
      summary: event.description || "A short community update from across the city.",
      imageUrl: pickEditorialImage(event.category, event.title, index + 1),
      source: "Events Desk",
    })),
    ...resources.slice(0, 2).map((resource, index) => ({
      headline: resource.title,
      summary: resource.description || "A short community update from across the city.",
      imageUrl: resource.imageUrl || pickEditorialImage(resource.category, resource.title, index + 3),
      source: "Resource Desk",
    })),
  ].slice(0, 3);

  return {
    kicker: "NaviHub Weekly Brief",
    headline: primaryTitle || "A Friendly Week of City Highlights",
    subhead: "A calm, kid-friendly recap of the people, places, and programs shaping the week ahead.",
    byline: "NaviHub Newsroom",
    location: "New York City",
    paragraphs: paragraphs.length
      ? paragraphs
      : [
          "This week in NaviHub, neighbors shared bright ideas, helpful guides, and new ways to support one another.",
          "Community centers and local teams are creating friendly spaces for learning, creativity, and wellness.",
          "Looking ahead, the city calendar is full of welcoming events that invite families and teens to join in.",
        ],
    imageUrl,
    imageAlt: primaryTitle || "Community newsletter feature",
    imageCaption: primaryDescription || "Neighbors sharing resources and community updates.",
    sideStories: sideStories.length
      ? sideStories
      : [
          {
            headline: "Neighborhood helpers team up",
            summary: "Local volunteers are sharing resources to make everyday tasks simpler for families.",
            imageUrl: pickEditorialImage("community", "helpers", 1),
            source: "Community Desk",
          },
          {
            headline: "After-school clubs grow",
            summary: "New programs focus on creativity, sports, and science for kids and teens.",
            imageUrl: pickEditorialImage("education", "clubs", 2),
            source: "Youth Beat",
          },
          {
            headline: "Weekend events to watch",
            summary: "A calm guide to local meetups, markets, and community celebrations.",
            imageUrl: pickEditorialImage("community", "events", 3),
            source: "City Notes",
          },
        ],
  };
};

function NewsletterPageInner() {
  const searchParams = useSearchParams();

  const [issues, setIssues] = useState<NewsletterIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<NewsletterIssue | null>(null);
  const [widgetModal, setWidgetModal] = useState<
    | { kind: "event"; data: NonNullable<IssueSections["events"]>[number] }
    | { kind: "resource"; data: NonNullable<IssueSections["resources"]>[number] }
    | { kind: "post"; data: NonNullable<IssueSections["latestPosts"]>[number] }
    | null
  >(null);

  const unsubscribed = searchParams.get("unsubscribed") === "1";

  useEffect(() => {
    const fetchIssues = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/newsletter/issues?limit=10", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load newsletter issues.");
        }

        setIssues(payload.issues ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load issues.");
      } finally {
        setLoading(false);
      }
    };

    void fetchIssues();
  }, []);

  const latestIssue = issues[0] ?? null;
  const previousIssues = useMemo(() => issues.slice(1), [issues]);
  const summaryParagraphs = useMemo(() => {
    return splitIntoParagraphs(latestIssue?.summary);
  }, [latestIssue?.summary]);
  const widgetEvents = useMemo(() => latestIssue?.sections?.events ?? [], [latestIssue?.sections?.events]);
  const widgetResources = useMemo(
    () => latestIssue?.sections?.resources ?? [],
    [latestIssue?.sections?.resources]
  );
  const widgetPosts = useMemo(
    () => (latestIssue?.sections?.latestPosts ?? []).filter((post) => post.postType !== "news"),
    [latestIssue?.sections?.latestPosts]
  );

  const fallbackEditorial = useMemo<NewsletterEditorial>(() => {
    const primaryEvent = widgetEvents[0];
    const primaryResource = widgetResources[0];
    const primaryTitle = primaryEvent?.title || primaryResource?.title;
    const primaryDescription = primaryEvent?.description || primaryResource?.description;
    const primaryCategory = primaryEvent?.category || primaryResource?.category;
    const imageUrl = primaryResource?.imageUrl || pickEditorialImage(primaryCategory, primaryTitle, 0);
    const imageAlt = primaryTitle || "Community newsletter feature";
    const paragraphs = summaryParagraphs.length
      ? summaryParagraphs
      : [
          "This week in NaviHub, neighbors shared bright ideas, helpful guides, and new ways to support one another.",
          "Community centers and local teams are creating friendly spaces for learning, creativity, and wellness.",
          "Looking ahead, the city calendar is full of welcoming events that invite families and teens to join in.",
        ];

    const seedStories = [
      ...widgetEvents.slice(0, 2).map((event, index) => ({
        headline: event.title,
        summary: event.description || "A short community update from across the city.",
        imageUrl: pickEditorialImage(event.category, event.title, index + 1),
        source: "Events Desk",
      })),
      ...widgetResources.slice(0, 2).map((resource, index) => ({
        headline: resource.title,
        summary: resource.description || "A short community update from across the city.",
        imageUrl: resource.imageUrl || pickEditorialImage(resource.category, resource.title, index + 3),
        source: "Resource Desk",
      })),
    ].slice(0, 3);

    const sideStories = seedStories.length
      ? seedStories
      : [
          {
            headline: "Neighborhood helpers team up",
            summary: "Local volunteers are sharing resources to make everyday tasks simpler for families.",
            imageUrl: pickEditorialImage("community", "helpers", 1),
            source: "Community Desk",
          },
          {
            headline: "After-school clubs grow",
            summary: "New programs focus on creativity, sports, and science for kids and teens.",
            imageUrl: pickEditorialImage("education", "clubs", 2),
            source: "Youth Beat",
          },
          {
            headline: "Weekend events to watch",
            summary: "A calm guide to local meetups, markets, and community celebrations.",
            imageUrl: pickEditorialImage("community", "events", 3),
            source: "City Notes",
          },
        ];

    return {
      kicker: "NaviHub Weekly Brief",
      headline: primaryTitle || "A Friendly Week of City Highlights",
      subhead: "A calm, kid-friendly recap of the people, places, and programs shaping the week ahead.",
      byline: "NaviHub Newsroom",
      location: "New York City",
      paragraphs,
      imageUrl,
      imageAlt,
      imageCaption: primaryDescription || "Neighbors sharing resources and community updates.",
      sideStories,
    };
  }, [summaryParagraphs, widgetEvents, widgetResources]);

  const editorial = useMemo<NewsletterEditorial>(() => {
    const provided = latestIssue?.sections?.editorial;
    if (!provided) return fallbackEditorial;

    return {
      ...fallbackEditorial,
      ...provided,
      paragraphs: provided.paragraphs?.length ? provided.paragraphs : fallbackEditorial.paragraphs,
      sideStories: provided.sideStories?.length ? provided.sideStories : fallbackEditorial.sideStories,
      imageUrl: provided.imageUrl || fallbackEditorial.imageUrl,
      imageAlt: provided.imageAlt || fallbackEditorial.imageAlt,
      imageCaption: provided.imageCaption || fallbackEditorial.imageCaption,
    };
  }, [latestIssue?.sections?.editorial, fallbackEditorial]);

  const selectedEditorial = useMemo(() => {
    if (!selectedIssue) return null;
    return buildIssueEditorial(selectedIssue);
  }, [selectedIssue]);

  const handleCloseIssue = useCallback(() => setSelectedIssue(null), []);

  useEffect(() => {
    if (!selectedIssue) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleCloseIssue(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selectedIssue, handleCloseIssue]);

  const triggerModal = () => {
    window.dispatchEvent(new Event("open-newsletter-modal"));
  };

  const formatDisplayDate = (value?: string) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDisplayTime = (value?: string) => {
    if (!value) return "";
    const [hourRaw, minuteRaw] = value.split(":");
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw ?? "0");
    if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
  };

  const buildHeadlineBrief = (story: NewsletterEditorialStory) => {
    const base = (story.summary || "").trim();
    const sentences = base
      ? base.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean)
      : [];

    const fillers = [
      "Organizers say the focus is on small, practical wins for neighbors.",
      "The update highlights how local teams are shaping the week ahead.",
      "Look for easy ways to join in, even for a short visit.",
      "This story connects to broader community efforts happening nearby.",
      "Families and teens are welcome to take part.",
    ];

    const result = [...sentences];
    let fillerIndex = 0;
    while (result.length < 4 && fillerIndex < fillers.length) {
      result.push(fillers[fillerIndex]);
      fillerIndex += 1;
    }

    if (result.length === 0) {
      result.push(...fillers.slice(0, 4));
    }

    return result.slice(0, 5).join(" ");
  };

  const buildEditorialBody = (paragraphs: string[]) => {
    const base = paragraphs.map((paragraph) => paragraph.trim()).filter(Boolean);
    const fillerParagraphs = [
      "Across different neighborhoods, organizers are focusing on small steps that feel doable. They are highlighting practical tips, friendly spaces, and shared learning. The goal is to help people feel confident trying something new. It is all about making daily life a little easier.",
      "Community calendars are filling with open houses, workshops, and meetups designed for all ages. Hosts emphasize a welcoming vibe and clear directions so first-time visitors feel comfortable. Many sessions are short and flexible, which makes them easier to join. Expect a steady mix of learning, creativity, and connection.",
      "Local teams are also sharing quick updates on resources, from food access to after-school support. These notes are meant to save time and point people to the right places. If a program is full, organizers often suggest a backup option nearby. Keep an eye out for updates that match your schedule.",
    ];

    const result = [...base];
    let fillerIndex = 0;
    while (result.length < base.length + 2 && fillerIndex < fillerParagraphs.length) {
      result.push(fillerParagraphs[fillerIndex]);
      fillerIndex += 1;
    }

    return result;
  };

  const getWidgetLink = (modal: NonNullable<typeof widgetModal>) => {
    if (modal.kind === "event") return `/pages/events?eventId=${modal.data.id}`;
    if (modal.kind === "resource") return `/pages/resources?resourceId=${modal.data.id}`;
    return modal.data.href || "/pages/news";
  };

  return (
    <div className="min-h-screen bg-[#fdfaf7] text-[#4f4339]!">
      <section className="relative px-4 pb-12 pt-24 md:pb-16 md:pt-28">
        <div className="mx-auto max-w-7xl">
          {unsubscribed && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-lg bg-green-50 p-4 text-center text-sm font-medium text-green-800"
            >
              You have been successfully unsubscribed.
            </motion.div>
          )}

          {/* Hero Section */}
          <div className="relative mb-5 h-75 md:h-112.5 w-full overflow-hidden rounded-2xl grayscale border-b border-t border-[#4f4339]">
            <Image 
              src="/page-images/newsletter.jpg" 
              alt="NaviHub Weekly Newsletter" 
              fill 
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center mix-blend-multiply" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <h1 className="font-(--font-heading) text-4xl md:text-7xl tracking-tight text-white! mb-4 uppercase" style={{ fontFamily: "Georgia, serif" }}>
                NaviHub Weekly
              </h1>
              <p className="text-sm md:text-xl text-white! max-w-2xl font-serif">
                Delivering community insights, critical resources, and local news to your inbox.
              </p>
              <button
                onClick={triggerModal}
                className="mt-6 flex items-center gap-2 px-6 py-3 bg-[#4f4339] text-white! rounded-none border border-white hover:bg-white hover:text-[#4f4339] transition-colors uppercase tracking-widest text-xs font-bold"
              >
                <Mail size={16} /> Subscribe
              </button>
            </div>
          </div>
          <div className="mt-24 flex flex-col items-center text-[#7a6655]! text-[10px] uppercase tracking-widest">
            <span>Scroll down</span>
            <ChevronDown size={18} className="mt-1 nh-scroll-bounce" />
          </div>
          <style jsx global>{`
            @keyframes nh-bounce-slow {
              0%, 100% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(8px);
              }
            }

            .nh-scroll-bounce {
              animation: nh-bounce-slow 16s ease-in-out infinite !important;
            }
          `}</style>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {unsubscribed && (
          <div className="mb-8 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800!">
            You have been unsubscribed. You can re-subscribe any time.
          </div>
        )}

        {loading && (
          <div className="rounded-3xl border border-[#eadfd3] bg-white p-8 text-center text-[#6f6257]">
            Loading newsletter issues...
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">{error}</div>
        )}

        {!loading && !error && !latestIssue && (
          <div className="rounded-3xl border border-[#eadfd3] bg-white p-8 text-center">
            <h2 className="text-2xl font-semibold text-[#1f1f1f]!">No issues yet</h2>
            <p className="mt-2 text-base! text-[#6f6257]!">Your first weekly issue will appear here after Monday dispatch.</p>
          </div>
        )}

        {!loading && !error && latestIssue && (
          <section className="mt-8 flex flex-col min-h-screen">
            {/* Top 2/3 - Editorial Feature */}
            <div className="flex-2 rounded-3xl border border-[#eadfd3] bg-white p-6 shadow-sm mb-6 flex flex-col">
              <div className="flex flex-col gap-8 flex-1">
                <article className="overflow-hidden rounded-2xl border border-[#eadfd3] bg-[#fffdfa] flex-1 flex flex-col">
                  <div className="relative h-64 sm:h-80 w-full overflow-hidden border-b border-[#eadfd3] shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editorial.imageUrl}
                      alt={editorial.imageAlt || editorial.headline}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#997e67]!">
                      {editorial.kicker}
                    </p>
                    <h2 className="font-(--font-heading) text-3xl sm:text-4xl text-[#1f1f1f]! mt-3 leading-tight">
                      {editorial.headline}
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-[#6f6257]! italic">
                      {editorial.subhead}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-widest text-[#7a6655]!">
                      {editorial.byline} · {editorial.location} · {formatDisplayDate(latestIssue.issue_date)}
                    </p>
                    <div className="mt-4 text-sm sm:text-base text-[#5e5045]! leading-relaxed sm:columns-2 sm:gap-6">
                      {buildEditorialBody(editorial.paragraphs).map((paragraph, index) => (
                        <p
                          key={`${latestIssue.id}-editorial-${index}`}
                          className="mb-4 break-inside-avoid text-[#5e5045]!"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-[#8a7868]! italic">{editorial.imageCaption}</p>

                    <div className="mt-6 border-t border-[#eadfd3] pt-5">
                      <h3 className="text-sm uppercase tracking-widest font-bold text-[#7a6655]! mb-4">
                        Additional Headlines
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {editorial.sideStories.map((story, index) => (
                          <div key={`${story.headline}-detail-${index}`} className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#7a6655]!">
                              {story.source || "Community Desk"}
                            </p>
                            <h4 className="text-sm sm:text-base font-bold text-[#1f1f1f]! leading-snug">
                              {story.headline}
                            </h4>
                            <p className="text-sm text-[#5e5045]! leading-relaxed">
                              {buildHeadlineBrief(story)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            {/* Bottom 1/3 - Key Sections */}
            <div className="flex-1 grid gap-6 md:grid-cols-3">
              <div className="rounded-3xl p-6 border border-[#eadfd3] bg-white flex flex-col">
                <h3 className="text-sm uppercase tracking-widest font-bold text-[#7a6655]! mb-4 pb-2 border-b border-[#eadfd3] flex items-center justify-between shrink-0">
                  Resources <Star size={14} />
                </h3>
                <ul className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {widgetResources.length > 0 ? (
                    widgetResources.slice(0, 4).map((resource) => (
                      <li key={resource.id} className="leading-snug">
                        <button
                          type="button"
                          onClick={() => setWidgetModal({ kind: "resource", data: resource })}
                          className="block w-full text-left bg-[#fffdfa] border border-[#eadfd3] p-4 rounded-xl hover:border-[#997e67] hover:bg-[#fdf7f1] transition-all cursor-pointer"
                        >
                          <p className="font-semibold text-[#1f1f1f]! truncate">{resource.title}</p>
                          <p className="text-xs text-[#7a6655]! mt-1.5 font-medium">
                            {(resource.category || "Community Resource").toUpperCase()} · {resource.location || "New York City"}
                          </p>
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="text-[#8a7868]! text-sm py-3 bg-[#fffdfa] rounded-lg px-4 italic border border-[#eadfd3]">
                      No resources compiled yet.
                    </li>
                  )}
                </ul>
                <Link
                  href="/pages/resources"
                  className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#997e67]! hover:text-[#7a6655]!"
                >
                  View all resources →
                </Link>
              </div>

              <div className="rounded-3xl p-6 border border-[#eadfd3] bg-white flex flex-col">
                <h3 className="text-sm uppercase tracking-widest font-bold text-[#7a6655]! mb-4 pb-2 border-b border-[#eadfd3] flex items-center justify-between shrink-0">
                  Upcoming <CalendarClock size={14} />
                </h3>
                <ul className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {widgetEvents.length > 0 ? (
                    widgetEvents.slice(0, 4).map((event) => (
                      <li key={event.id} className="leading-snug">
                        <button
                          type="button"
                          onClick={() => setWidgetModal({ kind: "event", data: event })}
                          className="block w-full text-left bg-[#fcf8f3] border border-[#eae0d5]/50 hover:border-[#997e67] hover:bg-[#f6f1ea] transition-all p-4 rounded-xs! text-[#4f4339]! font-medium cursor-pointer"
                        >
                          <p className="font-semibold text-[#1f1f1f]! truncate">{event.title}</p>
                          <p className="text-xs text-[#7a6655]! mt-1.5 font-medium">
                            {formatDisplayDate(event.eventDate)}
                            {event.startTime ? ` · ${formatDisplayTime(event.startTime)}` : ""}
                          </p>
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="text-[#8a7868]! text-sm py-3 bg-[#fcf8f3] rounded-xs px-4 italic">
                      No upcoming events this week.
                    </li>
                  )}
                </ul>
                <Link
                  href="/pages/events"
                  className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#997e67]! hover:text-[#7a6655]!"
                >
                  View all events →
                </Link>
              </div>

              <div className="rounded-3xl p-6 border border-[#eadfd3] bg-white flex flex-col">
                <h3 className="text-sm uppercase tracking-widest font-bold text-[#7a6655]! mb-4 pb-2 border-b border-[#eadfd3] flex items-center justify-between shrink-0">
                  Latest Posts <CalendarDays size={14} />
                </h3>
                <ul className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {widgetPosts.length > 0 ? (
                    widgetPosts.slice(0, 4).map((post, index) => (
                      <li key={`${post.title}-${index}`} className="leading-snug">
                        <button
                          type="button"
                          onClick={() => setWidgetModal({ kind: "post", data: post })}
                          className="block w-full text-left bg-[#fffdfa] border border-[#eadfd3] p-4 rounded-xs! hover:border-[#997e67] hover:bg-[#fdf7f1] transition-all cursor-pointer"
                        >
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#7a6655]! mb-1">
                            {(post.postType || "post").toUpperCase()}
                          </p>
                          <p className="font-semibold text-[#1f1f1f]! line-clamp-2">{post.title}</p>
                          <p className="text-xs text-[#7a6655]! mt-1.5 font-medium">
                            {formatDisplayDate(post.publishedAt)}
                          </p>
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="text-[#8a7868]! text-sm py-3 bg-[#fffdfa] rounded-xs px-4 italic border border-[#eadfd3]">
                      No forum updates yet.
                    </li>
                  )}
                </ul>
                <Link
                  href="/pages/news"
                  className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#997e67]! hover:text-[#7a6655]!"
                >
                  View all posts →
                </Link>
              </div>
            </div>
          </section>
        )}

        {!loading && !error && previousIssues.length > 0 && (
          <section className="mt-14 border-t border-[#eadfd3] pt-10">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-[#1f1f1f]!">Past Issues</h3>
              <p className="text-sm font-medium text-[#8a7868]!">Scroll to browse the archive →</p>
            </div>

            <div className="flex gap-5 overflow-x-auto pb-6 snap-x pt-2 px-1 -mx-1">
              {previousIssues.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => setSelectedIssue(issue)}
                  className="group relative flex h-70 w-105 shrink-0 snap-start flex-col justify-between rounded-xs! border border-[#eadfd3] bg-[#fffdfa] py-6 pr-6 pl-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md cursor-pointer"
                >
                  <div>
                    <p className="mb-3 inline-flex items-center gap-1.5 rounded bg-[#f6f1ea] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#7a6655]!">
                      <CalendarDays size={10} /> {new Date(issue.issue_date).toLocaleDateString()}
                    </p>
                    <h4 className="text-lg leading-snug font-bold text-[#1f1f1f]! group-hover:text-[#997e67]! transition-colors line-clamp-2">
                      {issue.title}
                    </h4>
                    <p className="mt-3 text-sm text-[#5e5045]! line-clamp-4 leading-relaxed">
                      {issue.summary}
                    </p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-[#997e67]! group-hover:text-[#846854]!">
                    Read Issue <span className="text-base leading-none">→</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      <AnimatePresence>
        {widgetModal && (
          <div className="fixed inset-0 z-130 flex items-center justify-center p-4 sm:p-6">
            <motion.button
              aria-label="Close detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
              onClick={() => setWidgetModal(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex w-full max-w-2xl flex-col rounded-2xl border border-[#eadfd3] bg-[#fffdfa] shadow-2xl overflow-hidden"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-[#eadfd3] bg-[#fdfaf7] px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#8a7868]!">
                  {widgetModal.kind === "event" && "Event Preview"}
                  {widgetModal.kind === "resource" && "Resource Preview"}
                  {widgetModal.kind === "post" && "Forum Preview"}
                </p>
                <button
                  aria-label="Close"
                  className="rounded-full bg-white p-2 text-[#6b5a4e]! shadow-sm ring-1 ring-black/5 transition hover:bg-[#f7f1ea] cursor-pointer"
                  onClick={() => setWidgetModal(null)}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 sm:p-8">
                {widgetModal.kind === "event" && (
                  <div>
                    <h3 className="text-2xl font-bold text-[#1f1f1f]! mb-3">{widgetModal.data.title}</h3>
                    <p className="text-sm uppercase tracking-widest text-[#7a6655]! mb-4">
                      {formatDisplayDate(widgetModal.data.eventDate)}
                      {widgetModal.data.startTime ? ` · ${formatDisplayTime(widgetModal.data.startTime)}` : ""}
                      {widgetModal.data.locationName ? ` · ${widgetModal.data.locationName}` : ""}
                    </p>
                    <p className="text-base text-[#5e5045]! leading-relaxed">
                      {widgetModal.data.description || "A welcoming community event with details coming soon."}
                    </p>
                  </div>
                )}

                {widgetModal.kind === "resource" && (
                  <div>
                    <h3 className="text-2xl font-bold text-[#1f1f1f]! mb-3">{widgetModal.data.title}</h3>
                    <p className="text-sm uppercase tracking-widest text-[#7a6655]! mb-4">
                      {widgetModal.data.category || "Community Resource"}
                      {widgetModal.data.location ? ` · ${widgetModal.data.location}` : ""}
                    </p>
                    <p className="text-base text-[#5e5045]! leading-relaxed">
                      {widgetModal.data.description || "A helpful community resource focused on everyday needs."}
                    </p>
                    {widgetModal.data.avgRating && (
                      <p className="mt-4 text-sm font-semibold text-[#7a6655]!">
                        {widgetModal.data.avgRating.toFixed(1)} Stars ({widgetModal.data.reviewCount ?? 0} reviews)
                      </p>
                    )}
                  </div>
                )}

                {widgetModal.kind === "post" && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#7a6655]! mb-2">
                      {(widgetModal.data.postType || "post").toUpperCase()}
                    </p>
                    <h3 className="text-2xl font-bold text-[#1f1f1f]! mb-3">{widgetModal.data.title}</h3>
                    <p className="text-sm uppercase tracking-widest text-[#7a6655]!">
                      {formatDisplayDate(widgetModal.data.publishedAt)}
                    </p>
                    <p className="mt-4 text-base text-[#5e5045]! leading-relaxed">
                      Visit the full post for the complete community update and discussion.
                    </p>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={getWidgetLink(widgetModal)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#4f4339] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white! hover:bg-[#2e2722] transition-colors"
                  >
                    View Full Page
                  </Link>
                  <button
                    type="button"
                    onClick={() => setWidgetModal(null)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#eadfd3] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#7a6655]! hover:border-[#997e67] cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedIssue && (
          <div className="fixed inset-0 z-120 flex items-center justify-center p-4 sm:p-6 pb-20">
            <motion.button
              aria-label="Close modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
              onClick={handleCloseIssue}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="newsletter-archive-title"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex max-h-full w-full max-w-3xl flex-col rounded-3xl border border-[#e6ddd5] bg-[#fffdfa] shadow-2xl overflow-hidden"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-[#eadfd3] bg-[#fdfaf7] px-6 py-4">
                <p id="newsletter-archive-title" className="text-xs font-semibold uppercase tracking-widest text-[#8a7868]!">
                  Issue Archive: {new Date(selectedIssue.issue_date).toLocaleDateString()}
                </p>
                <button
                  aria-label="Close issue archive"
                  className="rounded-full bg-white p-2 text-[#6b5a4e]! shadow-sm ring-1 ring-black/5 transition hover:bg-[#f7f1ea] cursor-pointer"
                  onClick={handleCloseIssue}
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="overflow-y-auto p-6 sm:p-8">
                {selectedEditorial && (
                  <div className="mb-10">
                    <div className="mb-8 text-center">
                      <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#fcf8f3] border border-[#eadfd3] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#7a6655]!">
                        <CalendarDays size={12} /> {new Date(selectedIssue.issue_date).toLocaleDateString()}
                      </p>
                      <h2 className="font-(--font-heading) text-3xl sm:text-4xl text-[#1f1f1f]! mt-4 mb-3 leading-tight">
                        {selectedEditorial.headline}
                      </h2>
                      <p className="text-sm sm:text-base text-[#6f6257]! italic">
                        {selectedEditorial.subhead}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-widest text-[#7a6655]!">
                        {selectedEditorial.byline} · {selectedEditorial.location}
                      </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[#eadfd3] bg-white mb-6">
                      <div className="relative h-56 sm:h-72 w-full overflow-hidden border-b border-[#eadfd3]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={selectedEditorial.imageUrl}
                          alt={selectedEditorial.imageAlt || selectedEditorial.headline}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-6">
                        <div className="text-sm text-[#5e5045]! leading-relaxed sm:columns-2 sm:gap-6">
                          {buildEditorialBody(selectedEditorial.paragraphs).map((paragraph, index) => (
                            <p key={`modal-paragraph-${index}`} className="mb-4 break-inside-avoid text-[#5e5045]!">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-[#8a7868]! italic">{selectedEditorial.imageCaption}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#eadfd3] bg-white p-6">
                      <h3 className="text-sm uppercase tracking-widest font-bold text-[#7a6655]! mb-4">
                        Additional Headlines
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {selectedEditorial.sideStories.map((story, index) => (
                          <div key={`modal-headline-${index}`} className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#7a6655]!">
                              {story.source || "Community Desk"}
                            </p>
                            <h4 className="text-sm sm:text-base font-bold text-[#1f1f1f]! leading-snug">
                              {story.headline}
                            </h4>
                            <p className="text-sm text-[#5e5045]! leading-relaxed">
                              {buildHeadlineBrief(story)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedIssue.sections?.highlights && selectedIssue.sections.highlights.length > 0 && (
                  <div className="mb-8">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#7a6655]!">Highlights</h3>
                    <ul className="space-y-2 text-[#4f4339]!">
                      {selectedIssue.sections.highlights.map((item) => (
                        <li key={item} className="flex gap-2 text-[#4f4339]!">
                          <span className="text-[#997e67]! mt-0.5">•</span>
                          <span className="text-[#4f4339]!">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#7a6655]!">Upcoming Events</h3>
                    <div className="grid gap-3">
                      {(selectedIssue.sections?.events ?? []).length > 0 ? (
                        selectedIssue.sections.events!.map((event) => (
                          <Link
                            key={event.id}
                            href={`/pages/events?eventId=${event.id}`}
                            className="block rounded-xs! border border-[#eadfd3] bg-white p-3 text-sm text-[#4f4339]! hover:border-[#997e67] hover:bg-[#fdfaf7] hover:text-[#997e67] transition-all cursor-pointer"
                          >
                            {event.title}
                          </Link>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500!">None in this issue.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#7a6655]!">Top Resources</h3>
                    <div className="grid gap-3">
                      {(selectedIssue.sections?.topRatedResources ?? []).length > 0 ? (
                        selectedIssue.sections.topRatedResources!.map((resource) => (
                          <div key={resource.title} className="rounded-xs! border border-[#eadfd3] p-3 text-sm text-[#4f4339]!">
                            {resource.title}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500!">None in this issue.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function NewsletterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fdfaf7] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-[#997e67]/30 border-t-[#997e67] animate-spin" /></div>}>
      <NewsletterPageInner />
    </Suspense>
  );
}
