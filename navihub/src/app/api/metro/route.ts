import { NextRequest, NextResponse } from "next/server";
import { transit_realtime } from "gtfs-realtime-bindings";

const MTA_FEED_BASE_URL =
  process.env.MTA_FEED_BASE_URL || "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds";

const FEED_BY_LINE: Record<string, string> = {
  A: "nyct%2Fgtfs-ace",
  C: "nyct%2Fgtfs-ace",
  E: "nyct%2Fgtfs-ace",
  B: "nyct%2Fgtfs-bdfm",
  D: "nyct%2Fgtfs-bdfm",
  F: "nyct%2Fgtfs-bdfm",
  M: "nyct%2Fgtfs-bdfm",
  G: "nyct%2Fgtfs-g",
  J: "nyct%2Fgtfs-jz",
  Z: "nyct%2Fgtfs-jz",
  L: "nyct%2Fgtfs-l",
  N: "nyct%2Fgtfs-nqrw",
  Q: "nyct%2Fgtfs-nqrw",
  R: "nyct%2Fgtfs-nqrw",
  W: "nyct%2Fgtfs-nqrw",
  1: "nyct%2Fgtfs",
  2: "nyct%2Fgtfs",
  3: "nyct%2Fgtfs",
  4: "nyct%2Fgtfs",
  5: "nyct%2Fgtfs",
  6: "nyct%2Fgtfs",
  7: "nyct%2Fgtfs",
  S: "nyct%2Fgtfs",
  SI: "nyct%2Fgtfs-si",
};

const buildError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

type Arrival = {
  tripId: string;
  routeId: string | null;
  startStopId: string;
  endStopId: string | null;
  startTime: string | null;
  endTime: string | null;
  minutesAway: number | null;
  durationMinutes: number | null;
  status: "scheduled" | "unknown";
};

const parseStopTime = (update?: transit_realtime.TripUpdate.IStopTimeUpdate | null) => {
  if (!update) return null;
  const arrival = update.arrival?.time ?? update.departure?.time ?? null;
  return arrival ? Number(arrival) : null;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lineParam = (searchParams.get("line") || "").toUpperCase();
  const startStopId = searchParams.get("startStopId") || "";
  const endStopId = searchParams.get("endStopId") || null;
  const direction = (searchParams.get("direction") || "").toUpperCase();
  const timeParam = searchParams.get("time");

  if (!lineParam || !startStopId) {
    return buildError("Missing required parameters: line, startStopId.");
  }

  const feedId = FEED_BY_LINE[lineParam];
  if (!feedId) {
    return buildError("Unsupported line. Provide a valid NYC subway line.", 400);
  }

  const earliestTime = timeParam && !Number.isNaN(Date.parse(timeParam))
    ? Math.floor(Date.parse(timeParam) / 1000)
    : null;

  try {
    const baseUrl = MTA_FEED_BASE_URL.replace(/\/+$/, "");
    const res = await fetch(`${baseUrl}/${feedId}`);

    if (!res.ok) {
      return buildError("Failed to fetch MTA feed.", 502);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const feed = transit_realtime.FeedMessage.decode(buffer);

    const nowSeconds = Math.floor(Date.now() / 1000);
    const arrivals: Arrival[] = [];

    feed.entity.forEach((entity) => {
      const tripUpdate = entity.tripUpdate;
      if (!tripUpdate || !tripUpdate.stopTimeUpdate?.length) return;

      const routeId = tripUpdate.trip?.routeId || null;
      if (routeId && routeId.toUpperCase() !== lineParam) return;

      const updates = tripUpdate.stopTimeUpdate || [];
      const startUpdate = updates.find((u) => u.stopId === startStopId);
      if (!startUpdate) return;

      if (direction && !startStopId.toUpperCase().endsWith(direction)) {
        return;
      }

      const startEpoch = parseStopTime(startUpdate);
      if (!startEpoch) return;
      if (earliestTime && startEpoch < earliestTime) return;

      const endUpdate = endStopId ? updates.find((u) => u.stopId === endStopId) : null;
      const endEpoch = endUpdate ? parseStopTime(endUpdate) : null;

      const durationMinutes =
        startEpoch && endEpoch ? Math.max(0, Math.round((endEpoch - startEpoch) / 60)) : null;

      arrivals.push({
        tripId: tripUpdate.trip?.tripId || entity.id || "unknown",
        routeId,
        startStopId,
        endStopId,
        startTime: startEpoch ? new Date(startEpoch * 1000).toISOString() : null,
        endTime: endEpoch ? new Date(endEpoch * 1000).toISOString() : null,
        minutesAway: startEpoch ? Math.max(0, Math.round((startEpoch - nowSeconds) / 60)) : null,
        durationMinutes,
        status: "scheduled",
      });
    });

    arrivals.sort((a, b) => {
      if (!a.startTime || !b.startTime) return 0;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

    const responseArrivals = arrivals.slice(0, 12);
    const message =
      responseArrivals.length === 0
        ? 'No trains matched the selected line, station, direction, or departure time.'
        : null;

    return NextResponse.json({
      line: lineParam,
      startStopId,
      endStopId,
      direction: direction || null,
      arrivals: responseArrivals,
      message,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Metro API error:", error);
    return buildError("Failed to load metro arrivals.", 502);
  }
}
