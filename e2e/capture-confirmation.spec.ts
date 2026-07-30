import { expect, test } from "@playwright/test";

const tinyPng = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

test.describe("KE-020 capture stays a proposal until confirmation", () => {
  test("voice fallback shows a diff and cancel leaves shopping unchanged", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/shopping");

    await page.getByRole("button", { name: "Ghi nhanh hóa đơn, nhãn hoặc giọng nói" }).click();
    await expect(page.getByRole("heading", { name: "Ghi nhanh cho bà quản gia" })).toBeVisible();
    await page.getByRole("tab", { name: /Giọng nói/ }).click();
    await page.getByLabel("Nội dung đã nói").fill("Bí xanh 310 g");
    await page.getByRole("button", { name: "Tạo bản nháp từ lời nói" }).click();

    await expect(page.getByText("Bản nháp · chưa áp dụng")).toBeVisible();
    const captureSheet = page.getByTestId("capture-sheet");
    await expect(captureSheet.getByText("297 g", { exact: true })).toBeVisible();
    await expect(captureSheet.getByText("310 g", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Đánh dấu đã mua: Bí xanh/ })).toBeVisible();

    await page.getByRole("button", { name: "Kiểm tra & xác nhận →" }).click();
    await expect(page.getByRole("heading", { name: "Xác nhận hàng đã mua" })).toBeVisible();
    await expect(page.getByLabel("Thay đổi được đề xuất")).toContainText("Chưa có dữ liệu nào được lưu");
    await expect(page.getByLabel("Lượng thực mua")).toHaveValue("310");
    await page.getByRole("button", { name: "Đóng" }).last().click();

    await expect(page.getByRole("button", { name: /Đánh dấu đã mua: Bí xanh/ })).toBeVisible();
  });

  test("label photo stays transient through review and exposes the existing final confirmation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/shopping");

    await page.getByRole("button", { name: "Ghi nhanh hóa đơn, nhãn hoặc giọng nói" }).click();
    await page.getByRole("tab", { name: /Nhãn hàng/ }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "nhan-bi-xanh.png",
      mimeType: "image/png",
      buffer: tinyPng,
    });
    await page.getByRole("button", { name: "Đọc ảnh thành bản nháp" }).click();

    await expect(page.getByText("Bản nháp · chưa áp dụng")).toBeVisible();
    await expect(page.locator('input[type="date"]')).toHaveValue("2026-08-05");
    await expect(page.getByRole("button", { name: /Đánh dấu đã mua: Bí xanh/ })).toBeVisible();

    await page.getByRole("button", { name: "Kiểm tra & xác nhận →" }).click();
    await expect(page.locator('input[type="date"]')).toHaveValue("2026-08-05");
    await expect(page.getByRole("button", { name: "Xác nhận đã mua" })).toBeVisible();
    await page.getByRole("button", { name: "Đóng" }).last().click();
    await expect(page.getByRole("button", { name: /Đánh dấu đã mua: Bí xanh/ })).toBeVisible();
  });

  test("unsupported image type fails closed without a proposal", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/overview");
    await page.getByRole("button", { name: "Ghi nhanh hóa đơn, nhãn hoặc giọng nói" }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "receipt.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not an image"),
    });
    await page.getByRole("button", { name: "Đọc ảnh thành bản nháp" }).click();
    await expect(page.getByText("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.")).toBeVisible();
    await expect(page.getByText("Bản nháp · chưa áp dụng")).toHaveCount(0);
  });
});
