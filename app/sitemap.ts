from pathlib import Path

content = '''import type { MetadataRoute } from "next";

const baseUrl = "https://econova-nine.vercel.app";
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\\\\/$/, "") ||
  "https://zusbebjskchgehdjvpsm.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type SitemapBillionaire = {
  id: string | number;
  updated_at?: string | null;
};

async function getBillionaireProfileUrls(): Promise<MetadataRoute.Sitemap> {
  if (!supabaseKey) return [];

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/billionaires?select=id,updated_at&order=rank.asc&limit=1000`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) return [];

    const data: unknown = await response.json();
    if (!Array.isArray(data)) return [];

    return (data as SitemapBillionaire[])
      .filter(
        (person) =>
          person &&
          (typeof person.id === "string" || typeof person.id === "number")
      )
      .map((person) => ({
        url: `${baseUrl}/billionaires/${encodeURIComponent(String(person.id))}`,
        lastModified: person.updated_at
          ? new Date(person.updated_at)
          : new Date(),
        changeFrequency: "daily" as const,
        priority: 0.65,
      }));
  } catch {
    // Keep the main sitemap available even if the database is temporarily unreachable.
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${baseUrl}/billionaires`,
      lastModified,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/billionaires/rankings`,
      lastModified,
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/crypto`,
      lastModified,
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/economies`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  const profileRoutes = await getBillionaireProfileUrls();

  return [...staticRoutes, ...profileRoutes];
}
'''
path = Path("/mnt/data/econova-sitemap.ts")
path.write_text(content, encoding="utf-8")
print(f"Created: {path.name} ({path.stat().st_size:,} bytes)")
