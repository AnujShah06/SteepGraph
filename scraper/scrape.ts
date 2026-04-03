import { chromium, type Browser, type Page } from "playwright";
import * as fs from "fs";
import * as path from "path";
import type { BrandConfig } from "@/lib/types";
import { delay, cleanText, slugify, retry } from "./utils";

interface ScrapeResult {
  url: string;
  text: string;
  htmlPath: string;
}

/**
 * Phase 2: Visit each product page, save raw HTML, extract clean text.
 * Key principle: save raw HTML BEFORE any processing.
 */
export async function scrapeBrandProducts(
  brand: BrandConfig,
  productUrls: string[]
): Promise<ScrapeResult[]> {
  console.log(
    `\n📄 Scraping ${productUrls.length} products for ${brand.name}`
  );

  // Ensure raw directory exists
  const rawDir = path.join(process.cwd(), "data", "raw", brand.id);
  fs.mkdirSync(rawDir, { recursive: true });

  const browser: Browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const results: ScrapeResult[] = [];

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    });
    const page: Page = await context.newPage();

    for (let i = 0; i < productUrls.length; i++) {
      const url = productUrls[i];
      const productSlug = slugify(
        url.split("/").pop()?.replace(/\.html?$/, "") || `product-${i}`
      );

      console.log(
        `  [${i + 1}/${productUrls.length}] ${productSlug}`
      );

      try {
        await retry(async () => {
          await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });
          await page.waitForTimeout(2000);
        });

        // Save raw HTML FIRST — before any processing
        const rawHtml = await page.content();
        const htmlPath = path.join(rawDir, `${productSlug}.html`);
        fs.writeFileSync(htmlPath, rawHtml, "utf-8");

        // Strip nav/footer in browser before extracting text
        await page.evaluate(() => {
          const selectors = [
            "nav",
            "header",
            "footer",
            ".nav",
            ".header",
            ".footer",
            ".cookie-banner",
            ".announcement-bar",
            "#shopify-section-header",
            "#shopify-section-footer",
          ];
          selectors.forEach((sel) => {
            document.querySelectorAll(sel).forEach((el) => el.remove());
          });
        });

        // Extract clean text, capped at 4000 chars
        const rawText = await page.evaluate(() => document.body.innerText);
        const text = cleanText(rawText, 4000);

        results.push({ url, text, htmlPath });
      } catch (error) {
        console.error(`  ❌ Failed: ${url}`, error);
        // Continue on error — never abort the full run for one bad page
      }

      // Polite delay between requests
      if (i < productUrls.length - 1) {
        await delay(brand.delayMs);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(
    `✅ ${brand.name}: ${results.length}/${productUrls.length} pages scraped`
  );
  return results;
}

/**
 * Re-extract text from already-saved raw HTML files.
 * Enables re-running extraction without re-scraping.
 */
export function loadRawTexts(
  brandId: string
): { url: string; text: string; htmlPath: string }[] {
  const rawDir = path.join(process.cwd(), "data", "raw", brandId);
  if (!fs.existsSync(rawDir)) return [];

  const files = fs.readdirSync(rawDir).filter((f) => f.endsWith(".html"));
  return files.map((file) => {
    const htmlPath = path.join(rawDir, file);
    const html = fs.readFileSync(htmlPath, "utf-8");

    // Simple text extraction from HTML
    const text = cleanText(
      html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&[a-z]+;/gi, " "),
      4000
    );

    return { url: "", text, htmlPath };
  });
}
