import { expect, test } from "@playwright/test";

test("explicit post-meal reflection becomes editable memory without mobile overflow", async ({ page }) => {
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
  await page.getByRole("dialog", { name: "Xác nhận bữa ăn" })
    .getByRole("button", { name: "Xác nhận" })
    .click();
  await page.getByRole("dialog", { name: "Có món còn thừa?" })
    .getByRole("button", { name: "Không có hoặc để sau" })
    .click();

  const reflection = page.getByRole("dialog", { name: "Phiếu nếm bữa cơm" });
  await expect(reflection).toBeVisible();
  await expect(reflection.locator('[aria-pressed="true"]')).toHaveCount(0);
  await expect(reflection.getByRole("button", { name: /Lưu &/ })).toBeDisabled();
  await reflection.getByRole("button", { name: "Muốn ăn lại" }).click();
  await reflection.getByRole("button", { name: /Lưu &/ }).click();
  await page.keyboard.press("Escape");

  await page.goto("/reports");
  const memory = page.locator("[data-meal-memory]");
  await expect(memory).toBeVisible();
  await expect(memory.getByText("1 phản hồi · một lần ghi nhận")).toBeVisible();
  await expect(memory.getByText("1/1").first()).toBeVisible();
  const assistantResponse = await page.request.post("/api/assistant", {
    data: {
      messages: [{
        role: "user",
        content: "Nhà mình thích món nào và món nào nên lặp lại?",
      }],
    },
  });
  expect(assistantResponse.ok()).toBe(true);
  expect(await assistantResponse.text()).toMatch(
    /không tự tạo, sửa hoặc xoá phản hồi|không suy đoán sở thích/,
  );
  await expect(memory.getByText("1 phản hồi · một lần ghi nhận")).toBeVisible();
  expect(await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )).toBe(0);

  await page.evaluate(() => {
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add("dark");
  });
  await page.reload();
  await expect(page.locator("[data-meal-memory]")).toBeVisible();
  expect(await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )).toBe(0);

  await page.locator("[data-meal-memory]").getByRole("button", { name: "Sửa" }).first().click();
  await expect(page.getByRole("dialog", { name: "Phiếu nếm bữa cơm" })
    .getByRole("button", { name: "Muốn ăn lại" })).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");

  await page.locator("[data-meal-memory]").getByRole("button", { name: "Xoá" }).first().click();
  await page.getByRole("button", { name: "Xác nhận xoá" }).click();
  await expect(memory.getByText("1 phản hồi · một lần ghi nhận")).toHaveCount(0);
});
