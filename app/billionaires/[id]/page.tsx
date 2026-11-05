
import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import ProfileClient from "./ProfileClient";

export const dynamic = "force-dynamic";

type Billionaire = {
  id: string | number;
  rank: number;
  name: string;
  company: string | null;
  country: string | null;
  image_url: string | null;
  bio: string | null;
  net_worth_billions: number | string;
  daily_change_pct: number | string | null;
  source_url: string | null;
  updated_at?: string | null;
};

type HistoryPoint = {
  id: number;
  billionaire_id: string;
  billionaire_name: string;
  net_worth_billions: number | string;
  recorded_at: string;
  source_url: string | null;
};

type BillionaireNews = {
  id: string;
  billionaire_id: string;
  title: string;
  summary: string | null;
  source_name: string;
  source_url: string;
  image_url: string | null;
  published_at: string | null;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

const SITE_URL = "https://econova-nine.vercel.app";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ||
  "https://zusbebjskchgehdjvpsm.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function validUrl(value: string | null | undefined) {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol)
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function cleanDescription(value: string | null, fallback: string) {
  const text = value?.replace(/\s+/g, " ").trim();

  if (!text) return fallback;

  return text.length > 155
    ? `${text.slice(0, 152)}...`
    : text;
}

const getBillionaire = cache(
  async (id: string): Promise<Billionaire | null> => {
    if (!SUPABASE_KEY) {
      throw new Error("Supabase configuration missing.");
    }

    const query = new URLSearchParams({
      select:
        "id,rank,name,company,country,image_url,bio,net_worth_billions,daily_change_pct,source_url,updated_at",
      id: `eq.${id}`,
      limit: "1",
    });

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/billionaires?${query}`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch billionaire.");
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    return data[0] as Billionaire;
  }
);

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const person = await getBillionaire(id);

    if (!person) {
      return {
        title: "Profile Not Found | Econova",
        robots: {
          index: false,
          follow: true,
        },
      };
    }

    const canonical = `${SITE_URL}/billionaires/${encodeURIComponent(id)}`;

    const description = cleanDescription(
      person.bio,
      `Explore ${person.name}'s estimated net worth, global ranking, daily wealth changes and wealth history on Econova.`
    );

    const image = validUrl(person.image_url);

    const title = `${person.name} Net Worth & Wealth History | Econova`;

    return {
      title,
      description,

      alternates: {
        canonical,
      },

      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
        },
      },

      openGraph: {
        type: "profile",
        url: canonical,
        siteName: "Econova",
        title,
        description,
        images: image
          ? [
              {
                url: image,
                alt: `${person.name} - Econova`,
              },
            ]
          : [],
      },

      twitter: {
        card: image ? "summary_large_image" : "summary",
        title,
        description,
        images: image ? [image] : [],
      },

      keywords: [
        person.name,
        `${person.name} net worth`,
        `${person.name} wealth`,
        "billionaires",
        "wealth rankings",
        "Econova",
      ],
    };
  } catch (error) {
    console.error("Metadata generation failed:", error);

    return {
      title: "Billionaire Profile | Econova",
      robots: {
        index: false,
        follow: true,
      },
    };
  }
}

async function getBillionaireHistory(
  billionaireId: string | number
): Promise<HistoryPoint[]> {
  const allHistory: HistoryPoint[] = [];
  const pageSize = 1000;
  const maxPages = 101;

  for (let page = 0; page < maxPages; page++) {
    const offset = page * pageSize;

    const query = new URLSearchParams({
      select:
        "id,billionaire_id,billionaire_name,net_worth_billions,recorded_at,source_url",
      billionaire_id: `eq.${String(billionaireId)}`,
      order: "recorded_at.asc,id.asc",
      limit: String(pageSize),
    });

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/billionaire_wealth_history?${query}`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Range-Unit": "items",
          Range: `${offset}-${offset + pageSize - 1}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch wealth history.");
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    allHistory.push(...(data as HistoryPoint[]));

    if (data.length < pageSize) {
      break;
    }
  }

  return allHistory
    .filter(
      (point) =>
        Number.isFinite(Number(point.net_worth_billions)) &&
        Number(point.net_worth_billions) > 0 &&
        Number.isFinite(Date.parse(point.recorded_at))
    )
    .sort(
      (a, b) =>
        Date.parse(a.recorded_at) - Date.parse(b.recorded_at) ||
        Number(a.id) - Number(b.id)
    );
}

async function getBillionaireNews(
  billionaireId: string | number
): Promise<BillionaireNews[]> {
  const query = new URLSearchParams({
    select:
      "id,billionaire_id,title,summary,source_name,source_url,image_url,published_at",
    billionaire_id: `eq.${String(billionaireId)}`,
    order: "published_at.desc.nullslast",
    limit: "2",
  });

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/billionaire_related_news?${query}`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) return [];

  return response.json();
}

export default async function BillionaireProfilePage({
  params,
}: PageProps) {
  const { id } = await params;

  if (!id || !SUPABASE_KEY) {
    return (
      <main
        dir="rtl"
        style={{
          minHeight: "100vh",
          padding: "40px 20px",
          background: "#080d0a",
          color: "#f3f6f1",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h1>خطا در دریافت اطلاعات</h1>
        <p>تنظیمات اتصال به پایگاه داده اکونوا کامل نیست.</p>
      </main>
    );
  }

  let person: Billionaire | null;

  try {
    person = await getBillionaire(id);
  } catch (error) {
    console.error("Profile fetch failed:", error);

    return (
      <main
        dir="rtl"
        style={{
          minHeight: "100vh",
          padding: "40px 20px",
          background: "#080d0a",
          color: "#f3f6f1",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h1>خطا در دریافت اطلاعات</h1>
        <p>
          ارتباط با پایگاه داده اکونوا برقرار نشد.
          لطفاً کمی بعد دوباره تلاش کن.
        </p>
        <a
          href="/billionaires/rankings"
          style={{ color: "#b9f27c" }}
        >
          بازگشت به رتبه‌بندی
        </a>
      </main>
    );
  }

  if (!person) {
    notFound();
  }

  let history: HistoryPoint[] = [];

  try {
    history = await getBillionaireHistory(person.id);
  } catch (error) {
    console.error("History fetch failed:", error);
    history = [];
  }

  const canonical =
    `${SITE_URL}/billionaires/${encodeURIComponent(id)}`;

  const image = validUrl(person.image_url);

  const description = cleanDescription(
    person.bio,
    `Explore ${person.name}'s estimated net worth, wealth history and global ranking on Econova.`
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${person.name} - Econova`,
    url: canonical,
    description,
    dateModified: person.updated_at || undefined,
    mainEntity: {
      "@type": "Person",
      name: person.name,
      image,
      description,
      url: canonical,
      worksFor: person.company
        ? {
            "@type": "Organization",
            name: person.company,
          }
        : undefined,
      address: person.country
        ? {
            "@type": "PostalAddress",
            addressCountry: person.country,
          }
        : undefined,
      additionalProperty: [
        {
          "@type": "PropertyValue",
          name: "Estimated Net Worth",
          value: Number(person.net_worth_billions),
          unitText: "USD billions",
        },
        {
          "@type": "PropertyValue",
          name: "Econova Global Ranking",
          value: person.rank,
        },
      ],
    },
  };

  const safeSchema = JSON.stringify(schema).replace(
    /</g,
    "\\u003c"
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeSchema,
        }}
      />

      <ProfileClient
        person={person}
        initialHistory={history}
      />
    </>
  );
      }
