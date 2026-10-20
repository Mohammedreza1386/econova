
"use client";

import { useEffect, useMemo, useState } from "react";

type Billionaire = {
  id?: string | number;
  rank: number;
  name: string;
  company?: string | null;
  country?: string | null;
  net_worth_billions: number;
  daily_change_pct?: number | null;
  updated_at?: string | null;
  source_url?: string | null;
  source_checked_at?: string | null;
  image_url?: string | null;
};

const SUPABASE_URL = "https://zusbebjskchgehdjvpsm.supabase.co";
const SUPABASE_KEY =
  "sb_publishable_WGMEA7-K8FAResrVCL8GJQ_6KCxrvmK";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 1,
  }).format(value * 1_000_000_000);
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("");
}

function formatDate(value?: string | null) {
  if (!value) return "زمان ثبت نامشخص";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "زمان ثبت نامشخص";

  return date.toLocaleString("fa-IR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function changeClass(value?: number | null) {
  if (!value || value === 0) return "change-neutral";
  return value > 0 ? "change-positive" : "change-negative";
}

function changeText(value?: number | null) {
  const number = Number(value || 0);
  const sign = number > 0 ? "+" : "";
  return `${sign}${number.toFixed(2)}%`;
}

export default function BillionairesPage() {
  const [people, setPeople] = useState<Billionaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function loadPeople() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/billionaires?select=rank,name,company,country,net_worth_billions,daily_change_pct,updated_at,source_url,source_checked_at&order=rank.asc&limit=30`,
          {
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `دریافت اطلاعات ناموفق بود (${response.status}).`
          );
        }

        const rows = (await response.json()) as Billionaire[];

        if (!Array.isArray(rows)) {
          throw new Error("ساختار اطلاعات دریافتی معتبر نیست.");
        }

        if (!cancelled) {
          setPeople(
            rows
              .map((person) => ({
                ...person,
                rank: Number(person.rank),
                net_worth_billions: Number(
                  person.net_worth_billions || 0
                ),
                daily_change_pct: Number(
                  person.daily_change_pct || 0
                ),
              }))
              .sort((a, b) => a.rank - b.rank)
              .slice(0, 30)
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "خطا در دریافت اطلاعات ثروتمندان."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPeople();

    return () => {
      cancelled = true;
    };
  }, []);

  const topFive = useMemo(
    () => [...people].sort((a, b) => a.rank - b.rank).slice(0, 5),
    [people]
  );

  const topTen = useMemo(
    () =>
      [...people]
        .filter((person) => person.rank <= 10)
        .sort((a, b) => a.rank - b.rank),
    [people]
  );

  const topTenTotal = useMemo(
    () =>
      topTen.reduce(
        (total, person) => total + person.net_worth_billions,
        0
      ),
    [topTen]
  );

  useEffect(() => {
    let animationId = 0;
    let startTime: number | null = null;
    const duration = 2200;

    setAnimatedTotal(0);

    if (topTenTotal <= 0) return;

    const animate = (time: number) => {
      if (startTime === null) startTime = time;

      const progress = Math.min(
        (time - startTime) / duration,
        1
      );
      const eased = 1 - Math.pow(1 - progress, 4);

      setAnimatedTotal(topTenTotal * eased);

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [topTenTotal]);

  useEffect(() => {
    let cancelled = false;

    async function loadPhotos() {
      const results = await Promise.all(
        people.map(async (person) => {
          if (person.image_url) {
            return [person.name, person.image_url] as const;
          }

          try {
            const url =
              "https://en.wikipedia.org/w/api.php" +
              "?action=query&generator=search" +
              "&gsrnamespace=0&gsrlimit=1" +
              "&prop=pageimages&piprop=thumbnail" +
              "&pithumbsize=320&format=json&origin=*" +
              "&gsrsearch=" +
              encodeURIComponent(person.name);

            const response = await fetch(url);

            if (!response.ok) {
              return [person.name, ""] as const;
            }

            const data = await response.json();
            const pages = Object.values(
              data.query?.pages ?? {}
            ) as Array<{
              thumbnail?: { source?: string };
            }>;

            return [
              person.name,
              pages[0]?.thumbnail?.source ?? "",
            ] as const;
          } catch {
            return [person.name, ""] as const;
          }
        })
      );

      if (!cancelled) {
        setPhotoUrls(Object.fromEntries(results));
      }
    }

    if (people.length) void loadPhotos();

    return () => {
      cancelled = true;
    };
  }, [people]);

  return (
    <main className="econova-page">
      <div className="econova-container">
        <header className="page-header">
          <p className="eyebrow">ECONOVA · GLOBAL WEALTH</p>
          <h1>ثروتمندترین افراد جهان</h1>
          <p className="subtitle">
            بررسی ثروت، رتبه و تغییرات ثبت‌شدهٔ ثروتمندان جهان
          </p>
        </header>

        <section className="total-card">
          <p className="total-label">
            مجموع ثروت ۱۰ نفر اول جهان
          </p>

          <div className="total-value" dir="ltr">
            {money(animatedTotal)}
          </div>

          <div className="total-progress">
            <span
              style={{
                width: `${
                  topTenTotal > 0
                    ? (animatedTotal / topTenTotal) * 100
                    : 0
                }%`,
              }}
            />
          </div>

          <p className="total-note">
            <span dir="ltr">{topTen.length}</span> نفر محاسبه‌شده
            {" · "}
            ارقام بر اساس اطلاعات ثبت‌شده در دیتابیس
          </p>
        </section>

        <section className="wealth-ticker" aria-label="خلاصه ثروت">
          <div className="ticker-track">
            {[0, 1].map((copy) => (
              <div className="ticker-group" key={copy}>
                <span>مجموع ثروت ۱۰ نفر اول: {money(topTenTotal)}</span>
                <span>تعداد رکوردهای دریافت‌شده: {people.length}</span>
                <span>رتبه‌بندی ثروتمندان جهان · ECONOVA</span>
              </div>
            ))}
          </div>
        </section>

        {loading && (
          <div className="status-message">
            <span className="loading-dot" />
            در حال دریافت اطلاعات ثروتمندان...
          </div>
        )}

        {!loading && error && (
          <div className="error-message">
            <h2>دریافت اطلاعات با مشکل روبه‌رو شد</h2>
            <p>{error}</p>
            <p>
              اتصال دیتابیس، دسترسی خواندن جدول و نام ستون‌ها را
              بررسی کن.
            </p>
          </div>
        )}

        {!loading && !error && people.length === 0 && (
          <div className="empty-message">
            هنوز اطلاعاتی برای نمایش در دیتابیس وجود ندارد.
          </div>
        )}

        {!loading && !error && people.length > 0 && (
          <>
            <section className="top-section">
              <div className="section-heading">
                <div className="section-number">01</div>
                <div>
                  <h2>۵ ثروتمند برتر جهان</h2>
                  <p>فهرست عمودی همراه با عکس و ارزش دارایی</p>
                </div>
              </div>

              <div className="top-list">
                {topFive.map((person) => {
                  const photo =
                    photoUrls[person.name] || person.image_url || "";

                  const estimatedChange =
                    person.net_worth_billions *
                    Number(person.daily_change_pct || 0) /
                    100;

                  return (
                    <article
                      className="person-card"
                      key={`${person.rank}-${person.name}`}
                    >
                      <span className="person-rank">
                        #{person.rank}
                      </span>

                      <div className="person-photo">
                        <span className="photo-fallback">
                          {initials(person.name)}
                        </span>

                        {photo && (
                          <img
                            src={photo}
                            alt={`عکس ${person.name}`}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                      </div>

                      <div className="person-info">
                        <p className="person-label">WORLD RANKING</p>
                        <h3>{person.name}</h3>
                        <p className="person-company">
                          {person.company || "شرکت ثبت نشده"}
                        </p>
                        <p className="person-country">
                          {person.country || "کشور ثبت نشده"}
                        </p>
                      </div>

                      <div className="person-wealth">
                        <p>ارزش دارایی ثبت‌شده</p>
                        <strong>{money(person.net_worth_billions)}</strong>
                        <span
                          className={changeClass(person.daily_change_pct)}
                        >
                          {changeText(person.daily_change_pct)}
                        </span>
                        <p className="estimated-change">
                          تغییر دلاری تخمینی:{" "}
                          <b dir="ltr">
                            {money(estimatedChange)}
                          </b>
                        </p>
                      </div>

                      <p className="person-updated">
                        آخرین ثبت: {formatDate(person.updated_at)}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="table-section">
              <div className="table-heading">
                <div>
                  <h2>۳۰ ثروتمند برتر جهان</h2>
                  <p>
                    تعداد رکوردهای نمایش‌داده‌شده: {people.length}
                  </p>
                </div>

                <span className="live-indicator">
                  <span />
                  داده‌های دیتابیس
                </span>
              </div>

              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>رتبه</th>
                      <th>عکس</th>
                      <th>نام</th>
                      <th>شرکت</th>
                      <th>کشور</th>
                      <th>ثروت</th>
                      <th>تغییر روزانه</th>
                    </tr>
                  </thead>

                  <tbody>
                    {people.map((person) => {
                      const photo =
                        photoUrls[person.name] ||
                        person.image_url ||
                        "";

                      return (
                        <tr key={`${person.rank}-${person.name}`}>
                          <td>
                            <span className="rank-badge">
                              {person.rank}
                            </span>
                          </td>
                          <td>
                            <div className="table-photo">
                              <span>{initials(person.name)}</span>
                              {photo && (
                                <img
                                  src={photo}
                                  alt={`عکس ${person.name}`}
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                  onError={(event) => {
                                    event.currentTarget.style.display =
                                      "none";
                                  }}
                                />
                              )}
                            </div>
                          </td>
                          <td className="table-name">{person.name}</td>
                          <td>{person.company || "—"}</td>
                          <td>{person.country || "—"}</td>
                          <td className="table-wealth" dir="ltr">
                            {money(person.net_worth_billions)}
                          </td>
                          <td
                            className={changeClass(person.daily_change_pct)}
                            dir="ltr"
                          >
                            {changeText(person.daily_change_pct)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
      
            <footer className="page-footer">
              <p>
                منبع مرجع اطلاعات:{" "}
                <a
                  href="https://www.forbes.com/real-time-billionaires/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Forbes Real-Time Billionaires
                </a>
              </p>
              <p>
                اطلاعات این صفحه از دیتابیس دریافت می‌شود؛ نمایش آن
                به‌معنای به‌روزرسانی لحظه‌ای نیست.
              </p>
              <p>
                تغییر دلاری تخمینی است و از درصد تغییر ثبت‌شده محاسبه
                می‌شود.
              </p>
            </footer>
          </>
        )}
      </div>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #07111f;
        }

        .econova-page {
          min-height: 100vh;
          padding: 28px 14px 44px;
          color: #f8fafc;
          direction: rtl;
          font-family: Arial, sans-serif;
          background:
            radial-gradient(ellipse at 50% 0%, #123b3a 0%, transparent 45%),
            linear-gradient(145deg, #07111f, #101d32 55%, #07111f);
        }

        .econova-container {
          max-width: 1120px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 26px;
          text-align: center;
        }

        .eyebrow {
          color: #34d399;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          direction: ltr;
        }

        .page-header h1 {
          margin: 10px 0;
          font-size: clamp(26px, 5vw, 42px);
          line-height: 1.5;
          font-weight: 800;
        }

        .subtitle {
          color: #94a3b8;
          font-size: 13px;
          line-height: 1.9;
        }

        .total-card {
          margin-bottom: 18px;
          padding: 22px 16px;
          text-align: center;
          border: 1px solid #10b98155;
          border-radius: 20px;
          background: linear-gradient(135deg, #064e3b80, #0f172aee);
          box-shadow: 0 18px 45px #00000025;
        }

        .total-label {
          margin: 0;
          color: #6ee7b7;
          font-size: 14px;
        }

        .total-value {
          margin: 10px 0;
          color: #ecfdf5;
          font-size: clamp(24px, 4.5vw, 38px);
          font-weight: 900;
          overflow-wrap: anywhere;
          font-variant-numeric: tabular-nums;
        }

        .total-progress {
          max-width: 500px;
          height: 6px;
          margin: 14px auto;
          overflow: hidden;
          border-radius: 20px;
          background: #ffffff12;
        }

        .total-progress span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #10b981, #a7f3d0);
          transition: width 0.06s linear;
        }

        .total-note {
          margin: 0;
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.9;
        }

        .wealth-ticker {
          margin: 0 0 28px;
          overflow: hidden;
          border: 1px solid #10b98140;
          border-radius: 10px;
          background: #064e3b40;
        }

        .ticker-track {
          display: flex;
          width: max-content;
          animation: econova-marquee 32s linear infinite;
          will-change: transform;
        }

        .ticker-group {
          display: flex;
          flex-shrink: 0;
          align-items: center;
        }

        .ticker-track span {
          flex-shrink: 0;
          padding: 9px 16px;
          color: #a7f3d0;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .wealth-ticker:hover .ticker-track {
          animation-play-state: paused;
        }

        @keyframes econova-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(50%);
          }
        }

        .section-heading,
        .table-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .section-heading {
          justify-content: flex-start;
        }

        .section-number {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          border: 1px solid #10b98155;
          border-radius: 12px;
          background: #064e3b55;
          color: #6ee7b7;
          font-weight: 800;
        }

        .section-heading h2,
        .table-heading h2 {
          margin: 0;
          font-size: 21px;
        }

        .section-heading p,
        .table-heading p {
          margin: 5px 0 0;
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.8;
        }

        .top-section {
          margin-bottom: 34px;
        }

        .top-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 2px;
        }

        .person-card {
          position: relative;
          display: grid;
          grid-template-columns: 84px minmax(0, 1fr);
          align-items: center;
          gap: 14px;
          min-width: 0;
          padding: 17px;
          border: 1px solid #2b405b;
          border-radius: 18px;
          background: linear-gradient(145deg, #16253b, #0d1728);
          box-shadow: 0 10px 28px #00000020;
          transition: border-color 0.2s, transform 0.2s;
        }

        .person-card:hover {
          border-color: #10b981;
          transform: translateY(-2px);
        }

        .person-rank {
          position: absolute;
          top: 12px;
          left: 14px;
          color: #34d399;
          font-size: 19px;
          font-weight: 900;
          direction: ltr;
        }

        .person-photo {
          position: relative;
          display: grid;
          place-items: center;
          width: 84px;
          height: 84px;
          overflow: hidden;
          border: 2px solid #10b98166;
          border-radius: 18px;
          background: linear-gradient(135deg, #064e3b, #1e293b);
        }

        .person-photo img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-fallback {
          color: #a7f3d0;
          font-size: 22px;
          font-weight: 800;
        }

        .person-info {
          width: 100%;
          min-width: 0;
          padding-left: 26px;
        }

        .person-label {
          margin: 0 0 5px;
          color: #34d399;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .person-info h3 {
          margin: 0 0 7px;
          font-size: 17px;
          overflow-wrap: anywhere;
        }

        .person-company,
        .person-country {
          margin: 3px 0 0;
          color: #cbd5e1;
          font-size: 12px;
          line-height: 1.8;
        }

        .person-country {
          color: #94a3b8;
        }

        .person-wealth {
          grid-column: 1 / -1;
          width: 100%;
          margin-top: 2px;
          padding-top: 12px;
          border-top: 1px solid #2b405b;
          direction: ltr;
          text-align: left;
        }

        .person-wealth p {
          margin: 0 0 7px;
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.8;
        }

        .person-wealth strong {
          display: block;
          color: #6ee7b7;
          font-size: 25px;
          overflow-wrap: anywhere;
        }

        .person-wealth span {
          display: block;
          margin-top: 7px;
          font-size: 12px;
        }

        .person-wealth small {
          color: #94a3b8;
          font-size: 10px;
        }

        .person-wealth .estimated-change {
          margin-top: 8px;
          color: #94a3b8;
          direction: rtl;
          text-align: right;
        }

        .estimated-change b {
          color: #e2e8f0;
        }

        .person-updated {
          grid-column: 1 / -1;
          margin: 0;
          color: #64748b;
          font-size: 10px;
          line-height: 1.8;
        }

        .change-positive {
          color: #34d399 !important;
        }

        .change-negative {
          color: #fb7185 !important;
        }

        .change-neutral {
          color: #94a3b8 !important;
        }

        .table-section {
          overflow: hidden;
          border: 1px solid #24364d;
          border-radius: 18px;
          background: #0d1728;
        }

        .table-heading {
          margin: 0;
          padding: 18px;
          border-bottom: 1px solid #24364d;
        }

        .live-indicator {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #94a3b8;
          font-size: 10px;
          white-space: nowrap;
        }

        .live-indicator span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #34d399;
        }

        .table-scroll {
          width: 100%;
          overflow-x: auto;
        }

        .table-scroll table {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
          color: #cbd5e1;
          text-align: right;
        }

        .table-scroll th,
        .table-scroll td {
          padding: 13px;
          border-bottom: 1px solid #24364d;
          white-space: nowrap;
        }

        .table-scroll th {
          background: #1e3048;
          color: #6ee7b7;
          font-size: 11px;
        }

        .table-scroll tbody tr:nth-child(even) {
          background: #142238;
        }

        .table-scroll tbody tr:hover {
          background: #20334a;
        }

        .table-name {
          color: #f8fafc;
          font-weight: 700;
        }

        .table-wealth {
          color: #6ee7b7;
          font-weight: 700;
        }

        .rank-badge {
          display: inline-grid;
          place-items: center;
          min-width: 28px;
          height: 28px;
          padding: 0 6px;
          border-radius: 8px;
          background: #064e3b70;
          color: #6ee7b7;
          font-weight: 800;
        }

        .table-photo {
          position: relative;
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          overflow: hidden;
          border-radius: 50%;
          background: #064e3b;
          color: #a7f3d0;
          font-size: 11px;
          font-weight: 800;
        }

        .table-photo img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .page-footer {
          margin-top: 24px;
          color: #94a3b8;
          font-size: 11px;
          line-height: 2;
          text-align: center;
        }

        .page-footer a {
          color: #34d399;
          text-decoration: underline;
        }

        .status-message,
        .empty-message,
        .error-message {
          margin: 20px 0;
          padding: 20px;
          border: 1px solid #2b405b;
          border-radius: 15px;
          background: #0d1728;
          color: #cbd5e1;
          text-align: center;
          line-height: 1.9;
        }

        .status-message {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .loading-dot {
          width: 8px;
          height: 8px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #34d399;
          animation: econova-pulse 1s infinite alternate;
        }

        .error-message {
          border-color: #f8717155;
          color: #fca5a5;
        }

        .error-message h2 {
          margin-top: 0;
        }

        @keyframes econova-pulse {
          from {
            opacity: 0.3;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1.15);
          }
        }

        @media (max-width: 600px) {
          .econova-page {
            padding: 22px 10px 36px;
          }

          .person-card {
            grid-template-columns: 70px minmax(0, 1fr);
            gap: 11px;
            padding: 13px;
          }

          .person-photo {
            width: 70px;
            height: 70px;
            border-radius: 15px;
          }

          .person-info h3 {
            font-size: 15px;
          }

          .person-wealth strong {
            font-size: 22px;
          }

          .table-heading {
            padding: 14px 10px;
          }

          .section-heading h2,
          .table-heading h2 {
            font-size: 18px;
          }

          .live-indicator {
            font-size: 9px;
          }

          .ticker-track span {
            padding: 8px 12px;
            font-size: 10px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  );
}
