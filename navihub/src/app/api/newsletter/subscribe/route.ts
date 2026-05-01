import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  DeliveryChannel,
} from "@/src/app/lib/newsletter";

interface SubscribeBody {
  email?: string;
  displayName?: string;
  userId?: string | null;
  deliveryChannel?: DeliveryChannel;
  source?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toSafeDeliveryChannel(value: unknown): DeliveryChannel {
  if (value === "web" || value === "both") return value;
  return "email";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubscribeBody;

    const rawEmail = (body.email ?? "").trim();
    const normalizedEmail = rawEmail.toLowerCase();

    if (!rawEmail || !isValidEmail(rawEmail)) {
      return NextResponse.json(
        { error: "A valid email is required." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: existingRows, error: existingErr } = await supabase
      .from("newsletter_subscriptions")
      .select("id")
      .ilike("email", normalizedEmail)
      .limit(1);

    if (existingErr) {
      return NextResponse.json(
        { error: existingErr.message },
        { status: 500 }
      );
    }

    const deliveryChannel = toSafeDeliveryChannel(body.deliveryChannel);

    const basePayload = {
      email: normalizedEmail,
      display_name: body.displayName?.trim() || null,
      user_id: body.userId ?? null,
      status: "active",
      frequency: "weekly_monday",
      delivery_channel: deliveryChannel,
      opt_in_source: body.source?.trim() || "site_modal",
      metadata: {
        subscribedAt: new Date().toISOString(),
        newsletterMode: "universal",
      },
    };

    let subscriptionId: string;

    if (existingRows && existingRows.length > 0) {
      subscriptionId = existingRows[0].id as string;

      const { error: updateErr } = await supabase
        .from("newsletter_subscriptions")
        .update(basePayload)
        .eq("id", subscriptionId);

      if (updateErr) {
        return NextResponse.json(
          { error: updateErr.message },
          { status: 500 }
        );
      }
    } else {
      const { data: insertedRow, error: insertErr } = await supabase
        .from("newsletter_subscriptions")
        .insert([basePayload])
        .select("id")
        .single();

      if (insertErr || !insertedRow) {
        return NextResponse.json(
          { error: insertErr?.message ?? "Failed to create subscription." },
          { status: 500 }
        );
      }

      subscriptionId = insertedRow.id as string;
    }

    return NextResponse.json({
      success: true,
      subscriptionId,
      email: normalizedEmail,
      mode: "universal",
      deliveryChannel,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("newsletter_subscriptions")
      .select("status, delivery_channel, display_name")
      .ilike("email", email)
      .single();

    // Not found is fine; just means they aren't subscribed yet
    if (error || !data) {
      return NextResponse.json({ subscribed: false });
    }

    return NextResponse.json({
      subscribed: data.status === "active",
      deliveryChannel: data.delivery_channel,
      displayName: data.display_name
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
