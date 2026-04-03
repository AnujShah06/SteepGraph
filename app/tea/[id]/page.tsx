import { getTeaById } from "@/lib/queries";
import { notFound } from "next/navigation";
import { getTypeColor, capitalize } from "@/lib/utils";
import Link from "next/link";
import styles from "./tea.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const tea = await getTeaById(params.id);
  if (!tea) return { title: "Tea not found — SteepWisdom" };
  return {
    title: `${tea.name} by ${tea.brand} — SteepWisdom`,
    description: tea.description_raw || `${tea.type} tea from ${tea.brand}.`,
  };
}

export default async function TeaPage({
  params,
}: {
  params: { id: string };
}) {
  const tea = await getTeaById(params.id);
  if (!tea) notFound();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link href="/">Explore</Link>
          <span className={styles.sep}>/</span>
          <span>{tea.name}</span>
        </nav>

        {/* Header */}
        <div className={styles.header}>
          <div
            className={styles.typeDot}
            style={{ background: getTypeColor(tea.type) }}
          />
          <div>
            <span className={styles.typeLabel}>
              {tea.type}
              {tea.origin_region && ` · ${tea.origin_region}`}
            </span>
            <h1 className={styles.name}>{tea.name}</h1>
            <span className={styles.brand}>{tea.brand}</span>
          </div>
        </div>

        {/* Description */}
        {tea.description_raw && (
          <p className={styles.description}>{tea.description_raw}</p>
        )}

        {/* Details grid */}
        <div className={styles.grid}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Caffeine</span>
            <span className={styles.fieldValue}>
              {capitalize(tea.caffeine_level)}
            </span>
          </div>

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

          {tea.flavor_tags.length > 0 && (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Flavor Profile</span>
              <div className={styles.tagRow}>
                {tea.flavor_tags.map((f) => (
                  <span key={f} className="tag">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

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
        </div>

        {/* Similar teas */}
        {tea.similar.length > 0 && (
          <div className={styles.similarSection}>
            <h2 className={styles.sectionTitle}>Similar Teas</h2>
            <div className={styles.similarGrid}>
              {tea.similar.map((s) => (
                <Link
                  key={s.id}
                  href={`/tea/${s.id}`}
                  className={styles.similarCard}
                >
                  <div
                    className={styles.similarDot}
                    style={{ background: getTypeColor(s.type) }}
                  />
                  <div className={styles.similarInfo}>
                    <span className={styles.similarName}>{s.name}</span>
                    <span className={styles.similarBrand}>{s.brand}</span>
                  </div>
                  <span className={styles.similarScore}>
                    {Math.round(s.score * 100)}%
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Source */}
        <div className={styles.footer}>
          {tea.source_url && (
            <a
              href={tea.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.sourceLink}
            >
              View on {tea.brand} →
            </a>
          )}
          <Link href={`/graph?tea=${tea.id}`} className={styles.graphLink}>
            View in Graph →
          </Link>
        </div>
      </div>
    </div>
  );
}
