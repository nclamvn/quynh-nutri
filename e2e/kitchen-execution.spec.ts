import { test, expect } from "@playwright/test";

test.describe("Kitchen Execution — receive shopping item", () => {
  test("confirm → persists through reload → creates one pantry lot", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await page.goto("/shopping");

    const receiveButton = page.getByRole("button", { name: /Đánh dấu đã mua: Bí xanh/ });
    await expect(receiveButton).toBeVisible({ timeout: 20_000 });
    await receiveButton.click();

    await expect(page.getByRole("heading", { name: "Xác nhận hàng đã mua" })).toBeVisible();
    const qty = page.getByLabel("Lượng thực mua");
    await qty.fill("310");
    await page.locator("select").filter({ has: page.locator('option[value="fridge"]') }).selectOption("fridge");
    await expect(page.locator('input[type="date"]')).toHaveValue("");

    const confirm = page.getByRole("button", { name: "Xác nhận đã mua" });
    await confirm.dblclick();
    await expect(page.getByRole("button", { name: /Xem hàng đã mua: Bí xanh/ })).toBeVisible();
    await expect(page.getByText("Thực mua: 310 g")).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: /Xem hàng đã mua: Bí xanh/ })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Thực mua: 310 g")).toBeVisible();

    await page.goto("/pantry");
    const receivedLot = page.getByTestId("pantry-lots").getByRole("listitem").filter({ hasText: "Bí xanh" });
    await expect(receivedLot).toHaveCount(1);
    await expect(receivedLot).toBeVisible();
    await expect(receivedLot.getByText("Ngăn mát", { exact: true })).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "e2e/__screens__/received-lot-390.png", fullPage: true });
  });

  test("invalid zero quantity cannot be confirmed or ticked", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 860 });
    await page.goto("/shopping");

    const receiveButton = page.getByRole("button", { name: /Đánh dấu đã mua: Cà chua/ });
    await expect(receiveButton).toBeVisible({ timeout: 20_000 });
    await receiveButton.click();
    await page.getByLabel("Lượng thực mua").fill("0");
    await expect(page.getByRole("button", { name: "Xác nhận đã mua" })).toBeDisabled();
    await page.getByText("×", { exact: true }).click();
    await expect(page.getByRole("button", { name: /Đánh dấu đã mua: Cà chua/ })).toBeVisible();
  });
});
