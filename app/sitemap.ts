
import type { MetadataRoute } from "next";

const baseUrl = "https://econova-nine.vercel.app";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ||
  "https://zusbebjskchgehdjvpsm.supabase.co";

const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type BillionaireRecord = {
  id: string | number;
};

async function getBillionaireUrls(): Promise<MetadataRoute.Sitemap> {
  if (!supabaseKey) return [];

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/billionaires?select=id&limit=1000`,
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

    return (data as BillionaireRecord[])
      .filter(
        (person) =>
          person &&
          (typeof person.id === "string" ||
            typeof person.id === "number")
      )
      .map((person) => ({
        url: `${baseUrl}/billionaires/${encodeURIComponent(
          String(person.id)
        )}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.65,
      }));
  } catch {
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
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  const profileRoutes = await getBillionaireUrls();

  return [...staticRoutes, ...profileRoutes];
}
