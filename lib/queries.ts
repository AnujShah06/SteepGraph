import { runQuery } from "./neo4j";
import type {
  TeaSummary,
  TeaDetail,
  SimilarTea,
  GraphPayload,
  GraphNode,
  GraphEdge,
  FilterState,
  TeaType,
  CaffeineLevel,
  ExperienceTag,
  FlavorTag,
} from "./types";

/* ── List & Filter Teas ── */

export async function getTeas(
  filters: Partial<FilterState> = {}
): Promise<TeaSummary[]> {
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.type) {
    conditions.push("t.type = $type");
    params.type = filters.type;
  }
  if (filters.caffeine) {
    conditions.push("t.caffeine_level = $caffeine");
    params.caffeine = filters.caffeine;
  }
  if (filters.brand) {
    conditions.push("t.brand = $brand");
    params.brand = filters.brand;
  }
  if (filters.region) {
    conditions.push(
      "EXISTS { MATCH (t)-[:ORIGIN_FROM]->(:Region {name: $region}) }"
    );
    params.region = filters.region;
  }
  if (filters.experience) {
    conditions.push(
      "EXISTS { MATCH (t)-[:EVOKES]->(:Experience {name: $experience}) }"
    );
    params.experience = filters.experience;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const cypher = `
    MATCH (t:Tea)
    ${whereClause}
    OPTIONAL MATCH (t)-[:HAS_FLAVOR]->(f:Flavor)
    RETURN t.id AS id, t.name AS name, t.brand AS brand,
           t.type AS type, t.caffeine_level AS caffeine_level,
           t.origin_region AS origin_region,
           collect(DISTINCT f.name) AS flavor_tags
    ORDER BY t.brand, t.name
  `;

  return runQuery<TeaSummary>(cypher, params);
}

/* ── Single Tea Detail ── */

export async function getTeaById(id: string): Promise<TeaDetail | null> {
  const cypher = `
    MATCH (t:Tea {id: $id})
    OPTIONAL MATCH (t)-[:HAS_FLAVOR]->(f:Flavor)
    OPTIONAL MATCH (t)-[:CONTAINS]->(i:Ingredient)
    OPTIONAL MATCH (t)-[:EVOKES]->(e:Experience)
    RETURN t.id AS id, t.name AS name, t.brand AS brand,
           t.type AS type, t.caffeine_level AS caffeine_level,
           t.origin_region AS origin_region,
           t.description_raw AS description_raw,
           t.ingredients_raw AS ingredients_raw,
           t.source_url AS source_url,
           collect(DISTINCT f.name) AS flavor_tags,
           collect(DISTINCT i.name) AS ingredients_normalized,
           collect(DISTINCT e.name) AS experience_tags
  `;

  const rows = await runQuery<TeaDetail>(cypher, { id });
  if (rows.length === 0) return null;

  const tea = rows[0];

  // Fetch similar teas — SIMILAR_TO is undirected (no arrow)
  const similarCypher = `
    MATCH (t:Tea {id: $id})-[r:SIMILAR_TO]-(s:Tea)
    RETURN s.id AS id, s.name AS name, s.brand AS brand,
           s.type AS type, r.score AS score
    ORDER BY r.score DESC
    LIMIT 6
  `;

  const similar = await runQuery<SimilarTea>(similarCypher, { id });

  return { ...tea, similar };
}

/* ── Full Graph for D3 ── */

