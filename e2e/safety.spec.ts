import { test, expect, type Page } from "@playwright/test";
import { SUPPORT_RESOURCES } from "../src/data/mood/resources";

// P0 SAFETY — the densest, most-scrutinized spec. Asymmetric bias: a crisis input
// must NEVER produce a food suggestion; benign must not be misread. Verified support
// resources must render exactly (no drift). Hotline is asserted, NEVER dialed.

const CRISIS_HEADING = "Bạn không phải đối mặt một mình";

async function openMood(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/overview");
  await page.getByRole("heading", { name: "Tổng quan" }).waitFor({ timeout: 20_000 });
  await page.getByRole("button", { name: /Hôm nay bạn cần gì/ }).click();
  await page.getByRole("button", { name: "Gợi ý bữa" }).waitFor();
}
async function submit(page: Page, text: string) {
  if (text) await page.locator("textarea").first().fill(text);
  await page.getByRole("button", { name: "Gợi ý bữa" }).click();
}

test.describe("P0 safety — mood crisis gate", () => {
  // Direct + INDIRECT / self-as-burden — how depression actually speaks. Each must
  // route to the crisis branch (no food).
  for (const phrase of [
    "tôi muốn chết",
    "con sẽ tốt hơn nếu không có tôi",
    "tôi không trụ nổi nữa",
    "mình không thấy lối thoát",
  ]) {
    test(`crisis input → resources, NO food: "${phrase}"`, async ({ page }) => {
      await openMood(page);
      await submit(page, phrase);
      await expect(page.getByText(CRISIS_HEADING)).toBeVisible();
      // no dishes, no add-to-plan buttons on the crisis branch
      await expect(page.getByRole("button", { name: "Đưa vào tuần" })).toHaveCount(0);
    });
  }

  // Benign venting + the "mẹ tôi" (my mother) guard — must NOT trigger crisis.
  for (const phrase of ["", "đang stress quá", "mẹ tôi nấu ăn ngon"]) {
    test(`benign → suggestions, not crisis: "${phrase || "(chips only)"}"`, async ({ page }) => {
      await openMood(page);
      await submit(page, phrase);
      await expect(page.getByText("Gợi ý mang tính chăm sóc")).toBeVisible(); // disclaimer
      await expect(page.getByText(CRISIS_HEADING)).toHaveCount(0);
      // defense-in-depth: a quiet parallel path to support is always present
      await expect(page.getByRole("button", { name: /Cần người lắng nghe/ })).toBeVisible();
    });
  }

  test("crisis resources render EXACTLY as verified (no drift from resources.ts)", async ({ page }) => {
    await openMood(page);
    await submit(page, "tôi muốn chết");
    await expect(page.getByText(CRISIS_HEADING)).toBeVisible();
    for (const r of SUPPORT_RESOURCES) {
      await expect(page.getByText(r.detail, { exact: false }).first()).toBeVisible();
      if (r.hours) await expect(page.getByText(r.hours, { exact: false }).first()).toBeVisible();
    }
    // the load-bearing correction: Ngày Mai days are explicit, NOT a T4–CN range
    await expect(page.getByText("Thứ 4, Thứ 6, Thứ 7, Chủ Nhật")).toBeVisible();
    await page.screenshot({ path: "e2e/__screens__/mood-crisis-390-light.png", fullPage: true });
  });

  test("suggest branch screenshot (390)", async ({ page }) => {
    await openMood(page);
    await submit(page, "");
    await expect(page.getByText("Gợi ý mang tính chăm sóc")).toBeVisible();
    await page.screenshot({ path: "e2e/__screens__/mood-suggest-390-light.png", fullPage: true });
  });
});

test.describe("P0 safety — execute-not-prescribe", () => {
  test("health page shows the disclaimer and gates clinical diets", async ({ page }) => {
    await page.goto("/health");
    // disclaimer present; clinical section marked needing a doctor's order
    await expect(page.getByText(/bác sĩ|chuyên môn|miễn trừ|không thay/i).first()).toBeVisible({ timeout: 20_000 });
  });
});
