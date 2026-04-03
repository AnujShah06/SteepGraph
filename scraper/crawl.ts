import { chromium, type Browser, type Page } from "playwright";
import type { BrandConfig } from "@/lib/types";
import { delay, resolveUrl } from "./utils";

/**
 * Phase 1: Visit a brand's collection URL and extract product page URLs.
 */
export async function crawlBrand(brand: BrandConfig): Promise<string[]> {
  console.log(`\n🔍 Crawling ${brand.name} — ${brand.collectionUrl}`);

  const browser: Browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    },
  });
  const page: Page = await context.newPage();
  const productUrls: Set<string> = new Set();

  try {
    await page.goto(brand.collectionUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForTimeout(3000);

    // For JS-rendered sites, wait for content
    if (brand.type === "js-rendered") {
      await page.waitForTimeout(8000);
      // Scroll to trigger lazy loading
      await autoScroll(page);
    }

    let hasMore = true;
    let pageNum = 1;

    while (hasMore && productUrls.size < brand.maxProducts) {
      console.log(`  Page ${pageNum}...`);

      // Extract product links
      const pageTitle = await page.title();
      console.log(`  Page title: ${pageTitle}`);

      // Wait for product links to appear (AJAX-loaded grids)
      try {
        await page.waitForSelector(brand.productLinkSelector, { timeout: 10000 });
      } catch {
        console.log(`  Selector "${brand.productLinkSelector}" not found — falling back to a[href*="/products/"]`);
      }

      let links = await page.$$eval(
        `${brand.productLinkSelector}, a[href*="/products/"], a[href*="/en-US/product/"]`,
        (els) => [...new Set(els.map((el) => (el as HTMLAnchorElement).href))]
      );

      // Final fallback: extract URLs from page source via regex (for SPAs with JSON-embedded URLs)
      if (links.length === 0) {
        const hrefMatch = brand.productLinkSelector.match(/href\*=["']([^"']+)["']/);
        if (hrefMatch) {
          const pattern = hrefMatch[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          links = await page.evaluate((pat) => {
            const src = document.documentElement.innerHTML;
            const re = new RegExp(`https?://[^"'\\s]*${pat}[^"'\\s]*`, "g");
            return [...new Set(src.match(re) || [])];
          }, pattern);
          console.log(`  Source-extracted links: ${links.length}`);
        }
      }

      console.log(`  Raw links from selector: ${links.length}`);

      const junkPatterns = [
        /privacy/i, /terms/i, /gift-card/i, /giftcard/i,
        /account/i, /login/i, /register/i, /cart/i, /checkout/i,
        /blog/i, /about/i, /contact/i, /faq/i, /shipping/i,
        /product-types\/?$/, /\/product\/?$/, /sampler-gift/i,
      ];

      links.forEach((href) => {
        if (href && !href.includes("#") && !junkPatterns.some((p) => p.test(href))) {
          const resolved = resolveUrl(href, brand.collectionUrl);
          // Filter to product pages (heuristic — contains /products/ or /product/)
          const matchesBrandSelector =
            brand.productLinkSelector.includes("href") &&
            (() => {
              try {
                return new RegExp(
                  brand.productLinkSelector.match(/href\*="([^"]+)"/)?.[1] || "$^"
                ).test(resolved);
              } catch {
                return false;
              }
            })();
          if (
            matchesBrandSelector ||
            resolved.includes("/products/") ||
            resolved.includes("/product/") ||
            resolved.includes("/teas/") ||
            resolved.includes("/tea/") ||
            resolved.includes("/shop-tea/") ||
            resolved.includes("/en-US/product/") ||
            resolved.includes("/loose-tea/")
          ) {
            productUrls.add(resolved);
          }
        }
      });

      console.log(`  Found ${productUrls.size} product URLs so far`);

      // Check for pagination
      if (
        brand.type === "paginated" &&
        brand.nextPageSelector &&
        productUrls.size < brand.maxProducts
      ) {
        const nextButton = await page.$(brand.nextPageSelector);
        if (nextButton) {
          await nextButton.click();
          await page.waitForLoadState("domcontentloaded");
          await page.waitForTimeout(2000);
          await delay(brand.delayMs);
          pageNum++;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    // Trim to maxProducts
    const urls = Array.from(productUrls).slice(0, brand.maxProducts);
    console.log(`✅ ${brand.name}: ${urls.length} product URLs collected`);
    return urls;
  } catch (error) {
    console.error(`❌ Error crawling ${brand.name}:`, error);
    return Array.from(productUrls);
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Auto-scroll a page to trigger lazy loading.
 */
async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
  await page.waitForTimeout(1000);
}
