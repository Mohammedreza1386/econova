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

type BillionaireNews = {
  id: string;
  billionaire_id: string;
  title: string;
  summary: string | null;
  source_name: string;
  source_url: string;
  image_url: string | null;
  published_at: string | null;
};

type YearlyRankingEntry = {
  id: string;
  name: string;
  image_url: string | null;
  current_net_worth: number;
  baseline_net_worth: number;
  baseline_date: string;
  change: number;
  change_pct: number | null;
  rank: number;
};

type YearlyRanking = {
  year: number;
  people: YearlyRankingEntry[];
};

type ProfileNavPerson = {
  id: string | number;
  rank: number;
  name: string;
  image_url: string | null;
};

type Props = {
  person: Billionaire;
  initialHistory: HistoryPoint[];
  initialNews: BillionaireNews[];
  yearlyRankings: YearlyRanking[];
  profileNavigation: ProfileNavPerson[];
};

const money = (value: number | string | null | undefined) => {
  const number = Number(value);

  return `$${(Number.isFinite(number) ? number : 0).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }
  )}B`;
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
  initialNews,
  yearlyRankings,
  profileNavigation,
}: Props) {
  const [historyRange, setHistoryRange] = useState<
    "all" | "week" | "month" | "year"
  >("all");

  const [selectedRankingYear, setSelectedRankingYear] =
    useState<number | null>(null);

  const history = initialHistory;

  const availableYears = yearlyRankings.map(
    (item) => item.year
  );

  const activeRankingYear =
    selectedRankingYear !== null &&
    availableYears.includes(selectedRankingYear)
      ? selectedRankingYear
      : availableYears[0] ?? null;

  const activeRanking = yearlyRankings.find(
    (item) => item.year === activeRankingYear
  );

  const rankingPeople = activeRanking?.people ?? [];

  const firstHistoryRecord = history[0] ?? null;

  const firstHistoryYear = firstHistoryRecord
    ? new Date(firstHistoryRecord.recorded_at).getFullYear()
    : null;

  const currentYear = new Date().getFullYear();

  const activeYear = history.some(
    (point) =>
      new Date(point.recorded_at).getFullYear() === currentYear
  )
    ? currentYear
    : history.length > 0
      ? new Date(
          history[history.length - 1].recorded_at
        ).getFullYear()
      : null;

  const activeYearRecords = activeYear
    ? history.filter(
        (point) =>
          new Date(point.recorded_at).getFullYear() === activeYear
      )
    : [];

  const yearBaseline =
    activeYear === firstHistoryYear
      ? history[4] ?? null
      : activeYearRecords[0] ?? null;

  const yearDelta = yearBaseline
    ? Number(person.net_worth_billions) -
      Number(yearBaseline.net_worth_billions)
    : null;

  const yearPercent =
    yearDelta !== null &&
    yearBaseline &&
    Number(yearBaseline.net_worth_billions) > 0
      ? (yearDelta /
          Number(yearBaseline.net_worth_billions)) *
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

    const cutoff =
      Date.now() - days * 24 * 60 * 60 * 1000;

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

  const dailyChange = Number(
    person.daily_change_pct ?? 0
  );

  const image =
    person.image_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      person.name
    )}&background=14271d&color=b9f27c&size=400&bold=true`;

  const goToYearlyRanking = () => {
    const thisYear = new Date().getFullYear();

    const targetYear = availableYears.includes(thisYear)
      ? thisYear
      : availableYears[0];

    if (targetYear !== undefined) {
      setSelectedRankingYear(targetYear);
    }

    document
      .getElementById("yearly-ranking-section")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

    return (
    <>
      <main className="profile-page" dir="rtl">
      <div className="profile-glow" />

      <header className="profile-header">
        <a className="brand" href="/">
          ECONOVA<span>.</span>
        </a>

        <div className="profile-header-actions">
          <button
            type="button"
            className="profile-ranking-switch"
            onClick={goToYearlyRanking}
          >
            مشاهده رتبه‌بندی اول سال
          </button>

          <a
            className="back-link"
            href="/billionaires/rankings"
          >
            رتبه‌بندی امروز ←
          </a>
        </div>
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

          <div className="hero-wealth">
            <span>ثروت فعلی تخمینی</span>

            <strong dir="ltr">
              {money(person.net_worth_billions)}
            </strong>

            <small>میلیارد دلار آمریکا</small>

            <div className="hero-year-change">
              <span>
                تغییر ثروت در سال {activeYear ?? "—"}
              </span>

              {yearDelta !== null &&
              yearPercent !== null &&
              yearBaseline ? (
                <>
                  <strong
                    dir="ltr"
                    className={
                      yearDelta >= 0 ? "positive" : "negative"
                    }
                  >
                    {yearDelta >= 0 ? "+" : "−"}
                    {money(Math.abs(yearDelta))}
                  </strong>

                  <b
                    dir="ltr"
                    className={
                      yearDelta >= 0 ? "positive" : "negative"
                    }
                  >
                    {yearPercent >= 0 ? "+" : ""}
                    {yearPercent.toFixed(2)}%
                  </b>

                  <small>
                    ثروت مبنا:{" "}
                    {money(yearBaseline.net_worth_billions)}
                  </small>

                  <small>
                    تاریخ مبنا:{" "}
                    {dateLabel(yearBaseline.recorded_at)}
                  </small>
                </>
              ) : (
                <small>
                  رکورد مبنای کافی برای محاسبه موجود نیست.
                </small>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>تغییر روزانه</span>

          <strong
            dir="ltr"
            className={
              dailyChange >= 0 ? "positive" : "negative"
            }
          >
            {dailyChange > 0 ? "+" : ""}
            {dailyChange.toFixed(2)}%
          </strong>

          <small>
            بر اساس داده ثبت‌شده در اکونوا
          </small>
        </article>

        <article className="stat-card">
          <span>رتبه جهانی</span>

          <strong dir="ltr">
            #{person.rank}
          </strong>

          <small>
            رتبه فعلی در فهرست اکونوا
          </small>
        </article>
      </section>
            <section className="history-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">WEALTH HISTORY</p>
            <h2>تاریخچه ثروت</h2>
          </div>

          <div className="range-switch">
            <button
              type="button"
              className={historyRange === "week" ? "active" : ""}
              onClick={() => setHistoryRange("week")}
            >
              هفته
            </button>

            <button
              type="button"
              className={historyRange === "month" ? "active" : ""}
              onClick={() => setHistoryRange("month")}
            >
              ماه
            </button>

            <button
              type="button"
              className={historyRange === "year" ? "active" : ""}
              onClick={() => setHistoryRange("year")}
            >
              سال
            </button>

            <button
              type="button"
              className={historyRange === "all" ? "active" : ""}
              onClick={() => setHistoryRange("all")}
            >
              کل
            </button>
          </div>
        </div>

        <div className="chart-card">
          {chartHistory.length > 1 ? (
            <>
              <div className="chart-value">
                <span>آخرین ثروت ثبت‌شده</span>
                <strong dir="ltr">
                  {money(
                    chartHistory[chartHistory.length - 1]
                      .net_worth_billions
                  )}
                </strong>
              </div>

              <svg
                className="wealth-chart"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="wealthGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#b9f27c"
                      stopOpacity=".35"
                    />
                    <stop
                      offset="100%"
                      stopColor="#b9f27c"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                <polyline
                  points={`0,100 ${chartPoints} 100,100`}
                  fill="url(#wealthGradient)"
                  stroke="none"
                />

                <polyline
                  points={chartPoints}
                  fill="none"
                  stroke="#b9f27c"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="chart-footer">
                <span>
                  {dateLabel(chartHistory[0].recorded_at)}
                </span>

                <span>
                  {dateLabel(
                    chartHistory[chartHistory.length - 1]
                      .recorded_at
                  )}
                </span>
              </div>
            </>
          ) : (
            <div className="empty-state">
              داده کافی برای نمایش نمودار این بازه وجود ندارد.
            </div>
          )}
        </div>

        <div className="history-summary">
          <div>
            <span>تعداد رکوردها</span>
            <strong>{chartHistory.length}</strong>
          </div>

          <div>
            <span>اولین ثبت</span>
            <strong>
              {chartHistory[0]
                ? dateLabel(chartHistory[0].recorded_at)
                : "—"}
            </strong>
          </div>

          <div>
            <span>آخرین ثبت</span>
            <strong>
              {chartHistory.length
                ? dateLabel(
                    chartHistory[chartHistory.length - 1]
                      .recorded_at
                  )
                : "—"}
            </strong>
          </div>
        </div>
      </section>

      <section
        className="yearly-ranking-section"
        id="yearly-ranking-section"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">ANNUAL WEALTH RANKING</p>
            <h2>رتبه‌بندی ثروت در آغاز سال</h2>
            <p className="section-description">
              مقایسه جایگاه ثروتمندان بر اساس ثروت مبنا در ابتدای هر سال
            </p>
          </div>

          {availableYears.length > 0 && (
            <select
              className="year-select"
              value={activeRankingYear ?? ""}
              onChange={(event) =>
                setSelectedRankingYear(
                  Number(event.target.value)
                )
              }
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  سال {year}
                </option>
              ))}
            </select>
          )}
        </div>

        {rankingPeople.length > 0 ? (
          <>
            <div className="ranking-highlight">
              <div>
                <span>سال انتخاب‌شده</span>
                <strong>{activeRankingYear}</strong>
              </div>

              <div>
                <span>تعداد افراد دارای رکورد مبنا</span>
                <strong>{rankingPeople.length}</strong>
              </div>

              <div>
                <span>رتبه این فرد در آغاز سال</span>
                <strong>
                  {rankingPeople.find(
                    (item) => item.id === String(person.id)
                  )?.rank
                    ? `#${rankingPeople.find(
                        (item) => item.id === String(person.id)
                      )?.rank}`
                    : "بدون رتبه"}
                </strong>
              </div>
            </div>

            <div className="ranking-table-wrap">
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th>رتبه</th>
                    <th>نام</th>
                    <th>ثروت مبنا</th>
                    <th>تاریخ مبنا</th>
                    <th>تغییر تا امروز</th>
                    <th>درصد تغییر</th>
                  </tr>
                </thead>

                <tbody>
                  {rankingPeople.map((item) => {
                    const isCurrent =
                      item.id === String(person.id);

                    return (
                      <tr
                        key={item.id}
                        className={
                          isCurrent ? "current-person" : ""
                        }
                      >
                        <td>
                          <strong>#{item.rank}</strong>
                        </td>

                        <td>
                          <div className="ranking-person">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                              />
                            ) : (
                              <div className="ranking-avatar">
                                {item.name.charAt(0)}
                              </div>
                            )}

                            <span>{item.name}</span>

                            {isCurrent && (
                              <small>این پروفایل</small>
                            )}
                          </div>
                        </td>

                        <td dir="ltr">
                          {money(item.baseline_net_worth)}
                        </td>

                        <td>
                          {dateLabel(item.baseline_date)}
                        </td>

                        <td
                          dir="ltr"
                          className={
                            item.change >= 0
                              ? "positive"
                              : "negative"
                          }
                        >
                          {item.change >= 0 ? "+" : "−"}
                          {money(Math.abs(item.change))}
                        </td>

                        <td
                          dir="ltr"
                          className={
                            (item.change_pct ?? 0) >= 0
                              ? "positive"
                              : "negative"
                          }
                        >
                          {item.change_pct === null
                            ? "—"
                            : `${item.change_pct >= 0 ? "+" : ""}${item.change_pct.toFixed(2)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="empty-state">
            برای این سال هنوز رتبه‌بندی قابل نمایش نیست.
          </div>
        )}

        <p className="ranking-note">
          مبنای سال اول هر فرد، پنجمین رکورد تاریخچه اوست.
          مبنای سال‌های بعد، اولین رکورد همان سال است.
          افرادی که رکورد مبنای کافی ندارند در جدول آن سال رتبه نمی‌گیرند.
        </p>
      </section>

      <section className="news-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LATEST UPDATES</p>
            <h2>آخرین اخبار {person.name}</h2>
          </div>
        </div>

        {initialNews.length > 0 ? (
          <div className="news-grid">
            {initialNews.map((news) => (
              <a
                key={news.id}
                className="news-card"
                href={`/billionaires/news/${news.id}`}
              >
                {news.image_url && (
                  <img
                    src={news.image_url}
                    alt={news.title}
                    className="news-image"
                  />
                )}

                <div className="news-content">
                  <span className="news-source">
                    {news.source_name}
                  </span>

                  <h3>{news.title}</h3>

                  {news.summary && (
                    <p>{news.summary}</p>
                  )}

                  {news.published_at && (
                    <small>
                      {dateLabel(news.published_at)}
                    </small>
                  )}

                  <span className="news-read">
                    مطالعه خبر ←
                  </span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            هنوز خبری برای این فرد ثبت نشده است.
          </div>
        )}
      </section>

      <footer className="profile-footer">
        <a href="/">ECONOVA<span>.</span></a>
        <p>داده‌ها و تحلیل‌های ثروت در اکونوا</p>
      </footer>
    </main>

      <style jsx>{`
        .profile-page {
          min-height: 100vh;
          padding: 24px;
          background: #080d0a;
          color: #f2f5f1;
          font-family: inherit;
          position: relative;
          overflow: hidden;
        }

        .profile-glow {
          position: absolute;
          width: 500px;
          height: 500px;
          top: -250px;
          right: 15%;
          background: #b9f27c;
          opacity: 0.045;
          filter: blur(120px);
          pointer-events: none;
        }

        .profile-header {
          max-width: 1250px;
          margin: 0 auto 35px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          position: relative;
          z-index: 2;
        }

        .brand,
        .profile-footer > a {
          color: #f5f7f3;
          text-decoration: none;
          font-size: 23px;
          font-weight: 900;
          letter-spacing: 2px;
        }

        .brand span,
        .profile-footer > a span {
          color: #b9f27c;
        }

        .profile-header-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .profile-ranking-switch {
          border: 1px solid #526b42;
          background: linear-gradient(
            135deg,
            #b9f27c,
            #91c65b
          );
          color: #10190d;
          border-radius: 999px;
          padding: 11px 17px;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .profile-ranking-switch:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px #b9f27c25;
        }

        .back-link {
          color: #b9f27c;
          text-decoration: none;
          font-size: 13px;
          border: 1px solid #334a38;
          border-radius: 999px;
          padding: 10px 15px;
          background: #101812;
        }

        .profile-hero {
          max-width: 1250px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 35px;
          align-items: center;
          padding: 35px;
          border: 1px solid #25352a;
          border-radius: 26px;
          background: linear-gradient(
            135deg,
            #121d16,
            #0c130f
          );
          position: relative;
          z-index: 1;
        }

        .profile-photo {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          border-radius: 22px;
          border: 1px solid #526b42;
          background: #152019;
        }

        .eyebrow {
          color: #b9f27c;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          margin: 0 0 12px;
        }

        .rank-pill {
          display: inline-flex;
          padding: 7px 13px;
          border: 1px solid #526b42;
          border-radius: 999px;
          color: #b9f27c;
          background: #172519;
          font-size: 12px;
          font-weight: 800;
        }

        .profile-intro h1 {
          margin: 15px 0 8px;
          font-size: clamp(30px, 5vw, 52px);
          font-weight: 900;
          letter-spacing: -1px;
        }

        .profile-meta {
          color: #a6b4a8;
          font-size: 14px;
          margin: 0 0 18px;
        }

        .profile-bio {
          color: #c0c9c1;
          line-height: 2;
          font-size: 14px;
          max-width: 750px;
        }

        .hero-wealth {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 7px;
          margin-top: 25px;
          padding: 20px;
          border: 1px solid #344a36;
          border-radius: 18px;
          background: #0b130d;
        }

        .hero-wealth > span,
        .hero-year-change > span {
          color: #9cab9e;
          font-size: 13px;
        }

        .hero-wealth > strong {
          color: #b9f27c;
          font-size: clamp(32px, 5vw, 48px);
          font-weight: 900;
        }

        .hero-wealth > small,
        .hero-year-change small {
          color: #879589;
          font-size: 12px;
        }

        .hero-year-change {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          margin-top: 12px;
          padding-top: 14px;
          border-top: 1px solid #26372a;
          width: 100%;
        }

        .hero-year-change strong {
          font-size: 17px;
        }

        .hero-year-change b {
          font-size: 14px;
        }

        .positive {
          color: #9ee878 !important;
        }

        .negative {
          color: #ff8585 !important;
        }

        .stats-grid {
          max-width: 1250px;
          margin: 22px auto;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .stat-card {
          padding: 22px;
          border: 1px solid #26372a;
          border-radius: 19px;
          background: #101812;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .stat-card span {
          color: #9cab9e;
          font-size: 13px;
        }

        .stat-card strong {
          font-size: 30px;
          font-weight: 900;
        }

        .stat-card small {
          color: #748477;
          font-size: 11px;
        }

        .history-section,
        .yearly-ranking-section,
        .news-section {
          max-width: 1250px;
          margin: 35px auto;
          padding: 27px;
          border: 1px solid #26372a;
          border-radius: 23px;
          background: #101812;
        }

        .yearly-ranking-section {
          scroll-margin-top: 25px;
          border-color: #526b42;
          background: linear-gradient(
            145deg,
            #111c14,
            #0d140f
          );
        }

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 22px;
        }

        .section-heading h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 900;
        }

        .section-description {
          color: #8d9b90;
          font-size: 12px;
          line-height: 1.8;
          margin: 8px 0 0;
        }

        .range-switch {
          display: flex;
          gap: 5px;
          padding: 5px;
          border: 1px solid #2b3b2f;
          border-radius: 999px;
          background: #09100b;
        }

        .range-switch button {
          border: 0;
          border-radius: 999px;
          padding: 8px 13px;
          background: transparent;
          color: #9eaa9f;
          font-size: 12px;
          cursor: pointer;
        }

        .range-switch button.active {
          color: #10190d;
          background: #b9f27c;
          font-weight: 900;
        }

        .chart-card {
          padding: 22px;
          border: 1px solid #283a2c;
          border-radius: 18px;
          background: #0a120d;
        }

        .chart-value {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }

        .chart-value span {
          color: #92a093;
          font-size: 12px;
        }

        .chart-value strong {
          color: #b9f27c;
          font-size: 20px;
        }

        .wealth-chart {
          display: block;
          width: 100%;
          height: 220px;
          overflow: visible;
        }

        .chart-footer {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: #78867b;
          font-size: 11px;
          margin-top: 12px;
        }

        .history-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 15px;
        }

        .history-summary > div {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 15px;
          border: 1px solid #283a2c;
          border-radius: 14px;
          background: #0b130e;
        }

        .history-summary span {
          color: #839185;
          font-size: 11px;
        }

        .history-summary strong {
          color: #e5eee5;
          font-size: 13px;
        }

        .year-select {
          color: #b9f27c;
          background: #0b130e;
          border: 1px solid #526b42;
          border-radius: 12px;
          padding: 11px 15px;
          font: inherit;
          outline: none;
        }

        .year-select option {
          background: #101812;
          color: #fff;
        }

        .ranking-highlight {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .ranking-highlight > div {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 17px;
          border: 1px solid #304333;
          border-radius: 15px;
          background: #0a130d;
        }

        .ranking-highlight span {
          color: #879589;
          font-size: 11px;
        }

        .ranking-highlight strong {
          color: #b9f27c;
          font-size: 22px;
          font-weight: 900;
        }

        .ranking-table-wrap {
          width: 100%;
          overflow-x: auto;
          border: 1px solid #29392d;
          border-radius: 15px;
        }

        .ranking-table {
          width: 100%;
          min-width: 760px;
          border-collapse: collapse;
          text-align: right;
          font-size: 12px;
        }

        .ranking-table th {
          padding: 16px 13px;
          color: #b9f27c;
          background: #17241a;
          white-space: nowrap;
          font-weight: 800;
        }

        .ranking-table td {
          padding: 14px 13px;
          border-top: 1px solid #26352a;
          color: #d5dfd6;
          white-space: nowrap;
        }

        .ranking-table tbody tr {
          transition: background 0.2s ease;
        }

        .ranking-table tbody tr:hover {
          background: #17251a;
        }

        .ranking-table tbody tr.current-person {
          background: #1b2b1c;
          outline: 1px solid #718e4e;
        }

        .ranking-person {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 180px;
        }

        .ranking-person img,
        .ranking-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          object-fit: cover;
          background: #25392a;
          border: 1px solid #526b42;
        }

        .ranking-avatar {
          display: grid;
          place-items: center;
          color: #b9f27c;
          font-weight: 900;
        }

        .ranking-person small {
          color: #b9f27c;
          font-size: 10px;
        }

        .ranking-note {
          color: #849287;
          font-size: 11px;
          line-height: 2;
          margin: 17px 0 0;
        }

        .news-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .news-card {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid #2a3a2e;
          border-radius: 17px;
          background: #0b130e;
          text-decoration: none;
          color: inherit;
          transition: 0.2s ease;
        }

        .news-card:hover {
          border-color: #789c56;
          transform: translateY(-3px);
        }

        .news-image {
          width: 100%;
          height: 190px;
          object-fit: cover;
          background: #17231a;
        }

        .news-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          padding: 18px;
        }

        .news-source {
          color: #b9f27c;
          font-size: 11px;
        }

        .news-content h3 {
          color: #edf3ed;
          font-size: 16px;
          line-height: 1.8;
          margin: 0;
        }

        .news-content p {
          color: #9ba99d;
          font-size: 12px;
          line-height: 1.9;
          margin: 0;
        }

        .news-content small {
          color: #748477;
          font-size: 10px;
        }

        .news-read {
          color: #b9f27c;
          font-size: 12px;
          font-weight: 800;
          margin-top: 5px;
        }

        .empty-state {
          padding: 35px 18px;
          text-align: center;
          color: #829085;
          border: 1px dashed #344638;
          border-radius: 15px;
          font-size: 13px;
          line-height: 2;
        }

        .profile-footer {
          max-width: 1250px;
          margin: 45px auto 10px;
          padding-top: 22px;
          border-top: 1px solid #26372a;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .profile-footer > a {
          font-size: 18px;
        }

        .profile-footer p {
          color: #718074;
          font-size: 11px;
        }

        @media (max-width: 750px) {
          .profile-page {
            padding: 15px;
          }

          .profile-header {
            align-items: flex-start;
            flex-direction: column;
            margin-bottom: 22px;
          }

          .profile-header-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .profile-hero {
            grid-template-columns: 1fr;
            padding: 20px;
            gap: 20px;
          }

          .profile-photo {
            width: 180px;
            margin: 0 auto;
          }

          .profile-intro h1 {
            font-size: 32px;
          }

          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }

          .history-section,
          .yearly-ranking-section,
          .news-section {
            padding: 18px;
            margin: 22px auto;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .ranking-highlight {
            grid-template-columns: 1fr;
          }

          .news-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .profile-header-actions {
            align-items: stretch;
            flex-direction: column;
          }

          .profile-ranking-switch,
          .back-link {
            text-align: center;
            width: 100%;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .history-summary {
            grid-template-columns: 1fr;
          }

          .range-switch {
            width: 100%;
            justify-content: space-between;
          }

          .range-switch button {
            flex: 1;
            padding: 8px 5px;
          }

          .chart-value {
            align-items: flex-start;
            flex-direction: column;
          }

          .profile-footer {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}
