/* ── SteepGraph — Shared TypeScript Interfaces ── */

export type TeaType =
  | "black"
  | "green"
  | "white"
  | "oolong"
  | "pu-erh"
  | "herbal"
  | "rooibos"
  | "blend";

export type CaffeineLevel = "none" | "low" | "medium" | "high";

export type FlavorTag =
  | "floral"
  | "citrus"
  | "earthy"
  | "smoky"
  | "malty"
  | "grassy"
  | "spicy"
  | "sweet"
  | "fruity"
  | "woody"
  | "vegetal"
  | "umami";

export type ExperienceTag =
  | "calming"
  | "energizing"
  | "digestive"
  | "immune-support"
  | "focus"
  | "sleep"
  | "detox";

export interface TeaSummary {
  id: string;
  name: string;
  brand: string;
  type: TeaType;
  caffeine_level: CaffeineLevel;
  origin_region: string | null;
  flavor_tags: FlavorTag[];
}

export interface SimilarTea {
  id: string;
  name: string;
  brand: string;
  type: TeaType;
  score: number;
}

export interface TeaDetail extends TeaSummary {
  description_raw: string | null;
  ingredients_raw: string | null;
  ingredients_normalized: string[];
  experience_tags: ExperienceTag[];
  source_url: string;
  similar: SimilarTea[];
}

export interface GraphNode {
  id: string;
  name: string;
  brand: string;
  type: TeaType;
  group: string; // brand or type — used for coloring
  degree: number; // number of SIMILAR_TO edges
}

export interface GraphEdge {
  source: string;
  target: string;
  score: number;
}

export interface GraphPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface RegionPin {
  name: string;
  country: string;
  lat: number;
  lng: number;
  type: "origin" | "travel";
  teaCount: number;
}

export interface FilterState {
  type: TeaType | null;
  caffeine: CaffeineLevel | null;
  experience: ExperienceTag | null;
  brand: string | null;
  region: string | null;
}

/* ── Pipeline types ── */

export interface BrandConfig {
  id: string;
  name: string;
  collectionUrl: string;
  type: "paginated" | "shopify" | "js-rendered";
  productLinkSelector: string;
  nextPageSelector?: string;
  maxProducts: number;
  delayMs: number;
}

export interface ExtractedTea {
  name: string;
  brand: string;
  type: TeaType;
  origin_region: string | null;
  caffeine_level: CaffeineLevel;
  ingredients_raw: string;
  ingredients_normalized: string[];
  flavor_tags: FlavorTag[];
  experience_tags: ExperienceTag[];
  description_raw: string | null;
  source_url: string;
  source_type: "brand_page";
}

export interface MergedTea extends ExtractedTea {
  id: string; // brand_slug + name_slug
}
