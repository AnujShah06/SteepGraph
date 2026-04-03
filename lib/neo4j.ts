import neo4j, { Driver, Session } from "neo4j-driver";

/* ── Neo4j Driver Singleton ──
 * Creates driver once, reuses across all requests.
 * Never create a new driver per request.
 */

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
    const user = process.env.NEO4J_USER || "neo4j";
    const password = process.env.NEO4J_PASSWORD || "";

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 10000,
    });
  }
  return driver;
}

/**
 * Run a Cypher query and return records.
 * Handles session lifecycle automatically.
 */
export async function runQuery<T = Record<string, unknown>>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const session: Session = getDriver().session();
  try {
    const result = await session.run(cypher, params);
    return result.records.map((record: any) => {
      const obj: Record<string, unknown> = {};
      record.keys.forEach((key: string) => {
        const val = record.get(key);
        // Convert Neo4j integers to JS numbers
        obj[key] = neo4j.isInt(val) ? val.toNumber() : val;
      });
      return obj as T;
    });
  } finally {
    await session.close();
  }
}

/**
 * Gracefully close the driver (for shutdown hooks).
 */
export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
