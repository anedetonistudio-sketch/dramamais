import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";
import { getAllSeries } from "@/lib/data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const series = await getAllSeries().catch(() => []);
  return [
    { url: SITE.url, changeFrequency: "daily", priority: 1 },
    { url: `${SITE.url}/assinar`, changeFrequency: "monthly", priority: 0.8 },
    ...series.map((s) => ({ url: `${SITE.url}/serie/${s.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
