import type { MetadataRoute } from "next";

const PRIVATE_ROUTES = [
  "/api/",
  "/dishes/",
  "/favorites",
  "/health",
  "/notes",
  "/nutrition",
  "/overview",
  "/pantry",
  "/reports",
  "/settings",
  "/shopping",
  "/sign-in",
  "/sign-up",
  "/suppliers",
  "/week",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: PRIVATE_ROUTES,
    },
    sitemap: "https://anngon.io/sitemap.xml",
    host: "https://anngon.io",
  };
}
