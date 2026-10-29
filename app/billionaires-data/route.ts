
import { NextResponse } from "next/server";

export const revalidate = 300;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ||
  "https://zusbebjskchgehdjvpsm.supabase.co";

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

    const data = result.filter(
      (person) =>
        person &&
        typeof person === "object" &&
        typeof person.name === "string" &&
        Number.isFinite(Number(person.rank)) &&
        Number.isFinite(Number(person.net_worth_billions))
    );

    return NextResponse.json(
      {
        source: "Econova",
        updated_at: new Date().toISOString(),
        count: data.length,
        data,
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
