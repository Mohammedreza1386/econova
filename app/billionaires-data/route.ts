
import { NextResponse } from "next/server";

export const revalidate = 300;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ||
  "https://zusbebjskchgehdjvpsm.supabase.co";

type BillionaireRecord = {
  rank: number | string;
  name: string;
  company?: string | null;
  country?: string | null;
  image_url?: string | null;
  net_worth_billions: number | string;
  daily_change_pct?: number | string | null;
  yesterday_net_worth_billions?: number | string | null;
  updated_at?: string | null;
  source_url?: string | null;
};

function isValidRecord(person: unknown): person is BillionaireRecord {
  if (!person || typeof person !== "object") return false;

  const item = person as Record<string, unknown>;

  return (
    typeof item.name === "string" &&
    item.name.trim().length > 0 &&
    Number.isFinite(Number(item.rank)) &&
    Number.isFinite(Number(item.net_worth_billions))
  );
}

export async function GET() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    return NextResponse.json(
      { error: "Public data is temporarily unavailable", count: 0, data: [] },
      { status: 503 }
    );
  }

  try {
    const url = new URL(`${SUPABASE_URL}/rest/v1/billionaires`);

    url.searchParams.set(
      "select",
      "rank,name,company,country,image_url,net_worth_billions,daily_change_pct,yesterday_net_worth_billions,updated_at,source_url"
    );
    url.searchParams.set("order", "rank.asc");
    url.searchParams.set("limit", "100");

    const response = await fetch(url.toString(), {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Could not load public billionaire data", count: 0, data: [] },
        { status: 502 }
      );
    }

    const result: unknown = await response.json();

    if (!Array.isArray(result)) {
      return NextResponse.json(
        { error: "Unexpected data format", count: 0, data: [] },
        { status: 502 }
      );
    }

    const data: BillionaireRecord[] = result
      .filter(isValidRecord)
      .map((person) => ({
        ...person,
        rank: Number(person.rank),
        net_worth_billions: Number(person.net_worth_billions),
      }));

    const validDates = data
      .map((person) => person.updated_at)
      .filter(
        (date): date is string =>
          typeof date === "string" &&
          date.trim().length > 0 &&
          Number.isFinite(Date.parse(date))
      );

    const latestRecordUpdatedAt =
      validDates.length > 0
        ? new Date(
            Math.max(...validDates.map((date) => Date.parse(date)))
          ).toISOString()
        : null;

    return NextResponse.json(
      {
        source: "Econova",
        generated_at: new Date().toISOString(),
        latest_record_updated_at: latestRecordUpdatedAt,
        count: data.length,
        data,
        data_notes: {
          attribution: "Data published by Econova",
          valuation_unit: "USD billions",
          freshness:
            "generated_at is the response generation time, not the data update time. latest_record_updated_at reflects the newest valid updated_at value among returned records.",
          verification:
            "Figures are Econova editorial estimates and are not necessarily real-time or independently verified. Check each record's source_url when available.",
          missing_sources:
            "Some records may not have a source_url or a recent independent verification.",
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Could not load public billionaire data", count: 0, data: [] },
      { status: 500 }
    );
  }
}
