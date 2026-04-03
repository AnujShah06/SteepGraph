"use client";

import { useState, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import styles from "./RegionMap.module.css";
import type { RegionPin } from "@/lib/types";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface RegionMapProps {
  regions: RegionPin[];
  selectedRegion?: string | null;
  onSelect: (name: string | null) => void;
}

export default function RegionMap({
  regions,
  selectedRegion,
  onSelect,
}: RegionMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const maxTeas = useMemo(
    () => Math.max(...regions.map((r) => r.teaCount), 1),
    [regions]
  );

  const pinSize = (count: number) => Math.max(6, (count / maxTeas) * 16);

  return (
    <div className={styles.mapWrap}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 140,
          center: [40, 20],
        }}
        className={styles.map}
      >
        <ZoomableGroup>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="var(--ink2)"
                  stroke="var(--ink3)"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "var(--ink3)" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {regions.map((region) => {
            const isSelected = selectedRegion === region.name;
            const isHovered = hoveredRegion === region.name;
            const size = pinSize(region.teaCount);
            const isTravel = region.type === "travel";

            return (
              <Marker
                key={region.name}
                coordinates={[region.lng, region.lat]}
                onClick={() =>
                  onSelect(isSelected ? null : region.name)
                }
                onMouseEnter={() => setHoveredRegion(region.name)}
                onMouseLeave={() => setHoveredRegion(null)}
                style={{ cursor: "pointer" }}
              >
                {isTravel ? (
                  /* Diamond shape for travel pins */
                  <rect
                    x={-size / 2}
                    y={-size / 2}
                    width={size}
                    height={size}
                    transform="rotate(45)"
                    fill="var(--gold)"
                    opacity={
                      isSelected ? 1 : selectedRegion ? 0.4 : 0.85
                    }
                    stroke={isSelected ? "var(--gold2)" : "none"}
                    strokeWidth={isSelected ? 2 : 0}
                  />
                ) : (
                  /* Circle for origin pins */
                  <>
                    {/* Pulse ring on hover */}
                    {(isHovered || isSelected) && (
                      <circle
                        r={size + 6}
                        fill="none"
                        stroke="var(--gold)"
                        strokeWidth={1.5}
                        opacity={0.4}
                        className={isHovered ? styles.pulse : ""}
                      />
                    )}
                    <circle
                      r={size}
                      fill="var(--gold)"
                      opacity={
                        isSelected ? 1 : selectedRegion ? 0.4 : 0.85
                      }
                      stroke={isSelected ? "var(--gold2)" : "var(--ink)"}
                      strokeWidth={isSelected ? 2 : 1}
                    />
                  </>
                )}

                {/* Label on hover/selected */}
                {(isHovered || isSelected) && (
                  <text
                    textAnchor="middle"
                    y={-size - 8}
                    className={styles.pinLabel}
                  >
                    {isTravel
                      ? `Collected at ${region.name}`
                      : region.name}
                  </text>
                )}
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
