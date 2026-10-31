
"use client";

import { useMemo, useState } from "react";

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
};

type HistoryPoint = {
  id: number;
  billionaire_id: string;
  billionaire_name: string;
  net_worth_billions: number | string;
  recorded_at: string;
  source_url: string | null;
};

type Props = {
  person: Billionaire;
  initialHistory: HistoryPoint[];
};

const money = (value: number | string | null | undefined) => {
  const number = Number(value);
  return `$${(Number.isFinite(number) ? number : 0).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })}B`;
};

const dateLabel = (value: string) =>
  new Date(value).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export default function ProfileClient({
  person,
  initialHistory,
}: Props) {
  const [historyRange, setHistoryRange] = useState<
    "all" | "week" | "month" | "year"
  >("all");

  const history = initialHistory;

  const firstHistoryRecord = history[0] ?? null;

  const lifetimeDelta = firstHistoryRecord
    ? Number(person.net_worth_billions) -
      Number(firstHistoryRecord.net_worth_billions)
    : null;

  const lifetimePercent =
    lifetimeDelta !== null &&
    firstHistoryRecord &&
    Number(firstHistoryRecord.net_worth_billions) > 0
      ? (lifetimeDelta /
          Number(firstHistoryRecord.net_worth_billions)) *
        100
      : null;

  const chartHistory = useMemo(() => {
    if (historyRange === "all") return history;

    const days =
      historyRange === "week"
        ? 7
        : historyRange === "month"
          ? 30
          : 365;

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    return history.filter(
      (point) => Date.parse(point.recorded_at) >= cutoff
    );
  }, [history, historyRange]);

  const chartPoints = useMemo(() => {
    if (chartHistory.length < 2) return "";

    const values = chartHistory.map((point) =>
      Number(point.net_worth_billions)
    );

    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = max - min || 1;

    return values
      .map((value, index) => {
        const x =
          (index / (values.length - 1)) * 100;
        const y = 90 - ((value - min) / spread) * 75;
        return `${x},${y}`;
      })
      .join(" ");
  }, [chartHistory]);

  const dailyChange = Number(person.daily_change_pct ?? 0);

  const image =
    person.image_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      person.name
    )}&background=14271d&color=b9f27c&size=400&bold=true`;

  return (
    <main className="profile-page" dir="rtl">
      <div className="profile-glow" />

      <header className="profile-header">
        <a className="brand" href="/">
          ECONOVA<span>.</span>
        </a>
        <a className="back-link" href="/billionaires/rankings">
          ← بازگشت به رتبه‌بندی
        </a>
      </header>

      <section className="profile-hero">
        <img
          className="profile-photo"
          src={image}
          alt={person.name}
        />

        <div className="profile-intro">
          <p className="eyebrow">
            ECONOVA · WEALTH PROFILE
          </p>

          <span className="rank-pill">
            رتبه فعلی #{person.rank}
          </span>

          <h1>{person.name}</h1>

          <p className="profile-meta">
            {person.company || "شرکت ثبت نشده"}
            {person.country ? ` · ${person.country}` : ""}
          </p>

          <p className="profile-bio">
            {person.bio ||
              "زندگی‌نامه‌ای برای این فرد در اکونوا ثبت نشده است."}
          </p>

          {person.source_url && (
            <a
              className="source-link"
              href={person.source_url}
              target="_blank"
              rel="noreferrer"
            >
              مشاهده منبع اطلاعات ↗
            </a>
          )}
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>ثروت فعلی تخمینی</span>
          <strong dir="ltr">
            {money(person.net_worth_billions)}
          </strong>
          <small>میلیارد دلار آمریکا</small>
        </article>

        <article className="stat-card">
          <span>تغییر روزانه</span>
          <strong
            dir="ltr"
            className={dailyChange >= 0 ? "positive" : "negative"}
          >
            {dailyChange > 0 ? "+" : ""}
            {dailyChange.toFixed(2)}%
          </strong>
          <small>بر اساس داده ثبت‌شده در اکونوا</small>
        </article>

        <article className="stat-card">
          <span>رتبه جهانی</span>
          <strong dir="ltr">#{person.rank}</strong>
          <small>رتبه فعلی در فهرست اکونوا</small>
        </article>

        <article className="stat-card lifetime-card">
          <span>تغییر ثروت از آغاز ثبت در اکونوا</span>

          {lifetimeDelta !== null &&
          lifetimePercent !== null &&
          firstHistoryRecord ? (
            <>
              <strong
                dir="ltr"
                className={
                  lifetimeDelta >= 0 ? "positive" : "negative"
                }
              >
                {lifetimeDelta >= 0 ? "+" : "−"}
                {money(Math.abs(lifetimeDelta))}
              </strong>

              <b
                dir="ltr"
                className={
                  lifetimeDelta >= 0 ? "positive" : "negative"
                }
              >
                {lifetimePercent >= 0 ? "+" : ""}
                {lifetimePercent.toFixed(2)}%
              </b>

              <small>
                مبنای اولیه:{" "}
                {money(firstHistoryRecord.net_worth_billions)}
              </small>

              <small>
                تاریخ اولین ثبت:{" "}
                {dateLabel(firstHistoryRecord.recorded_at)}
              </small>
            </>
          ) : (
            <>
              <strong>—</strong>
              <small>رکورد آغازین معتبر موجود نیست</small>
            </>
          )}
        </article>
      </section>

      <section className="history-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">WEALTH HISTORY</p>
            <h2>تاریخچه تغییرات ثروت</h2>
            <p>
              نمودار بر اساس تاریخچه واقعی ذخیره‌شده در پایگاه داده اکونوا ساخته شده است.
            </p>
          </div>

          <span className="record-count">
            {history.length.toLocaleString("fa-IR")} رکورد
          </span>
        </div>

        <div
          className="history-range"
          role="group"
          aria-label="بازه زمانی تاریخچه"
        >
          {(
            [
              ["all", "کل تاریخچه"],
              ["week", "هفته"],
              ["month", "ماه"],
              ["year", "سال"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={historyRange === value ? "active" : ""}
              aria-pressed={historyRange === value}
              onClick={() => setHistoryRange(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {history.length === 0 ? (
          <p className="empty">
            هنوز تاریخچه‌ای برای این فرد در اکونوا ثبت نشده است.
          </p>
        ) : chartHistory.length < 2 ? (
          <p className="empty">
            در این بازه برای رسم نمودار حداقل دو رکورد لازم است.
          </p>
        ) : (
          <div className="chart-wrap">
            <svg
              className="wealth-chart"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              role="img"
              aria-label={`نمودار تغییر ثروت ${person.name}`}
            >
              <line
                x1="0"
                y1="90"
                x2="100"
                y2="90"
                stroke="#294033"
                strokeWidth="0.5"
              />

              <line
                x1="0"
                y1="50"
                x2="100"
                y2="50"
                stroke="#294033"
                strokeWidth="0.35"
                strokeDasharray="2 2"
              />

              <polyline
                points={chartPoints}
                fill="none"
                stroke="#b9f27c"
                strokeWidth="1.7"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <div className="chart-foot">
              <span>{dateLabel(chartHistory[0].recorded_at)}</span>
              <strong dir="ltr">
                {money(
                  chartHistory[chartHistory.length - 1]
                    .net_worth_billions
                )}
              </strong>
              <span>
                {dateLabel(
                  chartHistory[chartHistory.length - 1].recorded_at
                )}
              </span>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="history-list">
            <div className="history-list-heading">
              <strong>رکوردهای این بازه</strong>
              <span>نمایش حداکثر ۱۰۰ رکورد اخیر</span>
            </div>

            {[...chartHistory]
              .reverse()
              .slice(0, 100)
              .map((point) => (
                <div className="history-row" key={point.id}>
                  <span>{dateLabel(point.recorded_at)}</span>
                  <strong dir="ltr">
                    {money(point.net_worth_billions)}
                  </strong>
                </div>
              ))}

            {chartHistory.length === 0 && (
              <p className="empty">
                در بازه انتخاب‌شده رکوردی ثبت نشده است.
              </p>
            )}
          </div>
        )}
      </section>

      <footer className="profile-footer">
        تمام مقادیر بر اساس اطلاعات فعلی و تاریخچه ذخیره‌شده در پایگاه داده Econova نمایش داده می‌شوند.
      </footer>

      <style jsx>{`
        .profile-page{position:relative;isolation:isolate;min-height:100vh;overflow:hidden;padding:24px;background:#080d0a;color:#f3f6f1;font-family:Arial,sans-serif;direction:rtl}
        .profile-glow{position:absolute;z-index:-1;top:-240px;right:8%;width:560px;height:560px;border-radius:50%;background:radial-gradient(circle,rgba(185,242,124,.11),transparent 68%);pointer-events:none}
        .profile-header,.profile-hero,.stats-grid,.history-card,.profile-footer{width:min(1100px,100%);margin-left:auto;margin-right:auto}
        .profile-header{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:34px}
        .brand{color:#f3f6f1;font-size:23px;font-weight:900;letter-spacing:1px;text-decoration:none}.brand span{color:#b9f27c}
        .back-link,.source-link{color:#b9f27c;text-decoration:none;font-size:13px}.back-link{border:1px solid #334a38;border-radius:999px;padding:10px 15px;background:#101812}
        .profile-hero{display:grid;grid-template-columns:240px minmax(0,1fr);gap:30px;align-items:center;padding:28px;margin-bottom:18px;border:1px solid #293b2e;border-radius:22px;background:linear-gradient(130deg,rgba(185,242,124,.075),#101812 42%,#0c120e);box-shadow:0 18px 50px #0004}
        .profile-photo{width:100%;aspect-ratio:1;object-fit:cover;border-radius:17px;border:1px solid #526b43;background:#14271d}
        .eyebrow{margin:0 0 10px;color:#b9f27c;font-size:10px;letter-spacing:2px;font-weight:800}.rank-pill{display:inline-block;padding:6px 11px;border:1px solid #40583b;border-radius:999px;color:#c8e6b4;background:#b9f27c0d;font-size:11px}
        h1{margin:12px 0;font-size:clamp(30px,5vw,48px);line-height:1.2}.profile-meta{color:#d2ded3;font-size:14px}.profile-bio{color:#a7b4aa;line-height:2;white-space:pre-wrap}.source-link{display:inline-block;margin-top:8px}
        .stats-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-bottom:18px}
        .stat-card,.history-card{min-width:0;padding:21px;border:1px solid #293b2e;border-radius:17px;background:#101812}
        .stat-card{display:flex;flex-direction:column;align-items:flex-start;gap:8px}.stat-card>span{color:#a7b4aa;font-size:12px}.stat-card>strong{margin:4px 0;font-size:clamp(23px,3vw,32px);font-variant-numeric:tabular-nums}.stat-card>small{color:#9eafa2;font-size:11px;line-height:1.7}.stat-card>b{font-size:17px;font-variant-numeric:tabular-nums}
        .lifetime-card{border-color:#536d3d;background:linear-gradient(145deg,#172218,#101812 70%)}.positive{color:#b9f27c}.negative{color:#ff8585}
        [dir="ltr"]{direction:ltr;unicode-bidi:isolate;text-align:left;font-variant-numeric:tabular-nums}
        .history-card{margin-top:0}.section-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}.section-heading h2{margin:4px 0 8px;font-size:clamp(20px,3vw,27px)}.section-heading p:not(.eyebrow){margin:0;color:#93a197;font-size:12px;line-height:1.8}.record-count{white-space:nowrap;color:#b9f27c;font-size:12px}
        .history-range{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0 12px}.history-range button{border:1px solid #344a39;border-radius:999px;padding:9px 15px;color:#c9d4cb;background:#151f18;font:inherit;font-size:12px;cursor:pointer}.history-range button.active{color:#10160e;background:#b9f27c;border-color:#b9f27c;font-weight:800}
        .chart-wrap{padding:18px;border:1px solid #24372a;border-radius:14px;background:#0a110c}.wealth-chart{display:block;width:100%;height:230px;overflow:visible}.chart-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;color:#9ba99e;font-size:10px}.chart-foot strong{color:#eaf2eb;font-size:13px}
        .empty{padding:18px;color:#a7b4aa;line-height:1.9}.history-list{margin-top:20px}.history-list-heading{display:flex;justify-content:space-between;gap:10px;margin-bottom:8px;color:#dce6dd;font-size:12px}.history-list-heading span{color:#87968b;font-size:10px}.history-row{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:13px 2px;border-bottom:1px solid #25342a;color:#aab7ac;font-size:12px}.history-row strong{color:#e9f0e9;font-size:13px}.profile-footer{padding:22px 4px;color:#819087;font-size:11px;line-height:1.8}
        @media(max-width:650px){.profile-page{padding:14px}.profile-header{margin-bottom:20px}.profile-hero{grid-template-columns:1fr;padding:18px;gap:18px}.profile-photo{max-width:210px;margin:0 auto}.stats-grid{grid-template-columns:1fr;gap:10px}.stat-card,.history-card{padding:16px}.section-heading{flex-direction:column}.wealth-chart{height:190px}.history-row{font-size:11px}}
      `}</style>
    </main>
  );
}
