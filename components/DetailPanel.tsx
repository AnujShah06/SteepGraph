"use client";

import { useEffect, useState } from "react";
import styles from "./DetailPanel.module.css";
import MiniGraph from "./MiniGraph";
import type { TeaDetail } from "@/lib/types";
import { getTypeColor, capitalize } from "@/lib/utils";

interface DetailPanelProps {
  teaId: string | null;
  onClose: () => void;
  onSelectSimilar: (id: string) => void;
}

export default function DetailPanel({
  teaId,
  onClose,
  onSelectSimilar,
}: DetailPanelProps) {
  const [tea, setTea] = useState<TeaDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!teaId) {
      setTea(null);
      return;
    }

    setLoading(true);
    fetch(`/api/tea/${teaId}`)
      .then((r) => r.json())
      .then((data) => {
        setTea(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [teaId]);

  if (!teaId) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <button className={styles.close} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      {loading ? (
        <div className={styles.skeletons}>
          <div className={`skeleton ${styles.skelTitle}`} />
          <div className={`skeleton ${styles.skelLine}`} />
          <div className={`skeleton ${styles.skelLine}`} />
          <div className={`skeleton ${styles.skelBlock}`} />
        </div>
      ) : tea ? (
        <div className={styles.content}>
          {/* Type + Region badge */}
          <div className={styles.badge}>
            <span
              className={styles.typeDot}
              style={{ background: getTypeColor(tea.type) }}
            />
            <span className={styles.typeLabel}>{tea.type}</span>
            {tea.origin_region && (
              <>
                <span className={styles.sep}>·</span>
                <span>{tea.origin_region}</span>
              </>
            )}
          </div>

          {/* Name + Brand */}
          <h2 className={styles.name}>{tea.name}</h2>
          <span className={styles.brand}>{tea.brand}</span>

          {/* Description */}
          {tea.description_raw && (
            <p className={styles.description}>{tea.description_raw}</p>
          )}

          {/* Caffeine */}
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Caffeine</span>
            <span className={styles.fieldValue}>
              {capitalize(tea.caffeine_level)}
            </span>
          </div>

          {/* Ingredients */}
          {tea.ingredients_normalized.length > 0 && (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Ingredients</span>
              <div className={styles.tagRow}>
                {tea.ingredients_normalized.map((ing) => (
                  <span key={ing} className="tag">
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Flavors */}
          {tea.flavor_tags.length > 0 && (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Flavor</span>
              <div className={styles.tagRow}>
                {tea.flavor_tags.map((f) => (
                  <span key={f} className="tag">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {tea.experience_tags.length > 0 && (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Experience</span>
              <div className={styles.tagRow}>
                {tea.experience_tags.map((e) => (
                  <span key={e} className="tag">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mini Graph */}
          {tea.similar.length > 0 && (
            <div className={styles.graphSection}>
              <span className={styles.fieldLabel}>Similar teas</span>
              <MiniGraph tea={tea} onSelectNode={onSelectSimilar} />
              <div className={styles.similarList}>
                {tea.similar.map((s) => (
                  <button
                    key={s.id}
                    className={styles.similarItem}
                    onClick={() => onSelectSimilar(s.id)}
                  >
                    <span
                      className={styles.similarDot}
                      style={{ background: getTypeColor(s.type) }}
                    />
                    <span className={styles.similarName}>{s.name}</span>
                    <span className={styles.similarScore}>
                      {Math.round(s.score * 100)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Source link */}
          {tea.source_url && (
            <a
              href={tea.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.source}
            >
              View on {tea.brand} →
            </a>
          )}
        </div>
      ) : null}
    </div>
  );
}
