
"use client";

import { useEffect, useState } from "react";

type Billionaire = {
  id: number;
  rank: number;
  name: string;
  image_url?: string | null;
  company: string | null;
  country: string | null;
  net_worth_billions: number;
  daily_change_pct: number | null;
  updated_at: string | null;
  source_url: string | null;
  source_checked_at: string | null;
};

const SUPABASE_URL =
  "https://zusbebjskchgehdjvpsm.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_WGMEA7-K8FAResrVCL8GJQ_6KCxrvmK";

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0);

// عکس افراد شناخته‌شده؛ برای نام‌های دیگر از تصویر ثبت‌شده در دیتابیس استفاده می‌شود.
function photoFor(name: string): string | null {
  const n = name.toLowerCase();

  const photos: [string[], string][] = [
    [
      ["elon musk"],
      "https://commons.wikimedia.org/wiki/Special:FilePath/Elon_Musk_Royal_Society_%28crop2%29.jpg",
    ],
    [
      ["jeff bezos"],
      "https://commons.wikimedia.org/wiki/Special:FilePath/Jeff_Bezos_2016.jpg",
    ],
    [
      ["mark zuckerberg"],
      "https://commons.wikimedia.org/wiki/Special:FilePath/Mark_Zuckerberg_F8_2018_keynote.jpg",
    ],
    [
      ["warren buffett"],
      "https://commons.wikimedia.org/wiki/Special:FilePath/Warren_Buffett_at_the_2015_SelectUSA_Investment_Summit.jpg",
    ],
    [
      ["larry page"],
      "https://commons.wikimedia.org/wiki/Special:FilePath/Larry_Page_in_the_European_Parliament%2C_17.06.2009.jpg",
    ],
    [
      ["sergey brin"],
      "https://commons.wikimedia.org/wiki/Special:FilePath/Sergey_Brin_Ted_2010.jpg",
    ],
    [
      ["bernard arnault"],
      "https://commons.wikimedia.org/wiki/Special:FilePath/Bernard_Arnault.jpg",
    ],
    [
      ["larry ellison"],
      "https://commons.wikimedia.org/wiki/Special:FilePath/Larry_Ellison.jpg",
    ],
  ];

  return photos.find(([names]) =>
    names.some((item) => n.includes(item))
  )?.[1] ?? null;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("");
}

