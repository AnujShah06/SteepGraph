import * as fs from "fs";
import * as path from "path";

// Load .env.local (Next.js convention — not loaded automatically in ts-node)
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8")
    .split("\n")
    .forEach((line) => {
      const [key, ...rest] = line.split("=");
      if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
    });
}

import { brands, getBrandById } from "./brands.config";
import { crawlBrand } from "./crawl";
import { scrapeBrandProducts } from "./scrape";
import { extractBrandProducts } from "./extract";

/**
 * Orchestrator: run the full pipeline for one or all brands.
 *
 * Usage:
 *   npx ts-node scraper/run.ts              # run all brands
 *   npx ts-node scraper/run.ts twinings     # run one brand
 *   npx ts-node scraper/run.ts --extract-only twinings  # re-extract from saved HTML
 */
async function main() {
  const args = process.argv.slice(2);
  const extractOnly = args.includes("--extract-only");
  const brandIds = args.filter((a) => !a.startsWith("--"));

  const targetBrands = brandIds.length > 0
    ? brandIds.map(getBrandById).filter(Boolean)
    : brands;

  if (targetBrands.length === 0) {
    console.error(`❌ Brand(s) not found: ${brandIds.join(", ")}`);
    console.log(
      "Available brands:",
      brands.map((b) => b.id).join(", ")
    );
    process.exit(1);
  }

  console.log("═══════════════════════════════════════");
  console.log("  SteepGraph Data Pipeline");
  console.log(`  Mode: ${extractOnly ? "Extract-only" : "Full crawl"}`);
  console.log(
    `  Brands: ${targetBrands.map((b) => b!.name).join(", ")}`
  );
  console.log("═══════════════════════════════════════");

  for (const brand of targetBrands) {
    if (!brand) continue;

    try {
      if (extractOnly) {
        // Re-extract from saved HTML without re-scraping
        const { loadRawTexts } = await import("./scrape");
        const rawTexts = loadRawTexts(brand.id);

        if (rawTexts.length === 0) {
          console.log(`⚠️  No raw HTML found for ${brand.name} — skipping`);
          continue;
        }

        console.log(
          `\n📄 Re-extracting ${rawTexts.length} products for ${brand.name}`
        );
        await extractBrandProducts(brand.id, brand.name, rawTexts);
      } else {
        // Full pipeline: crawl -> scrape -> extract
        // Phase 1: Collect product URLs
        const productUrls = await crawlBrand(brand);
        if (productUrls.length === 0) {
          console.log(`⚠️  No products found for ${brand.name} — skipping`);
          continue;
        }

        // Phase 2: Scrape product pages (saves raw HTML first)
        const scraped = await scrapeBrandProducts(brand, productUrls);

        // Phase 3: Extract via Claude
        const products = scraped.map((s) => ({
          url: s.url,
          text: s.text,
        }));
        await extractBrandProducts(brand.id, brand.name, products);
      }
    } catch (error) {
      console.error(`\n❌ Pipeline failed for ${brand.name}:`, error);
      // Continue with next brand — never abort full run for one brand
    }
  }

  console.log("\n═══════════════════════════════════════");
  console.log("  Pipeline complete");
  console.log("═══════════════════════════════════════");
  console.log("Next steps:");
  console.log("  1. Review data/extracted/ for quality");
  console.log("  2. Run: npm run merge");
  console.log("  3. Run: npm run edges");
  console.log("  4. Run: npm run import");
}

main().catch(console.error);
