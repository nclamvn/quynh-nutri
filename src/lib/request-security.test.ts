import { describe, expect, it } from "vitest";
import { assertSafeExternalUrl, parseJson, rateLimit, RequestError } from "./request-security";
import { z } from "zod";

describe("request security", () => {
  it.each([
    "http://localhost/recipe",
    "http://127.0.0.1/recipe",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/recipe",
    "http://[::ffff:7f00:1]/recipe",
    "ftp://example.com/recipe",
    "https://user:pass@example.com/recipe",
  ])("blocks unsafe URL %s", async (url) => {
    await expect(assertSafeExternalUrl(url)).rejects.toBeInstanceOf(RequestError);
  });

  it("validates and bounds JSON bodies", async () => {
    const schema = z.object({ value: z.string().max(5) });
    await expect(parseJson(new Request("https://app.test", {
      method: "POST",
      body: JSON.stringify({ value: "ok" }),
    }), schema)).resolves.toEqual({ value: "ok" });
    await expect(parseJson(new Request("https://app.test", {
      method: "POST",
      body: JSON.stringify({ value: "too long" }),
    }), schema)).rejects.toBeInstanceOf(RequestError);
  });

  it("enforces a fixed-window request limit", () => {
    const key = `test:${crypto.randomUUID()}`;
    expect(rateLimit(key, 2, 60_000)).toBe(true);
    expect(rateLimit(key, 2, 60_000)).toBe(true);
    expect(rateLimit(key, 2, 60_000)).toBe(false);
  });
});
