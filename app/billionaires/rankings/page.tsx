
import BillionairesClient from "./RankingsClient";

export const revalidate = 300;

type Billionaire = {
  id: string | number;
  rank: number;
  name: string;
  company: string | null;
  country: string | null;
  image_url: string | null;
  bio: string | null;
  net_worth_billions: number;
  daily_change_pct: number | null;
  daily_change_date?: string | null;
  updated_at?: string | null;
  source_url?: string | null;
  yesterday_net_worth_billions?: number | null;
  age?: number | null;
  birth_date?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  industry?: string | null;
  is_athlete?: boolean | null;
};

type BillionaireNews = {
  id: string;
  billionaire_id?: string | number | null;
  billionaire_name?: string | null;
  billionaire_rank?: number | null;
  title: string;
  content?: string | null;
  image_url?: string | null;
  source_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const API_URL =
  "https://zusbebjskchgehdjvpsm.supabase.co/functions/v1/econova-public-billionaires";

export default async function RankingsPage() {
  let initialPeople: Billionaire[] = [];
  let initialNews: BillionaireNews[] = [];
  let initialError = "";

  try {
    const response = await fetch(API_URL, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error("دریافت اطلاعات رتبه‌بندی ناموفق بود.");
    }

    const payload = await response.json();

    initialPeople = Array.isArray(payload.billionaires)
      ? payload.billionaires
          .map((person: Billionaire) => ({
            ...person,
            industry: person.industry?.trim() || null,
          }))
          .sort(
            (a: Billionaire, b: Billionaire) =>
              Number(a.rank) - Number(b.rank)
          )
      : [];

    initialNews = Array.isArray(payload.news)
      ? payload.news
      : [];
  } catch (error) {
    initialError =
      error instanceof Error
        ? error.message
        : "دریافت اطلاعات با خطا مواجه شد.";
  }

  return (
    <BillionairesClient
      initialPeople={initialPeople}
      initialNews={initialNews}
      initialError={initialError}
    />
  );
}
