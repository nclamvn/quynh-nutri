import { expect, test } from "@playwright/test";

const startCooking = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: /Bắt đầu nấu/ }).filter({ visible: true });

const clearPriorSession = async (
  page: import("@playwright/test").Page,
  dishName: string,
) => {
  const dialog = page.getByRole("dialog", { name: dishName, exact: true });
  await startCooking(page).click();
  await expect(dialog).toBeVisible();
  for (let attempt = 0; attempt < 3 && await dialog.isVisible(); attempt += 1) {
    await dialog
      .getByRole("button", { name: "Huỷ phiên và xoá tiến độ" })
      .evaluate((element: HTMLButtonElement) => element.click());
    await page.waitForTimeout(150);
  }
  await expect(dialog).toBeHidden();
};

test("reviewed dish → cooking progress restores → finish clears the session", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 860 });
  await page.goto("/dishes/com_trang");
  const cookingMode = () => page.getByRole("dialog", { name: "Cơm trắng", exact: true });

  await expect(page.locator("[data-recipe-detail]")).toBeVisible();
  // Reset the server-backed E2E household so this test is independent of prior runs.
  await clearPriorSession(page, "Cơm trắng");
  await startCooking(page).click();
  await expect(cookingMode()).toBeVisible();
  await expect(cookingMode().getByText("Đã xong 0/4 bước")).toBeVisible();
  await expect(
    cookingMode().getByRole("heading", { name: "Cơm trắng", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    cookingMode().getByRole("button", { name: "Huỷ phiên và xoá tiến độ" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    cookingMode().getByRole("button", { name: "Về chi tiết món" }),
  ).toBeFocused();

  await cookingMode().getByRole("button", { name: "Đến bước 2" }).click();
  await expect(cookingMode().getByText("Đã xong 0/4 bước")).toBeVisible();
  await expect(cookingMode().getByText("Bước 2/4")).toBeVisible();
  await cookingMode().getByRole("button", { name: "Đến bước 1" }).click();
  await cookingMode().getByRole("button", { name: "Đánh dấu bước đã xong" }).click();
  await expect(cookingMode().getByText("Đã xong 1/4 bước")).toBeVisible();
  await expect.poll(() =>
    page.evaluate(() =>
      Object.keys(sessionStorage).filter((key) => key.startsWith("qk-cooking:")),
    ),
  ).toEqual([]);

  await page.reload();
  await startCooking(page).click();
  await expect(cookingMode().getByText("Đã xong 1/4 bước")).toBeVisible();
  await expect(cookingMode().getByText("Bước 2/4")).toBeVisible();

  await page.screenshot({
    path: "e2e/__screens__/cooking-mode-390.png",
  });

  for (let step = 2; step <= 4; step += 1) {
    await cookingMode().getByRole("button", { name: "Đánh dấu bước đã xong" }).click();
    if (step < 4) await cookingMode().getByRole("button", { name: /Tiếp/ }).click();
  }
  const finish = cookingMode().getByRole("button", { name: "Kết thúc phiên nấu" });
  await expect(finish).toBeEnabled();
  await finish.click();
  await expect(page.locator("[data-recipe-detail]")).toBeVisible();

  await startCooking(page).click();
  await expect(cookingMode().getByText("Đã xong 0/4 bước")).toBeVisible();
  await cookingMode().getByRole("button", { name: "Huỷ phiên và xoá tiến độ" }).click();
});

test("a newly reviewed dish exposes its source-backed cooking mode", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 860 });
  await page.goto("/dishes/ba_chi_luoc");

  await expect(page.locator("[data-recipe-rhythm]")).toBeVisible();
  await expect(page.locator('a[href="https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures"]').first()).toBeVisible();
  const cookingMode = page.getByRole("dialog", { name: "Ba chỉ luộc mắm tôm", exact: true });
  await clearPriorSession(page, "Ba chỉ luộc mắm tôm");
  await startCooking(page).click();
  await expect(cookingMode.getByText("Đã xong 0/4 bước")).toBeVisible();
  await cookingMode.getByRole("button", { name: "Huỷ phiên và xoá tiến độ" }).click();
});

test("two devices surface a cooking conflict and keep the canonical progress", async ({ context }) => {
  const first = await context.newPage();
  const second = await context.newPage();
  await first.goto("/dishes/com_trang");
  await clearPriorSession(first, "Cơm trắng");
  const openRice = async (page: typeof first) => {
    await page.goto("/dishes/com_trang");
    await startCooking(page).click();
    const dialog = page.getByRole("dialog", { name: "Cơm trắng", exact: true });
    await expect(dialog.getByText("Đã xong 0/4 bước")).toBeVisible();
    await expect.poll(() =>
      page.evaluate(() =>
        Object.keys(sessionStorage).filter((key) => key.startsWith("qk-cooking:")),
      ),
    ).toEqual([]);
    return dialog;
  };

  const firstDialog = await openRice(first);
  const secondDialog = await openRice(second);
  await firstDialog.getByRole("button", { name: "Đánh dấu bước đã xong" }).click();
  await expect.poll(() =>
    first.evaluate(() =>
      Object.keys(sessionStorage).filter((key) => key.startsWith("qk-cooking:")),
    ),
  ).toEqual([]);

  await secondDialog.getByRole("button", { name: /Tiếp/ }).click();
  await secondDialog.getByRole("button", { name: "Đánh dấu bước đã xong" }).click();
  await expect(second.getByText("Phiên nấu đã được cập nhật trên thiết bị khác.")).toBeVisible();
  await expect(secondDialog.getByText("Đã xong 1/4 bước")).toBeVisible();
  await expect(secondDialog.getByText("Bước 2/4")).toBeVisible();

  await secondDialog.getByRole("button", { name: "Huỷ phiên và xoá tiến độ" }).click();
  await first.reload();
});
