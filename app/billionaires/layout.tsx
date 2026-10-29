
import type { Metadata } from "next";

const pageUrl = "https://econova-nine.vercel.app/billionaires";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://zusbebjskchgehdjvpsm.supabase.co";

const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const metadata: Metadata = {
  title: "World's Richest People & Billionaire Rankings | Econova",
  description:
    "Explore the world's richest people, estimated net worth, billionaire rankings, daily wealth changes and company information on Econova.",
  keywords: [
    "Econova",
    "world's richest people",
    "billionaire rankings",
    "billionaire net worth",
    "richest people in the world",
    "wealth rankings",
    "ثروتمندترین افراد جهان",
    "رتبه‌بندی ثروتمندان",
  ],
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "World's Richest People & Billionaire Rankings | Econova",
    description:
      "Explore billionaire rankings and estimated net worth on Econova.",
    url: pageUrl,
    siteName: "Econova",
    type: "website",
    locale: "en_US",
    alternateLocale: ["fa_IR"],
  },
  twitter: {
    card: "summary",
    title: "World's Richest People | Econova",
    description:
      "Explore global billionaire rankings and estimated net worth.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

type Billionaire = {
  id?: string | number;
  rank: number;
  name: string;
  company?: string | null;
  country?: string | null;
  net_worth_billions: number | string;
  updated_at?: string | null;
  source_url?: string | null;
};

async function getTopBillionaires(): Promise<Billionaire[]> {
  if (!supabaseKey) return [];

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/billionaires?select=rank,name,company,country,net_worth_billions,updated_at,source_url&order=rank.asc&limit=10`,
      {
        headers: {
          apikey: supabaseKey,
        },
        next: {
          revalidate: 300,
        },
      }
    );

    if (!response.ok) return [];

    const data: unknown = await response.json();

    if (!Array.isArray(data)) return [];

    return data
      .filter(
        (person): person is Billionaire =>
          person !== null &&
          typeof person === "object" &&
          typeof person.name === "string" &&
          Number.isFinite(Number(person.rank)) &&
          Number.isFinite(Number(person.net_worth_billions))
      )
      .sort((a, b) => Number(a.rank) - Number(b.rank))
      .slice(0, 10);
  } catch {
    return [];
  }
}

function formatWorth(value: number | string): string {
  return `$${Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })}B`;
}

export default async function BillionairesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const people = await getTopBillionaires();

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Econova Global Billionaire Net Worth Dataset",
    alternateName: "داده‌های ثروت میلیاردرهای جهان اکونوا",
    description:
      "Estimated net worth and rankings of the world's wealthiest people. Figures are estimates and may change as the dataset is updated.",
    url: pageUrl,
    keywords: [
      "billionaires",
      "net worth estimates",
      "richest people",
      "wealth rankings",
      "ثروتمندان جهان",
    ],
    inLanguage: ["en", "fa"],
    isAccessibleForFree: true,
    creator: {
      "@type": "Organization",
      name: "Econova",
      url: "https://econova-nine.vercel.app/",
    },
    distribution: {
      "@type": "DataDownload",
      contentUrl:
        "https://zusbebjskchgehdjvpsm.supabase.co/functions/v1/econova-public-billionaires",
      encodingFormat: "application/json",
    },
  };

  const rankingSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Econova Top Billionaires Ranking",
    url: pageUrl,
    numberOfItems: people.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: people.map((person, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: person.name,
      url: pageUrl,
      description: `${person.name}: estimated net worth ${formatWorth(
        person.net_worth_billions
      )}.`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(datasetSchema).replace(/</g, "\\u003c"),
        }}
      />

      {people.length > 0 && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(rankingSchema).replace(
                /</g,
                "\\u003c"
              ),
            }}
          />

          <section
            aria-labelledby="econova-indexed-ranking"
            style={{
              background: "#101410",
              color: "#f4f7f0",
              border: "1px solid #293629",
              borderRadius: 14,
              padding: "18px",
              margin: "16px auto",
              maxWidth: 1100,
            }}
          >
            <h2
              id="econova-indexed-ranking"
              style={{
                color: "#b9f27c",
                fontSize: 20,
                margin: "0 0 8px",
              }}
            >
              Top Billionaires — Econova
            </h2>

            <p style={{ color: "#b8c2b4", fontSize: 13 }}>
              Estimated net worth in billions of US dollars. Figures are
              estimates and may change.
            </p>

            <ol style={{ paddingInlineStart: 24, lineHeight: 2 }}>
              {people.map((person) => (
                <li key={`${person.rank}-${person.name}`}>
                  <strong>{person.name}</strong>
                  {" — "}
                  <span>{formatWorth(person.net_worth_billions)}</span>
                  {person.company ? ` · ${person.company}` : ""}
                  {person.country ? ` · ${person.country}` : ""}
                </li>
              ))}
            </ol>

            <p style={{ fontSize: 12, color: "#b8c2b4" }}>
              Data source: Econova database. This ranking is an estimate,
              not a real-time guarantee.
            </p>
          </section>
        </>
      )}

      {children}
    </>
  );
}
