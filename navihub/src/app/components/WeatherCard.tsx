"use client";
import React, { useEffect, useState } from 'react';
import { pinWeather, unpinWeather, isWeatherPinned } from '../lib/pinUtils';
import { X, MapPin } from 'lucide-react';

type WeatherData = any;

export default function WeatherCard({ data, showPin = true, onPin, onRemove, compact = false, flat = false, pinLocalOnly = false }: { data: WeatherData; showPin?: boolean; onPin?: () => void; onRemove?: () => void; compact?: boolean; flat?: boolean; pinLocalOnly?: boolean }) {
  if (!data) return null;

  // Expect route to return { provider: 'openweather'|'meteosource', data: raw }
  const provider = data?.provider ?? 'unknown';
  const payload = data?.data ?? data;

  const current = payload?.current || payload?.hourly?.[0] || {};
  let daily: any[] = [];
  if (Array.isArray(payload?.daily)) daily = payload.daily;
  else if (payload?.daily && Array.isArray((payload.daily as any).data)) daily = (payload.daily as any).data;
  else if (Array.isArray(payload?.days)) daily = payload.days;
  else if (payload?.data && Array.isArray(payload.data)) daily = payload.data;

  // Helper: robustly determine today's high/low and an icon/description
  const firstDay = daily && daily.length ? daily[0] : null;
  const pickNumber = (...vals: any[]) => {
    for (const v of vals) {
      if (v === 0) return 0;
      if (v || v === 0) return Number(v);
    }
    return undefined;
  };

  const high = pickNumber(
    firstDay?.temp?.max,
    firstDay?.temp?.day,
    firstDay?.temperature_max,
    firstDay?.all_day?.temperature_max,
    firstDay?.temperature?.max,
    firstDay?.air_temperature_max
  );
  const low = pickNumber(
    firstDay?.temp?.min,
    firstDay?.temperature_min,
    firstDay?.all_day?.temperature_min,
    firstDay?.temperature?.min,
    firstDay?.air_temperature_min
  );

  const desc = current?.weather?.[0]?.main ?? current?.weather?.[0]?.description ?? current?.condition ?? payload?.current?.icon ?? payload?.current?.summary ?? payload?.summary ?? payload?.description ?? '';
  const prettyDesc = (s: any) => {
    if (!s && s !== 0) return '';
    let str = String(s);
    str = str.replace(/[_-]+/g, ' ').trim();
    str = str.toLowerCase();
    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };
  // current temperature and feels-like fallbacks
  const currentTemp = pickNumber(
    current?.temp,
    current?.temperature,
    current?.air_temperature,
    payload?.current?.temp,
    payload?.current?.temperature,
    payload?.current?.air_temperature
  );
  const feelsLike = pickNumber(
    current?.feels_like,
    current?.apparent_temperature,
    current?.apparent_temp,
    current?.air_temperature_feels_like,
    payload?.current?.feels_like,
    payload?.current?.apparent_temperature
  );
  const mapToEmoji = (s: any) => {
    if (!s) return '❓';
    const str = String(s).toLowerCase();
    if (str.includes('rain')) return '🌧️';
    if (str.includes('snow')) return '❄️';
    if (str.includes('thunder') || str.includes('storm')) return '⛈️';
    if (str.includes('cloud')) return '☁️';
    if (str.includes('sun') || str.includes('clear')) return '☀️';
    if (str.includes('fog') || str.includes('mist') || str.includes('haze')) return '🌫️';
    return '🌤️';
  };
  const emoji = mapToEmoji(desc);

  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (pinLocalOnly) { setIsPinned(false); return; }
    const updateFromStore = () => { setIsPinned(isWeatherPinned()); };
    updateFromStore();
    const handler = (e: any) => { setIsPinned(!!e?.detail); };
    window.addEventListener('pin-weather', handler as EventListener);
    return () => { window.removeEventListener('pin-weather', handler as EventListener); };
  }, [data, pinLocalOnly]);

  const doPin = () => {
    if (pinLocalOnly) { setIsPinned(true); return; }
    pinWeather(data);
    setIsPinned(true);
  };

  const doUnpin = () => {
    if (pinLocalOnly) { setIsPinned(false); return; }
    unpinWeather();
    setIsPinned(false);
  };
  const handleTogglePin = () => {
    if (isPinned) {
      doUnpin();
    } else {
      doPin();
    }
    // notify parent callback if provided (only on pin)
    try { if (!isPinned && onPin) onPin(); } catch {}
  };

  if (compact) {
    if (flat) {
      return (
        <div className="flex items-center justify-between gap-2 text-white text-sm">
          <div className="flex items-center gap-2">
            <div className="text-lg">{emoji}</div>
            <div className="font-medium text-[0.9rem]">{prettyDesc(desc) || (provider === 'openweather' ? 'NYC' : 'Weather')}</div>
          </div>

          <div className="flex-1 text-center text-[0.9rem]">
            <div className="font-semibold text-base">{currentTemp ? `${Math.round(currentTemp)}°` : (high || low ? `${high ? `${Math.round(high)}°` : '—'} / ${low ? `${Math.round(low)}°` : '—'}` : '—')}</div>
            <div className="text-[0.72rem] text-gray-300">{(high || low) && <span>H: {high ? `${Math.round(high)}°` : '—'} L: {low ? `${Math.round(low)}°` : '—'}</span>}</div>
          </div>

          <div className="flex items-center gap-2">
            {showPin && (
              <button onClick={(e) => { e.stopPropagation(); handleTogglePin(); }} className="bg-transparent border border-white/20 text-white px-2 py-0.5 rounded text-[0.7rem]">{isPinned ? 'Unpin' : 'Pin'}</button>
            )}
            {onRemove && (
              <button onClick={(e) => { e.stopPropagation(); onRemove(); }} aria-label="Remove" className="p-1 rounded hover:bg-white/10">
                <X className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-sm bg-black text-white rounded-lg px-3 py-1 text-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="text-lg">{emoji}</div>
          <div className="font-medium text-[0.9rem]">{provider === 'openweather' ? 'NYC' : 'Weather'}</div>
        </div>

        <div className="flex-1 text-center text-[0.9rem]">
          <div className="font-semibold text-base">{currentTemp ? `${Math.round(currentTemp)}°` : (high || low ? `${high ? `${Math.round(high)}°` : '—'} / ${low ? `${Math.round(low)}°` : '—'}` : '—')}</div>
          <div className="text-[0.72rem] text-gray-300">{(high || low) && <span>H: {high ? `${Math.round(high)}°` : '—'} L: {low ? `${Math.round(low)}°` : '—'}</span>}</div>
        </div>

        <div className="flex items-center gap-2">
          {showPin && (
            <button onClick={(e) => { e.stopPropagation(); handleTogglePin(); }} className="bg-transparent border border-white/20 text-white px-2 py-0.5 rounded text-[0.7rem]">{isPinned ? 'Unpin' : 'Pin'}</button>
          )}
          {onRemove && (
            <button onClick={(e) => { e.stopPropagation(); onRemove(); }} aria-label="Remove" className="p-1 rounded hover:bg-white/10">
              <X className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full (chat) view: white card with current + 7-day forecast
  return (
    <div className="w-full max-w-xl bg-white border border-gray-100 rounded-lg shadow-sm p-4 text-sm text-gray-800">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{emoji}</div>
          <div>
            <div className="font-semibold text-lg">{prettyDesc(desc) || (provider === 'openweather' ? 'NYC Weather' : 'Weather')}</div>
            <div className="text-xs text-gray-500">{provider === 'openweather' ? 'NYC' : prettyDesc(desc)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showPin && (
            <button onClick={(e) => { e.stopPropagation(); handleTogglePin(); }} className="bg-[#404E3B] text-white px-3 py-1 rounded text-sm">{isPinned ? 'Unpin' : 'Pin'}</button>
          )}
          {onRemove && (
            <button onClick={(e) => { e.stopPropagation(); onRemove(); }} aria-label="Remove" className="p-2 rounded hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <div className="text-3xl font-semibold">{currentTemp ? `${Math.round(currentTemp)}°` : '—'}</div>
          {typeof feelsLike !== 'undefined' ? (
            <div className="text-xs text-gray-500">Feels like {Math.round(feelsLike)}°</div>
          ) : null}
        </div>
        <div className="text-right text-sm text-gray-600">
          <div>High: {high ? `${Math.round(high)}°` : '—'}</div>
          <div>Low: {low ? `${Math.round(low)}°` : '—'}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2">
        {(daily || []).slice(0,7).map((d: any, i: number) => {
          const unix = d.dt ? (d.dt > 1e12 ? Math.floor(d.dt / 1000) : d.dt) : (d.time ? Math.floor(new Date(d.time).getTime() / 1000) : undefined);
          let date = `D${i+1}`;
          if (unix) {
            date = new Date(unix * 1000).toLocaleDateString('en-US', { weekday: 'short' });
          } else if (d.day) {
            const parsed = new Date(d.day);
            if (!isNaN(parsed.getTime())) date = parsed.toLocaleDateString('en-US', { weekday: 'short' });
            else date = String(d.day).slice(0, 3);
          } else if (d.name) {
            const parsed2 = new Date(d.name);
            if (!isNaN(parsed2.getTime())) date = parsed2.toLocaleDateString('en-US', { weekday: 'short' });
            else date = String(d.name).slice(0, 3);
          }
          const tempHigh = pickNumber(d.temp?.max, d.temp?.day, d.air_temperature_max, d.temperature_max, d.all_day?.temperature_max);
          const tempLow = pickNumber(d.temp?.min, d.temperature_min, d.air_temperature_min, d.all_day?.temperature_min);
          const icon = mapToEmoji(d?.weather?.[0]?.main ?? d?.weather?.[0]?.description ?? d?.weather ?? d?.icon ?? '');
          return (
            <div key={i} className="flex flex-col items-center bg-gray-50 p-2 rounded text-center">
              <div className="text-[0.65rem] text-gray-600">{date}</div>
              <div className="text-sm">{icon}</div>
              <div className="text-sm font-medium mt-1">{tempHigh ? `${Math.round(tempHigh)}°` : '—'}</div>
              <div className="text-xs text-gray-500">{tempLow ? `${Math.round(tempLow)}°` : '—'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
