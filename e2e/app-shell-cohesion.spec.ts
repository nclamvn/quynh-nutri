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

test("desktop routes share one centered page canvas at common and ultra-wide widths", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 960 }, { width: 2560, height: 1440 }]) {
    await page.setViewportSize(viewport);
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
        `${measurement.route} starts at ${measurement.x}, expected ${origin} at ${viewport.width}px`,
      ).toBeLessThanOrEqual(1);
    }
  }

  await page.goto("/settings");
  const frame = page.locator("[data-page-frame]");
  const content = page.locator("[data-page-content]");
  const [frameBox, contentBox] = await Promise.all([
    frame.boundingBox(),
    content.boundingBox(),
  ]);
  expect(contentBox!.width).toBeLessThanOrEqual(1440);
  expect(Math.abs(contentBox!.x + contentBox!.width / 2 - (frameBox!.x + frameBox!.width / 2))).toBeLessThanOrEqual(1);
});

test("feedback regressions keep one visual axis per workspace", async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1440 });

  await page.goto("/overview");
  await expect(page.locator("[data-housekeeper-intro]")).toHaveCSS("border-bottom-width", "0px");

  const brandMark = page.locator("[data-brand-mark]");
  await expect(brandMark).toHaveCSS("border-top-width", "0px");
  await expect(brandMark).toHaveCSS("border-bottom-width", "0px");
  const logoBox = await brandMark.locator("svg").boundingBox();
  expect(logoBox!.width).toBe(35);
  expect(logoBox!.height).toBe(35);

  await page.goto("/pantry");
  const pantryWorkspace = await page.locator("[data-pantry-workspace]").boundingBox();
  const pantryContent = await page.locator("[data-page-content]").boundingBox();
  expect(pantryWorkspace!.width).toBe(pantryContent!.width);

  await page.goto("/notes");
  const notesWorkspace = await page.locator("[data-notes-workspace]").boundingBox();
  const notesContent = await page.locator("[data-page-content]").boundingBox();
  const notesForm = await page.locator("[data-notes-form]").boundingBox();
  const notesEmpty = await page.locator("[data-notes-empty]").boundingBox();
  const workspaceCenter = notesWorkspace!.x + notesWorkspace!.width / 2;
  expect(notesWorkspace!.width).toBe(notesContent!.width);
  expect(Math.abs(notesForm!.x + notesForm!.width / 2 - workspaceCenter)).toBeLessThanOrEqual(1);
  expect(Math.abs(notesEmpty!.x + notesEmpty!.width / 2 - workspaceCenter)).toBeLessThanOrEqual(1);
});

test("wide workspaces and controls follow one geometry", async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1440 });

  await page.goto("/settings");
  const settingsGrid = await page.locator("[data-settings-grid]").boundingBox();
  const settingsContent = await page.locator("[data-page-content]").boundingBox();
  expect(settingsGrid!.width).toBe(settingsContent!.width);
  const settingsColumns = page.locator("[data-settings-grid] > div");
  const firstColumn = await settingsColumns.nth(0).boundingBox();
  const secondColumn = await settingsColumns.nth(1).boundingBox();
  expect(secondColumn!.x).toBeGreaterThan(firstColumn!.x + firstColumn!.width);

  await page.goto("/nutrition");
  const toolbar = page.getByTestId("nutrition-filter-toolbar");
  const toolbarButtons = toolbar.getByRole("button");
  const firstFilter = await toolbarButtons.first().boundingBox();
  const lastFilter = await toolbarButtons.last().boundingBox();
  expect(Math.abs(firstFilter!.y - lastFilter!.y)).toBeLessThanOrEqual(1);
  for (const button of await toolbarButtons.all()) {
    const box = await button.boundingBox();
    expect(box!.height).toBe(32);
  }

  await page.goto("/week");
  const headerControls = page.locator("[data-page-actions] > a, [data-page-actions] > button, [data-page-actions] > [data-control]");
  for (const control of await headerControls.all()) {
    const box = await control.boundingBox();
    expect(box!.height).toBe(40);
  }
  for (const chip of await page.locator("[aria-label*='kcal']").all()) {
    const [chipBox, parentBox, whiteSpace] = await Promise.all([
      chip.boundingBox(),
      chip.locator("..").boundingBox(),
      chip.evaluate((element) => getComputedStyle(element).whiteSpace),
    ]);
    expect(whiteSpace).toBe("nowrap");
    expect(chipBox!.width).toBeLessThanOrEqual(parentBox!.width);
  }
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
