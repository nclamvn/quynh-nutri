import { expect, test } from "@playwright/test";

const localStorageSnapshot = (page: import("@playwright/test").Page) =>
  page.evaluate(() => Object.fromEntries(
    Array.from({ length: localStorage.length }, (_, index) => {
      const key = localStorage.key(index) ?? "";
      return [key, localStorage.getItem(key)];
    }),
  ));

test("tomorrow prep opens reviewed, grouped, source-backed guidance without mutation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 860 });
  await page.goto("/week");

  const trigger = page.getByRole("button", { name: /Chuẩn bị cho ngày mai/ });
  await expect(trigger).toBeVisible();
  await expect.poll(async () => (await localStorageSnapshot(page))["qk-b1-dishes:hh_default"]).toBe("[]");
  const before = await localStorageSnapshot(page);
  await trigger.click();

  const sheet = page.getByRole("dialog", { name: "Chuẩn bị cho bữa ngày mai" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText("Theo hướng dẫn đã rà soát")).toBeVisible();
  await expect(sheet.locator("section").first()).toBeVisible();
  await expect(sheet.getByRole("link", { name: /Food and Drug Administration|Xử lý thực phẩm an toàn/ }).first()).toHaveAttribute("href", /^https:\/\//);
  await expect(sheet.locator('input[type="checkbox"]')).toHaveCount(0);
  await expect(sheet.getByText(/Không có ô hoàn tất/)).toBeVisible();

  const recipe = sheet.locator("details").first();
  await recipe.locator("summary").click();
  const amountsBefore = await recipe.locator("ul").innerText();
  await sheet.getByLabel("Số người ăn").fill("2");
  await expect(recipe.getByText("Lượng công thức cho 2 người")).toBeVisible();
  const amountsAfter = await recipe.locator("ul").innerText();
  expect(amountsAfter).not.toBe(amountsBefore);
  await expect(recipe.getByText(/không phải lượng do hướng dẫn chuẩn bị suy đoán/)).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  expect(await localStorageSnapshot(page)).toEqual(before);
});

test("agenda and assistant expose prep-ahead as read-only reviewed guidance", async ({ page }) => {
  await page.goto("/overview");
  const card = page.getByTestId("kitchen-agenda-card");
  await card.getByRole("button", { name: "Xem tất cả" }).click();
  const agenda = page.getByRole("dialog", { name: "Việc bếp hôm nay" });
  await expect(agenda.getByText("Chuẩn bị cho bữa ngày mai")).toBeVisible();
  await expect(agenda.getByText(/hướng dẫn chuẩn bị trước đã rà soát/)).toBeVisible();
  await expect(agenda.locator('input[type="checkbox"]')).toHaveCount(0);
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: /AI gợi ý thực đơn/ }).click();
  const assistant = page.getByRole("dialog");
  await assistant.getByPlaceholder("Nhắn cho trợ lý…").fill("Tôi cần chuẩn bị gì cho ngày mai?");
  await assistant.getByRole("button", { name: "Gửi" }).click();
  await expect(assistant.getByText(/Theo hướng dẫn đã rà soát/)).toBeVisible();
  await expect(assistant.getByText(/không tự sinh bước|không tự sinh bước thay thế/)).toBeVisible();
});
