import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();

// Evidence screenshots (390, both themes) for the new SHELL/real screens.
for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript((t) => { try { localStorage.setItem("theme", t); } catch {} }, theme);
  const page = await ctx.newPage();
  for (const route of ["notes", "reports", "pantry"]) {
    await page.goto(`${BASE}/${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `qa/${route}__390__${theme}.png` });
  }
  // Reports SHELL must NOT contain a money number (L-1)
  const money = await page.evaluate(() => /\d[\d.]*\s*(đ|₫|VND)/.test(document.body.innerText));
  console.log(`[${theme}] reports-has-money=${money ? "BAD" : "none(OK)"}`);
  await ctx.close();
}

// Carried check: fork → favorite → favorites grid takes the B1 version.
// MUST use client-side nav (sidebar Link) — hard page.goto resets React state.
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(`${BASE}/dishes`, { waitUntil: "networkidle" });
await page.locator('[role="button"]').first().click();          // open detail (Thịt kho trứng)
await page.waitForTimeout(300);
await page.getByRole("button", { name: /Lưu vào Nhà mình/ }).click(); // fork → B1
await page.waitForTimeout(200);
await page.locator('[role="dialog"] button[aria-label="Yêu thích"]').click(); // favorite in detail
await page.waitForTimeout(200);
await page.keyboard.press("Escape");
await page.waitForTimeout(200);
const forkedBadge = /Nhà mình/.test(await page.locator("main li").first().innerText());
await page.getByRole("link", { name: "Yêu thích" }).click();    // client-side nav — state preserved
await page.waitForURL("**/favorites");
await page.waitForTimeout(300);
const favCount = await page.locator("main li").count();
const favText = favCount ? await page.locator("main li").first().innerText() : "";
await page.screenshot({ path: "qa/favorites-b1__1440__light.png" });
console.log(`fork→favorite (client-nav): dishes badge="Nhà mình"=${forkedBadge} · favorites count=${favCount} · fav shows "${favText.split("\n")[0]}"`);
await ctx.close();

await browser.close();
