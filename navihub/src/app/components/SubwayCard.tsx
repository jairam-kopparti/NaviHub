"use client";
import React, { useEffect, useState } from 'react';
import { pinSubway, unpinSubway, isSubwayPinned } from '../lib/pinUtils';
import { X } from 'lucide-react';

export default function SubwayCard({ data, showPin = true, onPin, onRemove, compact = false, flat = false, onOpen, pinLocalOnly = false }: { data: any; showPin?: boolean; onPin?: () => void; onRemove?: () => void; compact?: boolean; flat?: boolean; onOpen?: () => void; pinLocalOnly?: boolean }) {
  if (!data) return null;

  const lines = data.lines || [];
  const summary = data.summary || lines.map((l: any) => `${l.line}: ${l.status}`).join(' • ');

  const now = Date.now();

  const toMs = (v: any) => {
    if (!v) return undefined;
    const n = Number(v);
    if (!isNaN(n)) {
      // treat as seconds if length <= 10
      return n > 1e12 ? n : (String(v).length <= 10 ? n * 1000 : n);
    }
    const d = new Date(String(v));
    if (!isNaN(d.getTime())) return d.getTime();
    return undefined;
  };

  const alertIsActive = (a: any) => {
    try {
      const start = toMs(a.start || a.raw?.start_time || a.raw?.start || a.raw?.properties?.start);
      const end = toMs(a.end || a.raw?.end_time || a.raw?.end || a.raw?.properties?.end);
      const displayBefore = Number(a.raw?.properties?.display_before_active ?? a.raw?.display_before_active ?? 0) || 0;
      const startWindow = start ? (start - (displayBefore * 1000)) : undefined;
      if (startWindow && end) return now >= startWindow && now <= end;
      if (startWindow && !end) return now >= startWindow;
      if (start && end) return now >= start && now <= end;
      // fallback: treat as active
      return true;
    } catch {
      return true;
    }
  };

  const getSortOrder = (a: any) => {
    return Number(a.raw?.properties?.MercuryEntitySelector?.sort_order ?? a.raw?.sort_order ?? a.raw?.properties?.sort_order ?? a.raw?.sort ?? 0) || 0;
  };
  // categorize a status text into a known bucket or produce a trimmed specific label
  const categorize = (text: any) => {
    if (!text) return 'Other';
    const s = String(text).toLowerCase();
    if (s.includes('suspend') || s.includes('part suspended') || s.includes('suspended')) return 'Suspended';
    if (s.includes('delay') || s.includes('delays') || s.includes('slow')) return 'Delays';
    if (s.includes('planned') || s.includes('work') || s.includes('maintenance')) return 'Planned Work';
    if (s.includes('no active') || s.includes('good service')) return 'No Active Alerts';
    // If we can't map to a known bucket, use a more specific label derived from the status text
    const clean = String(text).trim();
    return clean.length > 50 ? clean.substring(0, 50) + '…' : clean;
  };

  // compute per-line most-severe active alert and build grouping
  const lineStatuses = lines.map((l: any) => {
    const alerts = Array.isArray(l.alerts) ? l.alerts : [];
    const active = alerts.filter(alertIsActive);
    // pick highest sort_order
    active.sort((a: any, b: any) => getSortOrder(b) - getSortOrder(a));
    const top = active[0];
    const statusText = top ? (top.title || top.effect || top.description || 'Alert') : 'No Active Alerts';
    const baseCategory = top ? categorize(statusText) : 'No Active Alerts';
    const lineId = String(l.line || '').toUpperCase();
    // treat shuttle identifiers separately
    const isShuttle = /^(S|SI|SR|SRV)$/.test(lineId) || /(^|\/)S(\/|$)/.test(lineId);
    const category = isShuttle ? 'Shuttles' : baseCategory;
    return { line: l.line, status: l.status || statusText, category, top, alerts: active };
  });

  const groups: Record<string, string[]> = {};
  for (const ls of lineStatuses) {
    const key = ls.category || 'Other';
    if (!groups[key]) groups[key] = [];
    groups[key].push(ls.line);
  }

  // compute a more accurate overall status by scanning per-line statuses
  const overallStatus = data.summary || (() => {
    // priority: Suspended > Delays > Planned Work > Other Service Alerts > No Active Alerts
    let found: string | null = null;
    for (const ls of lineStatuses) {
      const s = String(ls.status || '').toLowerCase();
      if (s.includes('suspend') || s.includes('suspended') || s.includes('replacement bus')) {
        return 'Suspended';
      }
      if (!found && (s.includes('delay') || s.includes('delays') || s.includes('slow') || s.includes('major') || s.includes('significant'))) {
        found = 'Delays';
      }
      if (!found && (s.includes('planned') || s.includes('work') || s.includes('maintenance') || s.includes('overnight') )) {
        found = 'Planned Work';
      }
      // collect any other non-empty specific statuses as service alerts
      if (!found && ls.category && ls.category !== 'No Active Alerts' && ls.category !== 'Shuttles') {
        found = ls.category;
      }
    }
    return found || 'No Active Alerts';
  })();

  const statusColor = (s: string) => {
    if (!s) return 'gray';
    if (s === 'Suspended') return 'bg-red-500';
    if (s === 'Delays') return 'bg-yellow-400';
    if (s === 'Planned Work') return 'bg-blue-500';
    if (s === 'No Active Alerts') return 'bg-green-500';
    return 'bg-gray-400';
  };

  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (pinLocalOnly) {
      setIsPinned(false);
      return;
    }

    const updateFromStore = () => { setIsPinned(isSubwayPinned(data)); };
    updateFromStore();
    const handler = (e: any) => { setIsPinned(isSubwayPinned(data)); };
    window.addEventListener('pin-subway', handler as EventListener);
    return () => { window.removeEventListener('pin-subway', handler as EventListener); };
  }, [data, pinLocalOnly]);

  const doPin = () => {
    if (pinLocalOnly) { setIsPinned(true); return; }
    pinSubway(data);
    setIsPinned(true);
  };
  const doUnpin = () => {
    if (pinLocalOnly) { setIsPinned(false); return; }
    unpinSubway();
    setIsPinned(false);
  };
  const handleTogglePin = () => {
    if (isPinned) doUnpin(); else doPin();
    try { if (!isPinned && onPin) onPin(); } catch {}
  };

  if (compact) {
    if (flat) {
      return (
        <div className="flex items-center justify-between gap-2 text-white text-sm">
          <div className="flex items-center gap-2">
            <div className="text-lg">🚇</div>
            <div className="flex flex-col">
              <div className="font-medium text-[0.9rem]">Subway</div>
              <div className="flex items-center gap-2 text-[0.65rem] text-gray-200">
                <span className={`${statusColor(overallStatus)} inline-block w-2 h-2 rounded-full`} />
                <span>{overallStatus}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 text-center text-[0.85rem]">
            <div className="font-semibold">{summary || 'Status unavailable'}</div>
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
      <div className="w-full max-w-sm bg-black text-white rounded-lg px-3 py-1 text-sm flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-lg">🚇</div>
          <div className="flex flex-col">
            <div className="font-medium text-[0.9rem]">Subway</div>
            <div className="flex items-center gap-2 text-[0.65rem] text-gray-200">
              <span className={`${statusColor(overallStatus)} inline-block w-2 h-2 rounded-full`} />
              <span>{overallStatus}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 text-center text-[0.85rem]">
          <div className="font-semibold">{summary || 'Status unavailable'}</div>
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

  // Full view
  return (
    <div className="w-full bg-white border border-gray-100 rounded-lg shadow-sm p-4 text-sm text-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🚇</div>
          <div>
            <div className="font-semibold text-lg">NYC Subway Status</div>
            <div className="text-xs text-gray-500">Updated: {data.updated ? new Date(data.updated).toLocaleString() : '—'}</div>
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

      {/* Service Status box: wider two-column grid with larger badges for readability */}
      <div className="mt-4 bg-gray-50 border border-gray-100 rounded p-4">
        <div className="text-sm font-semibold mb-3">Service Status</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>
          <div>
            {(() => {
              const knownOrdered = ['Planned Work', 'Suspended', 'Delays', 'Shuttles'];
              // Build dynamic order: show known categories first, then any other specific categories (but don't duplicate 'No Active Alerts' here)
              const dynamicKeys = Object.keys(groups).filter(k => !knownOrdered.includes(k) && k !== 'No Active Alerts');
              const ordered = [...knownOrdered, ...dynamicKeys];
              const lineColor = (id: string) => {
                if (!id) return '#999';
                const k = String(id).trim().toUpperCase();
                if (/^(1|2|3)$/.test(k)) return '#EE352E';
                if (/^(4|5|6)$/.test(k)) return '#00933C';
                if (/^(7)$/.test(k)) return '#B933AD';
                if (/^(A|C|E)$/.test(k)) return '#2850AD';
                if (/^(B|D|F|M)$/.test(k)) return '#FF6319';
                if (/^(G)$/.test(k)) return '#6CBE45';
                if (/^(J|Z)$/.test(k)) return '#996633';
                if (/^(L)$/.test(k)) return '#A7A9AC';
                if (/^(N|Q|R|W)$/.test(k)) return '#FCCC0A';
                return '#666';
              };

              const Badge = ({ id }: { id: string }) => (
                <div className="inline-flex items-center justify-center rounded-full text-white font-semibold" style={{ width: 32, height: 32, backgroundColor: lineColor(id) }}>
                  <div className="text-[0.75rem]">{id}</div>
                </div>
              );

              return ordered.map((key) => {
                const list = groups[key] || [];
                if (!list || list.length === 0) return null;
                return (
                  <div key={key} className="mb-4">
                    <div className="text-xs font-medium text-gray-700 mb-2">{key === 'Shuttles' ? 'Shuttles — Special' : key}</div>
                    <div className="flex flex-wrap gap-2 items-center">
                      {list.slice(0, 16).map((ln) => (
                        <Badge key={ln} id={ln} />
                      ))}
                      {list.length > 16 && <div className="text-sm text-gray-600">+{list.length - 16} more</div>}
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          <div>
            <div className="text-xs font-medium text-gray-700 mb-2">No Active Alerts</div>
            <div className="flex flex-wrap gap-2">
              {((groups['No Active Alerts'] || []) as string[]).map((ln) => (
                <div key={`no-${ln}`}> 
                  <div className="inline-flex items-center justify-center rounded-full text-white font-semibold" style={{ width: 32, height: 32, backgroundColor: ((): string => {
                    const k = String(ln).trim().toUpperCase();
                    if (/^(1|2|3)$/.test(k)) return '#EE352E';
                    if (/^(4|5|6)$/.test(k)) return '#00933C';
                    if (/^(7)$/.test(k)) return '#B933AD';
                    if (/^(A|C|E)$/.test(k)) return '#2850AD';
                    if (/^(B|D|F|M)$/.test(k)) return '#FF6319';
                    if (/^(G)$/.test(k)) return '#6CBE45';
                    if (/^(J|Z)$/.test(k)) return '#996633';
                    if (/^(L)$/.test(k)) return '#A7A9AC';
                    if (/^(N|Q|R|W)$/.test(k)) return '#FCCC0A';
                    return '#666';
                  })() }}>{ln}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* detailed per-line messages removed to keep card compact — badges above summarise lines */}
    </div>
  );
}

function formatTime(t: any) {
  return '';
}