export async function getGraph(
  filters: Partial<FilterState> = {}
): Promise<GraphPayload> {
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.type) {
    conditions.push("t.type = $type");
    params.type = filters.type;
  }
  if (filters.brand) {
    conditions.push("t.brand = $brand");
    params.brand = filters.brand;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Get nodes with degree count
  const nodesCypher = `
    MATCH (t:Tea)
    ${whereClause}
    OPTIONAL MATCH (t)-[r:SIMILAR_TO]-(other:Tea)
    ${whereClause ? `WHERE other.type = $type OR $type IS NULL` : ""}
    RETURN t.id AS id, t.name AS name, t.brand AS brand,
           t.type AS type, t.brand AS group,
           count(DISTINCT other) AS degree
  `;

  // Get edges — SIMILAR_TO is undirected (no arrow)
  const edgesCypher = `
    MATCH (a:Tea)-[r:SIMILAR_TO]-(b:Tea)
    ${whereClause ? `WHERE a.type = $type OR $type IS NULL` : ""}
    WHERE id(a) < id(b)
    RETURN a.id AS source, b.id AS target, r.score AS score
  `;

  const [nodes, edges] = await Promise.all([
    runQuery<GraphNode>(nodesCypher, params),
    runQuery<GraphEdge>(edgesCypher, params),
  ]);

  // Filter edges to only include nodes in the set
  const nodeIds = new Set(nodes.map((n) => n.id));
  const filteredEdges = edges.filter(
    (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
  );

  return { nodes, edges: filteredEdges };
}

/* ── Search ── */

export async function searchTeas(query: string): Promise<TeaSummary[]> {
  const cypher = `
    MATCH (t:Tea)
    WHERE toLower(t.name) CONTAINS toLower($q)
       OR toLower(t.brand) CONTAINS toLower($q)
       OR toLower(t.ingredients_raw) CONTAINS toLower($q)
       OR toLower(t.description_raw) CONTAINS toLower($q)
    OPTIONAL MATCH (t)-[:HAS_FLAVOR]->(f:Flavor)
    RETURN t.id AS id, t.name AS name, t.brand AS brand,
           t.type AS type, t.caffeine_level AS caffeine_level,
           t.origin_region AS origin_region,
           collect(DISTINCT f.name) AS flavor_tags
    ORDER BY
      CASE WHEN toLower(t.name) CONTAINS toLower($q) THEN 0 ELSE 1 END,
      t.name
    LIMIT 30
  `;

  return runQuery<TeaSummary>(cypher, { q: query });
}

/* ── Regions ── */

export async function getRegionsWithCounts(): Promise<
  { name: string; country: string; teaCount: number }[]
> {
  const cypher = `
    MATCH (r:Region)<-[:ORIGIN_FROM]-(t:Tea)
    RETURN r.name AS name, r.country AS country, count(t) AS teaCount
    ORDER BY teaCount DESC
  `;
  return runQuery(cypher);
}

/* ── Brands list ── */

export async function getBrands(): Promise<string[]> {
  const cypher = `
    MATCH (b:Brand)
    RETURN b.name AS name
    ORDER BY b.name
  `;
  const rows = await runQuery<{ name: string }>(cypher);
  return rows.map((r) => r.name);
}

/* ── Filter counts (for FilterBar badge numbers) ── */

export async function getFilterCounts(): Promise<{
  types: Record<string, number>;
  caffeine: Record<string, number>;
  brands: Record<string, number>;
}> {
  const typeCypher = `
    MATCH (t:Tea)
    RETURN t.type AS key, count(t) AS count
  `;
  const caffeineCypher = `
    MATCH (t:Tea)
    RETURN t.caffeine_level AS key, count(t) AS count
  `;
  const brandCypher = `
    MATCH (t:Tea)
    RETURN t.brand AS key, count(t) AS count
  `;

  const [typeRows, caffeineRows, brandRows] = await Promise.all([
    runQuery<{ key: string; count: number }>(typeCypher),
    runQuery<{ key: string; count: number }>(caffeineCypher),
    runQuery<{ key: string; count: number }>(brandCypher),
  ]);

  const toMap = (rows: { key: string; count: number }[]) =>
    Object.fromEntries(rows.map((r) => [r.key, r.count]));

  return {
    types: toMap(typeRows),
    caffeine: toMap(caffeineRows),
    brands: toMap(brandRows),
  };
}
