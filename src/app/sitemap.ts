import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://anngon.io",
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
