import { defineConfig, devices } from "@playwright/test";

const port = Number.parseInt(process.env.E2E_PORT ?? "3000", 10);
const baseURL = `http://localhost:${port}`;

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
    baseURL,
    trace: "off",
    screenshot: "off",
  },
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI && !process.env.E2E_PORT,
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
