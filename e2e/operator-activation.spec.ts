import { expect, test } from "@playwright/test";

test("operator console renders aggregate evidence and switches windows", async ({ page }) => {
  await page.goto("/ops/activation?window=28");
  await expect(page.getByRole("heading", { name: "Nhịp kích hoạt" })).toBeVisible();
  await expect(page.getByText("Thang bằng chứng")).toBeVisible();
  await expect(page.getByRole("link", { name: "28 ngày" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.locator("body")).not.toContainText("e2e-household");

  await page.getByRole("link", { name: "7 ngày" }).click();
  await expect(page).toHaveURL(/window=7/);
  await expect(page.getByRole("link", { name: "7 ngày" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("operator console is private, responsive and dark-theme safe", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.goto("/ops/activation?window=28");
  await expect(page.locator("html")).toHaveClass(/dark/);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("/ops/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});

test("operator console emits a private loading shell before the aggregate report", async ({
  request,
}) => {
  const response = await request.get("/ops/activation?window=90", {
    headers: { "Accept-Encoding": "identity" },
  });
  expect(response.status()).toBe(200);

  const body = await response.text();
  expect(body).toContain("Đang tổng hợp");
  expect(body).toContain("Thang bằng chứng");
  expect(body).not.toContain("e2e-household");
});
