
"use client";

import { useEffect, useState } from "react";

type Economy = {
  country: string;
  code: string;
  gdp: number | null;
  year: string | null;
};

const GDP_INDICATOR = "NY.GDP.MKTP.CD";

function formatMoney(value: number | null) {
  if (value === null) return "داده موجود نیست";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function EconomiesPage() {
  const [economies, setEconomies] = useState<Economy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadEconomies() {
      try {
        setLoading(true);
        setError("");

        
const [countriesResponse, response] = await Promise.all([
  fetch(
    "https://api.worldbank.org/v2/country?format=json&per_page=400"
  ),
  fetch(
    `https://api.worldbank.org/v2/country/all/indicator/${GDP_INDICATOR}?format=json&per_page=20000&date=2020:2026`
  ),
]);

if (!countriesResponse.ok || !response.ok) {
  throw new Error("دریافت اطلاعات بانک جهانی ناموفق بود.");
}

const countriesResult = await countriesResponse.json();
const countryRows = countriesResult?.[1];

if (!Array.isArray(countryRows)) {
  throw new Error("فهرست کشورهای بانک جهانی معتبر نیست.");
}

const countryCodes = new Set<string>(
  countryRows
    .filter(
      (country: {
        id?: string;
        region?: { value?: string };
      }) =>
        country.id &&
        country.region?.value &&
        country.region.value !== "Aggregates"
    )
    .map((country: { id: string }) => country.id)
);

const result = await response.json();
const rows = result?.[1];

if (!Array.isArray(rows)) {
  throw new Error("داده‌های GDP معتبر نیستند.");
}

const latestByCountry = new Map<string, Economy>();

        for (const row of rows) {
          if (
            !row?.country?.id ||
            !row?.country?.value ||
            !row?.countryiso3code ||
            !countryCodes.has(row.countryiso3code) ||
            row.value === null
          ) {
            continue;
          }

          const code = row.countryiso3code;
          const previous = latestByCountry.get(code);

          if (!previous || Number(row.date) > Number(previous.year)) {
            latestByCountry.set(code, {
              country: row.country.value,
              code,
              gdp: Number(row.value),
              year: String(row.date),
            });
          }
        }

        const sorted = Array.from(latestByCountry.values()).sort(
          (a, b) => (b.gdp ?? 0) - (a.gdp ?? 0)
        );

        if (active) setEconomies(sorted);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "خطا در دریافت اطلاعات اقتصادی."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEconomies();

    return () => {
      active = false;
    };
  }, []);

const top20 = economies.slice(0, 20);

const visibleEconomies = (
  showAll ? economies : top20
).filter((economy) =>
  `${economy.country} ${economy.code}`
    .toLowerCase()
    .includes(searchTerm.trim().toLowerCase())
);

  return (
    <main className="min-h-screen bg-[#070b12] text-[#f4f2ec]">
      <header className="border-b border-white/10 px-5 py-5 md:px-10">
        <a href="/" className="text-sm text-[#d9bd77]">
          ← بازگشت به Econova
        </a>

        <div className="mx-auto mt-8 max-w-7xl">
          <p className="text-xs tracking-[0.3em] text-[#b9f27c]">
            ECONOVA • WORLD ECONOMIES
          </p>
          <h1 className="mt-3 text-3xl font-black md:text-5xl">
            اقتصادهای جهان
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-400">
            رتبه‌بندی اقتصاد کشورها بر اساس تولید ناخالص داخلی اسمی،
            با استفاده از داده‌های منتشرشده بانک جهانی.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-10">
        
<div className="mb-5 flex flex-col gap-3 sm:flex-row">
  <input
    type="search"
    value={searchTerm}
    onChange={(event) => setSearchTerm(event.target.value)}
    placeholder="جست‌وجوی نام کشور یا کد آن..."
    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-[#b9f27c]"
  />

  <button
    onClick={() => setShowAll((current) => !current)}
    className="shrink-0 rounded-xl border border-[#d9bd77]/40 px-4 py-3 text-sm text-[#d9bd77]"
  >
    {showAll ? "نمایش ۲۰ اقتصاد برتر" : "نمایش فهرست کامل"}
  </button>
</div>
        
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">۲۰ اقتصاد بزرگ</h2>
            <p className="mt-2 text-sm text-gray-400">
              معیار: GDP اسمی به دلار آمریکا
            </p>
          </div>

          <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-gray-300">
            منبع: World Bank
          </span>
        </div>

        {loading && (
          <p className="rounded-2xl border border-white/10 p-5 text-gray-300">
            در حال دریافت آمار اقتصادی واقعی...
          </p>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-900 bg-red-950/30 p-5">
            <p className="font-bold text-red-300">
              دریافت اطلاعات ناموفق بود
            </p>
            <p className="mt-2 text-sm text-gray-300">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl border border-white/20 px-4 py-2 text-sm"
            >
              تلاش دوباره
            </button>
          </div>
        )}

        {!loading && !error && top20.length === 0 && (
          <p className="rounded-2xl border border-white/10 p-5 text-gray-300">
            برای این بازه، داده اقتصادی قابل نمایش دریافت نشد.
          </p>
        )}

        {!loading && !error && top20.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[600px] text-right text-sm">
              <thead className="bg-white/[0.04] text-gray-400">
                <tr>
                  <th className="p-4">رتبه</th>
                  <th className="p-4">کشور / اقتصاد</th>
                  <th className="p-4">GDP اسمی</th>
                  <th className="p-4">سال داده</th>
                </tr>
              </thead>
              <tbody>
                {visibleEconomies.map((economy, index) => (
                  <tr
                    key={economy.code}
                    className="border-t border-white/[0.07] hover:bg-white/[0.03]"
                  >
                    <td className="p-4 font-bold text-[#b9f27c]">
                      {economies.findIndex((item) => item.code === economy.code) + 1}
                    </td>
                    <td className="p-4">
                      <div className="font-bold">{economy.country}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {economy.code}
                      </div>
                    </td>
                    <td className="p-4 font-semibold">
                      {formatMoney(economy.gdp)}
                    </td>
                    <td className="p-4 text-gray-400">
                      {economy.year ?? "نامشخص"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="mt-8 border-t border-white/10 pt-5 text-xs leading-6 text-gray-500">
          منبع: World Bank Open Data · شاخص GDP اسمی
          <br />
          کد شاخص: NY.GDP.MKTP.CD
          <br />
          سال هر مقدار در ستون مربوطه درج شده است. رتبه‌بندی بر اساس
          جدیدترین سال موجود برای هر کشور انجام می‌شود؛ بنابراین سال
          داده‌ها ممکن است بین کشورها متفاوت باشد.
          <br />
          <a
            href="https://data.worldbank.org/indicator/NY.GDP.MKTP.CD"
            target="_blank"
            rel="noreferrer"
            className="text-[#d9bd77] underline"
          >
            مشاهده منبع رسمی داده‌ها
          </a>
        </footer>
      </section>
    </main>
  );
            }
