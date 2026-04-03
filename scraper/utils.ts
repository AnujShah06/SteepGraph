/**
 * Sleep for a given number of milliseconds.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function up to `maxRetries` times with exponential backoff.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        const waitMs = baseDelayMs * Math.pow(2, attempt);
        console.log(
          `  Retry ${attempt + 1}/${maxRetries} after ${waitMs}ms...`
        );
        await delay(waitMs);
      }
    }
  }
  throw lastError;
}

/**
 * Clean raw page text:
 * - Collapse whitespace
 * - Remove nav/footer boilerplate patterns
 * - Cap at maxChars
 */
export function cleanText(raw: string, maxChars: number = 4000): string {
  let text = raw
    // Collapse whitespace
    .replace(/\s+/g, " ")
    // Remove common nav/footer patterns
    .replace(/Skip to (main )?content/gi, "")
    .replace(/All rights reserved\.?/gi, "")
    .replace(/Cookie (policy|settings|preferences)/gi, "")
    .replace(/Privacy Policy/gi, "")
    .replace(/Terms (of|&) (Service|Use|Conditions)/gi, "")
    .trim();

  // Cap at maxChars
  if (text.length > maxChars) {
    text = text.slice(0, maxChars);
  }

  return text;
}

/**
 * Slugify a string for use in filenames and IDs.
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Resolve a possibly-relative URL against a base URL.
 */
export function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}
