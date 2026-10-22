
"use client";

import { useEffect, useState } from "react";

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

const URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ||
  "https://zusbebjskchgehdjvpsm.supabase.co";

const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const money = (value: number | string | null | undefined) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })}B`;

export default function BillionaireProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [personId, setPersonId] = useState("");
  const [person, setPerson] = useState<Billionaire | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    params.then(({ id }) => {
      if (!cancelled) setPersonId(id);
    });

    return () => {
      cancelled = true;
    };
  }, [params]);

  useEffect(() => {
    if (!personId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const headers = { apikey: KEY };

        const personResponse = await fetch(
          `${URL}/rest/v1/billionaires?select=*&id=eq.${encodeURIComponent(personId)}&limit=1`,
          { headers, cache: "no-store" }
        );

        if (!personResponse.ok) {
          throw new Error("دریافت اطلاعات ثروتمند ناموفق بود.");
        }

        const people = (await personResponse.json()) as Billionaire[];

        if (!people.length) {
          throw new Error("این ثروتمند در پایگاه داده پیدا نشد.");
        }

        const current = people[0];

        const historyResponse = await fetch(
          `${URL}/rest/v1/billionaire_wealth_history?select=id,billionaire_id,billionaire_name,net_worth_billions,recorded_at,source_url&billionaire_id=eq.${encodeURIComponent(String(current.id))}&order=recorded_at.asc&limit=100`,
          { headers, cache: "no-store" }
        );

        const historyData = historyResponse.ok
          ? ((await historyResponse.json()) as HistoryPoint[])
          : [];

        if (!cancelled) {
          setPerson(current);
          setHistory(historyData);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "خطایی رخ داد."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [personId]);

  const chartValues = history.map((point) =>
    Number(point.net_worth_billions)
  );

  const minValue = Math.min(...chartValues);
  const maxValue = Math.max(...chartValues);
  const spread = maxValue - minValue || 1;

  const chartPoints = chartValues
    .map((value, index) => {
      const x =
        chartValues.length === 1
          ? 50
          : (index / (chartValues.length - 1)) * 100;

      const y = 90 - ((value - minValue) / spread) * 75;

      return `${x},${y}`;
    })
    .join(" ");

  if (loading) {
    return (
      <main className="profile-page">
        <p className="status">در حال دریافت اطلاعات...</p>
      </main>
    );
  }

  if (error || !person) {
    return (
      <main className="profile-page">
        <a className="back-link" href="/billionaires">
          ← بازگشت به ثروتمندان
        </a>
        <p className="status">{error || "اطلاعات پیدا نشد."}</p>
      </main>
    );
  }

  const image =
    person.image_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      person.name
    )}&background=14271d&color=b9f27c&size=400&bold=true`;

  const change = Number(person.daily_change_pct || 0);

  return (
    <main className="profile-page">
      <header className="profile-header">
        <a className="brand" href="/">
          ECONOVA<span>.</span>
        </a>
        <a className="back-link" href="/billionaires">
          ← همهٔ ثروتمندان
        </a>
      </header>

      <section className="profile-hero">
        <div className="profile-photo-wrap">
          <img
            className="profile-photo"
            src={image}
            alt={person.name}
          />
        </div>

        <div className="profile-intro">
          <p className="eyebrow">ECONOVA • WEALTH PROFILE</p>
          <p className="rank">رتبهٔ فعلی: #{person.rank}</p>
          <h1>{person.name}</h1>
          <p className="profile-meta">
            {person.company || "شرکت ثبت نشده"}
            {person.country ? ` • ${person.country}` : ""}
          </p>
          <p className="profile-bio">
            {person.bio || "زندگی‌نامه‌ای برای این فرد ثبت نشده است."}
          </p>
          {person.source_url && (
            <a
              className="source-link"
              href={person.source_url}
              target="_blank"
              rel="noreferrer"
            >
              مشاهدهٔ منبع اطلاعات ↗
            </a>
          )}
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>ثروت تخمینی</span>
          <strong>{money(person.net_worth_billions)}</strong>
          <small>میلیارد دلار آمریکا</small>
        </article>

        <article className="stat-card">
          <span>تغییر روزانه</span>
          <strong className={change >= 0 ? "positive" : "negative"}>
            {change > 0 ? "+" : ""}
            {change.toFixed(2)}%
          </strong>
          <small>طبق دادهٔ ثبت‌شده</small>
        </article>

        <article className="stat-card">
          <span>رتبهٔ جهانی</span>
          <strong>#{person.rank}</strong>
          <small>بر اساس رتبهٔ فعلی پایگاه داده</small>
        </article>
      </section>

      <section className="history-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">WEALTH HISTORY</p>
            <h2>تاریخچهٔ ثروت</h2>
          </div>
          <span>{history.length} رکورد</span>
        </div>

        {history.length === 0 ? (
          <p className="empty">
            هنوز تاریخچه‌ای برای این فرد ثبت نشده است.
          </p>
        ) : (
          <>
            <div className="chart">
              {history.length > 1 ? (
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="نمودار تغییرات ثروت ثبت‌شده"
                >
                  <line
                    x1="0"
                    y1="90"
                    x2="100"
                    y2="90"
                    stroke="#294033"
                    strokeWidth="0.5"
                  />
                  <polyline
                    points={chartPoints}
                    fill="none"
                    stroke="#b9f27c"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              ) : (
                <p className="empty">
                  برای نمایش روند نمودار، حداقل دو رکورد لازم است.
                </p>
              )}
            </div>

            <div className="history-list">
              {[...history].reverse().map((point) => (
                <div className="history-row" key={point.id}>
                  <span>
                    {new Date(point.recorded_at).toLocaleDateString(
                      "fa-IR"
                    )}
                  </span>
                  <strong>
                    {money(point.net_worth_billions)}
                  </strong>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <footer className="profile-footer">
        اطلاعات بر اساس رکوردهای موجود در پایگاه دادهٔ Econova نمایش داده می‌شود.
      </footer>

      <style jsx>{`
        .profile-page {
          min-height: 100vh;
          padding: 24px;
          background: #080d0a;
          color: #f3f6f1;
          font-family: Arial, sans-serif;
          direction: rtl;
        }

        .profile-header {
          max-width: 1100px;
          margin: 0 auto 44px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .brand {
          color: #f3f6f1;
          font-size: 22px;
          font-weight: 900;
          text-decoration: none;
          letter-spacing: 1px;
        }

        .brand span {
          color: #b9f27c;
        }

        .back-link,
        .source-link {
          color: #b9f27c;
          text-decoration: none;
        }

        .profile-hero {
          max-width: 1100px;
          margin: 0 auto 28px;
          padding: 28px;
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 32px;
          align-items: center;
          background: #101812;
          border: 1px solid #26372b;
          border-radius: 20px;
        }

        .profile-photo-wrap {
          width: 100%;
          aspect-ratio: 1;
          overflow: hidden;
          border-radius: 16px;
          background: #14271d;
        }

        .profile-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .eyebrow {
          color: #b9f27c;
          font-size: 12px;
          letter-spacing: 2px;
        }

        .rank {
          color: #a7b4aa;
        }

        h1 {
          margin: 12px 0;
          font-size: clamp(30px, 5vw, 48px);
        }

        .profile-meta {
          color: #c2d0c5;
        }

        .profile-bio {
          color: #a7b4aa;
          line-height: 1.9;
          white-space: pre-wrap;
        }

        .stats-grid {
          max-width: 1100px;
          margin: 0 auto 28px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .stat-card,
        .history-card {
          background: #101812;
          border: 1px solid #26372b;
          border-radius: 16px;
          padding: 22px;
        }

        .stat-card span,
        .stat-card small {
          display: block;
          color: #a7b4aa;
        }

        .stat-card strong {
          display: block;
          margin: 14px 0;
          font-size: clamp(22px, 3vw, 32px);
          overflow-wrap: anywhere;
        }

        .positive {
          color: #b9f27c;
        }

        .negative {
          color: #ff8585;
        }

        .history-card {
          max-width: 1100px;
          margin: 0 auto;
        }

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .section-heading h2 {
          margin-top: 8px;
        }

        .section-heading > span {
          color: #b9f27c;
        }

        .chart {
          height: 220px;
          margin: 24px 0;
          padding: 12px;
          border-radius: 12px;
          background: #0a110c;
        }

        .chart svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .history-list {
          display: grid;
          gap: 10px;
        }

        .history-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #26372b;
        }

        .history-row span,
        .empty,
        .status {
          color: #a7b4aa;
        }

        .profile-footer,
        .status {
          max-width: 1100px;
          margin: 28px auto;
          line-height: 1.8;
        }

        @media (max-width: 650px) {
          .profile-page {
            padding: 14px;
          }

          .profile-header {
            margin-bottom: 22px;
          }

          .profile-hero {
            grid-template-columns: 1fr;
            padding: 18px;
            gap: 20px;
          }

          .profile-photo-wrap {
            max-width: 220px;
            margin: 0 auto;
          }

          .stats-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .stat-card,
          .history-card {
            padding: 16px;
          }
        }
      `}</style>
    </main>
  );
        }
