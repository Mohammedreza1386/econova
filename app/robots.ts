
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: "https://econova-nine.vercel.app/sitemap.xml",
    host: "https://econova-nine.vercel.app",
  };
}
