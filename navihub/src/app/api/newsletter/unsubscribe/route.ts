import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/src/app/lib/newsletter";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function unsubscribeEmail(email: string) {
  const normalized = email.trim().toLowerCase();

  if (!isValidEmail(normalized)) {
    return {
      ok: false,
      status: 400,
      message: "A valid email is required.",
    };
  }

  const supabase = createSupabaseAdminClient();

  const { data: existingRows, error: selectErr } = await supabase
    .from("newsletter_subscriptions")
    .select("id")
    .ilike("email", normalized)
    .limit(1);

  if (selectErr) {
    return {
      ok: false,
      status: 500,
      message: selectErr.message,
    };
  }

  if (!existingRows || existingRows.length === 0) {
    return {
      ok: true,
      status: 200,
      message: "Email is already unsubscribed.",
    };
  }

  const { error: updateErr } = await supabase
    .from("newsletter_subscriptions")
    .update({
      status: "unsubscribed",
      metadata: {
        unsubscribedAt: new Date().toISOString(),
      },
    })
    .eq("id", existingRows[0].id as string);

  if (updateErr) {
    return {
      ok: false,
      status: 500,
      message: updateErr.message,
    };
  }

  return {
    ok: true,
    status: 200,
    message: "You have been unsubscribed.",
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email ?? "";

    const result = await unsubscribeEmail(email);
    return NextResponse.json(
      { success: result.ok, message: result.message },
      { status: result.status }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email") ?? "";
  const result = await unsubscribeEmail(email);

  const target = new URL("/pages/newsletter", request.nextUrl.origin);
  target.searchParams.set("unsubscribed", result.ok ? "1" : "0");
  if (!result.ok) {
    target.searchParams.set("error", result.message);
  }

  return NextResponse.redirect(target);
}
