import { expect, test } from "@playwright/test";

test("reminders request permission only after explicit enable", async ({ page }) => {
  await page.addInitScript(() => {
    let permissionRequests = 0;
    class MockNotification {
      static permission = "default";
      static async requestPermission() {
        permissionRequests += 1;
        MockNotification.permission = "granted";
        return "granted";
      }
    }
    Object.defineProperty(window, "Notification", {
      value: MockNotification,
      configurable: true,
    });
    Object.defineProperty(window, "PushManager", {
      value: class PushManager {},
      configurable: true,
    });
    const subscription = {
      toJSON: () => ({
        endpoint: "https://push.example/e2e-device",
        keys: { p256dh: "e2e-p256dh", auth: "e2e-auth" },
      }),
      unsubscribe: async () => true,
    };
    const registration = {
      pushManager: {
        getSubscription: async () => null,
        subscribe: async () => subscription,
      },
    };
    Object.defineProperty(navigator, "serviceWorker", {
      value: { ready: Promise.resolve(registration) },
      configurable: true,
    });
    Object.defineProperty(window, "__permissionRequests", {
      get: () => permissionRequests,
    });
  });

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Nhắc việc quản gia" }))
    .toBeVisible();
  await expect.poll(() => page.evaluate(
    () => (window as typeof window & { __permissionRequests: number })
      .__permissionRequests,
  )).toBe(0);

  await page.getByRole("button", { name: "Bật nhắc việc" }).click();
  await expect(page.getByText("Đang bật", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(
    () => (window as typeof window & { __permissionRequests: number })
      .__permissionRequests,
  )).toBe(1);
});
