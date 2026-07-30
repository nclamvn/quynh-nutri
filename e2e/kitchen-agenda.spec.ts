import { expect, test } from "@playwright/test";

const toLocalDateTime = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

test("derived agenda → leftover source flow → agenda updates without local done state", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 860 });
  await page.goto("/week");

  await page.locator('button:not(:disabled)').filter({ hasText: "Phối hợp nấu" }).first().click();
  await page.getByRole("button", { name: "Tạo timeline nấu" }).click();
  const run = page.getByRole("dialog", { name: "Timeline dọn cơm" });
  while (await run.getByRole("button", { name: "Bắt đầu món" }).count()) {
    await run.getByRole("button", { name: "Bắt đầu món" }).first().click();
    await run.getByRole("button", { name: "Đánh dấu món xong" }).first().click();
  }
  await run.getByRole("button", { name: "Hoàn tất bữa nấu" }).click();

  const capture = page.getByRole("dialog", { name: "Có món còn thừa?" });
  const chilledAt = new Date(Date.now() - 80 * 60 * 60_000);
  const preparedAt = new Date(chilledAt.getTime() - 30 * 60_000);
  await capture.getByLabel("Thời điểm nấu xong").fill(toLocalDateTime(preparedAt));
  await capture.getByLabel("Thời điểm cho vào lạnh").fill(toLocalDateTime(chilledAt));
  await capture.getByLabel("Số khẩu phần").fill("2");
  const selectedDish = (
    await capture.getByLabel("Món đã nấu").locator("option:checked").textContent()
  ) ?? "";
  expect(selectedDish).not.toBe("");
  await capture.getByRole("button", { name: "Xác nhận đã cất món này" }).click();
  await capture.getByRole("button", { name: "Không có hoặc để sau" }).click();

  await page.goto("/overview");
  const card = page.getByTestId("kitchen-agenda-card");
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute("data-brief-status", "ready");
  await expect(card.locator("[data-brief-station]")).toHaveCount(3);
  await expect(card.getByText("Chuẩn bị", { exact: true })).toBeVisible();
  await expect(card.getByText("Mua & nhận", { exact: true })).toBeVisible();
  await expect(card.getByText("Dùng sớm", { exact: true })).toBeVisible();
  await expect(card.getByText(`Xem lại ${selectedDish}`)).toBeVisible();
  await expect(card.locator('input[type="checkbox"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(375);
  await page.screenshot({ path: "e2e/__screens__/daily-brief-375.png" });

  await card.getByRole("button", { name: "Xem tất cả" }).click();
  const sheet = page.getByRole("dialog", { name: "Việc bếp hôm nay" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText(/Không có nút hoàn tất/)).toBeVisible();
  await expect(sheet.getByText(/Tạo từ: món còn thừa đã xác nhận/)).toBeVisible();
  await page.waitForTimeout(350);
  await page.screenshot({ path: "e2e/__screens__/kitchen-agenda-375.png" });
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);

  await card.getByRole("button", { name: "Xem tất cả" }).click();
  await page.getByRole("dialog", { name: "Việc bếp hôm nay" })
    .getByRole("link", { name: /Mở món thừa/ })
    .click();
  await expect(page).toHaveURL(/\/pantry#leftovers$/);
  await expect(page.locator("#leftovers")).toBeVisible();

  const leftoverCard = page.getByTestId("leftover-lots")
    .getByRole("button", { name: new RegExp(`Mở món còn thừa: ${selectedDish}`) });
  await leftoverCard.click();
  const leftoverSheet = page.getByRole("dialog", { name: "Cập nhật món còn thừa" });
  await leftoverSheet.getByLabel("Số khẩu phần").fill("2");
  await leftoverSheet.getByRole("button", { name: "Lưu hoạt động" }).click();

  await page.goto("/overview");
  await expect(page.getByTestId("kitchen-agenda-card").getByText(`Xem lại ${selectedDish}`)).toHaveCount(0);
});

test("assistant reads the server agenda in hermetic mode and does not claim mutation", async ({ page }) => {
  await page.goto("/overview");
  await page.getByRole("button", { name: /AI gợi ý thực đơn/ }).click();
  const assistant = page.getByRole("dialog");
  await assistant.getByRole("button", { name: "Tôi nên làm gì tiếp trong bếp?" }).click();
  await expect(assistant.getByText(/Theo dữ liệu bạn đã ghi nhận/)).toBeVisible();
  await expect(assistant.getByText(/không tự đánh dấu hoàn tất|không tự nghĩ thêm việc/)).toBeVisible();
});
