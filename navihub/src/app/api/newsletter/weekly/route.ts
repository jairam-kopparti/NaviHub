import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  buildNewsletterSections,
  createIssuePayload,
  createSupabaseAdminClient,
  getIssueDateForWeek,
  getNewsletterSummary,
  renderNewsletterEmail,
  fetchWeeklyBaseContent,
} from "@/src/app/lib/newsletter";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface WeeklyBody {
  dryRun?: boolean;
}

interface NewsletterSubscriber {
  id: string;
  email: string;
  display_name: string | null;
  delivery_channel: "email" | "web" | "both";
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
