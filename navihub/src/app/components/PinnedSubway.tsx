'use client';
import React, { useEffect, useState, useRef } from 'react';
import SubwayCard from './SubwayCard';
import WeatherCard from './WeatherCard';

export default function PinnedSubway() {
  const [pinnedSubway, setPinnedSubway] = useState<any>(null);
  const [pinnedWeather, setPinnedWeather] = useState<any>(null);
  const [liveSubway, setLiveSubway] = useState<any>(null);
  const [modalType, setModalType] = useState<null | 'group' | 'subway' | 'weather'>(null);
  const [modalData, setModalData] = useState<{ subway?: any; weather?: any }>({});
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    // Restore persisted pinned items from sessionStorage so pins persist across the session
    try {
      const storedS = sessionStorage.getItem('pinnedSubway');
      if (storedS) setPinnedSubway(JSON.parse(storedS));
    } catch {}
    try {
      const storedW = sessionStorage.getItem('pinnedWeather');
      if (storedW) setPinnedWeather(JSON.parse(storedW));
    } catch {}

    const pinSubHandler = (e: any) => {
      const raw = e?.detail;
      const detail = raw?.data ?? raw;
      if (detail) {
        setPinnedSubway(detail);
      } else {
        setPinnedSubway(null);
      }
    };

    const pinWeatherHandler = (e: any) => {
      const raw = e?.detail;
      const detail = raw?.data ?? raw;
      if (detail) {
        setPinnedWeather(detail);
      } else {
        setPinnedWeather(null);
      }
    };

    const openHandler = (e: any) => {
      const raw = e?.detail;
      const detail = raw?.data ?? raw;
      if (detail) {
        // Open subway modal transiently without pinning
        setModalData((d) => ({ ...d, subway: detail }));
        setModalType('subway');
      }
    };

    window.addEventListener('pin-subway', pinSubHandler as EventListener);
    window.addEventListener('pin-weather', pinWeatherHandler as EventListener);
    window.addEventListener('open-subway', openHandler as EventListener);

    // Poll subway every 60s; fetch weather only once on mount (or when pinnedWeather absent)
    let interval: any = null;
    const fetchSubway = async () => {
      try {
        const res = await fetch('/api/subway/status');
        if (res.ok) {
          const json = await res.json();
          const norm = json?.data ?? json;
          if (mounted.current) setLiveSubway(norm);
        }
      } catch (err) {
        console.error('PinnedSubway subway fetch error', err);
      }
    };

    const fetchWeatherOnce = async () => {
      try {
        // only fetch if no pinned weather is set
        if (!sessionStorage.getItem('pinnedWeather')) {
          const res = await fetch('/api/weather?lat=40.7128&lon=-74.0060');
          if (res.ok) {
            const json = await res.json();
            const norm = json?.data ? { provider: json.provider ?? 'api', data: json.data } : json;
            // keep weather data transient unless user explicitly pins it
            if (mounted.current) setModalData((d) => ({ ...d, weather: norm }));
          }
        }
      } catch (err) {
        console.error('PinnedSubway weather fetch error', err);
      }
    };

    // initial
    fetchSubway();
    fetchWeatherOnce();
    interval = setInterval(fetchSubway, 60000);

    return () => {
      mounted.current = false;
      window.removeEventListener('pin-subway', pinSubHandler as EventListener);
      window.removeEventListener('pin-weather', pinWeatherHandler as EventListener);
      window.removeEventListener('open-subway', openHandler as EventListener);
      if (interval) clearInterval(interval);
    };
  }, []);

  const removeSubway = () => {
    setPinnedSubway(null);
    try { sessionStorage.removeItem('pinnedSubway'); } catch {}
    // notify other listeners that subway is now unpinned
    try { window.dispatchEvent(new CustomEvent('pin-subway', { detail: null })); } catch {}
    if (modalType === 'subway') setModalType(null);
    else if (modalType === 'group' && pinnedWeather) setModalType('weather');
  };
  const removeWeather = () => {
    setPinnedWeather(null);
    try { sessionStorage.removeItem('pinnedWeather'); } catch {}
    // notify other listeners that weather is now unpinned
    try { window.dispatchEvent(new CustomEvent('pin-weather', { detail: null })); } catch {}
    if (modalType === 'weather') setModalType(null);
    else if (modalType === 'group' && pinnedSubway) setModalType('subway');
  };

  const openModalGroup = () => {
    setModalData((d) => ({ subway: d.subway ?? pinnedSubway, weather: d.weather ?? pinnedWeather }));
    setModalType('group');
  };
  const openModalSubway = (e?: any) => { e?.stopPropagation?.(); setModalData((d) => ({ ...d, subway: d.subway ?? pinnedSubway })); setModalType('subway'); };
  const openModalWeather = (e?: any) => { e?.stopPropagation?.(); setModalData((d) => ({ ...d, weather: d.weather ?? pinnedWeather })); setModalType('weather'); };
  const closeModal = () => { setModalType(null); setModalData({}); };

  if (!pinnedSubway && !pinnedWeather) return null;

  const renderCombinedWidget = () => (
    <div className="bg-black text-white rounded-lg shadow-md flex items-center h-14 px-2" aria-label="Transit and weather">
      <div role="button" aria-label="Open subway" onClick={openModalSubway} className="flex-1 pr-0 h-14 flex items-center cursor-pointer">
        <div className="w-full overflow-hidden text-white">
          <SubwayCard data={pinnedSubway} compact={true} flat={true} showPin={false} onRemove={(e?: any) => { e?.stopPropagation?.(); removeSubway(); }} />
        </div>
      </div>
      <div className="w-px h-8 bg-gray-700 mx-1" />
      <div role="button" aria-label="Open weather" onClick={openModalWeather} className="flex-1 pl-0 h-14 flex items-center cursor-pointer">
        <div className="w-full overflow-hidden text-white">
          <WeatherCard data={pinnedWeather} compact={true} flat={true} showPin={false} onRemove={(e?: any) => { e?.stopPropagation?.(); removeWeather(); }} />
        </div>
      </div>
    </div>
  );

  const renderSubwayOnlyWidget = () => (
    <div className="bg-black text-white rounded-lg shadow-md cursor-pointer flex items-center h-14" role="button" aria-label="Open transit" onClick={openModalSubway}>
      <div className="w-full h-14 flex items-center pl-3 pr-3">
        <div className="w-full overflow-hidden">
          <SubwayCard data={pinnedSubway} compact={true} flat={true} showPin={false} onRemove={(e?: any) => { e?.stopPropagation?.(); removeSubway(); }} />
        </div>
      </div>
    </div>
  );

  const renderWeatherOnlyWidget = () => (
    <div className="bg-black text-white rounded-lg shadow-md cursor-pointer flex items-center h-14" role="button" aria-label="Open weather" onClick={openModalWeather}>
      <div className="w-full h-14 flex items-center pl-3 pr-3">
        <div className="w-full overflow-hidden">
          <WeatherCard data={pinnedWeather} compact={true} flat={true} showPin={false} onRemove={(e?: any) => { e?.stopPropagation?.(); removeWeather(); }} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-auto">
        <div className={`max-w-[95vw] h-14 ${pinnedSubway && pinnedWeather ? 'w-[680px]' : (pinnedSubway || pinnedWeather) ? 'w-[420px]' : ''}`}>
          {pinnedSubway && pinnedWeather ? renderCombinedWidget() : pinnedSubway ? renderSubwayOnlyWidget() : renderWeatherOnlyWidget()}
          </div>
      </div>

      {modalType && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative z-10 p-4 max-w-5xl w-full">
              <div className="relative z-10 p-4 w-full flex justify-center">
                {/* If group and both exist show two-column grid, otherwise show single centered card sized like one widget */}
                {modalType === 'group' && (modalData.subway ?? pinnedSubway) && (modalData.weather ?? pinnedWeather) ? (
                  <div className="max-w-5xl w-full grid grid-cols-2 gap-4">
                    {(modalData.subway ?? pinnedSubway) && <SubwayCard data={modalData.subway ?? pinnedSubway} compact={false} showPin={true} onRemove={() => { closeModal(); }} />}
                    {(modalData.weather ?? pinnedWeather) && <WeatherCard data={modalData.weather ?? pinnedWeather} compact={false} showPin={true} onRemove={() => { closeModal(); }} />}
                  </div>
                ) : (
                  <div className="max-w-[760px] w-full">
                    {modalType === 'subway' && (modalData.subway ?? pinnedSubway) && (
                      <SubwayCard data={modalData.subway ?? pinnedSubway} compact={false} showPin={true} onRemove={() => { closeModal(); }} />
                    )}
                    {modalType === 'weather' && (modalData.weather ?? pinnedWeather) && (
                      <div className="flex justify-center">
                        <div className="w-full max-w-[380px] mx-auto">
                          <WeatherCard data={modalData.weather ?? pinnedWeather} compact={false} showPin={true} onRemove={() => { closeModal(); }} />
                        </div>
                      </div>
                    )}
                    {/* Fallback: if group selected but only one available, render that one */}
                    {modalType === 'group' && !(modalData.subway ?? pinnedSubway) && (modalData.weather ?? pinnedWeather) && (
                      <div className="w-full max-w-[380px] mx-auto">
                        <WeatherCard data={modalData.weather ?? pinnedWeather} compact={false} showPin={true} onRemove={() => { closeModal(); }} />
                      </div>
                    )}
                    {modalType === 'group' && !(modalData.weather ?? pinnedWeather) && (modalData.subway ?? pinnedSubway) && (
                      <div className="w-full">
                        <SubwayCard data={modalData.subway ?? pinnedSubway} compact={false} showPin={true} onRemove={() => { closeModal(); }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
          </div>
        </div>
      )}
    </>
  );
}
