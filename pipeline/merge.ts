import * as fs from "fs";
import * as path from "path";
import type { ExtractedTea, MergedTea } from "@/lib/types";

/**
 * Combine all extracted JSON files into a single merged.json.
 * Assigns unique IDs to each tea.
 */
function merge() {
  const extractedDir = path.join(process.cwd(), "data", "extracted");
  const outputPath = path.join(process.cwd(), "data", "merged.json");

  if (!fs.existsSync(extractedDir)) {
    console.error("❌ No extracted/ directory found. Run the scraper first.");
    process.exit(1);
  }

  const allTeas: MergedTea[] = [];
  const seenIds = new Set<string>();

  const brandDirs = fs
    .readdirSync(extractedDir)
    .filter((d) =>
      fs.statSync(path.join(extractedDir, d)).isDirectory()
    );

  for (const brandDir of brandDirs) {
    const dirPath = path.join(extractedDir, brandDir);
    const files = fs
      .readdirSync(dirPath)
      .filter((f) => f.endsWith(".json"));

    console.log(`📦 ${brandDir}: ${files.length} products`);

    for (const file of files) {
      try {
        const filePath = path.join(dirPath, file);
        const raw = fs.readFileSync(filePath, "utf-8");
        const tea: ExtractedTea = JSON.parse(raw);

        // Generate unique ID: brand_slug + name_slug
        const slug = (s: string) =>
          s
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

        // Skip non-tea pages (Claude returns null name for gift cards, privacy pages, etc.)
        if (!tea.name || !tea.brand) {
          console.warn(`  ⚠️  Skipping ${file}: missing name or brand`);
          continue;
        }

        let id = `${slug(tea.brand)}_${slug(tea.name)}`;

        // Handle duplicates
        if (seenIds.has(id)) {
          console.warn(`  ⚠️  Duplicate ID: ${id} — skipping`);
          continue;
        }
        seenIds.add(id);

        allTeas.push({ ...tea, id });
      } catch (err) {
        console.warn(`  ⚠️  Failed to parse ${file}:`, err);
      }
    }
  }

  // Write merged.json
  fs.writeFileSync(outputPath, JSON.stringify(allTeas, null, 2), "utf-8");

  console.log(`\n✅ Merged ${allTeas.length} teas → data/merged.json`);
  console.log(`   Brands: ${new Set(allTeas.map((t) => t.brand)).size}`);
  console.log(`   Types: ${Array.from(new Set(allTeas.map((t) => t.type))).join(", ")}`);
}

merge();
