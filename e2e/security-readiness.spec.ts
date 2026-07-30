import { expect, test } from "@playwright/test";

const EXPECTED_HEADERS: Record<string, string | RegExp> = {
  "content-security-policy": /default-src 'self'.*frame-ancestors 'none'/,
  "cross-origin-opener-policy": "same-origin-allow-popups",
  "cross-origin-resource-policy": "same-site",
  "permissions-policy": /geolocation=\(\).*payment=\(\)/,
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": /max-age=63072000/,
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "x-permitted-cross-domain-policies": "none",
  "x-xss-protection": "0",
};

function expectSecurityHeaders(headers: Record<string, string>): void {
  for (const [name, expected] of Object.entries(EXPECTED_HEADERS)) {
    const value = headers[name];
    expect(value, `${name} must be present`).toBeTruthy();
    if (typeof expected === "string") expect(value).toBe(expected);
    else expect(value).toMatch(expected);
  }
  expect(headers["x-powered-by"]).toBeUndefined();
  expect(headers["access-control-allow-origin"]).toBeUndefined();
}

test("security headers cover public, authenticated and API responses", async ({ request }) => {
  const publicResponse = await request.get("/");
  expect(publicResponse.status()).toBe(200);
  expectSecurityHeaders(publicResponse.headers());

  const appResponse = await request.get("/overview");
  expect(appResponse.status()).toBe(200);
  expectSecurityHeaders(appResponse.headers());

  const apiResponse = await request.post("/api/substitute", {
    data: { slot: "MAN", missingCommodityId: "thit_heo" },
  });
  expect(apiResponse.status()).toBe(200);
  expectSecurityHeaders(apiResponse.headers());
});

test("malformed and oversized API bodies fail closed", async ({ request }) => {
  const malformed = await request.post("/api/mood-advisory", {
    data: "{not-json",
    headers: { "content-type": "application/json" },
  });
  expect(malformed.status()).toBe(400);

  const oversized = await request.post("/api/mood-advisory", {
    data: JSON.stringify({ mood: "x".repeat(70 * 1024), dishes: [] }),
    headers: { "content-type": "application/json" },
  });
  expect(oversized.status()).toBe(413);
});

test("substitute endpoint rejects calls after its 60-request window", async ({ request }) => {
  const statuses: number[] = [];
  for (let index = 0; index < 62; index += 1) {
    const response = await request.post("/api/substitute", {
      data: { slot: "MAN", missingCommodityId: `missing-${index}` },
    });
    statuses.push(response.status());
  }

  const successes = statuses.filter((status) => status === 200).length;
  const limited = statuses.filter((status) => status === 429).length;
  // One request may already have been consumed by the header test. The invariant
  // is the boundary itself: never more than 60 successes and later calls fail.
  expect(successes).toBeLessThanOrEqual(60);
  expect(limited).toBeGreaterThanOrEqual(2);
  expect(statuses.at(-1)).toBe(429);
});
