import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Everything requires sign-in except the auth pages + static assets.
function isPublic(pathname: string): boolean {
  return pathname === "/" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname === "/api/cron/reminders" ||
    pathname.startsWith("/spike/");
}

// E2E-only auth bypass — committed but env-gated and HARD-guarded off in production,
// so it can never weaken the live app. Replaces the old fragile "edit proxy.ts by
// hand, remember to restore before commit" QA dance. The E2E harness sets this env.
const E2E_BYPASS = process.env.E2E_BYPASS_AUTH === "1" && process.env.NODE_ENV !== "production";

const authenticatedProxy = clerkMiddleware(async (auth, req) => {
  // Canonical host: send www.anngon.io → anngon.io (permanent).
  if (req.nextUrl.hostname === "www.anngon.io") {
    const url = req.nextUrl.clone();
    url.hostname = "anngon.io";
    return NextResponse.redirect(url, 308);
  }
  if (isPublic(req.nextUrl.pathname)) return;
  // Redirect signed-out users to the sign-in page instead of auth.protect(),
  // which on a Clerk *development* instance rewrites to /404 ("dev-browser-missing")
  // on a deployed domain. A redirect lets the sign-in page bootstrap the dev browser.
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();
}, {
  // Send signed-out users to the app's OWN /sign-in (same origin), NOT Clerk's
  // Account Portal (accounts.anngon.io): the cross-origin RSC redirect from
  // anngon.io was blocked by CORS. The app renders <SignIn/> inline at /sign-in.
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
});

// Do not run a request through Clerk at all in hermetic E2E mode. Returning
// from inside `clerkMiddleware` is too late: the middleware may already derive
// its frontend API from the placeholder CI key and redirect off-origin.
export default E2E_BYPASS
  ? function e2eProxy() {
      return NextResponse.next();
    }
  : authenticatedProxy;

export const config = {
  matcher: [
    "/((?!_next|sw.js|manifest.webmanifest|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
