"use client";

import styles from "./TeaList.module.css";
import type { TeaSummary } from "@/lib/types";
import { getTypeColor } from "@/lib/utils";

interface TeaListProps {
  teas: TeaSummary[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
}

export default function TeaList({ teas, selectedId, onSelect }: TeaListProps) {
  if (teas.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>No teas match your filters</p>
        <p className={styles.emptyHint}>Try broadening your search</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {teas.map((tea, i) => (
        <button
          key={tea.id}
          className={`${styles.item} ${
            selectedId === tea.id ? styles.selected : ""
          } fade-up`}
          style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}
          onClick={() => onSelect(tea.id)}
        >
          <div
            className={styles.dot}
            style={{ background: getTypeColor(tea.type) }}
          />
          <div className={styles.info}>
            <span className={styles.name}>{tea.name}</span>
            <span className={styles.brand}>{tea.brand}</span>
          </div>
          <div className={styles.tags}>
            <span className={styles.type}>{tea.type}</span>
            {tea.origin_region && (
              <span className={styles.region}>{tea.origin_region}</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
