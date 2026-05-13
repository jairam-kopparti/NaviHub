import { NextRequest, NextResponse } from "next/server";
import { BOROUGH_CENTERS, BoroughName } from "@/src/app/lib/nycBoroughs";

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "";
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

const mergeForecasts = (openWeatherDays: WeatherDay[], meteoPollenByDate: Map<string, string | null>) => {
  return openWeatherDays.map((day) => ({
    ...day,
    pollenLevel: meteoPollenByDate.get(day.date) ?? day.pollenLevel ?? null,
  }));
};

const fetchOpenWeather = async (lat: number, lon: number) => {
  if (!OPENWEATHER_API_KEY) return [] as WeatherDay[];

  const url = new URL("https://api.openweathermap.org/data/3.0/onecall");
  url.searchParams.set("lat", lat.toString());
  url.searchParams.set("lon", lon.toString());
  url.searchParams.set("units", "imperial");
  url.searchParams.set("exclude", "minutely,hourly,alerts");
  url.searchParams.set("appid", OPENWEATHER_API_KEY);

  const res = await fetch(url.toString(), { next: { revalidate: 600 } });
  if (!res.ok) throw new Error("OpenWeather request failed");
  const data = await res.json();

  const daily = Array.isArray(data?.daily) ? data.daily : [];
  return daily.slice(0, 7).map((day: any) => ({
    date: day?.dt ? new Date(day.dt * 1000).toISOString().slice(0, 10) : "",
    tempMaxF: Number.isFinite(day?.temp?.max) ? Math.round(day.temp.max) : null,
    tempMinF: Number.isFinite(day?.temp?.min) ? Math.round(day.temp.min) : null,
    condition: day?.weather?.[0]?.description || day?.weather?.[0]?.main || null,
    precipitationMm: Number.isFinite(day?.rain)
      ? Number(day.rain)
      : Number.isFinite(day?.snow)
      ? Number(day.snow)
      : 0,
    precipitationChance: Number.isFinite(day?.pop) ? Number(day.pop) : null,
    pollenLevel: null,
  }));
};

const fetchMeteoSourcePollen = async (lat: number, lon: number) => {
  if (!METEOSOURCE_API_KEY) return new Map<string, string | null>();

  const url = new URL(METEOSOURCE_API_BASE_URL);
  url.searchParams.set("lat", lat.toString());
  url.searchParams.set("lon", lon.toString());
  url.searchParams.set("sections", "daily,pollen");
  url.searchParams.set("timezone", "America/New_York");
  url.searchParams.set("language", "en");
  url.searchParams.set("units", "us");
  url.searchParams.set("key", METEOSOURCE_API_KEY);

  const res = await fetch(url.toString(), { next: { revalidate: 900 } });
  if (!res.ok) throw new Error("MeteoSource request failed");
  const data = await res.json();

  const pollenData = Array.isArray(data?.pollen?.data) ? data.pollen.data : [];
  const pollenByDate = new Map<string, string | null>();
  pollenData.forEach((entry: any) => {
    if (!entry?.date) return;
    const level = entry?.level || entry?.category || entry?.description || null;
    pollenByDate.set(entry.date, level);
  });

  return pollenByDate;
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

  if (!OPENWEATHER_API_KEY) {
    return buildError("Missing OpenWeather API key.", 500);
  }

  try {
    const [openWeatherDays, pollenByDate] = await Promise.all([
      fetchOpenWeather(coords.lat, coords.lon),
      fetchMeteoSourcePollen(coords.lat, coords.lon),
    ]);

    const mergedDays = mergeForecasts(openWeatherDays, pollenByDate);

    const response: WeatherResponse = {
      borough: coords.borough,
      latitude: coords.lat,
      longitude: coords.lon,
      updatedAt: new Date().toISOString(),
      days: mergedDays,
      sources: {
        openWeather: openWeatherDays.length > 0,
        meteoSource: pollenByDate.size > 0,
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
