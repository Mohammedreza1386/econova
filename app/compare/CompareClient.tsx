
"use client";

import { useMemo, useState } from "react";

type Billionaire = {
  id: string | number;
  rank: number;
  name: string;
  company: string | null;
  country: string | null;
  image_url: string | null;
  net_worth_billions: number | string;
  daily_change_pct: number | string | null;
  updated_at: string | null;
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
  initialBillionaires: Billionaire[];
};

type Range = "week" | "month" | "year";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ||
  "https://zusbebjskchgehdjvpsm.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const money = (value: number | string) => {
  const number = Number(value);

  return (Number.isFinite(number) ? number : 0).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }
  );
};

const numberValue = (
  value: number | string | null
) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

async function getHistory(
  billionaireId: string | number
): Promise<HistoryPoint[]> {
  if (!SUPABASE_KEY) return [];

  const allHistory: HistoryPoint[] = [];
  const pageSize = 1000;
  const maxPages = 101;

  for (let page = 0; page < maxPages; page++) {
    const offset = page * pageSize;

    const query = new URLSearchParams({
      select:
        "id,billionaire_id,billionaire_name,net_worth_billions,recorded_at,source_url",
      billionaire_id: `eq.${String(billionaireId)}`,
      order: "recorded_at.asc,id.asc",
      limit: String(pageSize),
    });

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/billionaire_wealth_history?${query}`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Range-Unit": "items",
          Range: `${offset}-${offset + pageSize - 1}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch wealth history.");
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      break;
    }

    allHistory.push(...(data as HistoryPoint[]));

    if (data.length < pageSize) break;
  }

  return allHistory
    .filter(
      (point) =>
        Number.isFinite(Number(point.net_worth_billions)) &&
        Number(point.net_worth_billions) > 0 &&
        Number.isFinite(Date.parse(point.recorded_at))
    )
    .sort(
      (a, b) =>
        Date.parse(a.recorded_at) -
          Date.parse(b.recorded_at) ||
        Number(a.id) - Number(b.id)
    );
}

