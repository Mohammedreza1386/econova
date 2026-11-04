import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Top 25 Billionaires in the World | Econova",
  description:
    "Explore the world's top 25 billionaires, their net worth and daily wealth changes on Econova.",
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
    url.searchParams.set("limit", "25");

    const response = await fetch(url.toString(), {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error("Econova API error:", response.status);
      return [];
    }

    return (await response.json()) as Billionaire[];
  } catch (error) {
    console.error("Econova fetch failed:", error);
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
    <main
      dir="rtl"
      className="min-h-screen overflow-x-hidden bg-[#080b09] text-white"
    >
      <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">

        {/* HEADER */}

        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 sm:pb-6">
          <Link
            href="/"
            className="text-xl font-black tracking-[0.16em] text-[#b9f27c] sm:text-2xl sm:tracking-[0.2em]"
          >
            ECONOVA
          </Link>

          <nav
            dir="ltr"
            className="flex items-center gap-3 text-xs text-gray-400 sm:gap-5 sm:text-sm"
          >
            <Link href="/" className="transition hover:text-[#b9f27c]">
              Home
            </Link>

            <Link
              href="/billionaires/rankings"
              className="transition hover:text-[#b9f27c]"
            >
              Full Rankings
            </Link>
          </nav>
        </header>

        {/* HERO */}

        <section className="py-8 text-center sm:py-16">
          <div
            dir="ltr"
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#b9f27c]/20 bg-[#b9f27c]/5 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-[#b9f27c] sm:px-4 sm:py-2 sm:text-xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#b9f27c]" />
            ECONOVA WEALTH TRACKER
          </div>

          <h1
            dir="ltr"
            className="text-2xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl"
          >
            World&apos;s Top{" "}
            <span className="text-[#b9f27c]">25</span>{" "}
            Billionaires
          </h1>

          <p
            dir="ltr"
            className="mx-auto mt-3 max-w-2xl text-xs leading-6 text-gray-400 sm:mt-5 sm:text-base sm:leading-7"
          >
            Discover the world&apos;s wealthiest individuals and follow their
            daily net worth changes with Econova.
          </p>
        </section>

        {/* STATISTICS */}

        <section className="grid grid-cols-2 gap-2.5 sm:gap-4">
          <div className="min-w-0 rounded-xl border border-white/10 bg-[#101611] p-3 sm:rounded-2xl sm:p-6">
            <p
              dir="ltr"
              className="text-[9px] font-semibold tracking-wider text-gray-500 sm:text-xs sm:tracking-widest"
            >
              COMBINED WEALTH
            </p>

            <p
              dir="ltr"
              className="mt-2 break-all text-xl font-black text-[#b9f27c] sm:mt-3 sm:text-4xl"
            >
              <bdi>{money(totalWealth)}</bdi>
            </p>

            <p
              dir="ltr"
              className="mt-1 text-[9px] leading-4 text-gray-500 sm:mt-2 sm:text-xs"
            >
              Total wealth of the top 25
            </p>
          </div>

          <div className="min-w-0 rounded-xl border border-white/10 bg-[#101611] p-3 sm:rounded-2xl sm:p-6">
            <p
              dir="ltr"
              className="text-[9px] font-semibold tracking-wider text-gray-500 sm:text-xs sm:tracking-widest"
            >
              PEOPLE TRACKED
            </p>

            <p
              dir="ltr"
              className="mt-2 text-2xl font-black sm:mt-3 sm:text-4xl"
            >
              {billionaires.length}
              <span className="ml-1 text-sm font-medium text-gray-500 sm:ml-2 sm:text-base">
                / 25
              </span>
            </p>

            <p
              dir="ltr"
              className="mt-1 text-[9px] leading-4 text-gray-500 sm:mt-2 sm:text-xs"
            >
              Available ranking records
            </p>
          </div>
        </section>

        {/* RANKINGS */}

        <section className="mt-8 sm:mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2 sm:mb-5">
            <div>
              <p
                dir="ltr"
                className="text-[9px] font-bold tracking-[0.18em] text-[#b9f27c] sm:text-xs sm:tracking-[0.2em]"
              >
                GLOBAL WEALTH LEADERS
              </p>

              <h2
                dir="ltr"
                className="mt-1 text-xl font-black sm:mt-2 sm:text-3xl"
              >
                Top 25 Billionaire Rankings
              </h2>
            </div>

            <p
              dir="ltr"
              className="max-w-[150px] text-right text-[9px] leading-4 text-gray-500 sm:max-w-none sm:text-xs"
            >
              Daily changes based on Econova data
            </p>
          </div>

          {billionaires.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-[#101611] p-6 text-center sm:rounded-2xl sm:p-10">
              <p className="text-base font-bold sm:text-lg">
                Data temporarily unavailable
              </p>

              <p
                dir="ltr"
                className="mt-2 text-xs text-gray-500 sm:text-sm"
              >
                Please check the Supabase connection.
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {billionaires.map((person) => {
                const wealth = numberValue(person.net_worth_billions);

                const previousWealth =
                  person.yesterday_net_worth_billions;

                const hasPrevious =
                  previousWealth !== null &&
                  previousWealth !== undefined;

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
                    className="group grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 rounded-xl border border-white/10 bg-[#101611] p-2.5 transition duration-200 hover:border-[#b9f27c]/40 hover:bg-[#141d16] sm:grid-cols-[52px_minmax(0,1fr)_150px_150px] sm:gap-5 sm:rounded-2xl sm:p-5"
                  >
                    {/* RANK */}

                    <div className="row-span-2 text-center sm:row-span-1">
                      <span
                        dir="ltr"
                        className={`text-base font-black sm:text-xl ${
                          person.rank <= 3
                            ? "text-[#b9f27c]"
                            : "text-gray-500"
                        }`}
                      >
                        {String(person.rank).padStart(2, "0")}
                      </span>
                    </div>

                    {/* PERSON */}

                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#1c281d] sm:h-12 sm:w-12">
                        {person.image_url ? (
                          <img
                            src={person.image_url}
                            alt={person.name}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-black text-[#b9f27c]">
                            {getInitials(person.name)}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3
                          dir="ltr"
                          className="truncate text-xs font-bold text-right transition group-hover:text-[#b9f27c] sm:text-base"
                        >
                          {person.name}
                        </h3>

                        <p
                          dir="ltr"
                          className="mt-0.5 truncate text-right text-[9px] text-gray-500 sm:mt-1 sm:text-xs"
                        >
                          {person.company || "Company not specified"}
                          {person.country ? ` · ${person.country}` : ""}
                        </p>
                      </div>
                    </div>

                    {/* DAILY CHANGE */}

                    <div className="col-start-3 row-start-1 min-w-[76px] text-right sm:col-start-4 sm:row-start-1">
                      <p
                        dir="ltr"
                        className="text-[8px] font-semibold tracking-wider text-gray-500 sm:text-[10px]"
                      >
                        DAILY CHANGE
                      </p>

                      {person.daily_change_date ? (
                        <>
                          <p
                            dir="ltr"
                            className={`mt-1 text-center text-[10px] font-bold sm:text-sm ${changeColor}`}
                          >
                            <bdi>
                              {isPositive
                                ? "▲ "
                                : isNegative
                                  ? "▼ "
                                  : ""}
                              {percentage > 0 ? "+" : ""}
                              {percentage.toFixed(2)}%
                            </bdi>
                          </p>

                          <p
                            dir="ltr"
                            className={`mt-0.5 text-center text-[8px] sm:mt-1 sm:text-[10px] ${changeColor}`}
                          >
                            <bdi>
                              {change === null
                                ? "Amount unavailable"
                                : signedMoney(change)}
                            </bdi>
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 text-[9px] text-gray-500">
                          Not available
                        </p>
                      )}
                    </div>

                    {/* NET WORTH */}

                    <div className="col-start-2 row-start-2 sm:col-start-3 sm:row-start-1">
                      <p
                        dir="ltr"
                        className="text-[8px] font-semibold tracking-wider text-gray-500 sm:hidden"
                      >
                        NET WORTH
                      </p>

                      <p
                        dir="ltr"
                        className="text-right text-xs font-black text-white sm:text-lg"
                      >
                        <bdi>{money(wealth)}</bdi>
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* DATA INFORMATION */}

        <section className="mt-6 rounded-xl border border-white/10 bg-[#101611] p-3.5 sm:mt-8 sm:rounded-2xl sm:p-6">
          <h2
            dir="ltr"
            className="text-sm font-bold text-white sm:text-base"
          >
            Data Information
          </h2>

          <div className="mt-3 grid gap-3 text-[10px] text-gray-400 sm:mt-4 sm:grid-cols-2 sm:gap-4 sm:text-xs">
            <div>
              <p dir="ltr" className="text-gray-500">
                Latest database update
              </p>

              <p
                dir="ltr"
                className="mt-1 text-right font-semibold text-gray-200"
              >
                <bdi>{formatDate(latestUpdate || null)}</bdi>
              </p>
            </div>

            <div>
              <p dir="ltr" className="text-gray-500">
                Daily change data date
              </p>

              <p
                dir="ltr"
                className="mt-1 text-right font-semibold text-gray-200"
              >
                <bdi>{lastDailyDate || "Not available"}</bdi>
              </p>
            </div>
          </div>

          <p
            dir="ltr"
            className="mt-4 border-t border-white/10 pt-3 text-[10px] leading-5 text-gray-500 sm:mt-5 sm:pt-4 sm:text-xs sm:leading-6"
          >
            Wealth figures and daily changes reflect the latest records
            available in Econova&apos;s database. They are estimates and are
            not guaranteed to represent real-time market values.
          </p>
        </section>

        {/* FULL RANKINGS BUTTON */}

        <div className="mt-6 text-center sm:mt-8">
          <Link
            href="/billionaires/rankings"
            dir="ltr"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#b9f27c] px-4 py-3 text-xs font-bold text-[#101610] transition hover:bg-[#d0ff9d] sm:w-auto sm:px-7 sm:py-3 sm:text-sm"
          >
            Explore Full Billionaire Rankings
            <span>→</span>
          </Link>
        </div>

        {/* FOOTER */}

        <footer
          dir="ltr"
          className="mt-10 border-t border-white/10 py-5 text-center text-[9px] text-gray-600 sm:mt-16 sm:py-7 sm:text-xs"
        >
          © {new Date().getFullYear()} ECONOVA. Global Wealth Intelligence.
        </footer>
      </div>
    </main>
  )
 }
