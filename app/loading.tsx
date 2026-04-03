import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={`skeleton ${styles.skelTitle}`} />
        <div className={`skeleton ${styles.skelSearch}`} />
      </div>
      <div className={styles.filterRow}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`skeleton ${styles.skelTag}`} />
        ))}
      </div>
      <div className={styles.list}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`skeleton ${styles.skelRow}`}
            style={{ animationDelay: `${i * 0.05}s` }}
          />
        ))}
      </div>
    </div>
  );
}
