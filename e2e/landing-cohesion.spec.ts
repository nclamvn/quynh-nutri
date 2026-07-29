import { expect, test } from "@playwright/test";

test("landing preserves its editorial sequence and shares the app brand", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/");

  const sequence = [
    ".nav",
    ".hero",
    ".ticker",
    ".manifesto",
    ".stage",
    ".memory",
    ".truth",
    ".quote",
    ".final",
    "footer",
  ];
  const yPositions: number[] = [];
  for (const selector of sequence) {
    const box = await page.locator(selector).boundingBox();
    expect(box, `${selector} must render`).not.toBeNull();
    yPositions.push(box!.y);
  }
  for (let index = 1; index < yPositions.length; index += 1) {
    expect(yPositions[index]).toBeGreaterThanOrEqual(yPositions[index - 1]);
  }

  await expect(page.locator("[data-landing-brand-mark] svg")).toBeVisible();
  await expect(page.locator(".footer-mark svg")).toBeVisible();
  await expect(page.locator(".hero-marquee")).toHaveCount(0);
  await expect(page.locator(".hero-folio")).toContainText("Tuần mẫu");
});

test("landing uses one wide content axis and app semantic colors", async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.goto("/");

  const aligned = [
    ".nav .brand",
    ".manifesto .section-label",
    ".stage-inner",
    ".memory .section-label",
    ".truth-top",
    ".final-inner",
    "footer > div:first-child",
  ];
  const boxes = await Promise.all(aligned.map((selector) => page.locator(selector).boundingBox()));
  const origin = boxes[0]!.x;
  for (const [index, box] of boxes.entries()) {
    expect(Math.abs(box!.x - origin), `${aligned[index]} starts at the shared axis`).toBeLessThanOrEqual(1);
  }
  expect(boxes[2]!.width).toBeLessThanOrEqual(1440);

  await expect(page.locator(".truth")).toHaveCSS("background-color", "rgb(255, 250, 244)");
  await expect(page.locator(".trust article").nth(0).locator(".gauge")).toHaveCSS("color", "rgb(70, 155, 117)");
  await expect(page.locator(".trust article").nth(1).locator(".gauge")).toHaveCSS("color", "rgb(197, 138, 33)");
  await expect(page.locator(".trust article").nth(2).locator(".gauge")).toHaveCSS("color", "rgb(152, 145, 149)");
});

test("hero hierarchy and landing controls remain usable on a short desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");

  const [nav, heading, primary, hero] = await Promise.all([
    page.locator(".nav").boundingBox(),
    page.locator(".hero h1").boundingBox(),
    page.locator(".hero .btn").boundingBox(),
    page.locator(".hero").boundingBox(),
  ]);
  expect(heading!.y).toBeGreaterThanOrEqual(nav!.y + nav!.height);
  expect(primary!.y).toBeGreaterThanOrEqual(heading!.y + heading!.height);
  expect(primary!.y + primary!.height).toBeLessThanOrEqual(hero!.y + hero!.height);
  expect(primary!.height).toBeGreaterThanOrEqual(44);
  expect((await page.locator(".nav-cta").boundingBox())!.height).toBeGreaterThanOrEqual(40);
});

test("landing has no horizontal overflow at supported breakpoints", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 720 },
    { width: 1440, height: 960 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow at ${viewport.width}px`).toBe(0);
  }
});
