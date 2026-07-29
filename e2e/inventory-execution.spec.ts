import { expect, test } from "@playwright/test";

test("mobile FEFO lot → partial consume → canonical balance persists", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 860 });
  await page.goto("/shopping");

  const receiveButtons = page.getByRole("button", { name: /Đánh dấu đã mua:/ });
  await expect(receiveButtons.first()).toBeVisible({ timeout: 20_000 });
  let receiveButton = receiveButtons.first();
  let itemName = "";
  for (let index = 0; index < await receiveButtons.count(); index += 1) {
    const candidate = receiveButtons.nth(index);
    const label = await candidate.getAttribute("aria-label");
    const name = label?.replace(/^Đánh dấu đã mua:\s*/, "") ?? "";
    if (name && name !== "Bí xanh" && name !== "Cà chua") {
      receiveButton = candidate;
      itemName = name;
      break;
    }
  }
  expect(itemName).not.toBe("");

  await receiveButton.click();
  await page.getByLabel("Lượng thực mua").fill("240");
  await page
    .locator("select")
    .filter({ has: page.locator('option[value="fridge"]') })
    .selectOption("fridge");
  await page.getByRole("button", { name: "Xác nhận đã mua" }).click();

  await page.goto("/pantry");
  const lotCard = page
    .getByTestId("pantry-lots")
    .getByRole("listitem")
    .filter({ hasText: itemName });
  await expect(lotCard).toHaveCount(1);
  await expect(lotCard).toContainText("240 g");
  await lotCard.getByRole("button", { name: `Ghi nhận sử dụng: ${itemName}` }).click();

  await expect(page.getByRole("heading", { name: "Cập nhật lô thực phẩm" })).toBeVisible();
  await page.getByLabel("Lượng ghi nhận").fill("40");
  await expect(page.getByText("200 g", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Lưu hoạt động" }).click();

  await expect(lotCard).toContainText("200 g");
  const activity = page.getByTestId("inventory-activity").getByRole("listitem").first();
  await expect(activity).toContainText(itemName);
  await expect(activity).toContainText("−40 g");
  await expect(activity).toContainText("200 g");

  await page.reload();
  const reloadedLot = page
    .getByTestId("pantry-lots")
    .getByRole("listitem")
    .filter({ hasText: itemName });
  await expect(reloadedLot).toContainText("200 g", { timeout: 20_000 });
  await reloadedLot.getByRole("button", { name: `Ghi nhận sử dụng: ${itemName}` }).click();
  await page.getByLabel("Lượng ghi nhận").fill("201");
  await expect(page.getByText("Lượng ghi nhận vượt quá số dư hiện tại.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Lưu hoạt động" })).toBeDisabled();
  await page.getByRole("button", { name: "Đóng" }).last().click();

  await page.waitForTimeout(400);
  await page.screenshot({
    path: "e2e/__screens__/inventory-fefo-390.png",
    fullPage: true,
  });
});
