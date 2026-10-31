
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Top 10 Billionaires in the World | Econova",
  description:
    "Explore the world's top 10 billionaires, their net worth and daily wealth changes on Econova.",
  alternates: {
    canonical: "https://econova-nine.vercel.app/billionaires",
  },
};

type Billionaire = {
  id: string;
  rank: number;
  name: string;
  company: string | null;
  country: string | null;
  image_url: string | null;
  net_worth_billions: number | string;
  daily_change_pct: number | string | null;
  daily_change_date: string | null;
  yesterday_net_worth_billions: number | string | null;
  updated_at: string | null;
};

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://zusbebjskchgehdjvpsm.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

async function getTopBillionaires(): Promise<Billionaire[]> {
  if (!SUPABASE_KEY) return [];

  try {
    const url = new URL("/rest/v1/billionaires", SUPABASE_URL);

    url.searchParams.set(
      "select",
      "id,rank,name,company,country,image_url,net_worth_billions,daily_change_pct,daily_change_date,yesterday_net_worth_billions,updated_at"
    );
    url.searchParams.set("order", "rank.asc");
    url.searchParams.set("limit", "10");

    const response = await fetch(url.toString(), {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error("Econova billionaire API error:", response.status);
      return [];
    }

    return (await response.json()) as Billionaire[];
  } catch (error) {
    console.error("Econova billionaire fetch failed:", error);
    return [];
  }
}

function numberValue(value: number | string | null | undefined) {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

function money(value: number) {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })}B`;
}

function signedMoney(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}B`;
}

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function BillionairesPage() {
  const billionaires = await getTopBillionaires();

  const totalWealth = billionaires.reduce(
    (sum, person) => sum + numberValue(person.net_worth_billions),
    0
  );

  const latestUpdate = billionaires
    .map((person) => person.updated_at)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  const lastDailyDate = billionaires
    .map((person) => person.daily_change_date)
    .filter((value): value is string => Boolean(value))
    .sort()
    .reverse()[0];

  return (
    <main className="min-h-screen bg-[#080b09] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <Link href="/" className="text-2xl font-black tracking-[0.2em] text-[#b9f27c]">
            ECONOVA
          </Link>

          <nav className="flex flex-wrap items-center gap-5 text-sm text-gray-400">
            <Link href="/" className="transition hover:text-[#b9f27c]">
              Home
            </Link>
            <Link href="/billionaires/rankings" className="transition hover:text-[#b9f27c]">
              Full Rankings
            </Link>
          </nav>
        </header>

        <section className="py-12 text-center sm:py-16">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#b9f27c]/20 bg-[#b9f27c]/5 px-4 py-2 text-xs font-semibold tracking-wider text-[#b9f27c]">
            <span className="h-2 w-2 rounded-full bg-[#b9f27c]" />
            ECONOVA WEALTH TRACKER
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            World&apos;s Top <span className="text-[#b9f27c]">10</span> Billionaires
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-gray-400 sm:text-base">
            Discover the world&apos;s wealthiest individuals and follow their
            daily net worth changes with Econova.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#101611] p-6">
            <p className="text-xs font-semibold tracking-widest text-gray-500">
              COMBINED WEALTH · TOP 10
            </p>
            <p className="mt-3 text-3xl font-black text-[#b9f27c] sm:text-4xl">
              {money(totalWealth)}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Total estimated wealth of the listed individuals
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101611] p-6">
            <p className="text-xs font-semibold tracking-widest text-gray-500">
              PEOPLE TRACKED
            </p>
            <p className="mt-3 text-3xl font-black sm:text-4xl">
              {billionaires.length}
              <span className="ml-2 text-base font-medium text-gray-500">/ 10</span>
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Latest available ranking records
            </p>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-[#b9f27c]">
                GLOBAL WEALTH LEADERS
              </p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                Billionaire Rankings
              </h2>
            </div>

            <p className="text-xs text-gray-500">
              Daily changes are based on Econova&apos;s recorded data
            </p>
          </div>

          {billionaires.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#101611] p-10 text-center">
              <p className="text-lg font-bold">Data temporarily unavailable</p>
              <p className="mt-2 text-sm text-gray-500">
                Please check the Supabase connection and try again.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {billionaires.map((person) => {
                const wealth = numberValue(person.net_worth_billions);
                const previousWealth = person.yesterday_net_worth_billions;
                const hasPrevious =
                  previousWealth !== null && previousWealth !== undefined;

                const change = hasPrevious
                  ? wealth - numberValue(previousWealth)
                  : null;

                const percentage = numberValue(person.daily_change_pct);
                const isPositive = percentage > 0;
                const isNegative = percentage < 0;

                const changeColor = isPositive
                  ? "text-[#65d99a]"
                  : isNegative
                    ? "text-[#ff7777]"
                    : "text-gray-400";

                return (
                  <Link
                    key={person.id}
                    href={`/billionaires/${person.id}`}
                    className="group grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-[#101611] p-4 transition duration-200 hover:border-[#b9f27c]/40 hover:bg-[#141d16] sm:grid-cols-[52px_1fr_150px_150px] sm:gap-5 sm:p-5"
                  >
                    <div className="text-center">
                      <span
                        className={`text-xl font-black ${
                          person.rank <= 3 ? "text-[#b9f27c]" : "text-gray-500"
                        }`}
                      >
                        {String(person.rank).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#1c281d]">
                        {person.image_url ? (
                          <img
                            src={person.image_url}
                            alt={person.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-black text-[#b9f27c]">
                            {getInitials(person.name)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-bold transition group-hover:text-[#b9f27c]">
                          {person.name}
                        </h3>
                        <p className="mt-1 truncate text-xs text-gray-500">
                          {person.company || "Company not specified"}
                          {person.country ? ` · ${person.country}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="col-start-2 sm:col-start-auto">
                      <p className="text-[10px] font-semibold tracking-wider text-gray-500 sm:hidden">
                        NET WORTH
                      </p>
                      <p className="font-black text-white sm:text-lg">
                        {money(wealth)}
                      </p>
                    </div>

                    <div className={`col-start-3 row-start-1 text-right sm:col-start-auto sm:row-start-auto`}>
                      <p className="text-[10px] font-semibold tracking-wider text-gray-500">
                        DAILY CHANGE
                      </p>
                      {person.daily_change_date ? (
                        <>
                          <p className={`mt-1 text-sm font-bold ${changeColor}`}>
                            {isPositive ? "▲ " : isNegative ? "▼ " : ""}
                            {percentage > 0 ? "+" : ""}
                            {percentage.toFixed(2)}%
                          </p>
                          <p className={`mt-1 text-[10px] ${changeColor}`}>
                            {change === null
                              ? "Amount unavailable"
                              : signedMoney(change)}
                          </p>
                        </>
                      ) : (
                        <p className="mt-2 text-xs text-gray-500">
                          Not available
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-[#101611] p-5 sm:p-6">
          <h2 className="font-bold text-white">Data information</h2>
          <div className="mt-4 grid gap-4 text-xs text-gray-400 sm:grid-cols-2">
            <div>
              <p className="text-gray-500">Latest database update</p>
              <p className="mt-1 font-semibold text-gray-200">
                {formatDate(latestUpdate || null)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Daily change data date</p>
              <p className="mt-1 font-semibold text-gray-200">
                {lastDailyDate || "Not available"}
              </p>
            </div>
          </div>
          <p className="mt-5 border-t border-white/10 pt-4 leading-6 text-gray-500">
            Wealth figures and daily changes reflect the latest records available
            in Econova&apos;s database. They are estimates and are not guaranteed
            to represent real-time market values.
          </p>
        </section>

        <div className="mt-8 text-center">
          <Link
            href="/billionaires/rankings"
            className="inline-flex items-center gap-2 rounded-xl bg-[#b9f27c] px-7 py-3 font-bold text-[#101610] transition hover:bg-[#d0ff9d]"
          >
            Explore Full Billionaire Rankings
            <span>→</span>
          </Link>
        </div>

        <footer className="mt-16 border-t border-white/10 py-7 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} ECONOVA. Global Wealth Intelligence.
        </footer>
      </div>
    </main>
  );
              }
