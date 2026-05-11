import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    if (!lat || !lon) return NextResponse.json({ error: 'Missing lat or lon' }, { status: 400 });

    const openKey = process.env.OpenWeather_API_KEY || process.env.Weather_API_KEY;
    const meteoKey = process.env.METEOSOURCE_API_KEY || process.env.Weather_API_KEY;
    if (!openKey && !meteoKey) return NextResponse.json({ error: 'No weather provider API keys configured (OpenWeather or MeteoSource)' }, { status: 500 });

    // Try OpenWeather first and return immediately if successful
    if (openKey) {
      const openUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&exclude=minutely,hourly,alerts&units=imperial&appid=${openKey}`;
      try {
        const resOpen = await fetch(openUrl);
        const textOpen = await resOpen.text().catch(() => '');
        if (resOpen.ok) {
          const parsed = (() => { try { return JSON.parse(textOpen); } catch { return textOpen; } })();
          return NextResponse.json({ provider: 'openweather', data: parsed });
        } else {
          console.error('OpenWeather API error', resOpen.status, textOpen);
        }
      } catch (err) {
        console.error('OpenWeather fetch failed', err);
      }
    }

    // If OpenWeather failed, try MeteoSource (if key available)
    if (meteoKey) {
      const params = new URLSearchParams({
        lat: lat!,
        lon: lon!,
        sections: 'current,daily',
        timezone: 'America/New_York',
        units: 'us',
        language: 'en',
        key: meteoKey,
      });
      const meteoUrl = `https://www.meteosource.com/api/v1/free/point?${params.toString()}`;
      try {
        const resM = await fetch(meteoUrl);
        const textM = await resM.text().catch(() => '');
        if (resM.ok) {
          const parsedM = (() => { try { return JSON.parse(textM); } catch { return textM; } })();
          return NextResponse.json({ provider: 'meteosource', data: parsedM });
        } else {
          console.error('MeteoSource API error', resM.status, textM);
        }
      } catch (err) {
        console.error('MeteoSource fetch failed', err);
      }
    }

    return NextResponse.json({ error: 'Failed to fetch weather from providers' }, { status: 502 });
  } catch (err) {
    console.error('weather route error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
