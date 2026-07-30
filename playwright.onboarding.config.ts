import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e-onboarding",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3010",
    trace: "off",
    screenshot: "off",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "npm run dev -- --port 3010",
    url: "http://localhost:3010",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      E2E_BYPASS_AUTH: "1",
      E2E_EMPTY_HOUSEHOLD: "1",
      E2E_MOCK_AI: "1",
      E2E_MOCK_GEOCODE: "1",
      NODE_ENV: "development",
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

