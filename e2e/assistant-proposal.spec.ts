import { expect, test } from "@playwright/test";

const syncState = (page: import("@playwright/test").Page) =>
  page.getByTestId("week-plan-sync-state");

const firstDay = (page: import("@playwright/test").Page) =>
  page.locator("section.card.flex.flex-col").first();

const openPlanProposal = async (page: import("@playwright/test").Page) => {
  await page.goto("/week");
  await expect(syncState(page)).toHaveText("Đã lưu");
  await page.goto("/overview");
  await page.getByRole("button", { name: /AI gợi ý thực đơn/ }).click();
  const assistant = page.getByRole("dialog");
  await assistant
    .getByRole("button", { name: "Lên thực đơn tuần cho nhà mình" })
    .click();
  const proposal = assistant.getByTestId("assistant-week-plan-proposal");
  await expect(proposal).toBeVisible();
  await expect(proposal.getByText("Đề xuất chờ xác nhận")).toBeInViewport();
  await expect(
    proposal.getByText("Chưa có thay đổi nào được áp dụng"),
  ).toBeVisible();
  return { assistant, proposal };
};

test("week reroll enters the same proposal and confirmation workflow", async ({
  page,
}) => {
  await page.goto("/week");
  await expect(syncState(page)).toHaveText("Đã lưu");
  await page.getByRole("button", { name: /Đổi cả tuần/ }).click();
  const assistant = page.getByRole("dialog");
  await expect(assistant.getByPlaceholder("Nhắn cho trợ lý…"))
    .toHaveValue("Đổi cả tuần");
  await assistant.getByRole("button", { name: "Gửi" }).click();
  const proposal = assistant.getByTestId("assistant-week-plan-proposal");
  await expect(proposal).toBeVisible();
  await expect(proposal.locator("[data-occasion=\"dinner\"]").first())
    .toBeVisible();
  await proposal.getByRole("button", { name: "Bỏ đề xuất" }).click();
  await expect(
    assistant.getByText("Đã bỏ đề xuất. Thực đơn hiện tại không thay đổi."),
  ).toBeVisible();
});

test("assistant proposal is a full diff and discard writes nothing", async ({
  page,
}) => {
  await page.goto("/week");
  await expect(syncState(page)).toHaveText("Đã lưu");
  const initialMain = await firstDay(page)
    .locator("li")
    .filter({ has: page.getByText("Mặn", { exact: true }) })
    .locator("button.block")
    .innerText();

  const { assistant, proposal } = await openPlanProposal(page);
  expect(
    await proposal.locator("[data-day][data-slot]").count(),
  ).toBeGreaterThan(0);
  await expect(proposal.getByTestId("proposal-before").first()).not.toHaveText(
    "",
  );
  await expect(proposal.getByTestId("proposal-after").first()).not.toHaveText(
    "",
  );
  await proposal.getByRole("button", { name: "Bỏ đề xuất" }).click();
  await expect(
    assistant.getByText("Đã bỏ đề xuất. Thực đơn hiện tại không thay đổi."),
  ).toBeVisible();

  await page.goto("/week");
  await expect(syncState(page)).toHaveText("Đã lưu");
  await expect(
    firstDay(page)
      .locator("li")
      .filter({ has: page.getByText("Mặn", { exact: true }) })
      .locator("button.block"),
  ).toHaveText(initialMain);
});

test("only explicit confirmation persists exactly the displayed candidate", async ({
  page,
}) => {
  const { assistant, proposal } = await openPlanProposal(page);
  const firstChange = proposal.locator("[data-day][data-slot]").first();
  const day = Number(await firstChange.getAttribute("data-day"));
  const slot = await firstChange.getAttribute("data-slot");
  const slotLabel: Record<string, string> = {
    COM: "Cơm",
    MAN: "Mặn",
    RAU: "Rau",
    CANH: "Canh",
    TRANGMIENG: "Tráng miệng",
  };
  const after = (await firstChange
    .getByTestId("proposal-after")
    .innerText()).trim();

  await proposal
    .getByRole("button", { name: "Xác nhận áp dụng" })
    .click();
  await expect(
    assistant.getByText("Đã áp dụng đúng phương án bạn vừa xác nhận."),
  ).toBeVisible();

  await page.goto("/week");
  await expect(syncState(page)).toHaveText("Đã lưu");
  await expect(
    page
      .locator("section.card.flex.flex-col")
      .nth(day)
      .locator("li")
      .filter({ has: page.getByText(slotLabel[slot!], { exact: true }) })
      .locator("button.block"),
  ).toContainText(after);
});

test("a stale assistant proposal is rejected instead of silently rebased", async ({
  browser,
}) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  const { assistant, proposal } = await openPlanProposal(pageA);

  await pageB.goto("/week");
  await expect(syncState(pageB)).toHaveText("Đã lưu");
  const canhRow = firstDay(pageB).locator("li").filter({
    has: pageB.getByText("Canh", { exact: true }),
  });
  const initialLock = await canhRow
    .getByRole("button", { name: "lock" })
    .innerText();
  const changedLock = initialLock === "🔒" ? "🔓" : "🔒";
  await canhRow.getByRole("button", { name: "lock" }).click();
  await expect(syncState(pageB)).toHaveText("Đã lưu");
  await expect(
    canhRow.getByRole("button", { name: "lock" }),
  ).toHaveText(changedLock);

  await proposal
    .getByRole("button", { name: "Xác nhận áp dụng" })
    .click();
  await expect(
    assistant.getByText(
      "Thực đơn đã thay đổi ở nơi khác nên đề xuất này không được áp dụng.",
    ),
  ).toBeVisible();

  await pageB.reload();
  await expect(
    firstDay(pageB)
      .locator("li")
      .filter({ has: pageB.getByText("Canh", { exact: true }) })
      .getByRole("button", { name: "lock" }),
  ).toHaveText(changedLock);
  await firstDay(pageB)
    .locator("li")
    .filter({ has: pageB.getByText("Canh", { exact: true }) })
    .getByRole("button", { name: "lock" })
    .click();
  await expect(syncState(pageB)).toHaveText("Đã lưu");
  await expect(
    firstDay(pageB)
      .locator("li")
      .filter({ has: pageB.getByText("Canh", { exact: true }) })
      .getByRole("button", { name: "lock" }),
  ).toHaveText(initialLock);

  await contextA.close();
  await contextB.close();
});
