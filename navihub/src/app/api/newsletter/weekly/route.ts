import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildEditorialFallback,
  buildEditorialSeeds,
  buildNewsletterSections,
  createIssuePayload,
  createSupabaseAdminClient,
  getIssueDateForWeek,
  getNewsletterSummary,
  renderNewsletterEmail,
  selectEditorialSeeds,
  fetchWeeklyBaseContent,
  type NewsletterEditorial,
} from "@/src/app/lib/newsletter";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface WeeklyBody {
  dryRun?: boolean;
}

interface NewsletterSubscriber {
  id: string;
  email: string;
  display_name: string | null;
  delivery_channel: "email" | "web" | "both";
}

function safeParseJson(text: string): unknown | null {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;

  const snippet = text.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(snippet);
  } catch {
    return null;
  }
}

function normalizeEditorialPayload(
  raw: unknown,
  fallback: NewsletterEditorial
): NewsletterEditorial {
  if (!raw || typeof raw !== "object") return fallback;
  const payload = raw as Record<string, unknown>;

  const paragraphs = Array.isArray(payload.paragraphs)
    ? payload.paragraphs.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean)
    : [];

  const sideStories = Array.isArray(payload.sideStories)
    ? payload.sideStories
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const story = item as Record<string, unknown>;
          const headline = typeof story.headline === "string" ? story.headline.trim() : "";
          const summary = typeof story.summary === "string" ? story.summary.trim() : "";
          const source = typeof story.source === "string" ? story.source.trim() : "";
          return headline && summary
            ? {
                headline,
                summary,
                source,
              }
            : null;
        })
        .filter(Boolean)
    : [];

  return {
    ...fallback,
    kicker: typeof payload.kicker === "string" ? payload.kicker.trim() : fallback.kicker,
    headline: typeof payload.headline === "string" ? payload.headline.trim() : fallback.headline,
    subhead: typeof payload.subhead === "string" ? payload.subhead.trim() : fallback.subhead,
    byline: typeof payload.byline === "string" ? payload.byline.trim() : fallback.byline,
    location: typeof payload.location === "string" ? payload.location.trim() : fallback.location,
    paragraphs: paragraphs.length >= 2 ? paragraphs.slice(0, 4) : fallback.paragraphs,
    imageCaption:
      typeof payload.imageCaption === "string" ? payload.imageCaption.trim() : fallback.imageCaption,
    sideStories: sideStories.length > 0 ? (sideStories as NewsletterEditorial["sideStories"]) : fallback.sideStories,
  };
}

function buildSummaryFromEditorial(editorial: NewsletterEditorial): string {
  const summary = [editorial.paragraphs[0], editorial.paragraphs[1]]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (summary.length <= 240) return summary;
  return `${summary.slice(0, 237).trim()}...`;
}

function hasVercelCronAuthorization(req: NextRequest): boolean {
  const vercelCronHeader = req.headers.get("x-vercel-cron");
  if (vercelCronHeader === "1") return true;

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

  return false;
}

function isAuthorized(req: NextRequest): boolean {
  if (hasVercelCronAuthorization(req)) return true;

  const configuredSecret = process.env.NEWSLETTER_CRON_SECRET;
  if (!configuredSecret) return true;

  const secretHeader = req.headers.get("x-newsletter-secret");
  const secretQuery = req.nextUrl.searchParams.get("secret");
  return secretHeader === configuredSecret || secretQuery === configuredSecret;
}

