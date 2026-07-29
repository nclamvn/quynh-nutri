import { test, expect } from "@playwright/test";

// P0 CORE — post-auth route smoke: every area renders (a heading) with no uncaught
// JS error and no Next error overlay. (The background store-hydration 500 in the
// hermetic bypass env is a caught fetch → toast, not a page crash, so it's fine.)

const ROUTES = [
  "/overview", "/week", "/shopping", "/suppliers", "/dishes",
  "/nutrition", "/health", "/reports", "/favorites", "/notes", "/pantry", "/settings",
];

for (const route of ROUTES) {
  test(`route renders without crashing: ${route}`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));
    await page.goto(route);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Unhandled Runtime Error")).toHaveCount(0);
    await expect(page.getByText("Application error")).toHaveCount(0);
    expect(pageErrors, `uncaught JS error on ${route}`).toEqual([]);
  });
}

test("overview CTA row does not overflow at 390 (intersection regression guard)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/overview");
  const cta = page.getByRole("button", { name: /AI gợi ý thực đơn/ });
  await expect(cta).toBeVisible({ timeout: 20_000 });
  // the primary CTA must be one line (regression from the real-device 4-line-wrap bug)
  const box = await cta.boundingBox();
  expect(box!.height).toBeLessThan(60); // a wrapped 4-line pill was ~110px tall
  await page.screenshot({ path: "e2e/__screens__/overview-cta-390.png", fullPage: false });
});
