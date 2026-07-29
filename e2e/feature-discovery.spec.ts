import { expect, test } from "@playwright/test";

test("overview always exposes the three real-data housekeeper stages", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 860 });
  await page.goto("/overview");

  const path = page.getByTestId("housekeeper-path");
  await expect(path).toBeVisible();
  await expect(path.getByRole("heading", { name: "Lên tuần" })).toBeVisible();
  await expect(path.getByRole("heading", { name: "Đi chợ" })).toBeVisible();
  await expect(path.getByRole("heading", { name: "Nấu & cất" })).toBeVisible();
  await expect(path.getByRole("link", { name: /Mở thực đơn/ })).toHaveAttribute("href", "/week");
  await expect(path.getByRole("link", { name: /Mở danh sách chợ/ })).toHaveAttribute("href", "/shopping");
  await expect(path.getByRole("link", { name: /Mở Kho & Tủ lạnh/ })).toHaveAttribute("href", "/pantry");
  await expect(path.locator('input[type="checkbox"]')).toHaveCount(0);
  await expect(path.getByText("Đang đọc dữ liệu nhà mình…")).toHaveCount(0);
  await page.screenshot({ path: "e2e/__screens__/housekeeper-path-390.png", fullPage: false });
});

test("desktop Sidebar and housekeeper path expose Pantry without hidden navigation", async ({ page }) => {
  // The contextual rail is reserved for genuinely ultra-wide screens so it
  // never changes the primary canvas origin.
  await page.setViewportSize({ width: 1600, height: 960 });
  await page.goto("/overview");

  const pantryLinks = page.getByRole("link", { name: "Kho & Tủ lạnh", exact: true });
  await expect(pantryLinks).toHaveCount(1);
  await expect(pantryLinks).toBeVisible();
  const path = page.getByTestId("housekeeper-path");
  await expect(path).toBeVisible();
  await expect(path.getByRole("link", { name: /Mở thực đơn/ })).toHaveAttribute("href", "/week");
  await page.screenshot({ path: "e2e/__screens__/housekeeper-path-desktop.png", fullPage: false });
});

test("mobile Menu exposes Pantry & Fridge as a first-class destination", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 860 });
  await page.goto("/overview");
  await page.getByRole("button", { name: "Menu" }).click();

  const menu = page.getByRole("dialog", { name: "Menu" });
  const pantryLink = menu.getByRole("link", { name: "Kho & Tủ lạnh" });
  await expect(pantryLink).toBeVisible();
  await pantryLink.click();

  await expect(page).toHaveURL(/\/pantry$/);
  await expect(page.getByRole("heading", { name: "Kho & Tủ lạnh" })).toBeVisible();
  await expect(page.getByRole("heading", {
    name: "Kho chỉ ghi những gì gia đình thực sự cất",
  })).toBeVisible();
});

test("week keeps preparation and coordination capabilities discoverable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 860 });
  await page.goto("/week");

  await expect(page.getByRole("button", { name: /Chuẩn bị cho ngày mai/ })).toBeVisible();
  const coordinatorButtons = page.getByRole("button", { name: /Phối hợp nấu/ });
  await expect(coordinatorButtons).toHaveCount(7);

  const unsupportedReasons = page.getByText("Cần ít nhất 2 món có hướng dẫn đã rà soát");
  const unsupportedCount = await unsupportedReasons.count();
  expect(unsupportedCount).toBeGreaterThan(0);
  for (const button of await page.locator('button:disabled').filter({ hasText: "Phối hợp nấu" }).all()) {
    await expect(button).toBeDisabled();
  }
});
