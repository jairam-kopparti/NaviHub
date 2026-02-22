/**
 * Simplified GeoJSON polygons for NYC's five boroughs.
 * These are approximate boundaries suitable for map overlays.
 * For production-grade precision, replace with official NYC OpenData boundaries.
 */

import type { FeatureCollection, Feature, Polygon } from "geojson";

export type BoroughName = "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island";

export interface BoroughFeatureProperties {
  name: BoroughName;
  color: string;
  fillColor: string;
}

const boroughFeatures: Feature<Polygon, BoroughFeatureProperties>[] = [
  {
    type: "Feature",
    properties: {
      name: "Manhattan",
      color: "#997e67",
      fillColor: "rgba(153, 126, 103, 0.15)",
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-74.0479, 40.6829],
          [-74.0098, 40.7002],
          [-73.9717, 40.7309],
          [-73.9434, 40.7753],
          [-73.9299, 40.7957],
          [-73.9339, 40.8084],
          [-73.9345, 40.8348],
          [-73.9113, 40.8659],
          [-73.9100, 40.8724],
          [-73.9188, 40.8775],
          [-73.9271, 40.8791],
          [-74.0105, 40.7540],
          [-74.0340, 40.6999],
          [-74.0479, 40.6829],
        ],
      ],
    },
  },
  {
    type: "Feature",
    properties: {
      name: "Brooklyn",
      color: "#6B8E7B",
      fillColor: "rgba(107, 142, 123, 0.15)",
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-74.0421, 40.5707],
          [-73.8550, 40.5832],
          [-73.8336, 40.6285],
          [-73.8524, 40.6730],
          [-73.8672, 40.6941],
          [-73.9103, 40.7009],
          [-73.9717, 40.7309],
          [-74.0098, 40.7002],
          [-74.0421, 40.5707],
        ],
      ],
    },
  },
  {
    type: "Feature",
    properties: {
      name: "Queens",
      color: "#7B8EB0",
      fillColor: "rgba(123, 142, 176, 0.15)",
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-73.7004, 40.6102],
          [-73.7272, 40.5949],
          [-73.8550, 40.5832],
          [-73.8336, 40.6285],
          [-73.8524, 40.6730],
          [-73.8672, 40.6941],
          [-73.9103, 40.7009],
          [-73.9434, 40.7753],
          [-73.9164, 40.7978],
          [-73.8625, 40.7933],
          [-73.7949, 40.8009],
          [-73.7392, 40.7575],
          [-73.7004, 40.6102],
        ],
      ],
    },
  },
  {
    type: "Feature",
    properties: {
      name: "Bronx",
      color: "#B08E6B",
      fillColor: "rgba(176, 142, 107, 0.15)",
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-73.9113, 40.8659],
          [-73.9100, 40.8724],
          [-73.9049, 40.8780],
          [-73.8483, 40.9107],
          [-73.8270, 40.9102],
          [-73.7554, 40.9136],
          [-73.7274, 40.8881],
          [-73.7557, 40.8732],
          [-73.7634, 40.8498],
          [-73.7949, 40.8009],
          [-73.8625, 40.7933],
          [-73.9164, 40.7978],
          [-73.9271, 40.8791],
          [-73.9188, 40.8775],
          [-73.9113, 40.8659],
        ],
      ],
    },
  },
  {
    type: "Feature",
    properties: {
      name: "Staten Island",
      color: "#8B7BB0",
      fillColor: "rgba(139, 123, 176, 0.15)",
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-74.2469, 40.5020],
          [-74.2553, 40.5137],
          [-74.2464, 40.5462],
          [-74.2016, 40.5912],
          [-74.1498, 40.6362],
          [-74.0553, 40.6506],
          [-74.0340, 40.6420],
          [-74.0421, 40.5707],
          [-74.0604, 40.5421],
          [-74.0805, 40.5180],
          [-74.1283, 40.5027],
          [-74.1906, 40.4955],
          [-74.2469, 40.5020],
        ],
      ],
    },
  },
];

export const nycBoroughsGeoJSON: FeatureCollection<Polygon, BoroughFeatureProperties> = {
  type: "FeatureCollection",
  features: boroughFeatures,
};

/** NYC center coordinates */
export const NYC_CENTER: [number, number] = [-73.9712, 40.7831];
export const NYC_ZOOM = 10.5;

/** Borough center coordinates for quick navigation */
export const BOROUGH_CENTERS: Record<BoroughName, [number, number]> = {
  Manhattan: [-73.9712, 40.7831],
  Brooklyn: [-73.9442, 40.6782],
  Queens: [-73.7949, 40.7282],
  Bronx: [-73.8648, 40.8448],
  "Staten Island": [-74.1502, 40.5795],
};
