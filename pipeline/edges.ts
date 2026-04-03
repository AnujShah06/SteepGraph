import * as fs from "fs";
import * as path from "path";
import type { MergedTea } from "@/lib/types";

interface SimilarEdge {
  source: string;
  target: string;
  score: number;
}

/**
 * Compute SIMILAR_TO edges between all tea pairs.
 *
 * Score formula from spec:
 *   score =
 *     (shared_ingredients / max_ingredients) * 0.5
 *   + (shared_flavors / max_flavors) * 0.3
 *   + (same_type ? 0.1 : 0)
 *   + (same_region ? 0.1 : 0)
 *
 * Only edges with score >= 0.3 are written.
 */
function computeEdges() {
  const mergedPath = path.join(process.cwd(), "data", "merged.json");
  const edgesPath = path.join(process.cwd(), "data", "edges.json");

  if (!fs.existsSync(mergedPath)) {
    console.error("❌ merged.json not found. Run merge first.");
    process.exit(1);
  }

  const teas: MergedTea[] = JSON.parse(
    fs.readFileSync(mergedPath, "utf-8")
  );

  console.log(`Computing similarity for ${teas.length} teas...`);

  const edges: SimilarEdge[] = [];
  let comparisons = 0;

  for (let i = 0; i < teas.length; i++) {
    for (let j = i + 1; j < teas.length; j++) {
      comparisons++;
      const a = teas[i];
      const b = teas[j];

      // Shared ingredients
      const aIng = new Set((a.ingredients_normalized ?? []).map((s) => s.toLowerCase()));
      const bIng = new Set((b.ingredients_normalized ?? []).map((s) => s.toLowerCase()));
      const sharedIng = Array.from(aIng).filter((x) => bIng.has(x)).length;
      const maxIng = Math.max(aIng.size, bIng.size, 1);

      // Shared flavors
      const aFlav = new Set(a.flavor_tags ?? []);
      const bFlav = new Set(b.flavor_tags ?? []);
      const sharedFlav = Array.from(aFlav).filter((x) => bFlav.has(x)).length;
      const maxFlav = Math.max(aFlav.size, bFlav.size, 1);

      // Type match
      const sameType = a.type === b.type ? 0.1 : 0;

      // Region match
      const sameRegion =
        a.origin_region &&
        b.origin_region &&
        a.origin_region.toLowerCase() === b.origin_region.toLowerCase()
          ? 0.1
          : 0;

      // Compute score
      const score =
        (sharedIng / maxIng) * 0.5 +
        (sharedFlav / maxFlav) * 0.3 +
        sameType +
        sameRegion;

      // Only store edges above threshold
      if (score >= 0.3) {
        edges.push({
          source: a.id,
          target: b.id,
          score: Math.round(score * 1000) / 1000,
        });
      }
    }
  }

  // Write edges
  fs.writeFileSync(edgesPath, JSON.stringify(edges, null, 2), "utf-8");

  // Stats
  const avgDegree = (edges.length * 2) / teas.length;
  const maxScore = Math.max(...edges.map((e) => e.score));
  const avgScore =
    edges.reduce((sum, e) => sum + e.score, 0) / edges.length;

  console.log(`\n✅ Computed ${edges.length} edges from ${comparisons} comparisons`);
  console.log(`   Avg degree: ${avgDegree.toFixed(1)} connections/tea`);
  console.log(`   Score range: 0.3 – ${maxScore.toFixed(3)}`);
  console.log(`   Avg score: ${avgScore.toFixed(3)}`);
  console.log(`   → data/edges.json`);
}

computeEdges();
