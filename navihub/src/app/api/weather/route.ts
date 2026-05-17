import { NextRequest, NextResponse } from "next/server";
import { BOROUGH_CENTERS, BoroughName } from "@/src/app/lib/nycBoroughs";

const METEOSOURCE_API_KEY = process.env.METEOSOURCE_API_KEY || "";
const METEOSOURCE_API_BASE_URL =
  process.env.METEOSOURCE_API_BASE_URL || "https://www.meteosource.com/api/v1/free/point";

const BOROUGHS = Object.keys(BOROUGH_CENTERS) as BoroughName[];

type WeatherDay = {
  date: string;
  tempMaxF: number | null;
  tempMinF: number | null;
  condition: string | null;
  precipitationMm: number | null;
  precipitationChance: number | null;
  pollenLevel: string | null;
};

type WeatherResponse = {
  borough: BoroughName | "NYC";
  latitude: number;
  longitude: number;
  updatedAt: string;
  days: WeatherDay[];
  sources: {
    openWeather: boolean;
    meteoSource: boolean;
  };
};

const buildError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

const getCoordinates = (boroughParam: string | null, latParam: string | null, lonParam: string | null) => {
  if (latParam && lonParam) {
    const lat = Number(latParam);
    const lon = Number(lonParam);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      return { borough: "NYC" as const, lat, lon };
    }
  }

  const borough = BOROUGHS.find((b) => b.toLowerCase() === (boroughParam || "").toLowerCase());
  if (!borough) return null;
  const [lon, lat] = BOROUGH_CENTERS[borough];
  return { borough, lat, lon };
};

const mergeForecasts = (
  primaryDays: WeatherDay[],
  secondaryByDate: Map<string, WeatherDay>,
  meteoPollenByDate: Map<string, string | null>
) => {
  return primaryDays.map((day) => {
    const secondary = secondaryByDate.get(day.date);
    return {
      ...day,
      tempMaxF: day.tempMaxF ?? secondary?.tempMaxF ?? null,
      tempMinF: day.tempMinF ?? secondary?.tempMinF ?? null,
      condition: day.condition ?? secondary?.condition ?? null,
      precipitationMm: day.precipitationMm ?? secondary?.precipitationMm ?? null,
      precipitationChance: day.precipitationChance ?? secondary?.precipitationChance ?? null,
      pollenLevel: meteoPollenByDate.get(day.date) ?? day.pollenLevel ?? secondary?.pollenLevel ?? null,
    };
  });
};

const createFallbackDays = () => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    return {
      date: date.toISOString().slice(0, 10),
      tempMaxF: null,
      tempMinF: null,
      condition: index === 0 ? "Forecast unavailable" : "No forecast data",
      precipitationMm: null,
      precipitationChance: null,
      pollenLevel: null,
    } satisfies WeatherDay;
  });
};

const toNumber = (value: unknown) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const pickNumber = (entry: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const numericValue = toNumber(entry[key]);
    if (numericValue !== null) return numericValue;
  }
  return null;
};

const normalizeProbability = (value: number | null) => {
  if (value === null) return null;
  if (value > 1) return Math.min(value / 100, 1);
  return value;
};

const getPathValue = (entry: Record<string, unknown>, path: string) => {
  return path.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[key];
  }, entry);
};

const pickNestedNumber = (entry: Record<string, unknown>, paths: string[]) => {
  for (const path of paths) {
    const numericValue = toNumber(getPathValue(entry, path));
    if (numericValue !== null) return numericValue;
  }
  return null;
};

