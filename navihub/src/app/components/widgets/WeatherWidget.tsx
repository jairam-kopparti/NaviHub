'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, Loader2, RefreshCcw, ThermometerSun } from 'lucide-react';
import { BOROUGH_CENTERS, BoroughName } from '@/src/app/lib/nycBoroughs';

type WeatherDay = {
  date: string;
  tempMaxF: number | null;
  tempMinF: number | null;
  condition: string | null;
  precipitationMm: number | null;
  precipitationChance: number | null;
};

type WeatherResponse = {
  borough: BoroughName | 'NYC';
  latitude: number;
  longitude: number;
  updatedAt: string;
  days: WeatherDay[];
  sources: {
    openWeather: boolean;
    meteoSource: boolean;
  };
};

const BOROUGHS = Object.keys(BOROUGH_CENTERS) as BoroughName[];

interface WeatherWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatDay = (date: string) => {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export default function WeatherWidget({ isOpen, onClose }: WeatherWidgetProps) {
  const [selectedBorough, setSelectedBorough] = useState<BoroughName>('Manhattan');
  const [forecast, setForecast] = useState<WeatherDay[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const fetchForecast = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({ borough: selectedBorough });
      const res = await fetch(`/api/weather?${params.toString()}`);
      if (!res.ok) throw new Error('Forecast request failed');
      const data = (await res.json()) as WeatherResponse;
      setForecast(data.days || []);
      setUpdatedAt(data.updatedAt);
      setStatus('idle');
    } catch (error) {
      console.error(error);
      setErrorMessage('Unable to load forecast right now.');
      setStatus('error');
    }
  }, [selectedBorough]);

  useEffect(() => {
    if (!isOpen) return;
    fetchForecast();
  }, [isOpen, fetchForecast]);

  const sourceLabel = useMemo(() => {
    if (!updatedAt) return 'Loading data...';
    const time = new Date(updatedAt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `Updated ${time}`;
  }, [updatedAt]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            aria-label="Close Weather"
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm sm:hidden z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:left-6 sm:w-[420px] sm:max-h-[80vh] z-50 flex flex-col !bg-white border border-gray-200 rounded-none sm:rounded-2xl shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-5 py-4 !bg-[#404E3B] !text-white">
              <div>
                <h2 className="!text-lg !font-semibold !text-white">NYC Weather</h2>
                <p className="!text-xs !text-white/80">7-day forecast by borough</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full border border-white/30 px-3 py-1 !text-xs !font-semibold hover:!bg-white/15"
              >
                Close
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-100">
              <label className="!text-xs !font-semibold !text-gray-700">Borough</label>
              <select
                value={selectedBorough}
                onChange={(event) => setSelectedBorough(event.target.value as BoroughName)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1.5 !text-xs !text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7B9669]"
              >
                {BOROUGHS.map((borough) => (
                  <option key={borough} value={borough}>
                    {borough}
                  </option>
                ))}
              </select>
              <button
                onClick={fetchForecast}
                className="ml-auto inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 !text-xs !font-semibold !text-gray-700 hover:!bg-gray-50"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 !bg-gray-50">
              {status === 'loading' && (
                <div className="flex items-center gap-2 !text-gray-600 !text-sm">
                  <Loader2 className="h-4 w-4 !animate-[spin_1.6s_linear_infinite]" />
                  Loading forecast...
                </div>
              )}

              {status === 'error' && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 !text-xs !text-red-700">
                  {errorMessage}
                </div>
              )}

              {status !== 'loading' && forecast.length > 0 && (
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  {forecast.map((day) => (
                    <motion.div
                      key={day.date}
                      variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="space-y-3">
                        <div className="!text-xs !font-semibold !text-gray-700">{formatDay(day.date)}</div>
                        <div className="!text-xs !text-gray-500">{day.condition || 'N/A'}</div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                          <ThermometerSun className="h-4 w-4 !text-[#7B9669]" />
                          <div>
                            <div className="text-sm font-semibold !text-gray-900">
                              {day.tempMaxF ?? 'N/A'}° / {day.tempMinF ?? 'N/A'}°
                            </div>
                            <div className="text-[10px] !text-gray-500">High / Low</div>
                          </div>
                        </div>
                          <div className="flex items-center gap-2">
                          <CloudRain className="h-4 w-4 !text-[#7B9669]" />
                          <div>
                            <div className="text-sm font-semibold !text-gray-900">
                              {day.precipitationMm ?? 0} mm
                            </div>
                            <div className="text-[10px] !text-gray-500">Rain</div>
                          </div>
                        </div>
                      </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-white flex items-center justify-between">
              <span className="text-[11px] !text-gray-500">{sourceLabel}</span>
              <span className="text-[11px] !text-gray-500">OpenWeather + MeteoSource</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
