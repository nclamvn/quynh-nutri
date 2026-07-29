import { expect, test } from "@playwright/test";

const ALIGNED_ROUTES = [
  "/overview",
  "/health",
  "/week",
  "/shopping",
  "/pantry",
  "/suppliers",
  "/dishes",
  "/nutrition",
  "/reports",
  "/favorites",
  "/notes",
  "/settings",
];

test("desktop routes share one page origin while narrow content stays left-aligned", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  const titleXs: { route: string; x: number }[] = [];

  for (const route of ALIGNED_ROUTES) {
    await page.goto(route);
    const title = page.locator("main h1");
    await expect(title).toBeVisible({ timeout: 20_000 });
    const box = await title.boundingBox();
    titleXs.push({ route, x: box!.x });
  }

  const origin = titleXs[0].x;
  for (const measurement of titleXs) {
    expect(
      Math.abs(measurement.x - origin),
      `${measurement.route} starts at ${measurement.x}, expected ${origin}`,
    ).toBeLessThanOrEqual(1);
  }

  await page.goto("/settings");
  const frame = page.locator("[data-page-frame]");
  const content = page.locator("[data-page-content]");
  const [frameBox, contentBox] = await Promise.all([
    frame.boundingBox(),
    content.boundingBox(),
  ]);
  expect(contentBox!.x).toBe(frameBox!.x + 32);
  expect(contentBox!.width).toBeLessThan(800);
});

test("desktop brand returns to landing in expanded and collapsed folio", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/overview");

  const expandedBrand = page.getByTestId("sidebar-brand-home");
  await expect(expandedBrand).toHaveAttribute("href", "/");
  await expandedBrand.click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/overview");
  await page.getByRole("button", { name: "Thu gọn" }).click();
  const collapsedBrand = page.getByTestId("sidebar-brand-home");
  await expect(collapsedBrand).toBeVisible();
  await collapsedBrand.click();
  await expect(page).toHaveURL(/\/$/);
});

test("mobile shell keeps a 20px gutter and brand returns to landing", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/overview");

  const frameBox = await page.locator("[data-page-frame]").boundingBox();
  const contentBox = await page.locator("[data-page-content]").boundingBox();
  expect(contentBox!.x).toBe(frameBox!.x + 20);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);

  const mobileBrand = page.getByTestId("mobile-brand-home");
  await expect(mobileBrand).toHaveAttribute("href", "/");
  await page.screenshot({
    path: "e2e/__screens__/app-shell-390.png",
    fullPage: false,
  });
  await mobileBrand.click();
  await expect(page).toHaveURL(/\/$/);
});

test("active desktop navigation uses the folio bookmark treatment", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/overview");

  const active = page.getByRole("link", { name: "Tổng quan", exact: true });
  await expect(active).toHaveAttribute("aria-current", "page");
  await expect(active).toHaveClass(/folio-nav-active/);
  await expect(active).toHaveCSS("border-radius", "0px 11px 11px 0px");
  await page.screenshot({
    path: "e2e/__screens__/app-shell-1440.png",
    fullPage: false,
  });
});
