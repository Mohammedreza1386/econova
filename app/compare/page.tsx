
import type { Metadata } from "next";
import CompareClient from "./CompareClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Billionaire Comparison | Econova",
  description:
    "Compare the net worth and historical wealth of the world's billionaires on Econova.",
  alternates: {
    canonical: "https://econova-nine.vercel.app/compare",
  },
};

type Billionaire = {
  id: string | number;
  rank: number;
  name: string;
  company: string | null;
  country: string | null;
  image_url: string | null;
  net_worth_billions: number | string;
  daily_change_pct: number | string | null;
  updated_at: string | null;
};

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ||
  "https://zusbebjskchgehdjvpsm.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

async function getBillionaires(): Promise<Billionaire[]> {
  if (!SUPABASE_KEY) return [];

  try {
    const query = new URLSearchParams({
      select:
        "id,rank,name,company,country,image_url,net_worth_billions,daily_change_pct,updated_at",
      order: "rank.asc",
      limit: "1000",
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
      console.error(
        "Compare billionaires fetch error:",
        response.status
      );
      return [];
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) return [];

    return data as Billionaire[];
  } catch (error) {
    console.error("Compare fetch failed:", error);
    return [];
  }
}

export default async function ComparePage() {
  const billionaires = await getBillionaires();

  return (
    <CompareClient initialBillionaires={billionaires} />
  );
}
