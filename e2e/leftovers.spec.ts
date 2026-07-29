import { expect, test } from "@playwright/test";

const toLocalDateTime = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

test("finished meal → cooling guard → confirmed leftover → partial use persists", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 860 });
  await page.goto("/week");

  await page.getByRole("button", { name: /Phối hợp nấu/ }).first().click();
  await page.getByRole("button", { name: "Tạo timeline nấu" }).click();
  const run = page.getByRole("dialog", { name: "Timeline dọn cơm" });
  await expect(run).toBeVisible();

  while (await run.getByRole("button", { name: "Bắt đầu món" }).count()) {
    await run.getByRole("button", { name: "Bắt đầu món" }).first().click();
    await run.getByRole("button", { name: "Đánh dấu món xong" }).first().click();
  }
  await run.getByRole("button", { name: "Hoàn tất bữa nấu" }).click();

  const capture = page.getByRole("dialog", { name: "Có món còn thừa?" });
  await expect(capture).toBeVisible();
  await expect(capture.getByText(/không thể tự quan sát căn bếp/)).toBeVisible();

  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60_000);
  await capture.getByLabel("Thời điểm nấu xong").fill(toLocalDateTime(threeHoursAgo));
  await expect(capture.getByText(/đã vượt mốc hướng dẫn/)).toBeVisible();
  await expect(capture.getByRole("button", { name: "Xác nhận đã cất món này" })).toBeDisabled();

  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60_000);
  await capture.getByLabel("Thời điểm nấu xong").fill(toLocalDateTime(thirtyMinutesAgo));
  await capture.getByLabel("Số khẩu phần").fill("2");
  await capture.getByRole("button", { name: "Xác nhận đã cất món này" }).click();
  await expect(page.getByText("Đã ghi nhận món còn thừa.")).toBeVisible();

  await page.screenshot({ path: "e2e/__screens__/leftover-capture-390.png" });
  await capture.getByRole("button", { name: "Không có hoặc để sau" }).click();
  await page.goto("/pantry");

  const leftovers = page.getByTestId("leftover-lots");
  await expect(leftovers).toBeVisible();
  const card = leftovers.getByRole("button", { name: /Mở món còn thừa/ }).first();
  const dishName = (await card.getAttribute("aria-label"))?.replace(/^Mở món còn thừa:\s*/, "");
  expect(dishName).toBeTruthy();
  await card.click();

  const sheet = page.getByRole("dialog", { name: "Cập nhật món còn thừa" });
  await expect(sheet.getByText("Trong khoảng hướng dẫn")).toBeVisible();
  await expect(sheet.getByText(/74°C\/165°F/)).toBeVisible();
  await sheet.getByLabel("Số khẩu phần").fill("0.5");
  await sheet.getByRole("button", { name: "Lưu hoạt động" }).click();
  await expect(sheet).toHaveCount(0);

  await page.reload();
  const persisted = page.getByTestId("leftover-lots")
    .getByRole("button", { name: new RegExp(`Mở món còn thừa: ${dishName}`) });
  await expect(persisted).toContainText("1.5 khẩu phần");
  await page.getByText("Hoạt động món thừa gần đây").click();
  const activity = page.getByTestId("leftover-activity");
  await expect(activity.getByText(/2 → 1.5/)).toHaveCount(1);
});
