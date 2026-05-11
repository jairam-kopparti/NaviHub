export function pinSubway(detail: any) {
  try { sessionStorage.setItem('pinnedSubway', JSON.stringify(detail)); } catch {}
  try { window.dispatchEvent(new CustomEvent('pin-subway', { detail })); } catch {}
}

export function unpinSubway() {
  try { sessionStorage.removeItem('pinnedSubway'); } catch {}
  try { window.dispatchEvent(new CustomEvent('pin-subway', { detail: null })); } catch {}
}

export function pinWeather(detail: any) {
  try { sessionStorage.setItem('pinnedWeather', JSON.stringify(detail)); } catch {}
  try { window.dispatchEvent(new CustomEvent('pin-weather', { detail })); } catch {}
}

export function unpinWeather() {
  try { sessionStorage.removeItem('pinnedWeather'); } catch {}
  try { window.dispatchEvent(new CustomEvent('pin-weather', { detail: null })); } catch {}
}

export function isSubwayPinned(detail?: any) {
  try {
    const raw = sessionStorage.getItem('pinnedSubway');
    if (!raw) return false;
    if (!detail) return true;
    const stored = JSON.parse(raw);
    try {
      if (stored?.id && detail?.id) return stored.id === detail.id;
    } catch {}
    // fallback to JSON equality for a best-effort match
    try { return JSON.stringify(stored) === JSON.stringify(detail); } catch { return true; }
  } catch { return false; }
}

export function isWeatherPinned() {
  try { return !!sessionStorage.getItem('pinnedWeather'); } catch { return false; }
}
