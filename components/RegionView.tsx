"use client";

import { useState, useCallback, useEffect } from "react";
import styles from "./RegionView.module.css";
import RegionMap from "./RegionMap";
import TeaCard from "./TeaCard";
import type { RegionPin, TeaSummary } from "@/lib/types";

/* Hardcoded pin coordinates per spec Section 08 */
const REGION_COORDS: Record<
  string,
  { lat: number; lng: number; country: string; type: "origin" | "travel" }
> = {
  Assam: { lat: 26.2, lng: 92.9, country: "India", type: "origin" },
  Darjeeling: { lat: 27.0, lng: 88.2, country: "India", type: "origin" },
  Nilgiri: { lat: 11.4, lng: 76.7, country: "India", type: "origin" },
  Ceylon: { lat: 6.9, lng: 80.7, country: "Sri Lanka", type: "origin" },
  Yunnan: { lat: 25.0, lng: 101.0, country: "China", type: "origin" },
  Fujian: { lat: 26.0, lng: 118.0, country: "China", type: "origin" },
  Uji: { lat: 34.9, lng: 135.8, country: "Japan", type: "origin" },
  Taiwan: { lat: 23.7, lng: 121.0, country: "Taiwan", type: "origin" },
  Seattle: { lat: 47.6, lng: -122.3, country: "USA", type: "travel" },
  Hawaii: { lat: 20.8, lng: -156.3, country: "USA", type: "travel" },
  Germany: { lat: 51.2, lng: 10.4, country: "Germany", type: "travel" },
  Singapore: { lat: 1.3, lng: 103.8, country: "Singapore", type: "origin" },
};

interface RegionViewProps {
  initialTeas: TeaSummary[];
  regionCounts: { name: string; country: string; teaCount: number }[];
  initialRegion?: string | null;
}

export default function RegionView({
  initialTeas,
  regionCounts,
  initialRegion = null,
}: RegionViewProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(
    initialRegion
  );
  const [teas, setTeas] = useState<TeaSummary[]>(initialTeas);
  const [loading, setLoading] = useState(false);

  // Build region pins from DB counts + hardcoded coords
  const regions: RegionPin[] = regionCounts
    .map((rc) => {
      const coords = REGION_COORDS[rc.name];
      if (!coords) return null;
      return {
        name: rc.name,
        country: coords.country,
        lat: coords.lat,
        lng: coords.lng,
        type: coords.type,
        teaCount: rc.teaCount,
      };
    })
    .filter(Boolean) as RegionPin[];

  // Add travel pins with 0 count if not in DB
  Object.entries(REGION_COORDS).forEach(([name, coords]) => {
    if (!regions.find((r) => r.name === name)) {
      regions.push({
        name,
        country: coords.country,
        lat: coords.lat,
        lng: coords.lng,
        type: coords.type,
        teaCount: 0,
      });
    }
  });

  const handleSelect = useCallback((name: string | null) => {
    setSelectedRegion(name);
    if (name) {
      // Update URL without navigation
      window.history.replaceState(null, "", `/region?pin=${name}`);
    } else {
      window.history.replaceState(null, "", "/region");
    }
  }, []);

  useEffect(() => {
    if (!selectedRegion) {
      setTeas(initialTeas);
      return;
    }

    setLoading(true);
    fetch(`/api/teas?region=${encodeURIComponent(selectedRegion)}`)
      .then((r) => r.json())
      .then((data) => {
        setTeas(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedRegion, initialTeas]);

  return (
    <div className={styles.page}>
      <RegionMap
        regions={regions}
        selectedRegion={selectedRegion}
        onSelect={handleSelect}
      />

      <div className={styles.content}>
        <div className={styles.headerRow}>
          {selectedRegion ? (
            <>
              <h2 className={styles.heading}>
                Showing {teas.length} tea{teas.length !== 1 ? "s" : ""} from{" "}
                {selectedRegion}
              </h2>
              <button
                className="btn"
                onClick={() => handleSelect(null)}
              >
                Clear
              </button>
            </>
          ) : (
            <h2 className={styles.heading}>
              Select a region to explore its teas
            </h2>
          )}
        </div>

        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`skeleton ${styles.skelCard}`} />
            ))}
          </div>
        ) : teas.length > 0 ? (
          <div className={styles.grid}>
            {teas.map((tea, i) => (
              <div
                key={tea.id}
                className="fade-up"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <TeaCard tea={tea} variant="grid" />
              </div>
            ))}
          </div>
        ) : selectedRegion ? (
          <p className={styles.empty}>No teas found for this region.</p>
        ) : null}
      </div>
    </div>
  );
}
