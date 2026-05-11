import { NextResponse } from 'next/server';

export async function GET(_req: Request) {
  try {
    // Prefer MTA JSON alerts feed (camsys subway-alerts). Use MTA API key when available.
    const mtaKey = process.env.MTA_API_KEY;
    const configured = process.env.MTA_STATUS_URL;
    const defaultUrl = 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts.json';
    const mtaUrl = configured || defaultUrl;

    if (mtaKey) {
      try {
        const headers: Record<string,string> = { 'x-api-key': String(mtaKey), 'Accept': 'application/json', 'User-Agent': 'NaviHub/1.0 (+https://navihub)'};
        const res = await fetch(mtaUrl, { headers });
        const text = await res.text().catch(() => '');
        if (res.ok) {
          const parsed = (() => { try { return JSON.parse(text); } catch { return text; } })();
          const normalized = normalizeMtaAlerts(parsed);
          return NextResponse.json({ provider: 'mta', data: normalized });
        } else {
          console.error('MTA API error', res.status, text);
        }
      } catch (err) {
        console.error('MTA fetch failed', err);
      }
    }

    // Regardless of API key presence or failure, attempt an unauthenticated fetch
    // of the public JSON feed URL as many camsys feeds are publicly accessible.
    try {
      const publicHeaders: Record<string,string> = { 'Accept': 'application/json', 'User-Agent': 'NaviHub/1.0 (+https://navihub)'};
      const resPub = await fetch(mtaUrl, { headers: publicHeaders });
      const textPub = await resPub.text().catch(() => '');
      if (resPub.ok) {
        const parsedPub = (() => { try { return JSON.parse(textPub); } catch { return textPub; } })();
        const normalizedPub = normalizeMtaAlerts(parsedPub);
        return NextResponse.json({ provider: 'mta-public', data: normalizedPub });
      } else {
        console.error('MTA public URL error', resPub.status, textPub);
      }
    } catch (err) {
      console.error('MTA public fetch failed', err);
    }

    // Fallback: return a small sample/latest-status payload for NYC subway lines.
    const sample = {
      lines: [
        { line: 'A/C/E', status: 'Good Service' },
        { line: '1/2/3', status: 'Delays', detail: 'Service delays between 14 St and Times Sq.' },
        { line: '4/5/6', status: 'Planned Work', detail: 'Nighttime track maintenance' },
        { line: '7', status: 'Good Service' },
        { line: 'B/D/F/M', status: 'Suspended', detail: 'Replacement bus service' },
      ],
      updated: new Date().toISOString(),
      message: 'Sample subway status. Set `MTA_API_KEY` or `MTA_STATUS_URL` for live data.'
    };

    return NextResponse.json(sample);
  } catch (err) {
    console.error('subway status route error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

function normalizeMtaAlerts(parsed: Record<string, unknown> | null) {
  // Goal: produce { lines: [{ line, status, detail?, selectedAlert? }], updated, summary }
  try {
    if (!parsed) return { lines: [], updated: new Date().toISOString(), message: 'No data' };

    const doc = parsed as Record<string, unknown>;
    // Collect candidate alert objects from common locations
    const candidates: Record<string, unknown>[] = [];
    const feedEntity = doc?.['feed'] && (doc['feed'] as Record<string, unknown>)['entity'];
    if (Array.isArray(feedEntity)) candidates.push(...(feedEntity as Record<string, unknown>[]).map((e) => ((e as Record<string, unknown>)['alert'] as Record<string, unknown> | undefined) || (e as Record<string, unknown>)));
    const entities = doc?.['entities'];
    if (Array.isArray(entities)) candidates.push(...(entities as Record<string, unknown>[]).map((e) => ((e as Record<string, unknown>)['alert'] as Record<string, unknown> | undefined) || (e as Record<string, unknown>)));
    const alertsArr = doc?.['alerts'];
    if (Array.isArray(alertsArr)) candidates.push(...(alertsArr as Record<string, unknown>[]));
    const svc = doc?.['service_alerts'];
    if (Array.isArray(svc)) candidates.push(...(svc as Record<string, unknown>[]));
    const dataAlerts = (doc?.['data'] as Record<string, unknown> | undefined)?.['alerts'];
    if (Array.isArray(dataAlerts)) candidates.push(...(dataAlerts as Record<string, unknown>[]));
    const features = doc?.['features'];
    if (Array.isArray(features)) candidates.push(...(features as Record<string, unknown>[]));

    // Fallback: scan the object tree for alert-like objects
    if (candidates.length === 0) {
      const queue: (Record<string, unknown> | null)[] = [parsed];
      while (queue.length && candidates.length < 500) {
        const node = queue.shift();
        if (!node || typeof node !== 'object') continue;
        const keys = Object.keys(node);
        if (keys.includes('informed_entity') || keys.includes('informed_entities') || keys.includes('effect') || keys.includes('header_text') || keys.includes('active_period')) {
          candidates.push(node as Record<string, unknown>);
          continue;
        }
        for (const k of keys) if (typeof node[k] === 'object') queue.push(node[k] as Record<string, unknown> | null);
      }
    }

    const now = Date.now();

    const parseActive = (a: Record<string, unknown>) => {
      const ap = (a['active_period'] as unknown) || (a['activePeriod'] as unknown) || ((a['properties'] as Record<string, unknown> | undefined)?.['active_period'] as unknown) || ((a['properties'] as Record<string, unknown> | undefined)?.['activePeriod'] as unknown) || null;
      const displayBefore = (a['display_before_active'] as unknown) || ((a['properties'] as Record<string, unknown> | undefined)?.['display_before_active'] as unknown) || (a['display_before_active_seconds'] as unknown) || ((a['properties'] as Record<string, unknown> | undefined)?.['display_before_active_seconds'] as unknown) || 0;
      if (!ap) return { active: true, start: null, end: null };
      // ap might be array of [start, end] or array of objects or stringified fragments like "@{start=177...; end=177...}"
      let start = null, end = null;
      if (Array.isArray(ap) && ap.length) {
        const first = ap[0];
        if (typeof first === 'object') {
          start = first?.start || first?.start_time || first?.begin || null;
          end = first?.end || first?.end_time || first?.expire || null;
        } else if (typeof first === 'number') {
          start = ap[0];
          end = ap[1] || null;
        } else if (typeof first === 'string') {
          // parse string like "@{start=1778299260; end=1778490000}"
          const m = String(first).match(/start=(\d+).*end=(\d+)/);
          if (m) {
            start = Number(m[1]);
            end = Number(m[2]);
          }
        }
      }
      const toMs = (v: unknown) => {
        if (v === null || v === undefined) return null;
        const s = String(v);
        return s.length === 10 ? Number(s) * 1000 : Number(s);
      };
      const sMs = toMs(start);
      const eMs = toMs(end);
      const dbMs = Number(displayBefore) ? Number(displayBefore) * 1000 : 0;
      const active = ((sMs === null || now >= (sMs - dbMs)) && (eMs === null || now <= eMs));
      return { active, start: sMs, end: eMs };
    };

    const getRoutes = (a: Record<string, unknown>) => {
      const out: string[] = [];
      const informed = (a['informed_entity'] as unknown) || (a['informed_entities'] as unknown) || (a['informedEntities'] as unknown) || (a['entities'] as unknown) || ((a['properties'] as Record<string, unknown> | undefined)?.['informed_entities'] as unknown) || (((a['alert'] as Record<string, unknown> | undefined) as Record<string, unknown>)?.['informed_entity'] as unknown) || null;
      if (Array.isArray(informed)) {
        for (const ie of informed as unknown[]) {
          if (!ie) continue;
          if (typeof ie === 'string') {
            // parse string fragments like "@{agency_id=MTASBWY; route_id=1; stop_id=142;}"
            const m = ie.match(/route_id=([^;\s}]+)/i) || ie.match(/route=([^;\s}]+)/i);
            if (m) out.push(m[1]);
            continue;
          }
          if (typeof ie === 'object') {
            const obj = ie as Record<string, unknown>;
            const r = obj['route'] || obj['route_id'] || obj['routeId'] || (obj['trip'] && (obj['trip'] as Record<string, unknown>)['route']) || obj['line'];
            if (r) out.push(String(r));
          }
        }
      }
      // also consider common top-level fields
      if (Array.isArray(a['routes'] as unknown)) out.push(...((a['routes'] as unknown[])?.map((x) => String(x)) || []));
      if (Array.isArray(a['services'] as unknown)) out.push(...((a['services'] as unknown[])?.map((x) => String(x)) || []));
      if (a['routesAffected']) out.push(...(Array.isArray(a['routesAffected'] as unknown) ? (a['routesAffected'] as unknown[]).map(String) : [String(a['routesAffected'])]));
      return Array.from(new Set(out)).filter(Boolean);
    };

    const getSortOrder = (a: Record<string, unknown>) => {
      const props = a['properties'] as Record<string, unknown> | undefined;
      const v = ((a['entity_selector'] as Record<string, unknown> | undefined)?.['sort_order']) || props?.['sort_order'] || props?.['MercuryEntitySelector'] && (props['MercuryEntitySelector'] as Record<string, unknown>)['sort_order'] || a['sort_order'] || a['priority'] || props?.['priority'];
      const n = Number(v as unknown);
      if (!isNaN(n)) return n;
      // fallback heuristics: suspended=100, delays=50, planned=10
      const txt = String((a['effect'] as unknown) || (a['header_text'] as unknown) || (a['title'] as unknown) || (a['description'] as unknown) || '').toLowerCase();
      if (txt.includes('suspend')) return 100;
      if (txt.includes('delay')) return 50;
      if (txt.includes('planned') || txt.includes('work')) return 10;
      return 0;
    };

    const unwrapTranslation = (v: unknown) => {
      if (v == null) return null;
      // If it's an object with translation field
      if (typeof v === 'object') {
        const obj = v as Record<string, unknown>;
        const t = obj['translation'] ?? obj['translations'] ?? obj['text'] ?? obj['body'];
        if (Array.isArray(t) && t.length) {
          // choose english plain text if present, otherwise first
          for (const item of t) {
            if (!item) continue;
            if (typeof item === 'string') {
              const m = String(item).match(/text=(.*?);\s*language=(\w+)/);
              if (m && m[2] && m[2].toLowerCase().startsWith('en')) return m[1];
              return item;
            }
            if (typeof item === 'object') {
              if (item['text']) return String(item['text']);
            }
          }
          return String(t[0]);
        }
        if (typeof t === 'string') {
          // may be string like "@{text=...; language=en}"
          const m = String(t).match(/text=(.*?);\s*language=(\w+)/);
          if (m) return m[1];
          return t;
        }
        // fallback: if object has text property
        if (obj['text']) return String(obj['text']);
        return JSON.stringify(obj);
      }
      // string: possibly a Mercury fragment like "@{text=...}"
      if (typeof v === 'string') {
        const s = v as string;
        const m = s.match(/@\{text=(.*?);?\s*(?:language=([^}]+))?\}/);
        if (m) return m[1];
        return s;
      }
      return String(v);
    };

    const toAlertObj = (a: Record<string, unknown>) => {
      const headerRaw = (a['header_text'] as unknown) || (a['title'] as unknown) || (a['summary'] as unknown) || ((a['properties'] as Record<string, unknown> | undefined)?.['header_text'] as unknown) || ((a['properties'] as Record<string, unknown> | undefined)?.['title'] as unknown) || (a['alert_text'] as unknown) || null;
      const descriptionRaw = (a['description'] as unknown) || (a['desc'] as unknown) || ((a['properties'] as Record<string, unknown> | undefined)?.['description'] as unknown) || ((a['properties'] as Record<string, unknown> | undefined)?.['detail'] as unknown) || null;
      const effectRaw = (a['effect'] as unknown) || ((a['properties'] as Record<string, unknown> | undefined)?.['effect'] as unknown) || (a['cause'] as unknown) || ((a['properties'] as Record<string, unknown> | undefined)?.['cause'] as unknown) || null;
      const severity = (a['severity'] as unknown) || ((a['properties'] as Record<string, unknown> | undefined)?.['severity'] as unknown) || null;
      const header = unwrapTranslation(headerRaw);
      const description = unwrapTranslation(descriptionRaw);
      const effect = unwrapTranslation(effectRaw);
      const activeMeta = parseActive(a);
      const routes = getRoutes(a);
      const sort_order = getSortOrder(a);
      return { header, description, effect, severity, activeMeta, routes, sort_order, raw: a };
    };

    const alertObjs = candidates.map(toAlertObj);

    // Map routes to their alerts (only keep active alerts; include display_before_active as active)
    type AlertRecord = Record<string, unknown> & { active?: boolean; weightActive?: number; sort_order?: number; header?: unknown; effect?: unknown; description?: unknown };
    const perLine: Record<string, { alerts: AlertRecord[] }> = {};
    for (const al of alertObjs) {
      const active = al.activeMeta?.active ?? true;
      // attach both active and imminently-displayable alerts; treat non-active as lower priority
      const weightActive = active ? 1 : 0;
      if (!al.routes || al.routes.length === 0) {
        // apply to ALL lines
        const key = 'ALL';
        perLine[key] = perLine[key] || { alerts: [] };
        perLine[key].alerts.push({ ...al, active, weightActive });
        continue;
      }
      for (let r of al.routes) {
        if (!r) continue;
        r = String(r).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        perLine[r] = perLine[r] || { alerts: [] };
        perLine[r].alerts.push({ ...al, active, weightActive });
      }
    }

    // Build lines array by selecting the highest sort_order active alert per line
    const lines: Record<string, unknown>[] = [];
    if (perLine['ALL']) {
      const allAlerts = perLine['ALL'].alerts.slice().sort((a,b) => (b.sort_order || 0) - (a.sort_order || 0));
      const sel = allAlerts[0];
      const mappedAlerts = allAlerts.map((al) => {
        const am = al.activeMeta as Record<string, unknown> | undefined;
        return { title: al.header || al.effect || '', description: al.description, start: am?.start, end: am?.end, raw: al.raw, sort_order: al.sort_order, active: al.active };
      });
      lines.push({ line: 'All Lines', status: sel ? (sel.header || sel.effect || 'Alert') : 'Good Service', detail: sel?.description, selectedAlert: sel, alerts: mappedAlerts });
    }
    for (const k of Object.keys(perLine)) {
      if (k === 'ALL') continue;
      const alerts = perLine[k].alerts || [];
      // prefer active alerts; sort by active flag then sort_order
      alerts.sort((a: AlertRecord, b: AlertRecord) => {
        const aScore = ((a.active as boolean) ? 100000 : 0) + (Number(a.sort_order as number) || 0);
        const bScore = ((b.active as boolean) ? 100000 : 0) + (Number(b.sort_order as number) || 0);
        return bScore - aScore;
      });
      const sel = alerts[0] as AlertRecord | undefined;
      const formatted = k.split('').join('/');
      const mapped = alerts.map((al) => {
        const am = al.activeMeta as Record<string, unknown> | undefined;
        return { title: al.header || al.effect || '', description: al.description, start: am?.start, end: am?.end, raw: al.raw, sort_order: al.sort_order, active: al.active };
      });
      lines.push({ line: formatted, status: sel ? (sel.header || sel.effect || 'Alert') : 'Good Service', detail: sel?.description, selectedAlert: sel, alerts: mapped });
    }

    // compute updated timestamp
    const updated = parsed?.generated_in || parsed?.generatedAt || parsed?.last_updated || parsed?.updated || parsed?.timestamp || new Date().toISOString();

    // overall summary prioritization
    const allSelected = Object.values(perLine).flatMap(v => v.alerts || []);
    let summary = 'Good Service';
    if (allSelected.some(a => String(a.header || a.effect || a.description || '').toLowerCase().includes('suspend') || String(a.description || '').toLowerCase().includes('suspend'))) summary = 'Suspended';
    else if (allSelected.some(a => String(a.header || a.effect || a.description || '').toLowerCase().includes('delay'))) summary = 'Delays';
    else if (allSelected.some(a => String(a.header || a.effect || a.description || '').toLowerCase().includes('planned') || String(a.header || '').toLowerCase().includes('work'))) summary = 'Planned Work';

    return { lines, updated, summary };
  } catch (err) {
    console.error('normalizeMtaAlerts error', err);
    return { lines: [], updated: new Date().toISOString(), message: 'Failed to normalize MTA alerts' };
  }
}
