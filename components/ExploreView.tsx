"use client";

import { useState, useCallback } from "react";
import styles from "./ExploreView.module.css";
import FilterBar from "./FilterBar";
import SearchInput from "./SearchInput";
import TeaList from "./TeaList";
import DetailPanel from "./DetailPanel";
import type { TeaSummary, FilterState } from "@/lib/types";

interface ExploreViewProps {
  initialTeas: TeaSummary[];
  brands: string[];
}

export default function ExploreView({ initialTeas, brands }: ExploreViewProps) {
  const [teas, setTeas] = useState<TeaSummary[]>(initialTeas);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    type: null,
    caffeine: null,
    experience: null,
    brand: null,
    region: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTeas = useCallback(
    async (f: FilterState, q: string) => {
      setLoading(true);

      try {
        if (q.trim()) {
          const res = await fetch(
            `/api/search?q=${encodeURIComponent(q.trim())}`
          );
          const data = await res.json();
          setTeas(data);
        } else {
          const params = new URLSearchParams();
          if (f.type) params.set("type", f.type);
          if (f.caffeine) params.set("caffeine", f.caffeine);
          if (f.experience) params.set("experience", f.experience);
          if (f.brand) params.set("brand", f.brand);
          if (f.region) params.set("region", f.region);

          const res = await fetch(`/api/teas?${params.toString()}`);
          const data = await res.json();
          setTeas(data);
        }
      } catch (err) {
        console.error("Failed to fetch teas:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleFilterChange = useCallback(
    (f: FilterState) => {
      setFilters(f);
      fetchTeas(f, searchQuery);
    },
    [searchQuery, fetchTeas]
  );

  const handleSearch = useCallback(
    (q: string) => {
      setSearchQuery(q);
      fetchTeas(filters, q);
    },
    [filters, fetchTeas]
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleClose = useCallback(() => {
    setSelectedId(null);
  }, []);

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <div className={styles.toolbar}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Explore</h1>
            <span className={styles.count}>
              {teas.length} tea{teas.length !== 1 ? "s" : ""}
            </span>
          </div>
          <SearchInput onSearch={handleSearch} />
        </div>

        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          brands={brands}
        />

        <div className={styles.listWrap}>
          {loading ? (
            <div className={styles.loadingList}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`skeleton ${styles.skelRow}`} />
              ))}
            </div>
          ) : (
            <TeaList
              teas={teas}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          )}
        </div>
      </div>

      {selectedId && (
        <DetailPanel
          teaId={selectedId}
          onClose={handleClose}
          onSelectSimilar={handleSelect}
        />
      )}
    </div>
  );
}
