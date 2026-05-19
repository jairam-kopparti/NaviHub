"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Mail, X, Sparkles, CheckCircle2 } from "lucide-react";
import { useUser } from "@/src/app/lib/useUser";

const AUTO_TARGET_PATH = "/";
const AUTO_OPEN_DELAY_MS = 6000;
const AUTO_CLOSE_MS = 5000;
const AUTO_OPEN_MAX_PER_SESSION = 3;
const SESSION_AUTO_COUNT = "navihub_newsletter_auto_count";
const SESSION_DISMISS_UNTIL = "navihub_newsletter_dismiss_until";
const SESSION_DISMISS_COOLDOWN_MS = 10 * 60 * 1000;

const STORAGE_SUBSCRIBED = "navihub_newsletter_subscribed";

function isHomePage(pathname: string): boolean {
  return pathname === AUTO_TARGET_PATH || pathname === "";
}

function getSessionNumber(key: string): number {
  if (typeof window === "undefined") return 0;
  const raw = window.sessionStorage.getItem(key);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function setSessionNumber(key: string, value: number) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(key, String(value));
}

function getDismissedUntil(): number {
  return getSessionNumber(SESSION_DISMISS_UNTIL);
}

export default function NewsletterSubscriptionModal() {
  const pathname = usePathname() ?? "";
  const { user } = useUser();

  const [isOpen, setIsOpen] = useState(false);
  const [openSource, setOpenSource] = useState<"auto" | "manual">("manual");
  const [autoProgress, setAutoProgress] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState<"unknown" | "subscribed" | "unsubscribed">("unknown");

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [deliveryChannel, setDeliveryChannel] = useState<"email" | "web" | "both">("email");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isExistingUser, setIsExistingUser] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(false);

  const isAutoTarget = useMemo(() => isHomePage(pathname), [pathname]);
  const canAutoOpen = useMemo(
    () => isAutoTarget && !!user && subscriptionStatus === "unsubscribed",
    [isAutoTarget, user, subscriptionStatus]
  );

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
    if (user?.user_metadata?.full_name) {
      setDisplayName(String(user.user_metadata.full_name));
    }
  }, [user]);

  useEffect(() => {
    if (!user?.email) {
      setSubscriptionStatus("unknown");
      return;
    }

    let isActive = true;
    const localSubscribed =
      typeof window !== "undefined" && window.localStorage.getItem(STORAGE_SUBSCRIBED) === "1";

    if (localSubscribed) {
      setSubscriptionStatus("subscribed");
    }

    const checkSubscription = async () => {
      try {
        const email = user.email;
        if (!email) return;

        const res = await fetch(`/api/newsletter/subscribe?email=${encodeURIComponent(email)}`);
        if (!res.ok) {
          if (isActive) {
            setSubscriptionStatus(localSubscribed ? "subscribed" : "unsubscribed");
          }
          return;
        }

        const data = await res.json();
        if (!isActive) return;

        if (data.subscribed) {
          window.localStorage.setItem(STORAGE_SUBSCRIBED, "1");
          setSubscriptionStatus("subscribed");
        } else {
          setSubscriptionStatus("unsubscribed");
        }
      } catch (err) {
        if (isActive) {
          setSubscriptionStatus(localSubscribed ? "subscribed" : "unsubscribed");
        }
      }
    };

    checkSubscription();

    return () => {
      isActive = false;
    };
  }, [user?.email]);

  // Fetch existing preferences if email is typed or authed
  useEffect(() => {
    if (!isOpen || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    const checkStatus = async () => {
      setLoadingPreferences(true);
      try {
        const res = await fetch(`/api/newsletter/subscribe?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.subscribed) {
            setIsExistingUser(true);
            setDeliveryChannel(data.deliveryChannel || "email");
            if (data.displayName && !displayName) setDisplayName(data.displayName);
          } else {
            setIsExistingUser(false);
          }
        }
      } catch (e) {
        // Ignore, fallback to signup form
      } finally {
        setLoadingPreferences(false);
      }
    };

    const debounceId = setTimeout(checkStatus, 600);
    return () => clearTimeout(debounceId);
  }, [email, isOpen]);

  useEffect(() => {
    const onOpenRequested = () => {
      setOpenSource("manual");
      setIsOpen(true);
    };

    window.addEventListener("open-newsletter-modal", onOpenRequested);
    return () => {
      window.removeEventListener("open-newsletter-modal", onOpenRequested);
    };
  }, []);

  useEffect(() => {
    if (!canAutoOpen || isOpen) return;

    const dismissedUntil = getDismissedUntil();
    if (dismissedUntil > Date.now()) return;

    const autoCount = getSessionNumber(SESSION_AUTO_COUNT);
    if (autoCount >= AUTO_OPEN_MAX_PER_SESSION) return;

    const timer = window.setTimeout(() => {
      setOpenSource("auto");
      setIsOpen(true);
      setSessionNumber(SESSION_AUTO_COUNT, autoCount + 1);
    }, AUTO_OPEN_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [canAutoOpen, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || openSource !== "auto") {
      setAutoProgress(0);
      return;
    }

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(100, (elapsed / AUTO_CLOSE_MS) * 100);
      setAutoProgress(progress);

      if (elapsed >= AUTO_CLOSE_MS) {
        window.clearInterval(interval);
        handleClose("auto");
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, [isOpen, openSource]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const handleClose = (reason: "manual" | "auto" = "manual") => {
    setIsOpen(false);
    setAutoProgress(0);

    if (!success) {
      const cooldownMs = reason === "manual"
        ? SESSION_DISMISS_COOLDOWN_MS
        : Math.max(2 * 60 * 1000, Math.floor(SESSION_DISMISS_COOLDOWN_MS / 2));
      const dismissUntil = Date.now() + cooldownMs;
      setSessionNumber(SESSION_DISMISS_UNTIL, dismissUntil);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          displayName,
          userId: user?.id ?? null,
          deliveryChannel,
          source: openSource === "auto" ? "auto_modal" : "manual_cta",
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to subscribe.");
      }

      setSuccess(true);
      window.localStorage.setItem(STORAGE_SUBSCRIBED, "1");
      setSubscriptionStatus("subscribed");

      window.setTimeout(() => {
        setIsOpen(false);
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to subscribe right now.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center p-4 sm:p-6">
      <button
        aria-label="Close newsletter signup"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] z-0"
        onClick={() => handleClose()}
      />

      <div role="dialog" aria-modal="true" aria-labelledby="newsletter-sub-title" className="relative z-10 w-full max-w-5xl overflow-hidden rounded-4xl border border-[#e6ddd5] bg-[#fffdfa] shadow-[0_28px_120px_rgba(0,0,0,0.35)]">
        {openSource === "auto" && (
          <div className="absolute left-0 top-0 h-1 w-full bg-[#efe7de]">
            <div
              className="h-full bg-[#997e67] transition-[width] duration-100"
              style={{ width: `${autoProgress}%` }}
            />
          </div>
        )}
        <button
          aria-label="Close"
          className="absolute right-4 top-4 z-20 rounded-full border border-[#ece0d4] bg-white p-2 text-[#6b5a4e] transition hover:bg-[#f7f1ea] cursor-pointer"
          onClick={() =>handleClose()}
        >
          <X size={18} />
        </button>

        <div className="grid md:grid-cols-[0.95fr_1.35fr]">
          <aside className="relative overflow-hidden border-b border-[#efe7de] bg-[#1f1f1f] p-7 md:border-b-0 md:border-r md:border-r-[#2a2a2a] md:p-10">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#997e67]/25 blur-3xl" />
            <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-[#ccbeb1]/20 blur-3xl" />

            <div className="relative">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.16em] !text-[#f1e5da]">
                <Sparkles size={12} /> Weekly Digest
              </p>
              <h2 className="mb-4 font-(--font-heading) text-3xl leading-tight !text-white md:text-[2.25rem]">
                Keep Your Community Feed Curated
              </h2>
              <p className="text-base! leading-relaxed !text-[#dfd3c8]">
                Get a professional Monday update with upcoming events, top-rated resources, community reviews, and NYC highlights.
              </p>

              <div className="mt-8 space-y-3 text-sm !text-[#eaddd1]">
                <div className="flex items-start gap-3">
                  <Mail size={16} className="mt-0.5 !text-[#ccbeb1]" />
                  <p className="text-sm!">Email delivery, website archive, or both.</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="mt-0.5 !text-[#ccbeb1]" />
                  <p className="text-sm!">One universal weekly edition, sent every Monday.</p>
                </div>
              </div>
            </div>
          </aside>

          <section className="p-6 sm:p-8 md:p-9">
            {success ? (
              <div aria-live="polite" className="flex h-full min-h-90 flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-[#edf7ee] p-3 !text-[#2f7a42]">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="mb-2 text-2xl font-bold !text-[#1f1f1f]">Saved Successfully!</h3>
                <p className="text-[15px]! !text-[#6b5a4e]">
                  Your preferences have been registered.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="mb-4">
                  <h2 id="newsletter-sub-title" className="mb-1 font-(--font-heading) text-2xl !text-[#1f1f1f]">
                    {isExistingUser ? "Manage Preferences" : "Weekly Digest"}
                  </h2>
                  <p className="text-sm !text-[#6b5a4e]">
                    {isExistingUser 
                      ? "Update how you receive our weekly roundup." 
                      : "Get the best of NaviHub delivered straight to you every Monday."}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] !text-[#7a6a5c]">Name</span>
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Community Member"
                      className="w-full rounded-xl border border-[#e8ddd3] bg-white px-3.5 py-2.5 text-[15px] !text-[#1f1f1f] outline-none transition focus:border-[#997e67]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] !text-[#7a6a5c]">Email</span>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-[#e8ddd3] bg-white px-3.5 py-2.5 text-[15px] !text-[#1f1f1f] outline-none transition focus:border-[#997e67]"
                    />
                  </label>
                </div>

                <div className="grid gap-4">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] !text-[#7a6a5c]">Delivery</span>
                    <select
                      value={deliveryChannel}
                      onChange={(e) => setDeliveryChannel(e.target.value as "email" | "web" | "both")}
                      className="w-full rounded-xl border border-[#e8ddd3] bg-white px-3.5 py-2.5 text-[15px] !text-[#1f1f1f] outline-none transition focus:border-[#997e67]"
                    >
                      <option value="email">Email only</option>
                      <option value="web">Website archive only</option>
                      <option value="both">Email + website archive</option>
                    </select>
                  </label>
                </div>

                {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm !text-red-700">{error}</p>}

                <div className="flex flex-col gap-3">
                  <button
                    disabled={submitting || loadingPreferences || !email}
                    className="w-full cursor-pointer rounded-xl bg-[#1f1f1f] px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#3a3129] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting 
                      ? "Saving..." 
                      : isExistingUser 
                        ? "Update Preferences" 
                        : "Subscribe to Weekly Newsletter"}
                  </button>

                  {isExistingUser && (
                    <button
                      type="button"
                      onClick={() => window.location.href = `/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`}
                      className="w-full rounded-xl py-3 text-sm font-medium !text-red-600/80 transition-colors hover:bg-red-50 hover:text-red-700 cursor-pointer"
                    >
                      Unsubscribe from Newsletter
                    </button>
                  )}
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
