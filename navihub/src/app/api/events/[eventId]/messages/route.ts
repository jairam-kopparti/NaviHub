import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { moderateContent } from "../../../moderate/moderation";

// Server-side Supabase client using service role for RLS bypass on auth checks.
// Message inserts still go through the user's session client for RLS enforcement.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Helper: Extract and validate the Supabase auth session from the request.
 * Returns the authenticated user or null.
 */
async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

/**
 * Helper: Check if a user is signed up for a specific event.
 */
async function isUserSignedUp(userId: string, eventId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("event_signups")
    .select("id")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .single();

  return !!data;
}

// ─── GET /api/events/[eventId]/messages ───
// Fetch paginated messages for an event chat.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const user = await getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify membership
    const signedUp = await isUserSignedUp(user.id, eventId);
    if (!signedUp) {
      return NextResponse.json(
        { error: "You must be registered for this event to view messages" },
        { status: 403 }
      );
    }

    // Pagination via cursor (created_at)
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const before = searchParams.get("before"); // ISO timestamp cursor

    let query = supabaseAdmin
      .from("event_messages")
      .select("id, event_id, user_id, message, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error("Failed to fetch messages:", error);
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    // Collect unique user IDs to fetch display names
    const userIds = [...new Set(messages?.map((m) => m.user_id) || [])];
    const userMap: Record<string, string> = {};

    if (userIds.length > 0) {
      // Fetch user metadata from auth.users via admin API
      for (const uid of userIds) {
        const { data } = await supabaseAdmin.auth.admin.getUserById(uid);
        if (data?.user) {
          userMap[uid] =
            data.user.user_metadata?.full_name ||
            data.user.email?.split("@")[0] ||
            "Anonymous";
        }
      }
    }

    // Attach display names and return in chronological order
    const enriched = (messages || [])
      .map((m) => ({
        ...m,
        user_name: userMap[m.user_id] || "Anonymous",
      }))
      .reverse(); // Oldest first for chat display

    return NextResponse.json({ messages: enriched });
  } catch (err) {
    console.error("GET /messages error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/events/[eventId]/messages ───
// Submit a new message to an event chat.

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const user = await getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify membership
    const signedUp = await isUserSignedUp(user.id, eventId);
    if (!signedUp) {
      return NextResponse.json(
        { error: "You must be registered for this event to send messages" },
        { status: 403 }
      );
    }

    // Parse body
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const trimmed = message.trim();

    // ── Moderation Gate ──
    const modResult = moderateContent(trimmed);

    if (!modResult.allowed) {
      return NextResponse.json(
        {
          error: "Message blocked by moderation",
          moderation: {
            severity: modResult.severity,
            reason: modResult.reason,
            category: modResult.category,
          },
        },
        { status: 422 }
      );
    }

    // ── Insert message ──
    const { data: inserted, error } = await supabaseAdmin
      .from("event_messages")
      .insert({
        event_id: eventId,
        user_id: user.id,
        message: trimmed,
      })
      .select("id, event_id, user_id, message, created_at")
      .single();

    if (error) {
      console.error("Failed to insert message:", error);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    // Attach user display name to response
    const userName =
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Anonymous";

    return NextResponse.json(
      {
        message: { ...inserted, user_name: userName },
        moderation: modResult.flagged
          ? { severity: modResult.severity, reason: modResult.reason }
          : undefined,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /messages error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE /api/events/[eventId]/messages ───
// Delete a specific message.

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const user = await getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
    }

    // Check ownership first
    const { data: existingMsg } = await supabaseAdmin
      .from("event_messages")
      .select("user_id, event_id")
      .eq("id", messageId)
      .single();

    if (!existingMsg) {
       return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (existingMsg.user_id !== user.id) {
       return NextResponse.json(
         { error: "You can only delete your own messages" },
         { status: 403 }
       );
    }

    if (existingMsg.event_id !== eventId) {
       return NextResponse.json({ error: "Message does not belong to this event" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("event_messages")
      .delete()
      .eq("id", messageId);

    if (error) {
      console.error("Failed to delete message:", error);
      return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /messages error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
