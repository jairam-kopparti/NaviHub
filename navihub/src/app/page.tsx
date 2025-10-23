"use client";

import { useState } from "react";
import HomePage from "./page";
import ResourcesPage from "./resources/page";
import FormPage from "./form/page";
import AboutPage from "./about/page";

// Create a simple context for navigation
export const NavigationContext = ({ children }: { children: React.ReactNode }) => children;

// Simple Link component for navigation
export const Link = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('navigate', { detail: href }));
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};

export default function App() {
  const [currentPath, setCurrentPath] = useState('/');

  // Listen for navigation events
  useState(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent;
      setCurrentPath(customEvent.detail);
    };

    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  });

  // Render the appropriate page based on current path
  const renderPage = () => {
    switch (currentPath) {
      case '/resources':
        return <ResourcesPage />;
      case '/form':
        return <FormPage />;
      case '/about':
        return <AboutPage />;
      default:
        return <HomePage />;
    }
  };

  return renderPage();
}
