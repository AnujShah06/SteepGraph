import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import type { ExtractedTea } from "@/lib/types";
import { delay } from "./utils";

const SYSTEM_PROMPT = `You are a tea data extraction specialist. Given raw HTML or text scraped from a tea product page, extract structured product data and return ONLY valid JSON — no markdown, no explanation, no preamble.

1. NEVER invent or guess information not present in the source text.
2. If a field cannot be determined, use null.
3. Normalize all values to the controlled vocabularies below.
4. ingredients_normalized must map every raw ingredient using the synonym map.
5. Assign 1-4 flavor_tags and 1-3 experience_tags only if clearly supported.
6. caffeine_level must be inferred from tea type + ingredients if not stated.

CONTROLLED VOCABULARIES:

type: black | green | white | oolong | pu-erh | herbal | rooibos | blend
caffeine_level: none (herbal/rooibos) | low (white, light green) | medium (most greens, light oolongs) | high (black, dark oolong, pu-erh)
flavor_tags (1-4): floral | citrus | earthy | smoky | malty | grassy | spicy | sweet | fruity | woody | vegetal | umami
experience_tags (1-3): calming | energizing | digestive | immune-support | focus | sleep | detox

INGREDIENT SYNONYM MAP:
"lemon balm" | "melissa" | "Melissa officinalis" | "balm leaf" → lemon balm
"chamomile" | "chamomilla" | "German chamomile" → chamomile
"peppermint" | "mint leaf" | "mentha piperita" → peppermint
"ginger" | "ginger root" | "Zingiber officinale" → ginger
"cinnamon" | "cassia" | "cinnamon bark" → cinnamon
"hibiscus" | "roselle" | "Hibiscus sabdariffa" → hibiscus
"rooibos" | "red bush" | "Aspalathus linearis" → rooibos
"Assam" | "Assam black tea" | "Indian black tea" → Assam black tea
"Darjeeling" | "Darjeeling black" → Darjeeling black tea
"Ceylon" | "Sri Lanka tea" | "Ceylon black" → Ceylon black tea
"Yunnan" | "Yunnan black" | "Dian hong" → Yunnan black tea
"sencha" | "Japanese green" | "Japanese sencha" → sencha
"pu-erh" | "puer" | "pu'er" → pu-erh
"tulsi" | "holy basil" | "Ocimum tenuiflorum" → tulsi
"ashwagandha" | "Indian ginseng" | "Withania somnifera" → ashwagandha

Return JSON matching this exact schema:
{
  "name": "string",
  "brand": "string",
  "type": "string (from vocab)",
  "origin_region": "string or null",
  "caffeine_level": "string (from vocab)",
  "ingredients_raw": "string",
  "ingredients_normalized": ["string"],
  "flavor_tags": ["string (from vocab)"],
  "experience_tags": ["string (from vocab)"],
  "description_raw": "string or null",
  "source_url": "string",
  "source_type": "brand_page"
}`;

/**
 * Extract tea data from scraped text using Claude API.
 */
export async function extractTea(
  brandName: string,
  sourceUrl: string,
  scrapedText: string
): Promise<ExtractedTea | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set in environment");
  }

  const client = new Anthropic({ apiKey });

  const userPrompt = `Extract tea product data from the following scraped page text. Return JSON only.

Source URL: ${sourceUrl}
Brand: ${brandName}

--- PAGE TEXT START ---
${scrapedText}
--- PAGE TEXT END ---`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON — strip any markdown fencing if present
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed: ExtractedTea = JSON.parse(cleaned);

    return parsed;
  } catch (error) {
    console.error(`  ❌ Claude extraction failed:`, error);
    return null;
  }
}

/**
 * Extract all products for a brand and save individual JSON files.
 */
export async function extractBrandProducts(
  brandId: string,
  brandName: string,
  products: { url: string; text: string }[]
): Promise<ExtractedTea[]> {
  const outDir = path.join(process.cwd(), "data", "extracted", brandId);
  fs.mkdirSync(outDir, { recursive: true });

  const results: ExtractedTea[] = [];

  for (let i = 0; i < products.length; i++) {
    const { url, text } = products[i];
    console.log(`  [${i + 1}/${products.length}] Extracting via Claude...`);

    const tea = await extractTea(brandName, url, text);

    if (tea) {
      // Save individual JSON
      const slug = url
        .split("/")
        .pop()
        ?.replace(/\.html?$/, "") || `product-${i}`;
      const jsonPath = path.join(outDir, `${slug}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(tea, null, 2), "utf-8");
      results.push(tea);
    }

    // Small delay between API calls
    if (i < products.length - 1) {
      await delay(500);
    }
  }

  console.log(
    `✅ ${brandName}: ${results.length}/${products.length} teas extracted`
  );
  return results;
}
