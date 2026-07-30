import { expect, test } from "@playwright/test";

test("day plan → estimated timeline → manual progress → guide → restore → finish", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 860 });
  await page.goto("/week");

  const coordinate = page.getByRole("button", { name: /Phối hợp nấu/ }).first();
  await expect(coordinate).toBeVisible({ timeout: 20_000 });
  await coordinate.click();
  await expect(page.getByRole("heading", { name: "Phối hợp các món" })).toBeVisible();

  const target = page.getByLabel("Giờ dự kiến dọn cơm");
  const originalTarget = await target.inputValue();
  await target.fill("2020-01-01T10:00");
  await expect(page.getByText("Giờ dọn cơm phải ở tương lai.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo timeline nấu" })).toBeDisabled();
  await target.fill(originalTarget);

  const riceDuration = page.getByLabel("Thời lượng ước tính cho Cơm trắng");
  await riceDuration.fill("4");
  await expect(page.getByRole("button", { name: "Tạo timeline nấu" })).toBeDisabled();
  await riceDuration.fill("30");
  await page.getByRole("button", { name: "Tạo timeline nấu" }).click();

  const run = () => page.getByRole("dialog", { name: "Timeline dọn cơm" });
  await expect(run()).toBeVisible();
  const totalDishes = await run().getByRole("button", { name: "Bắt đầu món" }).count();
  expect(totalDishes).toBeGreaterThanOrEqual(2);
  await expect(run().getByText(`xong 0/${totalDishes} món`)).toBeVisible();
  await expect(run().getByText(/ước tính để sắp việc/)).toBeVisible();

  await page.keyboard.press("Shift+Tab");
  await expect(
    run().getByRole("button", { name: "Huỷ timeline và xoá tiến độ" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(run().getByRole("button", { name: "Về phần phối hợp" })).toBeFocused();

  await run().getByRole("button", { name: "Bắt đầu món" }).first().click();
  await expect(run().getByText("Đang nấu")).toBeVisible();
  await run().getByRole("button", { name: "Mở hướng dẫn" }).first().click();

  const cookingBack = page.getByRole("button", { name: "Về chi tiết món" });
  await expect(cookingBack).toBeVisible();
  await cookingBack.click();
  await expect(run()).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: /Phối hợp nấu/ }).first().click();
  await expect(run()).toBeVisible();
  await expect(run().getByText("Đang nấu")).toBeVisible();

  await run().getByRole("button", { name: "Đánh dấu món xong" }).click();
  for (let index = 1; index < totalDishes; index += 1) {
    await run().getByRole("button", { name: "Bắt đầu món" }).first().click();
    await run().getByRole("button", { name: "Đánh dấu món xong" }).click();
  }
  await expect(run().getByText(`xong ${totalDishes}/${totalDishes} món`)).toBeVisible();

  await page.screenshot({ path: "e2e/__screens__/meal-run-390.png" });

  const finish = run().getByRole("button", { name: "Hoàn tất bữa nấu" });
  await expect(finish).toBeEnabled();
  await finish.click();
  await expect(run()).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Tiếp tục phiên đang nấu" })).toHaveCount(0);
});