const fetchMeteoSource = async (lat: number, lon: number) => {
  if (!METEOSOURCE_API_KEY) {
    return { days: createFallbackDays(), pollenByDate: new Map<string, string | null>() };
  }

  const url = new URL(METEOSOURCE_API_BASE_URL);
  url.searchParams.set("lat", lat.toString());
  url.searchParams.set("lon", lon.toString());
  url.searchParams.set("sections", "daily");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("language", "en");
  url.searchParams.set("units", "us");
  url.searchParams.set("key", METEOSOURCE_API_KEY);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 900 } });
    if (!res.ok) throw new Error("MeteoSource request failed");
    const data = await res.json();

    const pollenByDate = new Map<string, string | null>();

    const dailyData = Array.isArray(data?.daily?.data) ? data.daily.data : [];
    const days = dailyData.slice(0, 7).map((entry: Record<string, unknown>) => {
      const date =
        (entry.day as string) ||
        (entry.date as string) ||
        (typeof entry.time === "string" ? entry.time.slice(0, 10) : "");

      const allDay = (entry.all_day as Record<string, unknown> | undefined) || {};
      const tempMaxF =
        pickNestedNumber(entry, [
          "all_day.temperature_max",
          "all_day.temperature",
          "temperature_max",
          "temperature",
          "temp.max",
        ]) ?? pickNestedNumber(allDay, ["temperature_max", "temperature", "temp.max"]);
      const tempMinF =
        pickNestedNumber(entry, ["all_day.temperature_min", "temperature_min", "temp.min"]) ??
        pickNestedNumber(allDay, ["temperature_min", "temp.min"]);
      const precipitationMm =
        pickNestedNumber(entry, [
          "all_day.precipitation.total",
          "precipitation.total",
          "precipitation",
          "rain",
          "snow",
        ]) ?? pickNestedNumber(allDay, ["precipitation.total", "precipitation", "rain", "snow"]);
      const precipitationChance = normalizeProbability(
        pickNestedNumber(entry, [
          "all_day.precipitation.probability",
          "precipitation_probability",
          "precip_probability",
          "precipitation_chance",
          "rain_probability",
          "pop",
        ]) ?? pickNestedNumber(allDay, ["precipitation.probability", "pop"])
      );
      const condition =
        (entry.summary as string) ||
        (allDay.summary as string) ||
        (entry.weather as string) ||
        (allDay.weather as string) ||
        (entry.condition as string) ||
        (allDay.condition as string) ||
        (entry.icon as string) ||
        (allDay.icon as string) ||
        null;

      return {
        date,
        tempMaxF: tempMaxF !== null ? Math.round(tempMaxF) : null,
        tempMinF: tempMinF !== null ? Math.round(tempMinF) : null,
        condition,
        precipitationMm: precipitationMm !== null ? Number(precipitationMm) : null,
        precipitationChance,
        pollenLevel: pollenByDate.get(date) ?? null,
      } as WeatherDay;
    });

    return { days: days.length > 0 ? days : createFallbackDays(), pollenByDate };
  } catch (error) {
    console.error("MeteoSource error:", error);
    return { days: createFallbackDays(), pollenByDate: new Map<string, string | null>() };
  }
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const borough = searchParams.get("borough");
  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");
  const coords = getCoordinates(borough, latParam, lonParam);

  if (!coords) {
    return buildError(
      `Invalid borough. Supported values: ${BOROUGHS.join(", ")}.`,
      400
    );
  }

  try {
    const meteoSource = await fetchMeteoSource(coords.lat, coords.lon);
    const secondaryDays = meteoSource.days;
    const pollenMap = meteoSource.pollenByDate;

    const secondaryByDate = new Map<string, WeatherDay>();
    secondaryDays.forEach((day: WeatherDay) => {
      if (day.date) secondaryByDate.set(day.date, day);
    });

    const mergedDays = mergeForecasts(secondaryDays, secondaryByDate, pollenMap);

    const response: WeatherResponse = {
      borough: coords.borough,
      latitude: coords.lat,
      longitude: coords.lon,
      updatedAt: new Date().toISOString(),
      days: mergedDays,
      sources: {
        openWeather: false,
        meteoSource: secondaryDays.length > 0 || pollenMap.size > 0,
      },
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "s-maxage=600, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Weather API error:", error);
    return buildError("Failed to load forecast data.", 502);
  }
}
