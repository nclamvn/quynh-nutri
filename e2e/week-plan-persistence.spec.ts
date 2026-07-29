import { expect, test } from "@playwright/test";

const syncState = (page: import("@playwright/test").Page) =>
  page.getByTestId("week-plan-sync-state");

const firstDay = (page: import("@playwright/test").Page) =>
  page.locator("section.card.flex.flex-col").first();

const slotRow = (
  page: import("@playwright/test").Page,
  slotLabel: string,
) => firstDay(page).locator("li").filter({
  has: page.getByText(slotLabel, { exact: true }),
});

test("change, lock and reroll persist while assistant reads the same canonical plan", async ({ page }) => {
  await page.goto("/week");
  await expect(syncState(page)).toHaveText("Đã lưu");

  const riceName = (await firstDay(page).locator("li").first().locator("button.block").innerText())
    .replace(/⚡.*/, "")
    .trim();
  const mainRow = slotRow(page, "Mặn");
  const initialMain = (await mainRow.locator("button.block").innerText()).trim();
  await mainRow.locator("button.block").evaluate((element) => (element as HTMLElement).click());
  const choices = page.getByRole("dialog").locator("li button");
  const count = await choices.count();
  let chosen = "";
  for (let index = 0; index < count; index += 1) {
    const label = (await choices.nth(index).locator("span.text-sm").innerText()).trim();
    if (label !== initialMain) {
      chosen = label;
      await choices.nth(index).click();
      break;
    }
  }
  expect(chosen).not.toBe("");
  await expect(syncState(page)).toHaveText("Đã lưu");
  await page.reload();
  await expect(syncState(page)).toHaveText("Đã lưu");
  await expect(slotRow(page, "Mặn").locator("button.block")).toContainText(chosen);

  await slotRow(page, "Mặn").getByRole("button", { name: "lock" }).click();
  await expect(syncState(page)).toHaveText("Đã lưu");
  await page.getByRole("button", { name: /Đổi cả tuần/ }).click();
  await expect(syncState(page)).toHaveText("Đã lưu");
  await page.reload();
  await expect(slotRow(page, "Mặn").getByRole("button", { name: "lock" })).toHaveText("🔒");

  await page.goto("/overview");
  await page.getByRole("button", { name: /AI gợi ý thực đơn/ }).click();
  const assistant = page.getByRole("dialog");
  await assistant.getByPlaceholder("Nhắn cho trợ lý…").fill("Thực đơn nhà tôi là gì?");
  await assistant.getByRole("button", { name: "Gửi" }).click();
  await expect(assistant.getByText(new RegExp(riceName))).toBeVisible();
  await expect(assistant.getByText(/không tự đổi hoặc lưu thực đơn/)).toBeVisible();
});

test("a failed save keeps the draft unsynced until an explicit retry", async ({ page }) => {
  await page.goto("/week");
  await expect(syncState(page)).toHaveText("Đã lưu");
  let failed = false;
  await page.route("**/week", async (route) => {
    if (!failed && route.request().method() === "POST") {
      failed = true;
      await route.abort("failed");
      return;
    }
    await route.continue();
  });

  await slotRow(page, "Rau").getByRole("button", { name: "lock" }).click();
  await expect(syncState(page)).toHaveText("Chưa đồng bộ");
  await expect(page.getByText(/chưa được xác nhận trên máy chủ/)).toBeVisible();
  await page.unroute("**/week");
  await page.getByRole("button", { name: "Thử lại" }).first().click();
  await expect(syncState(page)).toHaveText("Đã lưu");
});

test("two stale clients surface conflict and never overwrite automatically", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  await Promise.all([pageA.goto("/week"), pageB.goto("/week")]);
  await Promise.all([
    expect(syncState(pageA)).toHaveText("Đã lưu"),
    expect(syncState(pageB)).toHaveText("Đã lưu"),
  ]);

  await slotRow(pageA, "Canh").getByRole("button", { name: "lock" }).click();
  await expect(syncState(pageA)).toHaveText("Đã lưu");
  await slotRow(pageB, "Tráng miệng").getByRole("button", { name: "lock" }).click();
  await expect(syncState(pageB)).toHaveText("Có thay đổi ở nơi khác");
  await expect(pageB.getByText("Thực đơn đã đổi ở nơi khác")).toBeVisible();
  await pageB.getByRole("button", { name: "Tải bản mới từ máy chủ" }).click();
  await expect(syncState(pageB)).toHaveText("Đã lưu");
  await expect(slotRow(pageB, "Canh").getByRole("button", { name: "lock" })).toHaveText("🔒");

  await contextA.close();
  await contextB.close();
});

test("a selected B1 dish resolves after local storage is cleared and the page reloads", async ({ page }) => {
  await page.goto("/dishes");
  const firstDish = page.locator(".card-interactive").first();
  const dishName = (await firstDish.locator("h2").innerText()).trim();
  await firstDish.click();
  await page.getByRole("button", { name: "Lưu vào Nhà mình" }).click();

  await page.goto("/week");
  await expect(syncState(page)).toHaveText("Đã lưu");
  await slotRow(page, "Mặn").locator("button.block").evaluate((element) => (element as HTMLElement).click());
  const choice = page.getByRole("dialog").getByRole("button").filter({ hasText: dishName }).first();
  await expect(choice).toBeVisible();
  await choice.click();
  await expect(syncState(page)).toHaveText("Đã lưu");

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(syncState(page)).toHaveText("Đã lưu");
  await expect(slotRow(page, "Mặn").locator("button.block")).toContainText(dishName);
  await page.goto("/dishes");
  await expect(page.locator(".card-interactive").filter({ hasText: dishName }).getByText("Nhà mình")).toBeVisible();
});
