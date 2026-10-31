
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

type PageProps = {
  params: Promise<{ id: string }>;
};

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ||
  "https://zusbebjskchgehdjvpsm.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

async function getBillionaire(
  id: string
): Promise<Billionaire | null> {
  const query = new URLSearchParams({
    select: "*",
    id: `eq.${id}`,
    limit: "1",
  });

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/billionaires?${query.toString()}`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("دریافت اطلاعات میلیاردر از Supabase ناموفق بود.");
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  return data[0] as Billionaire;
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
      `${SUPABASE_URL}/rest/v1/billionaire_wealth_history?${query.toString()}`,
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
      throw new Error("دریافت تاریخچه ثروت ناموفق بود.");
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
        <p>
          تنظیمات اتصال به پایگاه داده اکونوا کامل نیست.
        </p>
      </main>
    );
  }

  let person: Billionaire | null;

  try {
    person = await getBillionaire(id);
  } catch {
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
  } catch {
    // در صورت خطای تاریخچه، اطلاعات اصلی پروفایل همچنان نمایش داده می‌شود.
    history = [];
  }

  return (
    <ProfileClient
      person={person}
      initialHistory={history}
    />
  );
}
