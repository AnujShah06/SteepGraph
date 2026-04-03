import Link from "next/link";
import styles from "./TeaCard.module.css";
import type { TeaSummary } from "@/lib/types";
import { getTypeColor } from "@/lib/utils";

interface TeaCardProps {
  tea: TeaSummary;
  variant?: "grid" | "list";
}

export default function TeaCard({ tea, variant = "list" }: TeaCardProps) {
  return (
    <Link
      href={`/tea/${tea.id}`}
      className={`${styles.card} ${styles[variant]}`}
    >
      <div
        className={styles.typeDot}
        style={{ background: getTypeColor(tea.type) }}
      />
      <div className={styles.content}>
        <h3 className={styles.name}>{tea.name}</h3>
        <span className={styles.brand}>{tea.brand}</span>
        <div className={styles.meta}>
          <span className={styles.type}>{tea.type}</span>
          {tea.origin_region && (
            <>
              <span className={styles.sep}>·</span>
              <span className={styles.region}>{tea.origin_region}</span>
            </>
          )}
          {tea.caffeine_level && (
            <>
              <span className={styles.sep}>·</span>
              <span className={styles.caffeine}>{tea.caffeine_level} caffeine</span>
            </>
          )}
        </div>
        {tea.flavor_tags.length > 0 && (
          <div className={styles.flavors}>
            {tea.flavor_tags.map((f) => (
              <span key={f} className="tag">
                {f}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
