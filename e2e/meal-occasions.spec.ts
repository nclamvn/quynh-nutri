import { expect, test } from "@playwright/test";

test("household explicitly plans and removes lunch without changing dinner", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 860 });
  await page.goto("/week");

  const dinner = page.getByRole("button", { name: /Bữa tối/ });
  await expect(dinner).toHaveAttribute("aria-pressed", "true");
  const dinnerCount = (await dinner.textContent())?.match(/\d+/)?.[0];

  await page.getByRole("button", { name: /Bữa trưa/ }).click();
  await expect(page.getByRole("button", { name: /Bữa trưa/ }))
    .toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "+ Thêm món" }).first().click();
  await page.getByRole("dialog").locator("li button").first().click();
  let addDiff = page.getByTestId("occasion-plan-diff");
  await expect(addDiff).toContainText("Đang trống");
  await expect(addDiff).toContainText("→");
  await addDiff.getByRole("button", { name: "Huỷ" }).click();
  await expect(page.getByRole("button", { name: /Bữa trưa.*0/ })).toBeVisible();

  await page.getByRole("button", { name: "+ Thêm món" }).first().click();
  await page.getByRole("dialog").locator("li button").first().click();
  addDiff = page.getByTestId("occasion-plan-diff");
  await addDiff.getByRole("button", { name: "Xác nhận" }).click();

  await expect(page.getByRole("button", { name: /Bữa trưa.*1/ })).toBeVisible();
  await expect(page.getByTestId("week-plan-sync-state")).toContainText("Đã lưu");
  await page.reload();
  await page.getByRole("button", { name: /Bữa trưa/ }).click();
  await expect(page.getByRole("button", { name: "Bỏ món" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Bữa tối/ }))
    .toContainText(`· ${dinnerCount}`);

  await page.getByRole("button", { name: "Bỏ món" }).first().click();
  const removeDiff = page.getByTestId("occasion-plan-diff");
  await expect(removeDiff).toContainText("Bỏ món");
  await removeDiff.getByRole("button", { name: "Xác nhận" }).click();
  await expect(page.getByRole("button", { name: /Bữa trưa.*0/ })).toBeVisible();
  await expect(page.getByTestId("week-plan-sync-state")).toContainText("Đã lưu");

  expect(await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )).toBe(0);

  await page.goto("/nutrition");
  await expect(page.getByText(/đây chưa phải đánh giá dinh dưỡng trọn ngày/))
    .toBeVisible();

  await page.goto("/overview");
  await expect(page.getByRole("heading", {
    name: "Chỉ ghi nhận điều nhà mình đã làm",
  })).toBeVisible();
  await expect(page.getByText(
    "Bữa còn trống vẫn là chưa lên; ứng dụng không tự gọi đó là bỏ bữa.",
  )).toBeVisible();

  await page.evaluate(() => {
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
  });
  await page.reload();
  expect(await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )).toBe(0);
});
