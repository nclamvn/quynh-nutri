import { chromium } from "playwright";

// UI-3/5 gate checks at true-390 (component-intersection precedent):
//  1. detail sheet buttons don't collide with the TabBar FAB
//  2. detail sheet shows per-dish macros, NOT the meal-vs-day AdequacyStrip
//  3. favorites empty → empty state
const BASE = "http://localhost:3000";
const browser = await chromium.launch();

for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((t) => { try { localStorage.setItem("theme", t); } catch {} }, theme);
  const page = await ctx.newPage();

  // Check 3 — favorites empty state
  await page.goto(`${BASE}/favorites`, { waitUntil: "networkidle" });
  await page.waitForTimeout(200);
  const emptyText = await page.locator("text=Chưa có món yêu thích").count();
  await page.screenshot({ path: `qa/favorites-empty__390__${theme}.png` });

  // Checks 1 + 2 — open dish detail, inspect collision + adequacy absence
  await page.goto(`${BASE}/dishes`, { waitUntil: "networkidle" });
  await page.waitForTimeout(200);
  await page.locator('[role="button"]').first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `qa/dish-detail__390__${theme}.png` });

  // Check 2: sheet must NOT contain the AdequacyStrip label "nhu cầu ngày"
  const hasAdequacy = await page.locator('[role="dialog"] >> text=nhu cầu ngày').count();
  // Check 1: does any button in the sheet overlap the TabBar FAB box?
  const collision = await page.evaluate(() => {
    const fab = [...document.querySelectorAll("button")].find((b) => b.getAttribute("aria-label")?.includes("Thêm") || b.querySelector('path[d*="M12 5v14"]'));
    const dialog = document.querySelector('[role="dialog"]');
    if (!fab || !dialog) return "no-fab-or-dialog";
    const f = fab.getBoundingClientRect();
    const btns = [...dialog.querySelectorAll("button")];
    const overlap = btns.some((b) => {
      const r = b.getBoundingClientRect();
      return !(r.right < f.left || r.left > f.right || r.bottom < f.top || r.top > f.bottom);
    });
    return overlap ? "OVERLAP" : "clear";
  });

  console.log(`[${theme}] favorites-empty=${emptyText > 0 ? "OK" : "MISSING"} · detail-adequacy=${hasAdequacy === 0 ? "absent(OK)" : "PRESENT(BAD)"} · fab-collision=${collision}`);
  await ctx.close();
}
await browser.close();
