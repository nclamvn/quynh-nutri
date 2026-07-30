import { expect, test } from "@playwright/test";

test("a blank household completes setup and reaches the confirmed-diff flow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/overview");

  const onboarding = page.getByTestId("household-onboarding");
  await expect(onboarding).toBeVisible();
  await expect(
    onboarding.getByRole("heading", {
      name: "Nhà mình có bao nhiêu người?",
    }),
  ).toBeVisible();
  await expect(onboarding).toHaveCSS("overflow-y", "auto");

  await onboarding.getByRole("button", { name: "Trẻ em: +" }).click();
  await onboarding.getByRole("button", { name: "Tiếp tục" }).click();
  await expect(
    onboarding.getByRole("heading", { name: "Cả nhà thường tránh gì?" }),
  ).toBeFocused();

  await onboarding.getByRole("button", { name: "Không thịt heo" }).click();
  await onboarding.getByRole("button", { name: "Tiếp tục" }).click();
  await onboarding.getByRole("button", { name: "Thứ 2" }).click();
  await onboarding.getByRole("button", { name: "Chợ truyền thống" }).click();
  await expect(
    onboarding.getByText(/Chưa có thực đơn hay danh sách chợ nào được áp dụng/),
  ).toBeVisible();

  await onboarding
    .getByRole("button", { name: /Hoàn tất và xem đề xuất/ })
    .click();
  await expect(onboarding).toBeHidden();

  const assistant = page.getByRole("heading", { name: "Trợ lý bếp" });
  await expect(assistant).toBeVisible();
  await page.getByRole("button", {
    name: "Lên thực đơn tuần cho nhà mình",
  }).click();

  const proposal = page.getByTestId("assistant-week-plan-proposal");
  await expect(proposal).toBeVisible();
  await expect(proposal.getByText("Đề xuất chờ xác nhận")).toBeVisible();
  await expect(
    proposal.getByText("Chưa có thay đổi nào được áp dụng"),
  ).toBeVisible();
  await expect(proposal.getByRole("button", { name: "Xác nhận áp dụng" })).toBeVisible();
});

