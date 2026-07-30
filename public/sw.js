// Minimal offline-read service worker (R-PWA-2). Network-first for the APP so the
// plan/list are fresh online; cache fallback keeps them readable offline.
//
// R-PWA-2 fix: the marketing landing ("/") must ALWAYS be fresh, so the SW no
// longer touches it (passthrough → browser + CDN handle it). Bumping CACHE also
// makes `activate` purge the old cache on the next load, so any client stuck on a
// stale v1 entry self-heals.
const CACHE = "bua-com-v4";
const SHELL = ["/week", "/shopping", "/dishes", "/nutrition", "/settings", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Cross-origin and the public marketing landing are never served by the SW –
  // let the browser/CDN deliver them so they're always the latest deploy.
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/") return;
  // Immutable hashed build assets – let the browser cache them natively. The SW
  // must never mediate these, or a stale/mismatched chunk can break the whole page.
  if (url.pathname.startsWith("/_next/")) return;

  const isNav = request.mode === "navigate";
  e.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit ?? (isNav ? caches.match("/week") : undefined))),
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = {};
  }
  const title = typeof payload.title === "string"
    ? payload.title
    : "Bữa cơm nhà";
  const body = typeof payload.body === "string"
    ? payload.body
    : "Có việc bếp cần bạn xem lại.";
  const href = typeof payload.href === "string"
    ? payload.href
    : "/overview";
  const tag = typeof payload.tag === "string"
    ? payload.tag
    : "kitchen-reminder";
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag,
    data: { href },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const raw = event.notification.data?.href;
  const allowed = new Set(["/overview", "/week", "/shopping", "/pantry"]);
  let href = "/overview";
  if (typeof raw === "string") {
    try {
      const target = new URL(raw, self.location.origin);
      if (target.origin === self.location.origin && allowed.has(target.pathname)) {
        href = `${target.pathname}${target.hash}`;
      }
    } catch {
      href = "/overview";
    }
  }
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((client) => "focus" in client);
        if (existing) {
          existing.navigate(href);
          return existing.focus();
        }
        return self.clients.openWindow(href);
      }),
  );
});