export default function BillionairesPage() {
  const [people, setPeople] = useState<Billionaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [animatedTotal, setAnimatedTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadPeople() {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/billionaires?select=id,rank,name,company,country,net_worth_billions,daily_change_pct,updated_at,source_url,source_checked_at&order=rank.asc&limit=50`,
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
            `خطا در دریافت اطلاعات دیتابیس (${response.status})`
          );
        }

        const data: Billionaire[] = await response.json();

        if (!cancelled) {
          setPeople(data);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "دریافت اطلاعات ناموفق بود."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPeople();

    return () => {
      cancelled = true;
    };
  }, []);

  const topFive = people.slice(0, 5);

  const topTenTotal = people
    .filter((person) => person.rank <= 10)
    .reduce(
      (total, person) =>
        total + (Number(person.net_worth_billions) || 0),
      0
    );

  // انیمیشن شمارش مجموع ثروت ۱۰ نفر اول
  useEffect(() => {
    let frame = 0;
    let startTime: number | null = null;
    const duration = 1400;

    setAnimatedTotal(0);

    if (topTenTotal <= 0) return;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;

      const progress = Math.min(
        (timestamp - startTime) / duration,
        1
      );

      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedTotal(topTenTotal * eased);

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [topTenTotal]);

  return (
    <main className="econova-page">
      <div className="econova-container">
        <header className="page-header">
          <p className="eyebrow">
            ECONOVA • WEALTH TRACKER
          </p>

          <h1>ثروتمندترین افراد جهان</h1>

          <p className="subtitle">
            رتبه‌بندی میلیاردرهای جهان بر اساس اطلاعات دیتابیس
          </p>
        </header>

        <section className="total-card">
          <p className="total-label">
            مجموع ثروت ۱۰ نفر اول
          </p>

          <p className="total-value" dir="ltr">
            ${money(animatedTotal)} میلیارد
          </p>

          <p className="total-note">
            محاسبه‌شده از اطلاعات موجود در دیتابیس
          </p>
        </section>

        {loading && (
          <div className="status-message">
            <span className="loading-dot" />
            در حال دریافت اطلاعات...
          </div>
        )}

        {!loading && error && (
          <div className="error-message">
            <h2>دریافت اطلاعات ناموفق بود</h2>
            <p>{error}</p>
            <p>
              اتصال Supabase، مجوز دسترسی و تنظیمات دیتابیس را بررسی کن.
            </p>
          </div>
        )}

        {!loading && !error && people.length === 0 && (
          <div className="empty-message">
            هنوز اطلاعاتی در جدول میلیاردرها موجود نیست.
          </div>
        )}

        {!loading && !error && people.length > 0 && (
          <>
            <section className="top-section">
              <div className="section-heading">
                <span className="section-number">01</span>
                <div>
                  <h2>پنج نفر ثروتمند برتر</h2>
                  <p>بررسی ثروت و اطلاعات هر فرد</p>
                </div>
              </div>

              <div className="top-list">
                {topFive.map((person) => {
                  const photo =
                    person.image_url || photoFor(person.name);

                  const change =
                    Number(person.daily_change_pct ?? 0);

                  return (
                    <article
                      key={person.id}
                      className="person-card"
                    >
                      <div className="person-rank">
                        {String(person.rank).padStart(2, "0")}
                      </div>

                      <div className="person-photo">
                        <span className="photo-fallback">
                          {initials(person.name)}
                        </span>

                        {photo && (
                          <img
                            src={photo}
                            alt={`عکس ${person.name}`}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                      </div>

                      <div className="person-info">
                        <p className="person-label">
                          RANK #{person.rank}
                        </p>

                        <h3>{person.name}</h3>

                        <p className="person-company">
                          {person.company || "شرکت ثبت نشده"}
                        </p>

                        <p className="person-country">
                          {person.country || "کشور ثبت نشده"}
                        </p>
                      </div>

                      <div className="person-wealth">
                        <p>ارزش خالص دارایی</p>

                        <strong dir="ltr">
                          ${money(Number(person.net_worth_billions))}B
                        </strong>

                        <span
                          className={
                            change > 0
                              ? "change-positive"
                              : change < 0
                              ? "change-negative"
                              : "change-neutral"
                          }
                        >
                          {change > 0 ? "+" : ""}
                          {change.toFixed(2)}%
                          <small> تغییر روزانه</small>
                        </span>
                      </div>

                      {person.updated_at && (
                        <p className="person-updated">
                          آخرین به‌روزرسانی:{" "}
                          {new Date(
                            person.updated_at
                          ).toLocaleString("fa-IR")}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="table-section">
              <div className="table-heading">
                <div>
                  <h2>فهرست میلیاردرها</h2>
                  <p>
                    {people.length} نفر از اطلاعات ثبت‌شده
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
                      <th>نام</th>
                      <th>شرکت</th>
                      <th>کشور</th>
                      <th>ثروت (میلیارد دلار)</th>
                      <th>تغییر روزانه</th>
                    </tr>
                  </thead>

                  <tbody>
                    {people.map((person) => {
                      const change =
                        Number(person.daily_change_pct ?? 0);

                      return (
                        <tr key={person.id}>
                          <td>
                            <span className="rank-badge">
                              {person.rank}
                            </span>
                          </td>

                          <td className="table-name">
                            {person.name}
                          </td>

                          <td>
                            {person.company || "—"}
                          </td>

                          <td>
                            {person.country || "—"}
                          </td>

                          <td className="table-wealth" dir="ltr">
                            ${money(
                              Number(person.net_worth_billions)
                            )}
                          </td>

                          <td
                            className={
                              change > 0
                                ? "change-positive"
                                : change < 0
                                ? "change-negative"
                                : "change-neutral"
                            }
                            dir="ltr"
                          >
                            {change > 0 ? "+" : ""}
                            {change.toFixed(2)}%
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
                منبع مرجع:{" "}
                <a
                  href="https://www.forbes.com/real-time-billionaires/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Forbes Real-Time Billionaires
                </a>
              </p>

              <p>
                اطلاعات این صفحه از دیتابیس دریافت می‌شود؛
                نمایش آن به‌تنهایی به معنی به‌روزرسانی خودکار ثروت‌ها نیست.
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
          padding: 36px 18px 56px;
          background:
            radial-gradient(
              ellipse at 50% 0%,
              #123b3a 0%,
              transparent 45%
            ),
            linear-gradient(145deg, #07111f, #101d32 55%, #07111f);
          color: #f8fafc;
          font-family: Arial, sans-serif;
          direction: rtl;
        }

        .econova-container {
          max-width: 1120px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 34px;
          text-align: center;
        }

        .eyebrow {
          color: #34d399;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 3px;
          direction: ltr;
        }

        .page-header h1 {
          margin: 12px 0;
          font-size: clamp(28px, 5vw, 46px);
          line-height: 1.5;
          font-weight: 800;
        }

        .subtitle {
          color: #94a3b8;
          line-height: 1.9;
        }

        .total-card {
          margin-bottom: 42px;
          padding: 28px 18px;
          text-align: center;
          border: 1px solid #10b98155;
          border-radius: 22px;
          background: linear-gradient(
            135deg,
            #064e3b80,
            #0f172aee
          );
          box-shadow: 0 18px 45px #00000025;
        }

        .total-label {
          margin: 0;
          color: #6ee7b7;
          font-size: 15px;
        }

        .total-value {
          margin: 12px 0;
          color: #ecfdf5;
          font-size: clamp(27px, 5vw, 42px);
          font-weight: 900;
          overflow-wrap: anywhere;
        }

        .total-note {
          margin: 0;
          color: #94a3b8;
          font-size: 12px;
        }

        .section-heading,
        .table-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 18px;
        }

        .section-heading {
          justify-content: flex-start;
        }

        .section-number {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          border: 1px solid #10b98155;
          border-radius: 14px;
          background: #064e3b55;
          color: #6ee7b7;
          font-weight: 800;
        }

        .section-heading h2,
        .table-heading h2 {
          margin: 0;
          font-size: 23px;
        }

        .section-heading p,
        .table-heading p {
          margin: 6px 0 0;
          color: #94a3b8;
          font-size: 13px;
        }

        .top-section {
          margin-bottom: 42px;
        }

        .top-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .person-card {
          position: relative;
          display: grid;
          grid-template-columns: 42px 76px minmax(0, 1fr) auto;
          align-items: center;
          gap: 18px;
          padding: 22px;
          border: 1px solid #2b405b;
          border-radius: 20px;
          background: linear-gradient(135deg, #16253b, #0d1728);
          box-shadow: 0 10px 28px #00000020;
          transition: border-color 0.2s, transform 0.2s;
        }

        .person-card:hover {
          border-color: #10b981;
          transform: translateY(-2px);
        }

        .person-rank {
          color: #34d399;
          font-size: 23px;
          font-weight: 900;
          direction: ltr;
          text-align: center;
        }

        .person-photo {
          position: relative;
          display: grid;
          place-items: center;
          width: 76px;
          height: 76px;
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
          font-size: 21px;
          font-weight: 800;
        }

        .person-info {
          min-width: 0;
        }

        .person-label {
          margin: 0 0 6px;
          color: #34d399;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          direction: ltr;
          text-align: right;
        }

        .person-info h3 {
          margin: 0 0 8px;
          font-size: 19px;
          overflow-wrap: anywhere;
        }

        .person-company,
        .person-country {
          margin: 4px 0 0;
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.8;
        }

        .person-country {
          color: #94a3b8;
        }

        .person-wealth {
          min-width: 155px;
          text-align: left;
          direction: ltr;
        }

        .person-wealth p {
          margin: 0 0 8px;
          color: #94a3b8;
          font-size: 11px;
        }

        .person-wealth strong {
          display: block;
          color: #6ee7b7;
          font-size: 25px;
          overflow-wrap: anywhere;
        }

        .person-wealth span {
          display: block;
          margin-top: 9px;
          font-size: 13px;
        }

        .person-wealth small {
          color: #94a3b8;
          font-size: 10px;
        }

        .person-updated {
          grid-column: 2 / -1;
          margin: 0;
          color: #64748b;
          font-size: 11px;
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
          border-radius: 20px;
          background: #0d1728;
        }

        .table-heading {
          margin: 0;
          padding: 22px;
          border-bottom: 1px solid #24364d;
        }

        .live-indicator {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
          font-size: 11px;
          white-space: nowrap;
        }

        .live-indicator span,
        .loading-dot {
          width: 8px;
          height: 8px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #34d399;
        }

        .table-scroll {
          width: 100%;
          overflow-x: auto;
        }

        .table-scroll table {
          width: 100%;
          min-width: 690px;
          border-collapse: collapse;
          color: #cbd5e1;
          text-align: right;
        }

        .table-scroll th,
        .table-scroll td {
          padding: 16px;
          border-bottom: 1px solid #24364d;
          white-space: nowrap;
        }

        .table-scroll th {
          background: #1e3048;
          color: #6ee7b7;
          font-size: 12px;
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
          min-width: 30px;
          height: 30px;
          padding: 0 7px;
          border-radius: 9px;
          background: #064e3b70;
          color: #6ee7b7;
          font-weight: 800;
        }

        .page-footer {
          margin-top: 28px;
          text-align: center;
          color: #94a3b8;
          font-size: 12px;
          line-height: 2;
        }

        .page-footer a {
          color: #34d399;
          text-decoration: underline;
        }

        .status-message,
        .empty-message,
        .error-message {
          margin: 24px 0;
          padding: 22px;
          border: 1px solid #2b405b;
          border-radius: 16px;
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

        @media (max-width: 700px) {
          .econova-page {
            padding: 24px 12px 40px;
          }

          .person-card {
            grid-template-columns: 34px 60px minmax(0, 1fr);
            gap: 12px;
            padding: 16px 12px;
          }

          .person-photo {
            width: 60px;
            height: 60px;
            border-radius: 15px;
          }

          .person-rank {
            font-size: 19px;
          }

          .person-info h3 {
            font-size: 16px;
          }

          .person-wealth {
            grid-column: 2 / -1;
            min-width: 0;
            padding-top: 12px;
            border-top: 1px solid #2b405b;
            text-align: right;
          }

          .person-wealth strong {
            font-size: 24px;
            text-align: right;
          }

          .person-updated {
            grid-column: 1 / -1;
          }

          .section-heading h2,
          .table-heading h2 {
            font-size: 19px;
          }

          .table-heading {
            padding: 16px 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}

