'use client';
import React, { useEffect, useState } from 'react';
import WeatherCard from './WeatherCard';

export default function PinnedWeather() {
  const [pinned, setPinned] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('pinnedWeather');
    if (stored) setPinned(JSON.parse(stored));

    const handler = (e: any) => {
      const detail = e?.detail;
      if (detail) {
        setPinned(detail);
        try { sessionStorage.setItem('pinnedWeather', JSON.stringify(detail)); } catch {}
      }
    };

    window.addEventListener('pin-weather', handler as EventListener);
    return () => window.removeEventListener('pin-weather', handler as EventListener);
  }, []);

  const remove = () => {
    setPinned(null);
    try { sessionStorage.removeItem('pinnedWeather'); } catch {}
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  if (!pinned) return null;

  return (
    <>
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-auto">
        <div onClick={openModal} role="button" aria-label="Open weather" className="cursor-pointer">
          <WeatherCard data={pinned} compact={true} showPin={false} onRemove={remove} />
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative z-10 p-4 max-w-3xl w-full">
            <WeatherCard data={pinned} compact={false} showPin={true} onRemove={closeModal} />
          </div>
        </div>
      )}
    </>
  );
}