async function runWeeklyNewsletter(request: NextRequest, dryRun: boolean) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const issueDate = getIssueDateForWeek(new Date());

    const baseContent = await fetchWeeklyBaseContent(supabase);
    const universalSections = buildNewsletterSections(baseContent);
    const universalIssue = createIssuePayload({
      issueDate,
      mode: "universal",
      sections: universalSections,
    });

    const editorialSeedPool = buildEditorialSeeds(baseContent);
    const editorialSeeds = selectEditorialSeeds(editorialSeedPool, 4);
    const fallbackEditorial = buildEditorialFallback({
      issueDate,
      seeds: editorialSeeds,
    });

    let editorial = fallbackEditorial;

    // Generate Gemini editorial payload
    if (process.env.GEMINI_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const prompt = `You are writing a fictional, child-friendly local newsletter for ages 8-18. Avoid scary, political, or controversial topics. Keep a warm, optimistic tone.\n\nReturn ONLY valid JSON using this exact shape:\n{\n  "kicker": "...",\n  "headline": "...",\n  "subhead": "...",\n  "byline": "NaviHub Newsroom",\n  "location": "New York City",\n  "paragraphs": ["...", "...", "..."],\n  "imageCaption": "...",\n  "sideStories": [\n    {"headline": "...", "summary": "...", "source": "..."},\n    {"headline": "...", "summary": "...", "source": "..."},\n    {"headline": "...", "summary": "...", "source": "..."}\n  ]\n}\n\nRules:\n- 3-4 paragraphs, 2-3 sentences each.\n- Keep everything local to NYC neighborhoods, libraries, parks, schools, and community centers.\n- Avoid real people names, government figures, courts, and world politics.\n- Avoid conflict, crime, or scary events.\n- Make the stories feel community-based and uplifting.\n\nSeed story inspirations (use these as themes, not quotes):\n${JSON.stringify(
          editorialSeeds.map((seed) => ({
            headline: seed.headline,
            summary: seed.summary,
            category: seed.category,
            location: seed.location,
            source: seed.source,
          }))
        )}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = text ? safeParseJson(text) : null;
        if (parsed) {
          editorial = normalizeEditorialPayload(parsed, fallbackEditorial);
        }
      } catch (e) {
        console.error("Gemini Newsletter editorial generation failed:", e);
      }
    }

    universalSections.editorial = editorial;
    const summaryFromEditorial = buildSummaryFromEditorial(editorial);
    if (summaryFromEditorial) {
      universalIssue.summary = summaryFromEditorial;
    }


    const { data: issueRow, error: issueError } = await supabase
      .from("newsletter_issues")
      .upsert([
        {
          issue_date: universalIssue.issue_date,
          slug: universalIssue.slug,
          title: universalIssue.title,
          summary: universalIssue.summary,
          sections: universalIssue.sections,
          stats: universalIssue.stats,
          published_at: new Date().toISOString(),
        },
      ], { onConflict: "issue_date" })
      .select("id, issue_date, title")
      .single();

    if (issueError || !issueRow) {
      return NextResponse.json(
        { error: issueError?.message ?? "Failed to create newsletter issue." },
        { status: 500 }
      );
    }

    const { data: subscriptionRows, error: subscriptionError } = await supabase
      .from("newsletter_subscriptions")
      .select("id, email, display_name, status, frequency, delivery_channel")
      .eq("status", "active")
      .eq("frequency", "weekly_monday");

    if (subscriptionError) {
      return NextResponse.json(
        { error: subscriptionError.message },
        { status: 500 }
      );
    }

    const subscriptions = (subscriptionRows ?? []) as NewsletterSubscriber[];

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      request.nextUrl.origin.replace(/\/$/, "");

    const fromEmail = process.env.NEWSLETTER_FROM_EMAIL || "NaviHub <onboarding@resend.dev>";

    let processed = 0;
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const subscription of subscriptions) {
      processed += 1;

      const sections = universalSections;

      if (subscription.delivery_channel === "web" || subscription.delivery_channel === "both") {
        if (!dryRun) {
          await supabase.from("newsletter_deliveries").upsert(
            [
              {
                issue_id: issueRow.id,
                subscription_id: subscription.id,
                delivery_channel: "web",
                status: "sent",
                sent_at: new Date().toISOString(),
              },
            ],
            { onConflict: "issue_id,subscription_id,delivery_channel" }
          );
        }
      }

      if (subscription.delivery_channel === "web") {
        skipped += 1;
        continue;
      }

      const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(
        subscription.email
      )}`;

      const html = renderNewsletterEmail({
        issueTitle: universalIssue.title,
        issueDate: universalIssue.issue_date,
        recipientName: subscription.display_name,
        summary: getNewsletterSummary("universal"),
        sections,
        siteUrl,
        unsubscribeUrl,
        mode: "universal",
      });

      if (dryRun) {
        sent += 1;
        continue;
      }

      if (!resend) {
        failed += 1;
        await supabase.from("newsletter_deliveries").upsert(
          [
            {
              issue_id: issueRow.id,
              subscription_id: subscription.id,
              delivery_channel: "email",
              status: "failed",
              error_message: "RESEND_API_KEY is not configured.",
            },
          ],
          { onConflict: "issue_id,subscription_id,delivery_channel" }
        );
        continue;
      }

      try {
        const result = await resend.emails.send({
          from: fromEmail,
          to: subscription.email,
          subject: universalIssue.title,
          html,
        });

        sent += 1;

        await supabase.from("newsletter_deliveries").upsert(
          [
            {
              issue_id: issueRow.id,
              subscription_id: subscription.id,
              delivery_channel: "email",
              status: "sent",
              provider_message_id: result.data?.id ?? null,
              sent_at: new Date().toISOString(),
            },
          ],
          { onConflict: "issue_id,subscription_id,delivery_channel" }
        );

        await supabase
          .from("newsletter_subscriptions")
          .update({ last_sent_at: new Date().toISOString() })
          .eq("id", subscription.id);
      } catch (error) {
        failed += 1;

        await supabase.from("newsletter_deliveries").upsert(
          [
            {
              issue_id: issueRow.id,
              subscription_id: subscription.id,
              delivery_channel: "email",
              status: "failed",
              error_message: error instanceof Error ? error.message : "Unknown email error.",
            },
          ],
          { onConflict: "issue_id,subscription_id,delivery_channel" }
        );
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      issue: {
        id: issueRow.id,
        issueDate: issueRow.issue_date,
        title: issueRow.title,
      },
      processed,
      sent,
      failed,
      skipped,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected error while sending newsletter.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as WeeklyBody;
  return runWeeklyNewsletter(request, Boolean(body.dryRun));
}

export async function GET(request: NextRequest) {
  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  return runWeeklyNewsletter(request, dryRun);
}
