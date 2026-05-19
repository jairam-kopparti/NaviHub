'use client';
import { useState } from 'react';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudSun, Train } from 'lucide-react';
import WeatherWidget from './widgets/WeatherWidget';
import MetroWidget from './widgets/MetroWidget';
import { usePathname } from 'next/navigation';

type Panel = 'weather' | 'metro' | null;

export default function FloatingTools() {
  const [openPanel, setOpenPanel] = useState<Panel>(null);
  const pathname = usePathname() ?? '';
  const hideWidgets = pathname.startsWith('/pages/signin') || pathname.startsWith('/pages/signup');

  useEffect(() => {
    const openWeather = () => setOpenPanel('weather');
    const openMetro = () => setOpenPanel('metro');

    window.addEventListener('open-weather-widget', openWeather);
    window.addEventListener('open-metro-widget', openMetro);

    return () => {
      window.removeEventListener('open-weather-widget', openWeather);
      window.removeEventListener('open-metro-widget', openMetro);
    };
  }, []);

  const togglePanel = (panel: Panel) => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  if (hideWidgets) return null;

  return (
    <>
      <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-3">
        <AnimatePresence>
          {openPanel !== 'metro' && (
            <motion.div
              key="metro-label"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="!bg-white !text-[#404E3B] px-3 py-1.5 rounded-lg shadow-md border border-gray-100 !text-xs !font-semibold"
            >
              NYC Metro
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          onClick={() => togglePanel('metro')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 rounded-full !bg-[#404E3B] !text-white shadow-lg hover:!bg-[#7B9669] transition-all focus:outline-none"
          aria-label="Open Metro info"
        >
          <Train className="h-6 w-6" />
        </motion.button>

        <AnimatePresence>
          {openPanel !== 'weather' && (
            <motion.div
              key="weather-label"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="!bg-white !text-[#404E3B] px-3 py-1.5 rounded-lg shadow-md border border-gray-100 !text-xs !font-semibold"
            >
              NYC Weather
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          onClick={() => togglePanel('weather')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 rounded-full !bg-[#404E3B] !text-white shadow-lg hover:!bg-[#7B9669] transition-all focus:outline-none"
          aria-label="Open Weather forecast"
        >
          <CloudSun className="h-6 w-6" />
        </motion.button>
      </div>

      <WeatherWidget isOpen={openPanel === 'weather'} onClose={() => setOpenPanel(null)} />
      <MetroWidget isOpen={openPanel === 'metro'} onClose={() => setOpenPanel(null)} />
    </>
  );
}
