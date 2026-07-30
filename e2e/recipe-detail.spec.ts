import { expect, test } from "@playwright/test";

const quantityFrom = (text: string | null) => {
  const match = text?.match(/([\d.,]+)\s*g\b/);
  if (!match) throw new Error(`No gram quantity in: ${text}`);
  return Number(match[1].replaceAll(".", "").replace(",", "."));
};

test("dish card opens a dedicated reviewed recipe route", async ({ page }) => {
  await page.goto("/dishes");
  const link = page.getByRole("link", { name: /Mở công thức Cơm trắng/ });
  await expect(link).toHaveAttribute("href", "/dishes/com_trang");
  await link.click();

  await expect(page).toHaveURL(/\/dishes\/com_trang$/);
  await expect(page.locator("[data-recipe-detail]")).toBeVisible();
  await expect(page.locator("[data-recipe-rhythm]")).toBeVisible();
  await expect(page.locator("[data-recipe-step]")).toHaveCount(4);
  await expect(page.getByRole("heading", { name: "Nhịp bếp" })).toBeVisible();
});

test("serving scaler changes only this view and selected count enters Cooking Mode", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dishes/ca_kho_to");

  const serving = page.locator("[data-recipe-serving]");
  const firstLine = serving.locator("li").first();
  const before = quantityFrom(await firstLine.textContent());
  await page.getByRole("button", { name: "Giảm một khẩu phần" }).click();
  const after = quantityFrom(await firstLine.textContent());
  expect(after).toBeLessThan(before);

  const selected = await serving.locator(".tnum").first().textContent();
  await page.locator('button:visible', { hasText: "Bắt đầu nấu" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("heading", { name: new RegExp(`Nguyên liệu cho ${selected} người`) })).toBeVisible();
  await page.getByRole("button", { name: "Về chi tiết món" }).click();

  await expect(page.locator("[data-recipe-detail]")).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
  await page.screenshot({
    path: "e2e/__screens__/recipe-detail-390.png",
    fullPage: true,
  });
});

test("recipe detail uses the centered app canvas on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/dishes/ga_kho_gung");

  const [frame, content, detail] = await Promise.all([
    page.locator("[data-page-frame]").boundingBox(),
    page.locator("[data-page-content]").boundingBox(),
    page.locator("[data-recipe-detail]").boundingBox(),
  ]);
  expect(detail!.width).toBe(content!.width);
  expect(
    Math.abs(detail!.x + detail!.width / 2 - (frame!.x + frame!.width / 2)),
  ).toBeLessThanOrEqual(1);
  await expect(page.getByText("Nguồn an toàn đã rà soát")).toBeVisible();
  await page.screenshot({
    path: "e2e/__screens__/recipe-detail-1440.png",
    fullPage: true,
  });
});

test("recipe detail remains overflow-free at intermediate and ultra-wide widths in dark reduced-motion mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  for (const width of [768, 2560]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto("/dishes/ga_kho_gung");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.locator("[data-recipe-detail]")).toBeVisible();
    const state = await page.evaluate(() => {
      const animated = document.querySelector("[data-recipe-detail] img");
      const style = animated ? getComputedStyle(animated) : undefined;
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        transitionDuration: style?.transitionDuration,
      };
    });
    expect(state.overflow).toBe(0);
    expect(Number.parseFloat(state.transitionDuration ?? "1")).toBeLessThanOrEqual(0.00001);
  }
});

test("unknown dish fails honestly without a generated recipe", async ({ page }) => {
  await page.goto("/dishes/not-a-real-dish");
  await expect(page.getByRole("heading", { name: "Không tìm thấy món này" })).toBeVisible();
  await expect(page.getByText(/không tự dựng một công thức thay thế/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Bắt đầu nấu/ })).toHaveCount(0);
});
