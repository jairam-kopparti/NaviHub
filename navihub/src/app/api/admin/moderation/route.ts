import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminEmail } from "../../../lib/admin";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const getAuthUser = async (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) return null;
  return data.user;
};

const assertAdminUser = async (req: NextRequest) => {
  const user = await getAuthUser(req);
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
};

export async function GET(req: NextRequest) {
  try {
    const adminUser = await assertAdminUser(req);
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [{ data: pendingResources, error: resourcesError }, { data: pendingEvents, error: eventsError }] =
      await Promise.all([
        supabaseAdmin
          .from("resources")
          .select("id, title, category, location, description, status, user_id")
          .eq("status", "pending")
          .order("id", { ascending: true }),
        supabaseAdmin
          .from("events")
          .select("id, title, category, event_date, start_time, location_name, description, created_at, status, user_id, creator_name")
          .eq("status", "pending")
          .order("created_at", { ascending: true }),
      ]);

    if (resourcesError || eventsError) {
      return NextResponse.json(
        { error: resourcesError?.message || eventsError?.message || "Failed to load pending submissions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      pendingResources: pendingResources ?? [],
      pendingEvents: pendingEvents ?? [],
    });
  } catch (error) {
    console.error("Admin moderation GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

type ModerationTarget = "resource" | "event";
type ModerationAction = "approve" | "reject";

export async function POST(req: NextRequest) {
  try {
    const adminUser = await assertAdminUser(req);
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const target = body?.target as ModerationTarget;
    const action = body?.action as ModerationAction;
    const itemId = body?.itemId as string;

    if (!itemId || (target !== "resource" && target !== "event") || (action !== "approve" && action !== "reject")) {
      return NextResponse.json({ error: "Invalid moderation payload" }, { status: 400 });
    }

    const nextStatus = action === "approve" ? "approved" : "rejected";

    if (target === "resource") {
      const { data, error } = await supabaseAdmin
        .from("resources")
        .update({ status: nextStatus })
        .eq("id", itemId)
        .select("id, status")
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json({ error: "Resource not found" }, { status: 404 });
      }

      return NextResponse.json({ ok: true, item: data });
    }

    const { data, error } = await supabaseAdmin
      .from("events")
      .update({ status: nextStatus })
      .eq("id", itemId)
      .select("id, status")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, item: data });
  } catch (error) {
    console.error("Admin moderation POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}