import { expect, test } from "@playwright/test";

test("weekly feedback renders four honest stages without mobile overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/reports");

  await expect(page.getByRole("heading", { name: "Báo cáo" })).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("[data-feedback-stage]")).toHaveCount(4);
  await expect(page.locator('[data-feedback-stage="01"]')).toContainText("Dự kiến");
  await expect(page.locator('[data-feedback-stage="02"]')).toContainText("Đã mua");
  await expect(page.locator('[data-feedback-stage="03"]')).toContainText("Đã dùng");
  await expect(page.locator('[data-feedback-stage="04"]')).toContainText("Đã bỏ");
  await expect(page.getByText(/không cộng thành một con số “tiết kiệm”/i)).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);

  await page.screenshot({
    path: "e2e/__screens__/reports-feedback-390.png",
    fullPage: true,
  });
});
