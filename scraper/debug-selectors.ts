/**
 * Dumps page HTML to stdout so we can find the right product link selectors.
 * Usage: npx ts-node --project tsconfig.scraper.json scraper/debug-selectors.ts <url>
 */
import { chromium } from "playwright";
import * as fs from "fs";

const url = process.argv[2];
if (!url) {
  console.error("Usage: npx ts-node --project tsconfig.scraper.json scraper/debug-selectors.ts <url>");
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--disable-blink-features=AutomationControlled"] });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(8000);

  const html = await page.content();
  const outFile = "debug-page.html";
  fs.writeFileSync(outFile, html);
  console.log(`Saved ${html.length} bytes to ${outFile}`);

  // Print all anchor hrefs containing /products/ or /collections/
  const links = await page.$$eval("a[href]", (els) =>
    els.map((el) => ({ href: (el as HTMLAnchorElement).href, classes: (el as HTMLElement).className }))
      .filter((l) => l.href.includes("/product") || l.href.includes("/tea"))
  );
  console.log(`\nProduct-like links found: ${links.length}`);
  links.slice(0, 20).forEach((l) => console.log(`  class="${l.classes}" href=${l.href}`));

  await browser.close();
})();
