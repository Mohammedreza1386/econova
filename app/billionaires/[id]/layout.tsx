
import type { Metadata } from "next";
import type { ReactNode } from "react";

const baseUrl = "https://econova-nine.vercel.app";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ||
  "https://zusbebjskchgehdjvpsm.supabase.co";

const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type BillionaireSeoRecord = {
  id: string | number;
  name: string;
  company?: string | null;
  country?: string | null;
  bio?: string | null;
  image_url?: string | null;
  net_worth_billions?: number | string | null;
  rank?: number | null;
};

async function getBillionaire(
  id: string
): Promise<BillionaireSeoRecord | null> {
  if (!supabaseKey || !id) return null;

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/billionaires?select=id,name,company,country,bio,image_url,net_worth_billions,rank&id=eq.${encodeURIComponent(id)}&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) return null;

    const data: unknown = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const person = data[0] as BillionaireSeoRecord;

    return typeof person.name === "string" ? person : null;
  } catch {
    return null;
  }
}

function formatWealth(
  value: number | string | null | undefined
): string | null {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return null;

  return `$${amount.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })} billion`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const person = await getBillionaire(id);

  if (!person) {
    return {
      title: "Billionaire Profile | Econova",
      description:
        "Explore billionaire profiles, wealth rankings and wealth history on Econova.",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const title = `${person.name} Net Worth, Wealth & Profile | Econova`;

  const wealth = formatWealth(person.net_worth_billions);

  const details = [
    person.company,
    person.country,
  ]
    .filter(Boolean)
    .join(", ");

  const description = [
    `Explore ${person.name}'s profile on Econova.`,
    wealth ? `Estimated net worth: ${wealth}.` : "",
    details ? `Associated with ${details}.` : "",
    person.bio || "",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 300);

  const canonical =
    `${baseUrl}/billionaires/${encodeURIComponent(String(person.id))}`;

  return {
    title,
    description,

    alternates: {
      canonical,
    },

    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Econova",
      type: "profile",

      ...(person.image_url
        ? {
            images: [
              {
                url: person.image_url,
                alt: person.name,
              },
            ],
          }
        : {}),
    },

    twitter: {
      card: person.image_url
        ? "summary_large_image"
        : "summary",

      title,
      description,

      ...(person.image_url
        ? {
            images: [person.image_url],
          }
        : {}),
    },
  };
}

export default function BillionaireProfileLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return children;
}
