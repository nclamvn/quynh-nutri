import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Everything requires sign-in except the auth pages + static assets.
const isPublic = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Canonical host: send www.anngon.io → anngon.io (permanent).
  if (req.nextUrl.hostname === "www.anngon.io") {
    const url = req.nextUrl.clone();
    url.hostname = "anngon.io";
    return NextResponse.redirect(url, 308);
  }
  if (isPublic(req)) return;
  // Redirect signed-out users to the sign-in page instead of auth.protect(),
  // which on a Clerk *development* instance rewrites to /404 ("dev-browser-missing")
  // on a deployed domain. A redirect lets the sign-in page bootstrap the dev browser.
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();
});

export const config = {
  matcher: [
    "/((?!_next|sw.js|manifest.webmanifest|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
