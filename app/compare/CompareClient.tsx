
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

  return `$${(Number.isFinite(number) ? number : 0).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }
  )}B`;
};

const numberValue = (value: number | string) => {
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

    if (!Array.isArray(data) || data.length === 0) break;

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
        Date.parse(a.recorded_at) - Date.parse(b.recorded_at) ||
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
        .filter((person): person is Billionaire => Boolean(person)),
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
            (person.company || "").toLowerCase().includes(term) ||
            (person.country || "").toLowerCase().includes(term))
      )
      .slice(0, 30);
  }, [initialBillionaires, selectedIds, search]);

  async function addPerson(person: Billionaire) {
    if (selectedIds.length >= 5) return;

    const id = String(person.id);

    setSelectedIds((previous) => [...previous, id]);
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
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    return selectedPeople.map((person) => {
      const id = String(person.id);
      const history = histories[id] || [];

      const points = history.filter(
        (point) => Date.parse(point.recorded_at) >= cutoff
      );

      return {
        person,
        points,
      };
    });
  }, [selectedPeople, histories, days]);

  const chartValues = chartData.flatMap((item) =>
    item.points.map((point) =>
      numberValue(point.net_worth_billions)
    )
  );

  const chartMin =
    chartValues.length > 0 ? Math.min(...chartValues) : 0;

  const chartMax =
    chartValues.length > 0 ? Math.max(...chartValues) : 1;

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
        <p className="eyebrow">ECONOVA COMPARISON</p>
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
          onChange={(event) => setSearch(event.target.value)}
          placeholder="جست‌وجوی نام، شرکت یا کشور..."
        />

        {search.trim() && (
          <div className="search-results">
            {filteredPeople.length === 0 ? (
              <p className="empty">فردی پیدا نشد.</p>
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
                      رتبه #{person.rank} ·{" "}
                      {money(person.net_worth_billions)}
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
                <small>
                  رتبه #{person.rank}
                </small>
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
        
      {selectedPeople.length >= 2 && (
        <section className="comparison-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">LIVE COMPARISON</span>
              <h2>مقایسه ثروت</h2>
              <p>مقایسه ارزش دارایی و روند تغییر ثروت افراد انتخاب‌شده</p>
            </div>
            <span className="people-count">
              {selectedPeople.length} نفر
            </span>
          </div>

          <div className="wealth-grid">
            {selectedPeople.map((person, index) => {
              const worth = numberValue(person.net_worth_billions);
              const change = numberValue(person.daily_change_pct);

              return (
                <article className="wealth-card" key={person.id}>
                  <div className="wealth-card-top">
                    <span
                      className="person-color"
                      style={{ background: colors[index] }}
                    />
                    <span className="person-rank">
                      #{person.rank}
                    </span>
                  </div>

                  <div className="person-info">
                    {personImage(person.image_url) ? (
                      <img
                        src={personImage(person.image_url)!}
                        alt={person.name}
                        className="person-avatar"
                      />
                    ) : (
                      <div className="person-avatar placeholder">
                        {person.name.slice(0, 1)}
                      </div>
                    )}

                    <div>
                      <h3>{person.name}</h3>
                      <p>{person.company || person.country || "—"}</p>
                    </div>
                  </div>

                  <div className="wealth-value">
                    <strong>${money(worth)}B</strong>
                    <span>ثروت تخمینی فعلی</span>
                  </div>

                  <div
                    className={`daily-change ${
                      change > 0 ? "positive" : change < 0 ? "negative" : ""
                    }`}
                  >
                    {change > 0 ? "+" : ""}
                    {change.toFixed(2)}%
                    <span>تغییر روزانه</span>
                  </div>
                </article>
              );
            })}
          </div>

          {(() => {
            const sorted = [...selectedPeople].sort(
              (a, b) =>
                numberValue(b.net_worth_billions) -
                numberValue(a.net_worth_billions)
            );

            const richest = sorted[0];
            const poorest = sorted[sorted.length - 1];

            const richestWorth = numberValue(richest.net_worth_billions);
            const poorestWorth = numberValue(poorest.net_worth_billions);

            const difference = richestWorth - poorestWorth;
            const percentage =
              poorestWorth > 0
                ? (difference / poorestWorth) * 100
                : 0;

            return (
              <div className="difference-card">
                <div>
                  <span className="eyebrow">WEALTH GAP</span>
                  <h3>اختلاف ثروت</h3>
                  <p>
                    {richest.name} در مقایسه با {poorest.name}
                  </p>
                </div>

                <div className="difference-values">
                  <strong>${money(difference)}B</strong>
                  <span>
                    {percentage.toFixed(2)}% اختلاف
                  </span>
                </div>
              </div>
            );
          })()}

          <section className="chart-card">
            <div className="chart-heading">
              <div>
                <span className="eyebrow">HISTORICAL DATA</span>
                <h2>نمودار مقایسه تاریخی</h2>
                <p>بر اساس اطلاعات ثبت‌شده در تاریخچه واقعی اکونوا</p>
              </div>

              <div className="range-selector">
                {(
                  [
                    ["week", "۷ روز"],
                    ["month", "۳۰ روز"],
                    ["year", "یک سال"],
                  ] as [Range, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={range === value ? "active" : ""}
                    onClick={() => setRange(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="chart-message">
                در حال دریافت تاریخچه ثروت...
              </div>
            ) : error ? (
              <div className="chart-message error-message">
                {error}
              </div>
            ) : chartData.length === 0 ? (
              <div className="chart-message">
                برای افراد انتخاب‌شده در این بازه اطلاعات تاریخی کافی ثبت نشده است.
              </div>
            ) : (
              <>
                <div className="chart-summary">
                  <span>بیشترین مقدار:</span>
                  <strong>${money(chartMax)}B</strong>
                  <span>کمترین مقدار:</span>
                  <strong>${money(chartMin)}B</strong>
                </div>

                <div className="chart-container">
                  <svg
                    viewBox="0 0 900 320"
                    preserveAspectRatio="none"
                    className="comparison-chart"
                    role="img"
                    aria-label="نمودار مقایسه تاریخی ثروت"
                  >
                    {[0, 1, 2, 3, 4].map((line) => {
                      const y = 25 + line * 65;

                      return (
                        <line
                          key={line}
                          x1="55"
                          y1={y}
                          x2="880"
                          y2={y}
                          className="chart-grid-line"
                        />
                      );
                    })}

                    {chartData.map((series, index) => {
                      const points = series.points
                        .map((point, pointIndex) => {
                          const x =
                            series.points.length > 1
                              ? 55 +
                                (pointIndex /
                                  (series.points.length - 1)) *
                                  825
                              : 55;

                          const value = numberValue(
                            point.net_worth_billions
                          );

                          const y =
                            285 -
                            ((value - chartMin) / chartSpread) * 260;

                          return `${x},${y}`;
                        })
                        .join(" ");

                      return (
                        <polyline
                          key={series.id}
                          points={points}
                          fill="none"
                          stroke={colors[index]}
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="chart-line"
                        />
                      );
                    })}
                  </svg>
                </div>

                <div className="chart-legend">
                  {chartData.map((series, index) => (
                    <div className="legend-item" key={series.id}>
                      <span
                        className="legend-dot"
                        style={{ background: colors[index] }}
                      />
                      <span>{series.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </section>
      )}
    </main>
  );
</>
                                  
<style jsx>{`
  .comparison-section {
    margin-top: 38px;
  }

  .section-heading,
  .chart-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 22px;
  }

  .eyebrow {
    display: block;
    color: #b9f27c;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 2px;
    margin-bottom: 8px;
  }

  .section-heading h2,
  .chart-heading h2 {
    font-size: 23px;
    margin: 0;
    color: #f5f7f2;
  }

  .section-heading p,
  .chart-heading p {
    color: #929b8c;
    font-size: 12px;
    margin: 8px 0 0;
  }

  .people-count {
    border: 1px solid #35452d;
    color: #b9f27c;
    border-radius: 30px;
    padding: 8px 14px;
    font-size: 12px;
  }

  .wealth-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 14px;
  }

  .wealth-card,
  .difference-card,
  .chart-card {
    background: #111710;
    border: 1px solid #293426;
    border-radius: 18px;
    padding: 19px;
  }

  .wealth-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .person-color,
  .legend-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    display: inline-block;
  }

  .person-rank {
    color: #8d9886;
    font-size: 11px;
  }

  .person-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 19px 0;
  }

  .person-avatar {
    width: 43px;
    height: 43px;
    border-radius: 50%;
    object-fit: cover;
    background: #263122;
  }

  .placeholder {
    display: grid;
    place-items: center;
    color: #b9f27c;
    font-weight: 800;
  }

  .person-info h3 {
    margin: 0;
    color: #f1f4ed;
    font-size: 15px;
  }

  .person-info p {
    color: #929b8c;
    font-size: 11px;
    margin: 5px 0 0;
  }

  .wealth-value strong {
    display: block;
    color: #b9f27c;
    font-size: 25px;
    direction: ltr;
    text-align: right;
  }

  .wealth-value span,
  .daily-change span {
    display: block;
    color: #929b8c;
    font-size: 11px;
    margin-top: 6px;
  }

  .daily-change {
    border-top: 1px solid #293426;
    margin-top: 16px;
    padding-top: 13px;
    color: #c4cbbd;
    font-weight: 700;
    font-size: 13px;
  }

  .daily-change.positive {
    color: #9ee879;
  }

  .daily-change.negative {
    color: #ff8585;
  }

  .difference-card {
    margin-top: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }

  .difference-card h3 {
    color: #f2f5ed;
    margin: 0;
    font-size: 17px;
  }

  .difference-card p {
    color: #929b8c;
    font-size: 12px;
    margin: 8px 0 0;
  }

  .difference-values {
    text-align: left;
    flex-shrink: 0;
  }

  .difference-values strong {
    display: block;
    color: #b9f27c;
    font-size: 23px;
    direction: ltr;
  }

  .difference-values span {
    display: block;
    color: #929b8c;
    font-size: 11px;
    margin-top: 7px;
  }

  .chart-card {
    margin-top: 17px;
  }

  .range-selector {
    display: flex;
    gap: 5px;
    padding: 4px;
    background: #0b100a;
    border: 1px solid #293426;
    border-radius: 10px;
  }

  .range-selector button {
    border: 0;
    background: transparent;
    color: #9ca595;
    padding: 8px 11px;
    border-radius: 7px;
    font-size: 11px;
    cursor: pointer;
    white-space: nowrap;
  }

  .range-selector button.active {
    background: #b9f27c;
    color: #10170c;
    font-weight: 800;
  }

  .chart-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin: 20px 0 12px;
    color: #929b8c;
    font-size: 11px;
  }

  .chart-summary strong {
    color: #dce6d3;
    margin-left: 12px;
    direction: ltr;
  }

  .chart-container {
    width: 100%;
    overflow: hidden;
    border-radius: 12px;
    background: #0c120b;
    padding: 10px 0;
  }

  .comparison-chart {
    width: 100%;
    height: 260px;
    overflow: visible;
  }

  .chart-grid-line {
    stroke: #293426;
    stroke-width: 1;
    stroke-dasharray: 4 5;
  }

  .chart-line {
    vector-effect: non-scaling-stroke;
  }

  .chart-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 17px;
    margin-top: 18px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 7px;
    color: #c2cbbb;
    font-size: 12px;
  }

  .chart-message {
    min-height: 150px;
    display: grid;
    place-items: center;
    text-align: center;
    color: #a8b19e;
    font-size: 13px;
    padding: 20px;
  }

  .error-message {
    color: #ff9292;
  }

  @media (max-width: 650px) {
    .section-heading,
    .chart-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .wealth-grid {
      grid-template-columns: 1fr;
    }

    .difference-card {
      align-items: flex-start;
      flex-direction: column;
    }

    .difference-values {
      text-align: right;
    }

    .range-selector {
      width: 100%;
    }

    .range-selector button {
      flex: 1;
    }

    .comparison-chart {
      height: 210px;
    }
  }
`}</style>
    );
  }
  
