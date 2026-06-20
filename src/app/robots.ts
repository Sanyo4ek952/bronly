import type { MetadataRoute } from "next";

import { getSeoBaseUrl } from "@/shared/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/p/", "/a/"],
      disallow: [
        "/c/",
        "/login",
        "/register",
        "/check-email",
        "/forgot-password",
        "/reset-password",
        "/welcome",
        "/invite/",
        "/dashboard",
        "/agent/dashboard",
        "/admin",
        "/api/",
      ],
    },
    sitemap: `${getSeoBaseUrl().toString()}/sitemap.xml`,
    host: getSeoBaseUrl().toString(),
  };
}
