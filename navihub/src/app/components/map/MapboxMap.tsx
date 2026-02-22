"use client";

import { useRef, useEffect, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Resource } from "../../lib/types";
import {
  nycBoroughsGeoJSON,
  NYC_CENTER,
  NYC_ZOOM,
} from "../../lib/nycBoroughs";

// Set access token from env
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export interface MapboxMapProps {
  /** Resources to display as markers */
  resources: Resource[];
  /** User's current location, if available */
  userLocation?: { latitude: number; longitude: number } | null;
  /** Called when a resource marker is clicked */
  onMarkerClick?: (resource: Resource) => void;
  /** CSS class for the container */
  className?: string;
  /** Whether to show borough boundary overlays */
  showBoroughs?: boolean;
  /** Initial zoom level */
  initialZoom?: number;
  /** Whether this instance is in a modal (larger) view */
  isFullView?: boolean;
}

export default function MapboxMap({
  resources,
  userLocation,
  onMarkerClick,
  className = "",
  showBoroughs = true,
  initialZoom,
  isFullView = false,
}: MapboxMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create persistent tooltip element
    const tooltip = document.createElement("div");
    tooltip.className = "map-hover-tooltip";
    tooltip.style.cssText = `
      position: absolute;
      z-index: 10;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      background: #fff;
      border-radius: 10px;
      padding: 10px 14px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08);
      border: 1px solid rgba(153,126,103,0.15);
      max-width: 230px;
      font-family: 'Open Sans', sans-serif;
      transform: translate(-50%, -100%);
      margin-top: -14px;
    `;
    mapContainerRef.current.style.position = "relative";
    mapContainerRef.current.appendChild(tooltip);
    tooltipRef.current = tooltip;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: NYC_CENTER,
      zoom: initialZoom ?? NYC_ZOOM,
      minZoom: 9,
      maxZoom: 18,
      maxBounds: [
        [-74.35, 40.45],
        [-73.65, 40.95],
      ],
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      if (showBoroughs) {
        addBoroughLayers(map);
      }
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      tooltipRef.current?.remove();
      tooltipRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add borough boundary layers
  const addBoroughLayers = useCallback((map: mapboxgl.Map) => {
    if (map.getSource("boroughs")) return;

    map.addSource("boroughs", {
      type: "geojson",
      data: nycBoroughsGeoJSON as GeoJSON.FeatureCollection,
    });

    map.addLayer({
      id: "borough-fills",
      type: "fill",
      source: "boroughs",
      paint: {
        "fill-color": [
          "match",
          ["get", "name"],
          "Manhattan", "rgba(153, 126, 103, 0.08)",
          "Brooklyn", "rgba(107, 142, 123, 0.08)",
          "Queens", "rgba(123, 142, 176, 0.08)",
          "Bronx", "rgba(176, 142, 107, 0.08)",
          "Staten Island", "rgba(139, 123, 176, 0.08)",
          "rgba(0, 0, 0, 0.03)",
        ],
        "fill-opacity": 0.7,
      },
    });

    map.addLayer({
      id: "borough-borders",
      type: "line",
      source: "boroughs",
      paint: {
        "line-color": [
          "match",
          ["get", "name"],
          "Manhattan", "#997e67",
          "Brooklyn", "#6B8E7B",
          "Queens", "#7B8EB0",
          "Bronx", "#B08E6B",
          "Staten Island", "#8B7BB0",
          "#888",
        ],
        "line-width": 1.5,
        "line-opacity": 0.5,
      },
    });

    map.addLayer({
      id: "borough-labels",
      type: "symbol",
      source: "boroughs",
      layout: {
        "text-field": ["get", "name"],
        "text-size": 12,
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-anchor": "center",
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": "#888",
        "text-halo-color": "#fff",
        "text-halo-width": 1.5,
        "text-opacity": 0.6,
      },
    });
  }, []);

  // Sync resource markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateMarkers = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      resources.forEach((resource) => {
        if (resource.latitude == null || resource.longitude == null) return;

        // Create marker element
        const el = document.createElement("div");
        el.className = "resource-marker";
        el.style.cssText = `
          width: 26px;
          height: 26px;
          background: #997e67;
          border: 2.5px solid #fff;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: box-shadow 0.15s ease, border-color 0.15s ease;
          transform-origin: center center;
        `;

        // Hover: glow effect (no scale to prevent drift)
        el.addEventListener("mouseenter", () => {
          el.style.boxShadow = "0 0 0 4px rgba(153,126,103,0.3), 0 2px 12px rgba(0,0,0,0.25)";
          el.style.borderColor = "#997e67";

          // Show tooltip above marker
          if (tooltipRef.current && mapRef.current) {
            const point = mapRef.current.project([resource.longitude!, resource.latitude!]);
            tooltipRef.current.innerHTML = `
              <div style="font-size: 12px; font-weight: 600; color: #1F1F1F; line-height: 1.3;">${resource.title}</div>
              <div style="font-size: 10px; color: #997e67; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.4px; font-weight: 600;">${resource.category || ""}</div>
              ${resource.location ? `<div style="font-size: 10px; color: #888; margin-top: 2px; display: flex; align-items: center; gap: 3px;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                ${resource.location}
              </div>` : ""}
            `;
            tooltipRef.current.style.left = `${point.x}px`;
            tooltipRef.current.style.top = `${point.y}px`;
            tooltipRef.current.style.opacity = "1";
          }
        });

        el.addEventListener("mouseleave", () => {
          el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
          el.style.borderColor = "#fff";

          if (tooltipRef.current) {
            tooltipRef.current.style.opacity = "0";
          }
        });

        // Create marker (no popup — click opens resource detail)
        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([resource.longitude, resource.latitude])
          .addTo(map);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onMarkerClick?.(resource);
        });

        markersRef.current.push(marker);
      });
    };

    if (map.loaded()) {
      updateMarkers();
    } else {
      map.on("load", updateMarkers);
    }
  }, [resources, onMarkerClick]);

  // Sync user location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    userMarkerRef.current?.remove();
    userMarkerRef.current = null;

    if (!userLocation) return;

    const el = document.createElement("div");
    el.style.cssText = `
      width: 14px;
      height: 14px;
      background: #4285F4;
      border: 2.5px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(66, 133, 244, 0.25), 0 2px 6px rgba(0,0,0,0.15);
    `;

    const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 12, closeButton: false })
          .setHTML('<div style="font-size: 11px; font-family: \'Open Sans\', sans-serif; color: #555; font-weight: 500;">Your location</div>')
      )
      .addTo(map);

    userMarkerRef.current = marker;
  }, [userLocation]);

  // Fly to user location
  useEffect(() => {
    if (!userLocation || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 14,
      duration: 1200,
    });
  }, [userLocation]);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full ${isFullView ? "h-full" : "h-100 lg:h-125"} overflow-hidden ${className}`}
      style={{ minHeight: isFullView ? "100%" : 400 }}
    />
  );
}
