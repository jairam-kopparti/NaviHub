"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Mail, Sparkles, Newspaper, Star, CalendarClock, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface IssueSections {
  highlights?: string[];
  events?: Array<{ id: string; title: string; eventDate?: string; locationName?: string }>;
  resources?: Array<{ title: string; category?: string; views?: number }>;
  topRatedResources?: Array<{ title: string; avgRating?: number; reviewCount?: number }>;
  news?: Array<{ title: string; sourceName?: string; publishedAt?: string }>;
  latestPosts?: Array<{ title: string; postType?: string; publishedAt?: string; href?: string }>;
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

export default function NewsletterPage() {
  const searchParams = useSearchParams();

  const [issues, setIssues] = useState<NewsletterIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<NewsletterIssue | null>(null);

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

  const latestIssue = useMemo(() => issues[0] ?? null, [issues]);
  const previousIssues = useMemo(() => issues.slice(1), [issues]);

  const triggerModal = () => {
    window.dispatchEvent(new Event("open-newsletter-modal"));
  };

  return (
    <div className="min-h-screen bg-[#f8f4ef] text-[#1f1f1f]">
      <section className="relative overflow-hidden bg-[#1f1f1f] px-4 py-20 sm:px-6 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(153,126,103,0.35),transparent_50%),radial-gradient(circle_at_90%_85%,rgba(204,190,177,0.25),transparent_45%)]" />
        <div className="relative mx-auto max-w-6xl">
          <motion.p
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1 text-xs uppercase tracking-[0.14em] text-[#dccfc2]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles size={14} /> Newsletter Hub
          </motion.p>

          <motion.h1
            className="font-(--font-heading) text-4xl leading-tight text-white sm:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
          >
            Weekly Digest Archive
          </motion.h1>

          <motion.p
            className="mt-5 max-w-2xl text-base! text-[#e7ddd3] sm:text-lg!"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
          >
            Professional weekly roundups from NaviHub featuring top resources, community reviews, upcoming events, and local news highlights.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32 }}
          >
            <button
              onClick={triggerModal}
              className="inline-flex items-center gap-2 rounded-full bg-[#997e67] px-5 py-3 text-sm font-semibold uppercase tracking-[0.09em] text-white transition hover:bg-[#846854] cursor-pointer"
            >
              <Mail size={16} /> Subscribe Weekly
            </button>

            <Link
              href="/pages/news"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-semibold uppercase tracking-[0.09em] text-white transition hover:bg-white/10"
            >
              <Newspaper size={16} /> Explore News
            </Link>
          </motion.div>
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
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">{error}</div>
        )}

        {!loading && !error && !latestIssue && (
          <div className="rounded-3xl border border-[#eadfd3] bg-white p-8 text-center">
            <h2 className="text-2xl font-semibold text-[#1f1f1f]!">No issues yet</h2>
            <p className="mt-2 text-base! text-[#6f6257]!">Your first weekly issue will appear here after Monday dispatch.</p>
          </div>
        )}

        {!loading && !error && latestIssue && (
          <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <article className="rounded-4xl border border-[#eadfd3] bg-white p-6 shadow-[0_12px_40px_rgba(31,31,31,0.08)] sm:p-8">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#f5efe9] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#7a6655]!">
                <CalendarDays size={13} /> Latest Issue
              </p>
              <h2 className="font-(--font-heading) text-3xl text-[#1f1f1f]! sm:text-4xl">{latestIssue.title}</h2>
              <p className="mt-2 text-sm! uppercase tracking-[0.09em] text-[#8a7868]!">{new Date(latestIssue.issue_date).toLocaleDateString()}</p>
              <p className="mt-4 text-base! text-[#5e5045]!">{latestIssue.summary}</p>

              {latestIssue.sections?.highlights && latestIssue.sections.highlights.length > 0 && (
                <div className="mt-6 rounded-2xl border border-[#ece2d8] bg-[#fcf8f3] p-4">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#7a6655]!">Highlights</h3>
                  <ul className="space-y-1 text-sm text-[#5e5045]!">
                    {latestIssue.sections.highlights.map((item) => (
                      <li key={item} className="text-[#5e5045]!">
                        <span className="text-[#997e67]!">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#ece2d8] bg-[#fffdfa] p-4">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#7a6655]!">
                    <CalendarClock size={14} className="text-[#7a6655]!" /> Upcoming Events
                  </h4>
                  <ul className="space-y-2 text-sm text-[#4f4339]!">
                    {(latestIssue.sections.events ?? []).length > 0 ? (
                      (latestIssue.sections.events ?? []).slice(0, 3).map((event) => (
                        <li key={event.id} className="leading-snug">
                          <Link 
                            href={`/pages/events?eventId=${event.id}`}
                            className="block w-full text-left bg-white border border-[#eae0d5] hover:border-[#997e67] hover:bg-[#fdfaf7] hover:text-[#997e67] transition-all p-2 rounded-lg text-[#4f4339]!"
                          >
                            {event.title}
                          </Link>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500! italic">No upcoming events this week.</li>
                    )}
                  </ul>
                </div>

                <div className="rounded-2xl border border-[#ece2d8] bg-[#fffdfa] p-4">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#7a6655]!">
                    <Star size={14} className="text-[#7a6655]!" /> Top Reviews
                  </h4>
                  <ul className="space-y-2 text-sm text-[#4f4339]!">
                    {(latestIssue.sections.topRatedResources ?? []).length > 0 ? (
                      (latestIssue.sections.topRatedResources ?? []).slice(0, 3).map((resource) => (
                        <li key={resource.title} className="leading-snug text-[#4f4339]!">
                          {resource.title}
                          {resource.avgRating ? ` (${resource.avgRating.toFixed(1)} stars)` : ""}
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500! italic">No reviews compiled yet.</li>
                    )}
                  </ul>
                </div>
              </div>
            </article>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-[#eadfd3] bg-white p-5">
                <h3 className="text-lg font-semibold text-[#1f1f1f]!">Issue Stats</h3>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {Object.entries(latestIssue.stats ?? {}).map(([key, value]) => (
                    <div key={key} className="rounded-xl bg-[#f6f1ea] px-3 py-2 text-center">
                      <p className="text-xl font-bold text-[#1f1f1f]!">{value}</p>
                      <p className="text-[11px] uppercase tracking-[0.08em] text-[#756353]!">{key.replaceAll("_", " ")}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-[#eadfd3] bg-white p-5">
                <h3 className="text-lg font-semibold text-[#1f1f1f]!">Quick Links</h3>
                <div className="mt-3 grid gap-2 text-sm">
                  <Link href="/pages/events" className="rounded-xl bg-[#f6f1ea] px-3 py-2 text-[#5e5045]! hover:bg-[#efe5db] transition">View events</Link>
                  <Link href="/pages/resources" className="rounded-xl bg-[#f6f1ea] px-3 py-2 text-[#5e5045]! hover:bg-[#efe5db] transition">View resources</Link>
                  <Link href="/pages/news" className="rounded-xl bg-[#f6f1ea] px-3 py-2 text-[#5e5045]! hover:bg-[#efe5db] transition">Read news</Link>
                </div>
              </div>
            </aside>
          </section>
        )}

        {!loading && !error && previousIssues.length > 0 && (
          <section className="mt-14 border-t border-[#eadfd3] pt-10">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-[#1f1f1f]!">Past Issues</h3>
              <p className="text-sm font-medium text-[#8a7868]!">Scroll for more →</p>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-6 snap-x pt-2 px-1 -mx-1 no-scrollbar">
              {previousIssues.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => setSelectedIssue(issue)}
                  className="group relative flex w-72 shrink-0 snap-start flex-col justify-between rounded-2xl border border-[#eadfd3] bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md cursor-pointer"
                >
                  <div>
                    <p className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-[#f6f1ea] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#7a6655]!">
                      <CalendarDays size={10} /> {new Date(issue.issue_date).toLocaleDateString()}
                    </p>
                    <h4 className="mt-1 text-lg leading-snug font-semibold text-[#1f1f1f]! group-hover:text-[#997e67]! transition-colors line-clamp-2">
                      {issue.title}
                    </h4>
                    <p className="mt-2 text-sm text-[#5e5045]! line-clamp-3">
                      {issue.summary}
                    </p>
                  </div>
                  <div className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#997e67]! group-hover:text-[#846854]!">
                    Read Issue →
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      <AnimatePresence>
        {selectedIssue && (
          <div className="fixed inset-0 z-120 flex items-center justify-center p-4 sm:p-6 pb-20">
            <motion.button
              aria-label="Close modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
              onClick={() => setSelectedIssue(null)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex max-h-full w-full max-w-3xl flex-col rounded-3xl border border-[#e6ddd5] bg-[#fffdfa] shadow-2xl overflow-hidden"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-[#eadfd3] bg-[#fdfaf7] px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#8a7868]!">
                  Issue Archive: {new Date(selectedIssue.issue_date).toLocaleDateString()}
                </p>
                <button
                  aria-label="Close"
                  className="rounded-full bg-white p-2 text-[#6b5a4e]! shadow-sm ring-1 ring-black/5 transition hover:bg-[#f7f1ea] cursor-pointer"
                  onClick={() => setSelectedIssue(null)}
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="overflow-y-auto p-6 sm:p-8">
                <h2 className="mb-4 font-(--font-heading) text-3xl text-[#1f1f1f]!">{selectedIssue.title}</h2>
                <div className="mb-8 rounded-xl bg-[#f6f1ea] p-4 text-[#5e5045]!">
                  {selectedIssue.summary}
                </div>
                
                {selectedIssue.sections?.highlights && selectedIssue.sections.highlights.length > 0 && (
                  <div className="mb-8">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#7a6655]!">Highlights</h3>
                    <ul className="space-y-2 text-[#4f4339]!">
                      {selectedIssue.sections.highlights.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-[#997e67]! mt-0.5">•</span> <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#7a6655]!">Upcoming Events</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(selectedIssue.sections?.events ?? []).length > 0 ? (
                      selectedIssue.sections.events!.map((event) => (
                        <Link 
                          key={event.id}
                          href={`/pages/events?eventId=${event.id}`}
                          className="block rounded-xl border border-[#eadfd3] bg-white p-3 text-sm text-[#4f4339]! hover:border-[#997e67] hover:bg-[#fdfaf7] hover:text-[#997e67] transition-all cursor-pointer"
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
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(selectedIssue.sections?.topRatedResources ?? []).length > 0 ? (
                      selectedIssue.sections.topRatedResources!.map((resource) => (
                        <div key={resource.title} className="rounded-xl border border-[#eadfd3] p-3 text-sm text-[#4f4339]!">
                          {resource.title}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500!">None in this issue.</p>
                    )}
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
