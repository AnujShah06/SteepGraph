# SteepGraph

A graph-based tea discovery tool. ~140 real teas from 11 brands, scraped from brand product pages, normalized via Claude API, stored in Neo4j Aura, and visualized with D3 in a Next.js 14 app.

## Stack

- **Frontend:** Next.js 14 (App Router) · TypeScript · D3 v7 · react-simple-maps
- **Database:** Neo4j Aura (cloud graph DB)
- **Pipeline:** Playwright scraper → Claude API extraction → Neo4j import
- **Design:** Dark ink + gold · Cormorant Garamond + DM Mono

## Views

1. **Explore** — Filterable tea list with detail panel and mini graph
2. **Graph** — Full-screen D3 force-directed graph explorer
3. **Region** — World map with origin/travel pins filtering a tea grid

## Quick Start

### Prerequisites

- Node.js 18+
- Neo4j Aura account (free tier works) — [console.neo4j.io](https://console.neo4j.io)
- Anthropic API key (for data pipeline only)

### Install

```bash
npm install
npx playwright install chromium
```

### Configure

Create `.env.local` and fill in your credentials:

```
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_aura_password
ANTHROPIC_API_KEY=your_key
```

### Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> The app reads directly from Neo4j Aura — no local database needed.

## Data Pipeline

Run in order. The pipeline auto-loads `.env.local` — no extra setup needed.

### 1. Scrape a brand

```bash
npm run crawl -- twinings
```

Crawls the collection page, scrapes product pages (saving raw HTML to `data/raw/`), and extracts structured data via Claude API (saving to `data/extracted/`).

To scrape multiple brands at once:

```bash
npm run crawl -- harney rishi bigelow vahdam
```

To scrape all brands:

```bash
npm run crawl
```

### 2. Re-extract without re-scraping

```bash
npm run crawl -- --extract-only twinings
```

Uses already-saved HTML in `data/raw/` — no Playwright, no scraping.

### 3. Merge all extracted data

```bash
npm run merge
```

Combines all `data/extracted/` JSON into `data/merged.json`.

### 4. Compute similarity edges

```bash
npm run edges
```

Writes `data/edges.json` with SIMILAR_TO scores (threshold ≥ 0.3).

### 5. Import to Neo4j

```bash
npm run import
```

Loads all nodes and edges into Neo4j Aura using idempotent MERGE statements. Safe to re-run.

### Debug a brand's selectors

If a brand returns 0 products, use the debug script to inspect the page:

```bash
npx ts-node --project tsconfig.scraper.json scraper/debug-selectors.ts https://brand.com/teas
```

Saves `debug-page.html` and prints all product-like links found.

## Supported Brands

| Brand | Products |
|-------|----------|
| Twinings USA | 21 |
| Harney & Sons | 20 |
| TWG Tea | 20 |
| Bigelow | 18 |
| Yogi Tea | 15 |
| Vahdam | 15 |
| Pukka Herbs | 12 |
| Rishi Tea | 12 |
| Teekanne | 10 |
| MarketSpice | 5 |
| Hawaiian Islands Tea | 3 |

## Project Structure

```
tea-graph/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes (teas, tea/[id], graph, search)
│   ├── graph/              # Graph explorer view
│   ├── region/             # Region map view
│   ├── tea/[id]/           # Individual tea page
│   ├── globals.css         # Design tokens & global styles
│   ├── layout.tsx          # Root layout with nav & fonts
│   └── page.tsx            # Explore view (homepage)
├── components/             # React components
│   ├── GraphExplorer.tsx   # D3 force-directed graph
│   ├── RegionMap.tsx       # World map with react-simple-maps
│   ├── DetailPanel.tsx     # Tea detail sidebar with mini graph
│   ├── FilterBar.tsx       # Type/caffeine/mood/brand filters
│   └── ...
├── lib/                    # Shared utilities
│   ├── neo4j.ts            # Driver singleton (uses Neo4j Aura)
│   ├── queries.ts          # All Cypher queries as typed functions
│   ├── types.ts            # TypeScript interfaces
│   └── utils.ts            # Helpers
├── scraper/                # Data pipeline — scraping & extraction
│   ├── brands.config.ts    # 11 brand definitions with selectors
│   ├── crawl.ts            # Phase 1: collect product URLs
│   ├── scrape.ts           # Phase 2: scrape pages, save raw HTML
│   ├── extract.ts          # Phase 3: Claude API extraction
│   ├── debug-selectors.ts  # Dev tool: inspect page selectors
│   └── run.ts              # Pipeline orchestrator
├── pipeline/               # Data pipeline — processing & import
│   ├── merge.ts            # Combine extracted JSON
│   ├── edges.ts            # Compute SIMILAR_TO scores
│   └── neo4j-import.ts     # Load into Neo4j Aura
├── tsconfig.scraper.json   # CommonJS tsconfig for pipeline scripts
└── data/                   # Pipeline outputs (gitignored)
    ├── raw/                # Raw HTML snapshots
    ├── extracted/          # Claude JSON per product
    ├── merged.json         # Combined data
    └── edges.json          # Similarity edges
```

## Design Tokens

All colors use CSS variables — never hardcoded hex in components.

| Token     | Value     | Use                      |
|-----------|-----------|--------------------------|
| `--ink`   | `#0f0e0c` | Primary background       |
| `--ink2`  | `#1a1916` | Card/panel background    |
| `--ink3`  | `#252420` | Borders, subtle bg       |
| `--gold`  | `#c8a96e` | Primary accent           |
| `--gold2` | `#e8c88a` | Hover accent             |
| `--cream` | `#f0e8d8` | Primary text             |
| `--cream2`| `#d4c9b0` | Secondary text           |
| `--muted` | `#9a9690` | Tertiary text, labels    |

## Critical Rules

- **Server components for data** — Never fetch from Neo4j inside client components
- **MERGE not CREATE** — All Neo4j imports are idempotent
- **Save raw HTML first** — Pipeline writes to `data/raw/` before calling Claude
- **SIMILAR_TO is undirected** — Always use `-[r:SIMILAR_TO]-` (no arrow) in queries
- **Similarity threshold 0.3** — No edges below this score
- **Controlled vocabularies** — Flavor/experience/type/caffeine values are fixed
