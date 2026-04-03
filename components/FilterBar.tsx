"use client";

import styles from "./FilterBar.module.css";
import type { FilterState, TeaType, CaffeineLevel, ExperienceTag } from "@/lib/types";

const TEA_TYPES: TeaType[] = [
  "black", "green", "white", "oolong", "pu-erh", "herbal", "rooibos", "blend",
];

const CAFFEINE_LEVELS: CaffeineLevel[] = ["none", "low", "medium", "high"];

const EXPERIENCE_TAGS: ExperienceTag[] = [
  "calming", "energizing", "digestive", "immune-support", "focus", "sleep", "detox",
];

interface FilterBarProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  brands?: string[];
  counts?: Record<string, number>;
}

export default function FilterBar({
  filters,
  onChange,
  brands = [],
}: FilterBarProps) {
  const toggle = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onChange({
      ...filters,
      [key]: filters[key] === value ? null : value,
    });
  };

  const hasActive = Object.values(filters).some((v) => v !== null);

  return (
    <div className={styles.bar}>
      <div className={styles.section}>
        <span className={styles.label}>Type</span>
        <div className={styles.tags}>
          {TEA_TYPES.map((t) => (
            <button
              key={t}
              className={`tag ${filters.type === t ? "tag--active" : ""}`}
              onClick={() => toggle("type", t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.label}>Caffeine</span>
        <div className={styles.tags}>
          {CAFFEINE_LEVELS.map((c) => (
            <button
              key={c}
              className={`tag ${filters.caffeine === c ? "tag--active" : ""}`}
              onClick={() => toggle("caffeine", c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.label}>Mood</span>
        <div className={styles.tags}>
          {EXPERIENCE_TAGS.map((e) => (
            <button
              key={e}
              className={`tag ${filters.experience === e ? "tag--active" : ""}`}
              onClick={() => toggle("experience", e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {brands.length > 0 && (
        <div className={styles.section}>
          <span className={styles.label}>Brand</span>
          <div className={styles.tags}>
            {brands.map((b) => (
              <button
                key={b}
                className={`tag ${filters.brand === b ? "tag--active" : ""}`}
                onClick={() => toggle("brand", b)}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasActive && (
        <button
          className={styles.clear}
          onClick={() =>
            onChange({
              type: null,
              caffeine: null,
              experience: null,
              brand: null,
              region: null,
            })
          }
        >
          Clear all
        </button>
      )}
    </div>
  );
}
