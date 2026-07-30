import { expect, test } from "@playwright/test";

type WebVitalsSnapshot = {
  cls: number;
  domContentLoadedMs: number;
  javaScriptBytes: number;
  lcpMs: number;
  loadMs: number;
  responseEndMs: number;
  responseStartMs: number;
  resourceCount: number;
  transferBytes: number;
};

declare global {
  interface Window {
    __marketingVitals?: { cls: number; lcp: number };
  }
}

const BUDGET = {
  cls: 0.1,
  domContentLoadedMs: 2_000,
  javaScriptBytes: 550_000,
  lcpMs: 2_500,
  loadMs: 3_000,
  resourceCount: 55,
  transferBytes: 1_350_000,
};

test.beforeAll(async ({ browser, baseURL }) => {
  // A production deployment is warm before marketing traffic arrives. Warm the
  // local Next server in a separate, disposable context so the measured browser
  // still has a cold HTTP cache and honest transfer sizes.
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(baseURL ?? "http://127.0.0.1:3100", { waitUntil: "load" });
  await context.close();
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__marketingVitals = { cls: 0, lcp: 0 };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__marketingVitals!.lcp = Math.max(window.__marketingVitals!.lcp, entry.startTime);
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!shift.hadRecentInput) window.__marketingVitals!.cls += shift.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
});

test("public landing stays inside launch performance budgets", async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/", { waitUntil: "load" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));

  const snapshot = await page.evaluate<WebVitalsSnapshot>(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const scripts = resources.filter((resource) =>
      resource.initiatorType === "script" || new URL(resource.name).pathname.endsWith(".js")
    );
    return {
      cls: window.__marketingVitals?.cls ?? 0,
      domContentLoadedMs: navigation.domContentLoadedEventEnd,
      javaScriptBytes: scripts.reduce((total, resource) => total + resource.transferSize, 0),
      lcpMs: window.__marketingVitals?.lcp ?? 0,
      loadMs: navigation.loadEventEnd,
      responseEndMs: navigation.responseEnd,
      responseStartMs: navigation.responseStart,
      resourceCount: resources.length,
      transferBytes: resources.reduce((total, resource) => total + resource.transferSize, 0),
    };
  });
  console.log(`[marketing:${testInfo.project.name}] ${JSON.stringify(snapshot)}`);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(snapshot.lcpMs, JSON.stringify(snapshot)).toBeGreaterThan(0);
  expect(snapshot.lcpMs, JSON.stringify(snapshot)).toBeLessThanOrEqual(BUDGET.lcpMs);
  expect(snapshot.cls, JSON.stringify(snapshot)).toBeLessThanOrEqual(BUDGET.cls);
  expect(snapshot.domContentLoadedMs, JSON.stringify(snapshot)).toBeLessThanOrEqual(BUDGET.domContentLoadedMs);
  expect(snapshot.loadMs, JSON.stringify(snapshot)).toBeLessThanOrEqual(BUDGET.loadMs);
  expect(snapshot.resourceCount, JSON.stringify(snapshot)).toBeLessThanOrEqual(BUDGET.resourceCount);
  expect(snapshot.transferBytes, JSON.stringify(snapshot)).toBeLessThanOrEqual(BUDGET.transferBytes);
  expect(snapshot.javaScriptBytes, JSON.stringify(snapshot)).toBeLessThanOrEqual(BUDGET.javaScriptBytes);
});

test("public metadata and crawler routes expose only the landing", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://anngon.io");
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", "https://anngon.io");
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const robotsText = await robots.text();
  expect(robotsText).toContain("Allow: /");
  expect(robotsText).toContain("Disallow: /overview");
  expect(robotsText).toContain("Sitemap: https://anngon.io/sitemap.xml");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain("<loc>https://anngon.io</loc>");
  expect(sitemapText).not.toContain("/overview");
});
