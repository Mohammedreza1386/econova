
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "./crypto-detail.css";

type Point = {
  timestamp: number;
  price: number;
};

const coins: Record<string, { name: string; id: string }> = {
  BTC: { name: "بیت‌کوین", id: "bitcoin" },
  ETH: { name: "اتریوم", id: "ethereum" },
  BNB: { name: "بایننس کوین", id: "binancecoin" },
  SOL: { name: "سولانا", id: "solana" },
  XRP: { name: "ریپل", id: "ripple" },
  DOGE: { name: "دوج‌کوین", id: "dogecoin" },
  ADA: { name: "کاردانو", id: "cardano" },
  TRX: { name: "ترون", id: "tron" },
  TON: { name: "تون‌کوین", id: "the-open-network" },
  BCH: { name: "بیت‌کوین کش", id: "bitcoin-cash" },
};

const ranges = [
  { label: "۲۴ ساعت", days: "1" },
  { label: "۷ روز", days: "7" },
  { label: "۳۰ روز", days: "30" },
  { label: "۹۰ روز", days: "90" },
  { label: "۱ سال", days: "365" },
];

export default function CryptoDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const [symbol, setSymbol] = useState("");
  const [range, setRange] = useState("7");
  const [points, setPoints] = useState<Point[]>([]);
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    params.then((value) => {
      if (active) setSymbol(value.symbol.toUpperCase());
    });

    return () => {
      active = false;
    };
  }, [params]);

  useEffect(() => {
    if (!symbol || !coins[symbol]) return;

    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      setPoints([]);

      try {
        const response = await fetch(
          `/api/crypto/chart?symbol=${symbol}&days=${range}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("دریافت تاریخچه قیمت ناموفق بود.");
        }

        const data = await response.json();

        if (!Array.isArray(data.points) || data.points.length < 2) {
          throw new Error("داده تاریخی کافی برای این بازه موجود نیست.");
        }

        if (active) {
          setPoints(data.points);
          setPrice(
            typeof data.currentPrice === "number"
              ? data.currentPrice
              : data.points[data.points.length - 1].price
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "خطا در دریافت اطلاعات بازار"
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [symbol, range]);

  const coin = coins[symbol];

  const values = points.map((point) => point.price);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  const change = first > 0 ? ((last - first) / first) * 100 : 0;

  const chartPoints = points
    .map((point, index) => {
      const x =
        points.length > 1 ? (index / (points.length - 1)) * 1000 : 0;
      const y =
        max === min ? 150 : 280 - ((point.price - min) / (max - min)) * 250;
      return `${x},${y}`;
    })
    .join(" ");

  if (symbol && !coin) {
    return (
      <main className="crypto-detail-page" dir="rtl">
        <h1 className="text-2xl font-bold">رمزارز پیدا نشد</h1>
        <Link href="/" className="mt-5 inline-block text-lime-300">
          بازگشت به اکونوا
        </Link>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="crypto-detail-page"
    >
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm text-lime-300 hover:text-lime-200">
          ← بازگشت به اکونوا
        </Link>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#101512] p-5 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400">بازار رمزارزها · ECONOVA</p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">
                {coin?.name ?? "در حال بارگذاری..."}
              </h1>
              <p className="mt-2 text-sm text-gray-400">{symbol}</p>
            </div>

            <div className="text-left">
              <p className="text-sm text-gray-400">قیمت فعلی به دلار</p>
              <p className="mt-2 text-2xl font-bold" dir="ltr">
                {price === null
                  ? "—"
                  : `$${price.toLocaleString("en-US", {
                      maximumFractionDigits: 8,
                    })}`}
              </p>
              {points.length > 1 && (
                <p
                  className={`mt-2 text-sm font-bold ${
                    change >= 0 ? "text-lime-300" : "text-red-400"
                  }`}
                >
                  {change >= 0 ? "+" : ""}
                  {change.toFixed(2)}٪ در بازه انتخابی
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {ranges.map((item) => (
              <button
                key={item.days}
                onClick={() => setRange(item.days)}
                className={`rounded-xl border px-4 py-2 text-sm transition ${
                  range === item.days
                    ? "border-lime-300 bg-lime-300 text-black"
                    : "border-white/10 bg-black/20 text-gray-300 hover:border-lime-300/50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/5 bg-[#090d0b] p-3 md:p-5">
            {loading ? (
              <div className="flex h-64 items-center justify-center text-gray-400">
                در حال دریافت داده‌های واقعی بازار...
              </div>
            ) : error ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
                <p className="text-red-300">{error}</p>
                <button
                  onClick={() => setRange((value) => value)}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm"
                >
                  تلاش دوباره
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex justify-between text-xs text-gray-500">
                  <span>کمترین: ${min.toLocaleString("en-US", { maximumFractionDigits: 4 })}</span>
                  <span>بیشترین: ${max.toLocaleString("en-US", { maximumFractionDigits: 4 })}</span>
                </div>

                <svg
                  viewBox="0 0 1000 300"
                  className="h-64 w-full md:h-96"
                  role="img"
                  aria-label={`نمودار قیمت ${coin?.name}`}
                  preserveAspectRatio="none"
                >
                  {[50, 110, 170, 230, 290].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      x2="1000"
                      y1={y}
                      y2={y}
                      stroke="#263129"
                      strokeWidth="1"
                    />
                  ))}
                  <polyline
                    points={chartPoints}
                    fill="none"
                    stroke={change >= 0 ? "#b9f27c" : "#fb7185"}
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                <p className="mt-3 text-center text-xs text-gray-500">
                  نمودار بر اساس داده‌های تاریخی دریافتی از سرور اکونوا
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
                }

