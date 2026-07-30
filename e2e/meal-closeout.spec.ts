import { expect, test } from "@playwright/test";

test("today meal handoff stays honest and overflow-free at 375 px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 860 });
  await page.goto("/overview");

  const card = page.getByTestId("today-meal-card");
  await expect(card).toBeVisible();
  await expect(card.getByText("Bữa nhà mình hôm nay")).toBeVisible();
  await card.getByRole("button", { name: "Kiểm tra" }).click();
  await expect(card.getByText(/không khẳng định đủ dùng/)).toBeVisible();
  await expect(card.getByText(/có ghi|chưa thấy/).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(375);

  await page.screenshot({ path: "e2e/__screens__/today-meal-375.png" });
});
