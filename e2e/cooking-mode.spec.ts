import { expect, test } from "@playwright/test";

test("reviewed dish → cooking progress restores → finish clears the session", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 860 });
  await page.goto("/dishes");
  const cookingMode = () => page.getByRole("dialog", { name: "Cơm trắng", exact: true });

  await page.getByRole("heading", { name: "Cơm trắng", exact: true }).click();
  await expect(page.getByText("Quy trình nấu đã rà soát")).toBeVisible();
  await page.getByRole("button", { name: "Bắt đầu nấu" }).click();
  await expect(cookingMode()).toBeVisible();
  await expect(cookingMode().getByText("Đã xong 0/4 bước")).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await expect(
    cookingMode().getByRole("button", { name: "Huỷ phiên và xoá tiến độ" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    cookingMode().getByRole("button", { name: "Về chi tiết món" }),
  ).toBeFocused();

  await cookingMode().getByRole("button", { name: /Tiếp/ }).click();
  await expect(cookingMode().getByText("Đã xong 0/4 bước")).toBeVisible();
  await cookingMode().getByRole("button", { name: /Trước/ }).click();
  await cookingMode().getByRole("button", { name: "Đánh dấu bước đã xong" }).click();
  await expect(cookingMode().getByText("Đã xong 1/4 bước")).toBeVisible();

  await page.reload();
  await page.getByRole("heading", { name: "Cơm trắng", exact: true }).click();
  await page.getByRole("button", { name: "Bắt đầu nấu" }).click();
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
  await expect(page.getByText("Quy trình nấu đã rà soát")).toBeVisible();

  await page.getByRole("button", { name: "Bắt đầu nấu" }).click();
  await expect(cookingMode().getByText("Đã xong 0/4 bước")).toBeVisible();
  await cookingMode().getByRole("button", { name: "Huỷ phiên và xoá tiến độ" }).click();
});

test("unsupported dish fails honestly and has no Start cooking action", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 860 });
  await page.goto("/dishes");

  await page.getByRole("heading", { name: "Ba chỉ luộc mắm tôm", exact: true }).click();
  await expect(page.getByText("Chưa có quy trình đã kiểm chứng")).toBeVisible();
  await expect(page.getByRole("button", { name: "Bắt đầu nấu" })).toHaveCount(0);
});