function personImage(person: Billionaire) {
  return (
    person.image_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      person.name
    )}&background=14271d&color=b9f27c&size=200&bold=true`
  );
}

export default function CompareClient({
  initialBillionaires,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<Range>("month");

  const [histories, setHistories] = useState<
    Record<string, HistoryPoint[]>
  >({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedPeople = useMemo(
    () =>
      selectedIds
        .map((id) =>
          initialBillionaires.find(
            (person) => String(person.id) === id
          )
        )
        .filter(
          (person): person is Billionaire =>
            Boolean(person)
        ),
    [selectedIds, initialBillionaires]
  );

  const filteredPeople = useMemo(() => {
    const term = search.trim().toLowerCase();

    return initialBillionaires
      .filter(
        (person) =>
          !selectedIds.includes(String(person.id)) &&
          (!term ||
            person.name.toLowerCase().includes(term) ||
            (person.company || "")
              .toLowerCase()
              .includes(term) ||
            (person.country || "")
              .toLowerCase()
              .includes(term))
      )
      .slice(0, 30);
  }, [initialBillionaires, selectedIds, search]);

  async function addPerson(person: Billionaire) {
    if (
      selectedIds.length >= 5 ||
      selectedIds.includes(String(person.id))
    ) {
      return;
    }

    const id = String(person.id);

    setSelectedIds((previous) =>
      previous.length < 5 && !previous.includes(id)
        ? [...previous, id]
        : previous
    );

    setSearch("");
    setError("");

    if (histories[id]) return;

    setLoading(true);

    try {
      const history = await getHistory(person.id);

      setHistories((previous) => ({
        ...previous,
        [id]: history,
      }));
    } catch {
      setHistories((previous) => ({
        ...previous,
        [id]: [],
      }));

      setError(
        `دریافت تاریخچه ${person.name} با خطا مواجه شد.`
      );
    } finally {
      setLoading(false);
    }
  }

  function removePerson(id: string) {
    setSelectedIds((previous) =>
      previous.filter((item) => item !== id)
    );
  }

  const days =
    range === "week" ? 7 : range === "month" ? 30 : 365;

  const chartData = useMemo(() => {
    const cutoff =
      Date.now() - days * 24 * 60 * 60 * 1000;

    return selectedPeople.map((person) => {
      const id = String(person.id);
      const history = histories[id] || [];

      const points = history.filter(
        (point) =>
          Date.parse(point.recorded_at) >= cutoff
      );

      return { person, points };
    });
  }, [selectedPeople, histories, days]);

  const chartValues = chartData.flatMap((item) =>
    item.points.map((point) =>
      numberValue(point.net_worth_billions)
    )
  );

  const chartMin =
    chartValues.length > 0
      ? Math.min(...chartValues)
      : 0;

  const chartMax =
    chartValues.length > 0
      ? Math.max(...chartValues)
      : 1;

  const chartSpread = chartMax - chartMin || 1;

  const colors = [
    "#b9f27c",
    "#63c7ff",
    "#ffbd69",
    "#d59cff",
    "#ff8585",
  ];

  return (
    <main className="compare-page" dir="rtl">
      <div className="background-glow" />

      <header className="topbar">
        <a href="/" className="brand">
          ECONOVA<span>.</span>
        </a>

        <a href="/billionaires" className="back-link">
          بازگشت به ثروتمندان ←
        </a>
      </header>

      <section className="hero">
        <p className="eyebrow">
          ECONOVA COMPARISON
        </p>

        <h1>
          مقایسه <span>ثروتمندان جهان</span>
        </h1>

        <p className="hero-description">
          ثروت و روند تغییرات دارایی ثروتمندان را در یک صفحه
          مقایسه کن.
        </p>
      </section>

      <section className="selector-card">
        <div className="section-title">
          <div>
            <h2>انتخاب افراد</h2>
            <p>حداقل ۲ و حداکثر ۵ نفر انتخاب کن.</p>
          </div>

          <span className="counter">
            {selectedPeople.length} / 5
          </span>
        </div>

        <input
          className="search-input"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="جست‌وجوی نام، شرکت یا کشور..."
        />

        {search.trim() && (
          <div className="search-results">
            {filteredPeople.length === 0 ? (
              <p className="empty">
                فردی پیدا نشد.
              </p>
            ) : (
              filteredPeople.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  className="search-result"
                  disabled={selectedIds.length >= 5}
                  onClick={() => addPerson(person)}
                >
                  <img
                    src={personImage(person)}
                    alt=""
                  />

                  <span className="result-info">
                    <strong>{person.name}</strong>
                    <small>
                      رتبه #{person.rank} · $
                      {money(person.net_worth_billions)}B
                    </small>
                  </span>

                  <span className="add-icon">+</span>
                </button>
              ))
            )}
          </div>
        )}

        <div className="selected-list">
          {selectedPeople.map((person) => (
            <div
              className="selected-person"
              key={person.id}
            >
              <img
                src={personImage(person)}
                alt={person.name}
              />

              <div>
                <strong>{person.name}</strong>
                <small>رتبه #{person.rank}</small>
              </div>

              <button
                type="button"
                onClick={() =>
                  removePerson(String(person.id))
                }
                aria-label={`حذف ${person.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {selectedPeople.length === 0 && (
          <p className="empty">
            هنوز فردی انتخاب نشده است.
          </p>
        )}

        {error && <p className="error">{error}</p>}

        {loading && (
          <p className="loading">
            در حال دریافت تاریخچه واقعی از پایگاه داده...
          </p>
        )}
      </section>
      
      <section className="comparison-section">
        <div className="section-title">
          <div>
            <h2>مقایسه ثروت فعلی</h2>
            <p>اطلاعات بر اساس داده‌های ثبت‌شده در اکونوا</p>
          </div>
        </div>

        {selectedPeople.length > 0 ? (
          <div className="wealth-grid">
            {selectedPeople.map((person, index) => {
              const change = numberValue(
                person.daily_change_pct
              );

              return (
                <article
                  className="wealth-card"
                  key={person.id}
                  style={{
                    borderTopColor: colors[index],
                  }}
                >
                  <div className="wealth-card-top">
                    <span className="rank">
                      #{person.rank}
                    </span>

                    <span
                      className="person-color"
                      style={{
                        background: colors[index],
                      }}
                    />
                  </div>

                  <img
                    className="wealth-avatar"
                    src={personImage(person)}
                    alt={person.name}
                  />

                  <h3>{person.name}</h3>

                  <p className="company">
                    {person.company || "شرکت نامشخص"}
                  </p>

                  <div className="wealth-value">
                    ${money(person.net_worth_billions)}B
                  </div>

                  <div
                    className={`daily-change ${
                      change > 0
                        ? "positive"
                        : change < 0
                          ? "negative"
                          : ""
                    }`}
                  >
                    {change > 0 ? "+" : ""}
                    {change.toFixed(2)}%
                    <span> تغییر روزانه</span>
                  </div>

                  <div className="card-footer">
                    <span>
                      {person.country || "کشور نامشخص"}
                    </span>

                    <span>
                      {person.updated_at
                        ? new Date(
                            person.updated_at
                          ).toLocaleDateString("fa-IR")
                        : "تاریخ نامشخص"}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="empty">
            برای مشاهده مقایسه، افراد را از بخش بالا انتخاب کن.
          </p>
        )}
      </section>

      <section className="chart-section">
        <div className="section-title chart-heading">
          <div>
            <h2>نمودار مقایسه تاریخی</h2>
            <p>
              نمودار فقط از رکوردهای واقعی تاریخچه ثروت اکونوا
              ساخته می‌شود.
            </p>
          </div>

          <div className="range-switch">
            <button
              type="button"
              className={range === "week" ? "active" : ""}
              onClick={() => setRange("week")}
            >
              هفته
            </button>

            <button
              type="button"
              className={range === "month" ? "active" : ""}
              onClick={() => setRange("month")}
            >
              ماه
            </button>

            <button
              type="button"
              className={range === "year" ? "active" : ""}
              onClick={() => setRange("year")}
            >
              سال
            </button>
          </div>
        </div>

        {!chartData.some(
          (series) => series.points.length > 0
        ) ? (
          <div className="chart-empty">
            <span>◷</span>
            <h3>داده تاریخی کافی نیست</h3>
            <p>
              برای افراد انتخاب‌شده هنوز رکوردی در بازه زمانی
              انتخابی ثبت نشده است.
            </p>
          </div>
        ) : (
          <>
            <div className="chart-legend">
              {chartData.map((series, index) => (
                <div
                  className="legend-item"
                  key={series.person.id}
                >
                  <span
                    style={{
                      background: colors[index],
                    }}
                  />
                  {series.person.name}
                </div>
              ))}
            </div>

            <div className="chart-container">
              <div className="chart-y-labels">
                <span>${money(chartMax)}B</span>
                <span>
                  ${money(chartMin + chartSpread * 0.75)}B
                </span>
                <span>
                  ${money(chartMin + chartSpread * 0.5)}B
                </span>
                <span>
                  ${money(chartMin + chartSpread * 0.25)}B
                </span>
                <span>${money(chartMin)}B</span>
              </div>

              <div className="chart-plot">
                <div className="chart-grid-lines">
                  {[0, 1, 2, 3, 4].map((line) => (
                    <span key={line} />
                  ))}
                </div>

                <svg
                  className="wealth-chart"
                  viewBox="0 0 1000 400"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label="نمودار مقایسه تاریخی ثروت"
                >
                  {chartData.map((series, index) => {
                    const points = series.points;

                    if (points.length === 0) return null;

                    const coordinates = points.map(
                      (point, pointIndex) => {
                        const x =
                          points.length === 1
                            ? 500
                            : (pointIndex /
                                (points.length - 1)) *
                              1000;

                        const value = numberValue(
                          point.net_worth_billions
                        );

                        const y =
                          390 -
                          ((value - chartMin) /
                            chartSpread) *
                            370;

                        return `${x},${y}`;
                      }
                    );

                    return (
                      <g key={series.person.id}>
                        {points.length > 1 && (
                          <polyline
                            points={coordinates.join(" ")}
                            fill="none"
                            stroke={colors[index]}
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        )}

                        {points.length === 1 && (
                          <circle
                            cx="500"
                            cy={
                              390 -
                              ((numberValue(
                                points[0].net_worth_billions
                              ) -
                                chartMin) /
                                chartSpread) *
                                370
                            }
                            r="6"
                            fill={colors[index]}
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            <p className="chart-note">
              محور افقی ترتیب رکوردهای تاریخی هر فرد را نشان
              می‌دهد؛ فاصله زمانی بین رکوردها لزوماً یکسان
              نیست.
            </p>
          </>
        )}
      </section>
      
      <footer className="compare-footer">
        <span>ECONOVA</span>
        <p>مقایسه هوشمند ثروت در بازارهای جهانی</p>
      </footer>

      <style jsx>{`
        .compare-page {
          min-height: 100vh;
          background: #080d0a;
          color: #f2f5f0;
          padding: 24px;
          position: relative;
          overflow: hidden;
          font-family: inherit;
        }

        .background-glow {
          position: absolute;
          width: 650px;
          height: 650px;
          border-radius: 50%;
          background: #b9f27c;
          opacity: 0.035;
          filter: blur(150px);
          top: -300px;
          right: -200px;
          pointer-events: none;
        }

        .topbar,
        .hero,
        .selector-card,
        .comparison-section,
        .chart-section,
        .compare-footer {
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          position: relative;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0 35px;
        }

        .brand {
          color: #f2f5f0;
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 2px;
          text-decoration: none;
        }

        .brand span,
        .hero h1 span {
          color: #b9f27c;
        }

        .back-link {
          color: #b9f27c;
          text-decoration: none;
          font-size: 13px;
        }

        .hero {
          padding: 45px 0 35px;
        }

        .eyebrow {
          color: #b9f27c;
          font-size: 11px;
          letter-spacing: 3px;
          font-weight: 800;
        }

        .hero h1 {
          font-size: clamp(30px, 5vw, 48px);
          margin: 12px 0;
          font-weight: 900;
        }

        .hero-description {
          color: #89958c;
          line-height: 2;
          font-size: 14px;
        }

        .selector-card,
        .chart-section {
          background: #101813;
          border: 1px solid #243328;
          border-radius: 22px;
          padding: 25px;
          margin-bottom: 28px;
        }

        .section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 22px;
        }

        .section-title h2 {
          font-size: 20px;
          margin: 0 0 8px;
        }

        .section-title p {
          color: #829087;
          font-size: 12px;
          margin: 0;
          line-height: 1.8;
        }

        .counter {
          color: #b9f27c;
          background: #1b2b1e;
          border: 1px solid #385438;
          border-radius: 30px;
          padding: 8px 14px;
          direction: ltr;
          font-size: 13px;
        }

        .search-input {
          width: 100%;
          box-sizing: border-box;
          background: #080f0b;
          border: 1px solid #2a3b2e;
          color: white;
          padding: 15px;
          border-radius: 12px;
          outline: none;
          font: inherit;
          font-size: 13px;
        }

        .search-input:focus {
          border-color: #b9f27c;
        }

        .search-results {
          margin-top: 10px;
          background: #0b120e;
          border: 1px solid #26372b;
          border-radius: 13px;
          overflow: hidden;
          max-height: 320px;
          overflow-y: auto;
        }

        .search-result {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px;
          background: transparent;
          border: none;
          border-bottom: 1px solid #1d2b21;
          color: white;
          text-align: right;
          cursor: pointer;
          font: inherit;
        }

        .search-result:hover {
          background: #17241a;
        }

        .search-result:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .search-result img,
        .selected-person img {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          object-fit: cover;
        }

        .result-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
          flex: 1;
        }

        .result-info strong {
          font-size: 13px;
        }

        .result-info small,
        .selected-person small {
          color: #829087;
          font-size: 11px;
        }

        .add-icon {
          color: #b9f27c;
          font-size: 25px;
        }

        .selected-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 20px;
        }

        .selected-person {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #18241b;
          border: 1px solid #304532;
          padding: 9px 12px;
          border-radius: 13px;
        }

        .selected-person div {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .selected-person strong {
          font-size: 12px;
        }

        .selected-person button {
          background: transparent;
          border: none;
          color: #ff8585;
          font-size: 22px;
          cursor: pointer;
          margin-right: 5px;
        }

        .empty {
          color: #829087;
          text-align: center;
          padding: 22px 5px;
          font-size: 13px;
        }

        .error {
          color: #ff8585;
          font-size: 12px;
        }

        .loading {
          color: #b9f27c;
          font-size: 12px;
        }

        .comparison-section {
          margin-bottom: 35px;
        }

        .comparison-section > .section-title {
          padding: 0 3px;
        }

        .wealth-grid {
          display: grid;
          grid-template-columns: repeat(
            auto-fit,
            minmax(190px, 1fr)
          );
          gap: 15px;
        }

        .wealth-card {
          background: #101813;
          border: 1px solid #26372b;
          border-top: 3px solid #b9f27c;
          border-radius: 18px;
          padding: 20px;
          text-align: center;
          min-width: 0;
        }

        .wealth-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .rank {
          color: #b9f27c;
          font-size: 12px;
          font-weight: 800;
        }

        .person-color {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .wealth-avatar {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          object-fit: cover;
          margin: 18px auto 10px;
          border: 2px solid #344c37;
        }

        .wealth-card h3 {
          font-size: 16px;
          margin: 8px 0;
        }

        .company {
          color: #849087;
          font-size: 11px;
          min-height: 18px;
        }

        .wealth-value {
          color: #b9f27c;
          font-size: 25px;
          font-weight: 900;
          direction: ltr;
          margin: 20px 0 10px;
        }

        .daily-change {
          color: #89958c;
          font-size: 12px;
          direction: ltr;
        }

        .daily-change.positive {
          color: #83e5a0;
        }

        .daily-change.negative {
          color: #ff8585;
        }

        .daily-change span {
          direction: rtl;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          gap: 5px;
          color: #738078;
          font-size: 10px;
          border-top: 1px solid #26372b;
          margin-top: 18px;
          padding-top: 12px;
        }

        .chart-heading {
          flex-wrap: wrap;
        }

        .range-switch {
          display: flex;
          gap: 5px;
          background: #080f0b;
          border: 1px solid #293a2d;
          border-radius: 10px;
          padding: 4px;
        }

        .range-switch button {
          background: transparent;
          border: none;
          color: #849087;
          padding: 8px 15px;
          border-radius: 7px;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
        }

        .range-switch button.active {
          background: #b9f27c;
          color: #101810;
          font-weight: 800;
        }

        .chart-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          margin: 20px 0;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          color: #c5cec6;
        }

        .legend-item span {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .chart-container {
          display: flex;
          height: 300px;
          gap: 12px;
          direction: ltr;
        }

        .chart-y-labels {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: #829087;
          font-size: 10px;
          text-align: right;
          padding: 0 0 2px;
          min-width: 65px;
        }

        .chart-plot {
          position: relative;
          flex: 1;
          min-width: 0;
        }

        .chart-grid-lines {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .chart-grid-lines span {
          width: 100%;
          border-top: 1px dashed #29382d;
        }

        .wealth-chart {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .chart-empty {
          text-align: center;
          padding: 50px 15px;
          border: 1px dashed #304532;
          border-radius: 15px;
        }

        .chart-empty > span {
          color: #b9f27c;
          font-size: 32px;
        }

        .chart-empty h3 {
          font-size: 16px;
        }

        .chart-empty p,
        .chart-note {
          color: #829087;
          font-size: 12px;
          line-height: 2;
        }

        .chart-note {
          margin-top: 20px;
        }

        .compare-footer {
          text-align: center;
          padding: 30px 0 15px;
          color: #657269;
          font-size: 11px;
        }

        .compare-footer span {
          color: #b9f27c;
          font-weight: 900;
          letter-spacing: 3px;
        }

        @media (max-width: 600px) {
          .compare-page {
            padding: 15px;
          }

          .selector-card,
          .chart-section {
            padding: 17px;
          }

          .section-title {
            align-items: flex-start;
          }

          .chart-heading {
            flex-direction: column;
          }

          .range-switch {
            width: 100%;
          }

          .range-switch button {
            flex: 1;
          }

          .chart-container {
            height: 230px;
          }

          .wealth-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .wealth-value {
            font-size: 20px;
          }
        }
      `}</style>
    </main>
  );
}
