import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();

for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((t) => { try { localStorage.setItem("theme", t); } catch {} }, theme);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/overview`, { waitUntil: "networkidle" });
  await page.waitForTimeout(200);

  // 4-tab present (no regression): bottom nav has 4 tab links + a FAB
  const tabLinks = await page.locator("nav a").count();

  // Open the More menu
  await page.getByRole("button", { name: "Menu" }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `qa/mobile-menu__390__${theme}.png` });
  const menuLinks = await page.locator('[role="dialog"] a').count();

  // Collision: any menu link overlapping the TabBar FAB box?
  const collision = await page.evaluate(() => {
    const fab = [...document.querySelectorAll("button")].find((b) => b.querySelector('path[d*="M12 5v14"]'));
    const dialog = document.querySelector('[role="dialog"]');
    if (!fab || !dialog) return "no-fab-or-dialog";
    const f = fab.getBoundingClientRect();
    return [...dialog.querySelectorAll("a")].some((a) => {
      const r = a.getBoundingClientRect();
      return !(r.right < f.left || r.left > f.right || r.bottom < f.top || r.top > f.bottom);
    }) ? "geom-overlap(check-image)" : "clear";
  });

  // Nav works + state preserved: tap "Dinh dưỡng" → /nutrition, sheet closed
  await page.getByRole("link", { name: "Dinh dưỡng" }).click();
  await page.waitForURL("**/nutrition");
  await page.waitForTimeout(200);
  const dialogGone = (await page.locator('[role="dialog"]').count()) === 0;

  console.log(`[${theme}] bottom-tab-links=${tabLinks}(want 4) · menu-areas=${menuLinks}(want 9) · fab=${collision} · nav-works=${dialogGone}`);
  await ctx.close();
}
await browser.close();
