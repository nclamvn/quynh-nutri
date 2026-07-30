import { defineConfig, devices } from "@playwright/test";

// E2E harness. Default run uses the committed, prod-guarded E2E auth bypass
// (E2E_BYPASS_AUTH) + deterministic mocks for AI + geocode — so the suite is
// hermetic: no real calls to Clerk / the AI gateway / Nominatim / the hotline.
// The @clerk/testing real-auth path (e2e/*.setup.ts) is wired but only enabled
// when E2E_CLERK_USER/PASSWORD are provided (see e2e/MANUAL-CHECKLIST.md).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
    screenshot: "off",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      E2E_BYPASS_AUTH: "1",
      E2E_MOCK_AI: "1",
      E2E_MOCK_GEOCODE: "1",
      NODE_ENV: "development",
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
