import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://doer.done.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Every authenticated surface requires sign-in and returns nothing
        // useful to a crawler — keep the index to the public marketing route.
        disallow: [
          "/dashboard",
          "/tasks/",
          "/pool",
          "/jobs",
          "/earnings",
          "/profile",
          "/notifications",
          "/messages",
          "/support",
          "/doer/payouts",
          "/auth/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
