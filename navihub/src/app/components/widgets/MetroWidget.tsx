'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  MapPin,
  Timer,
  Train,
  RefreshCcw,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/src/app/lib/supabaseClient';
import type { Resource } from '@/src/app/lib/types';

type StopOption = {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
};

type MetroArrival = {
  tripId: string;
  routeId: string | null;
  startStopId: string;
  endStopId: string | null;
  startTime: string | null;
  endTime: string | null;
  minutesAway: number | null;
  durationMinutes: number | null;
  status: string;
};

const LINE_OPTIONS = [
  'A', 'C', 'E',
  'B', 'D', 'F', 'M',
  'G',
  'J', 'Z',
  'L',
  'N', 'Q', 'R', 'W',
  '1', '2', '3',
  '4', '5', '6',
  '7',
  'S',
  'SI',
];

interface MetroWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatTime = (time?: string | null) => {
  if (!time) return 'N/A';
  return new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const StopComboBox = ({
  label,
  value,
  onSelect,
  placeholder,
  options,
  disabled,
  loading,
}: {
  label: string;
  value: StopOption | null;
  onSelect: (stop: StopOption | null) => void;
  placeholder: string;
  options: StopOption[];
  disabled?: boolean;
  loading?: boolean;
}) => {
  const selectedLabel = value ? `${value.stop_name} (${value.stop_id})` : '';
  const [query, setQuery] = useState(selectedLabel);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setQuery(selectedLabel);
  }, [selectedLabel]);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return options.slice(0, 60);
    return options
      .filter((stop) =>
        stop.stop_name.toLowerCase().includes(trimmed) ||
        stop.stop_id.toLowerCase().includes(trimmed)
      )
      .slice(0, 80);
  }, [options, query]);

  return (
    <div className="space-y-2 relative">
      <label className="!text-xs !font-semibold !text-gray-700">{label}</label>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 120)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-full border border-gray-200 bg-white px-4 py-2 !text-xs !text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7B9669] disabled:opacity-60"
      />

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 z-20 mt-2 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {loading && (
            <div className="px-3 py-2 text-xs !text-gray-500">Loading stations...</div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="px-3 py-2 text-xs !text-gray-500">No matching stations.</div>
          )}
          {!loading && filtered.map((stop) => (
            <button
              key={stop.stop_id}
              type="button"
              onMouseDown={() => {
                onSelect(stop);
                setQuery(`${stop.stop_name} (${stop.stop_id})`);
              }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left !text-xs !text-gray-700 hover:!bg-gray-50"
            >
              <span className="font-semibold !text-gray-900">{stop.stop_name}</span>
              <span className="text-[10px] !text-gray-500">{stop.stop_id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function MetroWidget({ isOpen, onClose }: MetroWidgetProps) {
  const [line, setLine] = useState('A');
  const [direction, setDirection] = useState<'N' | 'S' | ''>('');
  const [startStop, setStartStop] = useState<StopOption | null>(null);
  const [endStop, setEndStop] = useState<StopOption | null>(null);
  const [departAt, setDepartAt] = useState('');
  const [arrivals, setArrivals] = useState<MetroArrival[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<string>('');
  const [allStops, setAllStops] = useState<StopOption[]>([]);
  const [stopsLoading, setStopsLoading] = useState(false);

  const loadResources = useCallback(async () => {
    const { data } = await supabase
      .from('resources')
      .select('*')
      .eq('status', 'approved')
      .limit(50);
    if (data) setResources(data as Resource[]);
  }, []);

  const loadAllStops = useCallback(async () => {
    if (allStops.length > 0) return allStops;
    setStopsLoading(true);
    try {
      const res = await fetch('/api/metro/stops?all=1');
      const data = await res.json();
      const stops = Array.isArray(data.stops) ? data.stops : [];
      setAllStops(stops);
      return stops;
    } finally {
      setStopsLoading(false);
    }
  }, [allStops]);

  useEffect(() => {
    if (!isOpen) return;
    loadResources();
  }, [isOpen, loadResources]);

  useEffect(() => {
    if (!isOpen) return;
    loadAllStops();
  }, [isOpen, loadAllStops]);

  const resourceOptions = useMemo(() => {
    return resources.filter((resource) => resource.latitude && resource.longitude);
  }, [resources]);

  const sortedStops = useMemo(() => {
    return [...allStops].sort((a, b) => a.stop_name.localeCompare(b.stop_name));
  }, [allStops]);

  const applyResourceStop = useCallback(async () => {
    if (!selectedResource) return;
    const resource = resources.find((item) => item.id === selectedResource);
    if (!resource || !resource.latitude || !resource.longitude) return;

    const stops = await loadAllStops();
    if (!stops || stops.length === 0) return;

    let closest: StopOption | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;
    stops.forEach((stop: StopOption) => {
      const distance = haversineDistance(
        resource.latitude as number,
        resource.longitude as number,
        stop.stop_lat,
        stop.stop_lon
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = stop;
      }
    });

    if (closest) setStartStop(closest);
  }, [selectedResource, resources, allStops, loadAllStops]);

  useEffect(() => {
    if (!selectedResource) return;
    applyResourceStop();
  }, [selectedResource, applyResourceStop]);

  const fetchArrivals = useCallback(async () => {
    if (!startStop) {
      setStatus('error');
      setErrorMessage('Pick a start station to continue.');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        line,
        startStopId: startStop.stop_id,
      });

      if (endStop) params.set('endStopId', endStop.stop_id);
      if (direction) params.set('direction', direction);
      if (departAt) {
        const date = new Date(departAt);
        if (!Number.isNaN(date.getTime())) {
          params.set('time', date.toISOString());
        }
      }

      const res = await fetch(`/api/metro?${params.toString()}`);
      if (!res.ok) throw new Error('Metro request failed');
      const data = await res.json();
      setArrivals(Array.isArray(data.arrivals) ? data.arrivals : []);
      setStatus('idle');
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage('Unable to load metro updates right now.');
    }
  }, [line, startStop, endStop, direction, departAt]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            aria-label="Close Metro"
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
            className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:left-6 sm:w-[460px] sm:max-h-[82vh] z-50 flex flex-col !bg-white border border-gray-200 rounded-none sm:rounded-2xl shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-5 py-4 !bg-[#404E3B] !text-white">
              <div>
                <h2 className="!text-lg !font-semibold !text-white">NYC Metro Planner</h2>
                <p className="!text-xs !text-white/80">Next arrivals + travel time</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full border border-white/30 px-3 py-1 !text-xs !font-semibold hover:!bg-white/15"
              >
                Close
              </button>
            </div>

            <div className="flex flex-col gap-4 px-5 py-4 bg-gray-50 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {LINE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => setLine(option)}
                    className={`rounded-full px-3 py-1 !text-xs !font-semibold transition border ${
                      line === option
                        ? '!bg-[#404E3B] !text-white border-transparent'
                        : 'bg-white !text-gray-700 border-gray-200 hover:!bg-gray-100'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <StopComboBox
                  label="Start station"
                  value={startStop}
                  onSelect={setStartStop}
                  placeholder={stopsLoading ? "Loading stations..." : "Select a start station"}
                  options={sortedStops}
                  disabled={stopsLoading || sortedStops.length === 0}
                  loading={stopsLoading}
                />
                <StopComboBox
                  label="End station"
                  value={endStop}
                  onSelect={setEndStop}
                  placeholder={stopsLoading ? "Loading stations..." : "Select a destination (optional)"}
                  options={sortedStops}
                  disabled={stopsLoading || sortedStops.length === 0}
                  loading={stopsLoading}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="!text-xs !font-semibold !text-gray-700">Direction</label>
                  <div className="flex gap-2">
                    {['', 'N', 'S'].map((dir) => (
                      <button
                        key={dir || 'any'}
                        onClick={() => setDirection(dir as 'N' | 'S' | '')}
                        className={`rounded-full px-3 py-1 !text-xs !font-semibold border transition ${
                          direction === dir
                            ? '!bg-[#404E3B] !text-white border-transparent'
                            : 'bg-white !text-gray-700 border-gray-200 hover:!bg-gray-100'
                        }`}
                      >
                        {dir || 'Any'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="!text-xs !font-semibold !text-gray-700">Depart at</label>
                  <div className="relative">
                    <Timer className="absolute left-3 top-2.5 h-4 w-4 !text-gray-400" />
                    <input
                      type="datetime-local"
                      value={departAt}
                      onChange={(event) => setDepartAt(event.target.value)}
                      className="w-full rounded-full border border-gray-200 bg-white px-9 py-2 !text-xs !text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7B9669]"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 space-y-3">
                <div className="flex items-center gap-2 !text-xs !font-semibold !text-gray-700">
                  <MapPin className="h-4 w-4 !text-[#7B9669]" />
                  Use a community resource to set the nearest start station
                </div>
                <select
                  value={selectedResource}
                  onChange={(event) => setSelectedResource(event.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-white px-3 py-2 !text-xs !text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7B9669]"
                >
                  <option value="">Select a resource (optional)</option>
                  {resourceOptions.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={fetchArrivals}
                  className="inline-flex items-center gap-2 rounded-full !bg-[#404E3B] px-4 py-2 !text-xs !font-semibold !text-white shadow-md hover:!bg-[#7B9669]"
                >
                  <Train className="h-4 w-4" />
                  Find trains
                </button>
                <button
                  onClick={fetchArrivals}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 !text-xs !font-semibold !text-gray-700 hover:!bg-gray-50"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </button>
                {status === 'loading' && (
                  <div className="flex items-center gap-2 !text-xs !text-gray-600">
                    <Loader2 className="h-4 w-4 !animate-[spin_1.6s_linear_infinite]" />
                    Loading live arrivals...
                  </div>
                )}
              </div>

              {status === 'error' && errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 !text-xs !text-red-700">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-3">
                {arrivals.length === 0 && status !== 'loading' && (
                  <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 !text-xs !text-gray-600">
                    Choose a line and start station to see live train arrivals.
                  </div>
                )}

                {arrivals.map((arrival) => (
                  <motion.div
                    key={`${arrival.tripId}-${arrival.startTime}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full !bg-[#404E3B] text-xs font-semibold !text-white">
                          {arrival.routeId || line}
                        </span>
                        <div>
                          <div className="text-xs font-semibold !text-gray-900">Next train</div>
                          <div className="text-[11px] !text-gray-500">Trip {arrival.tripId}</div>
                        </div>
                      </div>
                      <div className="text-xs font-semibold !text-gray-900">
                        {arrival.minutesAway !== null ? `${arrival.minutesAway} min` : 'N/A'}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-3 text-xs !text-gray-700">
                      <div>
                        <div className="text-[10px] uppercase tracking-wide !text-gray-500">Depart</div>
                        <div className="font-semibold !text-gray-900">{formatTime(arrival.startTime)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wide !text-gray-500">Arrive</div>
                        <div className="font-semibold !text-gray-900">{formatTime(arrival.endTime)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wide !text-gray-500">Duration</div>
                        <div className="font-semibold !text-gray-900">
                          {arrival.durationMinutes !== null ? `${arrival.durationMinutes} min` : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-[11px] !text-gray-500">
                      <span>{startStop?.stop_name || startStop?.stop_id || 'Start'}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>{endStop?.stop_name || endStop?.stop_id || 'Destination'}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
