import neo4j from "neo4j-driver";
import * as fs from "fs";
import * as path from "path";
import type { MergedTea } from "@/lib/types";

// Load .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8").split("\n").forEach((line) => {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
  });
}

interface SimilarEdge {
  source: string;
  target: string;
  score: number;
}

/**
 * Import merged.json + edges.json into Neo4j.
 *
 * All Cypher uses MERGE — safe to re-run without duplicating data.
 * Run order: constraints → teas/brands/regions → ingredients/flavors/experience → SIMILAR_TO edges
 */
async function importToNeo4j() {
  const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
  const user = process.env.NEO4J_USER || "neo4j";
  const password = process.env.NEO4J_PASSWORD || "";

  const mergedPath = path.join(process.cwd(), "data", "merged.json");
  const edgesPath = path.join(process.cwd(), "data", "edges.json");

  if (!fs.existsSync(mergedPath)) {
    console.error("❌ merged.json not found. Run merge first.");
    process.exit(1);
  }

  const teas: MergedTea[] = JSON.parse(
    fs.readFileSync(mergedPath, "utf-8")
  );

  const edges: SimilarEdge[] = fs.existsSync(edgesPath)
    ? JSON.parse(fs.readFileSync(edgesPath, "utf-8"))
    : [];

  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  const session = driver.session();

  try {
    console.log("═══════════════════════════════════════");
    console.log("  Neo4j Import");
    console.log(`  ${teas.length} teas, ${edges.length} edges`);
    console.log("═══════════════════════════════════════\n");

    // ── Step 1: Create constraints & indexes ──
    console.log("📐 Creating constraints and indexes...");
    const constraints = [
      "CREATE CONSTRAINT tea_id_unique IF NOT EXISTS FOR (t:Tea) REQUIRE t.id IS UNIQUE",
      "CREATE CONSTRAINT ingredient_name_unique IF NOT EXISTS FOR (i:Ingredient) REQUIRE i.name IS UNIQUE",
      "CREATE CONSTRAINT brand_name_unique IF NOT EXISTS FOR (b:Brand) REQUIRE b.name IS UNIQUE",
      "CREATE CONSTRAINT flavor_name_unique IF NOT EXISTS FOR (f:Flavor) REQUIRE f.name IS UNIQUE",
      "CREATE CONSTRAINT region_name_unique IF NOT EXISTS FOR (r:Region) REQUIRE r.name IS UNIQUE",
      "CREATE CONSTRAINT experience_name_unique IF NOT EXISTS FOR (e:Experience) REQUIRE e.name IS UNIQUE",
      "CREATE INDEX tea_type IF NOT EXISTS FOR (t:Tea) ON (t.type)",
      "CREATE INDEX tea_caffeine IF NOT EXISTS FOR (t:Tea) ON (t.caffeine_level)",
      "CREATE INDEX tea_brand IF NOT EXISTS FOR (t:Tea) ON (t.brand)",
    ];

    for (const cypher of constraints) {
      await session.run(cypher);
    }
    console.log("  ✅ Constraints ready\n");

    // ── Step 2: Import brands ──
    console.log("🏷️  Importing brands...");
    const brandCountryMap: Record<string, string> = {
      Twinings: "UK",
      Bigelow: "USA",
      TWG: "Singapore",
      "Harney & Sons": "USA",
      "Pukka Herbs": "UK",
      Vahdam: "India",
      "Yogi Tea": "USA",
      "Rishi Tea": "USA",
      Teekanne: "Germany",
      MarketSpice: "USA",
      "Hawaiian Islands Tea": "USA",
    };

    const uniqueBrands = Array.from(new Set(teas.map((t) => t.brand)));
    for (const brandName of uniqueBrands) {
      await session.run(
        `MERGE (b:Brand {name: $name})
         SET b.country = $country`,
        { name: brandName, country: brandCountryMap[brandName] || "Unknown" }
      );
    }
    console.log(`  ✅ ${uniqueBrands.length} brands\n`);

    // ── Step 3: Import teas ──
    console.log("🍵 Importing teas...");
    for (let i = 0; i < teas.length; i++) {
      const t = teas[i];
      if (i % 25 === 0 && i > 0) console.log(`  ${i}/${teas.length}...`);

      // MERGE Tea node
      await session.run(
        `MERGE (t:Tea {id: $id})
         SET t.name = $name,
             t.brand = $brand,
             t.type = $type,
             t.caffeine_level = $caffeine_level,
             t.origin_region = $origin_region,
             t.description_raw = $description_raw,
             t.ingredients_raw = $ingredients_raw,
             t.source_url = $source_url,
             t.source_type = $source_type`,
        {
          id: t.id,
          name: t.name,
          brand: t.brand,
          type: t.type,
          caffeine_level: t.caffeine_level,
          origin_region: t.origin_region || null,
          description_raw: t.description_raw || null,
          ingredients_raw: t.ingredients_raw || null,
          source_url: t.source_url,
          source_type: t.source_type || "brand_page",
        }
      );

      // MADE_BY → Brand
      await session.run(
        `MATCH (t:Tea {id: $id})
         MERGE (b:Brand {name: $brand})
         MERGE (t)-[:MADE_BY]->(b)`,
        { id: t.id, brand: t.brand }
      );

      // CONTAINS → Ingredient
      for (const ing of (t.ingredients_normalized ?? [])) {
        await session.run(
          `MATCH (t:Tea {id: $id})
           MERGE (i:Ingredient {name: $ing})
           SET i.display_name = $ing
           MERGE (t)-[:CONTAINS]->(i)`,
          { id: t.id, ing }
        );
      }

      // HAS_FLAVOR → Flavor
      for (const flav of (t.flavor_tags ?? [])) {
        await session.run(
          `MATCH (t:Tea {id: $id})
           MERGE (f:Flavor {name: $flav})
           MERGE (t)-[:HAS_FLAVOR]->(f)`,
          { id: t.id, flav }
        );
      }

      // EVOKES → Experience
      for (const exp of (t.experience_tags ?? [])) {
        await session.run(
          `MATCH (t:Tea {id: $id})
           MERGE (e:Experience {name: $exp})
           MERGE (t)-[:EVOKES]->(e)`,
          { id: t.id, exp }
        );
      }

      // ORIGIN_FROM → Region
      if (t.origin_region) {
        await session.run(
          `MATCH (t:Tea {id: $id})
           MERGE (r:Region {name: $region})
           MERGE (t)-[:ORIGIN_FROM]->(r)`,
          { id: t.id, region: t.origin_region }
        );
      }
    }
    console.log(`  ✅ ${teas.length} teas imported\n`);

    // ── Step 4: Import SIMILAR_TO edges ──
    if (edges.length > 0) {
      console.log("🔗 Importing SIMILAR_TO edges...");
      for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        if (i % 100 === 0 && i > 0)
          console.log(`  ${i}/${edges.length}...`);

        // SIMILAR_TO is undirected — single edge serves both directions
        await session.run(
          `MATCH (a:Tea {id: $source}), (b:Tea {id: $target})
           MERGE (a)-[r:SIMILAR_TO]-(b)
           SET r.score = $score`,
          { source: e.source, target: e.target, score: e.score }
        );
      }
      console.log(`  ✅ ${edges.length} similarity edges\n`);
    }

    // ── Step 5: Verification ──
    console.log("🔍 Verification queries:");

    const teaCount = await session.run("MATCH (t:Tea) RETURN count(t) AS c");
    console.log(`  Teas: ${teaCount.records[0].get("c")}`);

    const ingCount = await session.run(
      "MATCH (i:Ingredient) RETURN count(i) AS c"
    );
    console.log(`  Ingredients: ${ingCount.records[0].get("c")}`);

    const edgeCount = await session.run(
      "MATCH ()-[r:SIMILAR_TO]-() RETURN count(r)/2 AS c"
    );
    console.log(`  SIMILAR_TO edges: ${edgeCount.records[0].get("c")}`);

    const topIngredients = await session.run(
      `MATCH (i:Ingredient)<-[:CONTAINS]-(t:Tea)
       RETURN i.name, count(t) AS tea_count
       ORDER BY tea_count DESC LIMIT 5`
    );
    console.log("  Top ingredients:");
    topIngredients.records.forEach((r) =>
      console.log(`    ${r.get("i.name")}: ${r.get("tea_count")} teas`)
    );

    console.log("\n═══════════════════════════════════════");
    console.log("  Import complete! ✅");
    console.log("═══════════════════════════════════════");
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  } finally {
    await session.close();
    await driver.close();
  }
}

importToNeo4j().catch(console.error);
