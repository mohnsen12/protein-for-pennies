import type { MetadataRoute } from "next";
import { getAllRecipes } from "@/lib/recipes";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const recipes = getAllRecipes().map((r) => ({
    url: `${SITE.url}/recipes/${r.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  return [
    { url: SITE.url, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE.url}/recipes`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/meal-plan`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE.url}/about`, lastModified: new Date(), priority: 0.4 },
    { url: `${SITE.url}/privacy`, lastModified: new Date(), priority: 0.2 },
    { url: `${SITE.url}/terms`, lastModified: new Date(), priority: 0.2 },
    ...recipes,
  ];
}
