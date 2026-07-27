/**
 * Real-auth path via @clerk/testing — WIRED FOR LATER, not run by default.
 *
 * The default suite uses the committed, prod-guarded E2E_BYPASS_AUTH gate (see
 * playwright.config.ts + src/proxy.ts), so it's hermetic and runs with no external
 * calls. To exercise the REAL Clerk sign-in (and to run against a production
 * instance — Testing Tokens support prod):
 *
 * 1. In the Clerk dashboard, create a test user with a `+clerk_test` email.
 * 2. Provide env: E2E_CLERK_USER, E2E_CLERK_PASSWORD (+ CLERK_* keys already in .env).
 * 3. Add a `setup` project to playwright.config.ts running THIS file (rename to
 *    *.setup.ts and reference it as a dependency), have the `chromium` project use
 *    `storageState: "e2e/.auth/user.json"`, and drop E2E_BYPASS_AUTH from webServer.env.
 *
 * This file is intentionally NOT matched by the default testMatch (it's *.setup.ts,
 * not *.spec.ts), so it never runs or fails when creds are absent.
 */
import { test as setup } from "@playwright/test";
import { clerk, clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";

const AUTH_FILE = "e2e/.auth/user.json";

setup("authenticate via Clerk Testing Token", async ({ page }) => {
  const email = process.env.E2E_CLERK_USER;
  const password = process.env.E2E_CLERK_PASSWORD;
  setup.skip(!email || !password, "No E2E_CLERK_USER/PASSWORD — running in bypass mode.");

  await clerkSetup(); // fetches a Testing Token (bypasses bot detection; works on prod)
  await setupClerkTestingToken({ page });
  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    signInParams: { strategy: "password", identifier: email!, password: password! },
  });
  await page.goto("/overview");
  await page.context().storageState({ path: AUTH_FILE });
});
