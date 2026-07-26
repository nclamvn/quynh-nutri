import { chromium } from "playwright";

// True-viewport QA screenshots (viewport override is NOT window-min-width clamped,
// unlike the extension resize). Closes the mobile-390 evidence gap + writes files
// into qa/ (QA constraint #1). Requires the dev server on :3000.

const BASE = "http://localhost:3000";
const ROUTES = ["overview", "week", "shopping", "dishes", "nutrition", "reports", "favorites", "pantry", "notes", "settings"];
const VIEWPORTS = [
  { name: "390", width: 390, height: 844 },
  { name: "1024", width: 1024, height: 800 },
  { name: "1440", width: 1440, height: 900 },
];
const THEMES = ["light", "dark"];

const browser = await chromium.launch();
let count = 0;
for (const theme of THEMES) {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    // Set theme before any page script runs so the pre-paint script applies it.
    await context.addInitScript((t) => {
      try {
        localStorage.setItem("theme", t);
      } catch {}
    }, theme);
    const page = await context.newPage();
    for (const route of ROUTES) {
      await page.goto(`${BASE}/${route}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);
      const file = `qa/${route}__${vp.name}__${theme}.png`;
      await page.screenshot({ path: file });
      count++;
      console.log(file);
    }
    await context.close();
  }
}
await browser.close();
console.log(`\n${count} screenshots written to qa/`);
