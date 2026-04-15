"use client";

import { useRef, useEffect, useCallback, useState } from "react";
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

  const [activeRouteDest, setActiveRouteDest] = useState<Resource | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapContainerRef.current.style.position = "relative";

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: NYC_CENTER,
      zoom: initialZoom ?? NYC_ZOOM,
      minZoom: 3,
      maxZoom: 18,
    });

    map.on("load", () => {
      if (showBoroughs) {
        addBoroughLayers(map);
      }
    });

    mapRef.current = map;

    // Create persistent tooltip element after Map instance
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
    mapContainerRef.current.appendChild(tooltip);
    tooltipRef.current = tooltip;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      if (tooltipRef.current) {
        tooltipRef.current.remove();
        tooltipRef.current = null;
      }
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

  // Fetch and draw route on Mapbox
  const drawRoute = useCallback(async (destination: Resource) => {
    if (!userLocation || !mapRef.current || destination.latitude == null || destination.longitude == null) {
      alert("User location is required for Navihub directions.");
      return;
    }
    const map = mapRef.current;
    const start = [userLocation.longitude, userLocation.latitude];
    const end = [destination.longitude, destination.latitude];

    setActiveRouteDest(destination);
    
    try {
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`
      );
      const json = await query.json();
      
      if (!json.routes || json.routes.length === 0) {
        console.error("No route found:", json);
        alert("Could not find a route for the selected mode.");
        return;
      }
      
      const data = json.routes[0];
      const route = data.geometry.coordinates;

      // Extract duration in seconds and format
      const durationSecs = data.duration;
      const mins = Math.ceil(durationSecs / 60);
      const timeStr = mins >= 60 ? `${Math.floor(mins / 60)} hr ${mins % 60} min` : `${mins} min`;

      // Extract distance in meters and convert to miles
      const distanceMiles = (data.distance / 1609.34).toFixed(1);
      const displayStr = `${timeStr} (${distanceMiles} mi)`;

      const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: { duration_str: displayStr },
        geometry: {
          type: 'LineString',
          coordinates: route
        }
      };

      if (map.getSource('route')) {
        (map.getSource('route') as mapboxgl.GeoJSONSource).setData(geojson);
      } else {
        map.addLayer({
          id: 'route',
          type: 'line',
          source: {
            type: 'geojson',
            data: geojson
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#4285F4',
            'line-width': 5,
            'line-opacity': 0.75
          }
        });

        map.addLayer({
          id: 'route-label',
          type: 'symbol',
          source: 'route',
          layout: {
            'symbol-placement': 'line-center',
            'text-field': ['get', 'duration_str'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 13,
            'text-offset': [0, -0.8],
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#4285F4',
            'text-halo-width': 2
          }
        });
      }
      
      // Calculate bounds using standard coordinates arrays
      const bounds = route.reduce(
        (bounds: mapboxgl.LngLatBounds, coord: number[]) => {
          return bounds.extend(coord as [number, number]);
        },
        new mapboxgl.LngLatBounds(route[0] as [number, number], route[0] as [number, number])
      );

      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
      
    } catch (err) {
      console.error("Error fetching directions", err);
    }
  }, [userLocation]);

  const clearRoute = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (map.getLayer('route-label')) map.removeLayer('route-label');
    if (map.getLayer('route')) map.removeLayer('route');
    if (map.getSource('route')) map.removeSource('route');
    setActiveRouteDest(null);
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

        let isPopupOpen = false;

        // Hover: glow effect (no scale to prevent drift)
        el.addEventListener("mouseenter", () => {
          if (isPopupOpen) return;
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
          if (isPopupOpen) return;
          el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
          el.style.borderColor = "#fff";

          if (tooltipRef.current) {
            tooltipRef.current.style.opacity = "0";
          }
        });

        const popupContainer = document.createElement("div");
        popupContainer.innerHTML = `
          <div style="padding: 4px 6px; font-family: 'Open Sans', sans-serif;">
            <div style="font-size: 13px; font-weight: 700; color: #1F1F1F; margin-bottom: 2px;">${resource.title}</div>
            <div style="font-size: 10px; color: #888; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 6px;">${resource.category || ""}</div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <button id="view-resource-btn" style="background: #997e67; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; transition: opacity 0.2s;">
                View Resource
              </button>
              <button id="navihub-dir-btn" style="background: #fff; color: #4285F4; border: 1px solid #4285F4; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
                NaviHub Route
              </button>
              <button id="google-dir-btn" style="background: #fff; color: #34A853; border: 1px solid #34A853; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
                Google Maps
              </button>
            </div>
          </div>
        `;

        popupContainer.querySelector("#view-resource-btn")?.addEventListener("click", () => {
          onMarkerClick?.(resource);
        });

        popupContainer.querySelector("#navihub-dir-btn")?.addEventListener("click", () => {
          drawRoute(resource);
        });

        popupContainer.querySelector("#google-dir-btn")?.addEventListener("click", () => {
          const destStr = resource.address 
            ? encodeURIComponent(`${resource.address}, ${resource.location || 'New York'}, NY`)
            : `${resource.latitude},${resource.longitude}`;
          
          if (!userLocation) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${destStr}`, '_blank');
          } else {
            window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${destStr}`, '_blank');
          }
        });

        const popup = new mapboxgl.Popup({ offset: 15, closeButton: true, focusAfterOpen: false })
          .setDOMContent(popupContainer);

        popup.on('open', () => {
          isPopupOpen = true;
          if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
        });
        
        popup.on('close', () => {
          isPopupOpen = false;
          el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
          el.style.borderColor = "#fff";
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([resource.longitude, resource.latitude])
          .setPopup(popup)
          .addTo(map);

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

  const handleResetZoom = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: NYC_CENTER,
      zoom: initialZoom ?? NYC_ZOOM,
      duration: 1200,
    });
  }, [initialZoom]);

  return (
    <div 
      className={`relative w-full overflow-hidden ${className}`} 
      style={{ height: isFullView ? "100%" : "500px", minHeight: isFullView ? "100%" : "400px" }}
    >
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: "inherit" }} />
      <button
        onClick={handleResetZoom}
        className="absolute top-4 left-4 z-10 bg-white px-3 py-1.5 shadow-md border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
        NYC Default View
      </button>

      {/* Active Route Controls */}
      {activeRouteDest && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white shadow-lg rounded-full px-4 py-2 flex gap-2 items-center border border-gray-100">
          <span className="text-xs font-bold text-gray-700 mx-2">Driving Route</span>
          <div className="w-px h-5 bg-gray-200 mx-1"></div>
          <button 
            onClick={clearRoute} 
            className="px-3 py-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full text-xs font-bold transition"
          >
            Clear Route
          </button>
        </div>
      )}
    </div>
  );
}
