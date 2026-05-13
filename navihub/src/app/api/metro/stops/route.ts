import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";

const STATIC_GTFS_URL =
  process.env.MTA_STATIC_GTFS_URL ||
  "https://web.mta.info/developers/data/nyct/subway/google_transit.zip";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let stopsCache: StopRecord[] | null = null;
let stopsCacheAt = 0;

type StopRecord = {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
};

const buildError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

const loadStops = async () => {
  if (stopsCache && Date.now() - stopsCacheAt < CACHE_TTL_MS) return stopsCache;

  const res = await fetch(STATIC_GTFS_URL, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error("Failed to download GTFS stops");

  const buffer = Buffer.from(await res.arrayBuffer());
  const zip = new AdmZip(buffer);
  const entry = zip.getEntry("stops.txt");
  if (!entry) throw new Error("Missing stops.txt in GTFS archive");

  const csvText = entry.getData().toString("utf-8");
  const records = parse(csvText, { columns: true, skip_empty_lines: true }) as Record<string, string>[];

  const stops = records
    .filter((record) => record.stop_id && record.stop_name)
    .map((record) => ({
      stop_id: record.stop_id.trim(),
      stop_name: record.stop_name.trim(),
      stop_lat: Number(record.stop_lat),
      stop_lon: Number(record.stop_lon),
    }))
    .filter((record) => Number.isFinite(record.stop_lat) && Number.isFinite(record.stop_lon));

  stopsCache = stops;
  stopsCacheAt = Date.now();
  return stops;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") || "").trim().toLowerCase();
  const limitParam = Number(searchParams.get("limit") || 25);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 25;
  const all = searchParams.get("all") === "1";

  try {
    const stops = await loadStops();
    let results = stops;

    if (!all) {
      if (query.length >= 2) {
        results = stops.filter((stop) => {
          return (
            stop.stop_name.toLowerCase().includes(query) ||
            stop.stop_id.toLowerCase().includes(query)
          );
        });
      }
      results = results.slice(0, limit);
    }

    return NextResponse.json({
      stops: results,
      count: results.length,
      total: stops.length,
    });
  } catch (error) {
    console.error("Stops API error:", error);
    return buildError("Failed to load stops list.", 502);
  }
}
