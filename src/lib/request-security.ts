import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { z } from "zod";

const buckets = new Map<string, { count: number; resetAt: number }>();

/** Best-effort per-instance limiter. Durable/global limiting belongs at the edge. */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= max) return false;
  current.count += 1;
  return true;
}

export async function parseJson<T>(
  req: Request,
  schema: z.ZodType<T>,
  maxBytes = 64 * 1024,
): Promise<T> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new RequestError("Payload quá lớn.", 413);
  const text = await req.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new RequestError("Payload quá lớn.", 413);
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new RequestError("JSON không hợp lệ.", 400);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new RequestError("Dữ liệu không hợp lệ.", 400);
  return parsed.data;
}

export class RequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function blockedIpv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51) ||
    (a === 203 && b === 0) ||
    a >= 224
  );
}

function isPrivateOrReservedIp(ip: string): boolean {
  if (isIP(ip) === 4) return blockedIpv4(ip);
  const normalized = ip.toLowerCase();
  if (normalized.startsWith("::ffff:")) {
    // Block all mapped literals. DNS normally returns native IPv4 records; this
    // closes hexadecimal mapped forms such as ::ffff:7f00:1 without ambiguity.
    return true;
  }
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("fec") ||
    normalized.startsWith("fed") ||
    normalized.startsWith("fee") ||
    normalized.startsWith("fef") ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8")
  );
}

/** Validate every redirect hop before the server is allowed to fetch it. */
export async function assertSafeExternalUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new RequestError("URL không hợp lệ.", 400);
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new RequestError("Chỉ hỗ trợ http(s).", 400);
  }
  if (url.username || url.password || (url.port && !["80", "443"].includes(url.port))) {
    throw new RequestError("URL không được phép.", 400);
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new RequestError("URL nội bộ không được phép.", 400);
  }
  let addresses: { address: string }[];
  try {
    addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new RequestError("Không phân giải được tên miền.", 400);
  }
  if (!addresses.length || addresses.some(({ address }) => isPrivateOrReservedIp(address))) {
    throw new RequestError("URL nội bộ không được phép.", 400);
  }
  return url;
}

export async function fetchBoundedText(
  raw: string,
  opts: { maxBytes?: number; timeoutMs?: number; redirects?: number } = {},
): Promise<string> {
  const maxBytes = opts.maxBytes ?? 512 * 1024;
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const maxRedirects = opts.redirects ?? 3;
  let url = await assertSafeExternalUrl(raw);

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { "user-agent": "BuaComNha-recipe-import/1.0", accept: "text/html,text/plain;q=0.9" },
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw new RequestError("Trang phản hồi quá chậm.", 504);
      }
      throw new RequestError("Không kết nối được tới trang.", 400);
    }
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location || hop === maxRedirects) throw new RequestError("Quá nhiều chuyển hướng.", 400);
      url = await assertSafeExternalUrl(new URL(location, url).toString());
      continue;
    }
    if (!res.ok) throw new RequestError(`Không tải được trang (${res.status}).`, 400);
    const type = res.headers.get("content-type")?.toLowerCase() ?? "";
    if (type && !type.includes("text/html") && !type.includes("text/plain")) {
      throw new RequestError("Trang không phải nội dung văn bản.", 400);
    }
    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared > maxBytes) throw new RequestError("Trang quá lớn.", 413);
    if (!res.body) return "";
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RequestError("Trang quá lớn.", 413);
      }
      chunks.push(value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder().decode(body);
  }
  throw new RequestError("Không tải được trang.", 400);
}
