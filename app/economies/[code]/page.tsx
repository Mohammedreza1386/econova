"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Metric = {
  value: number | null;
  year: string | null;
};

type CountryProfile = {
  name: string;
  code: string;
  region: string;
  incomeLevel: string;
  gdp: Metric;
  growth: Metric;
  gdpPerCapita: Metric;
  population: Metric;
  history: { year: string; value: number }[];
};

const INDICATORS = {
  gdp: "NY.GDP.MKTP.CD",
  growth: "NY.GDP.MKTP.KD.ZG",
  gdpPerCapita: "NY.GDP.PCAP.CD",
  population: "SP.POP.TOTL",
};

const styles = `
* { box-sizing:border-box; }
.country-page {
  min-height:100vh;
  background:radial-gradient(ellipse at 85% 0%,rgba(44,90,65,.2),transparent 38%),#070b12;
  color:#f4f2ec;font-family:Tahoma,Arial,sans-serif;direction:rtl;
}
.country-wrap {width:min(1120px,calc(100% - 32px));margin:auto}
.country-topline {height:3px;background:linear-gradient(90deg,#947039,#d9bd77,#b9f27c,#947039)}
.country-header {padding:28px 0 38px;border-bottom:1px solid rgba(217,189,119,.16)}
.country-back {color:#d9bd77;text-decoration:none;font-size:12px}
.country-eyebrow {margin:30px 0 10px;color:#b9f27c;font-size:10px;font-weight:800;letter-spacing:2px;direction:ltr;text-align:right}
.country-title {margin:0;font-size:clamp(32px,5vw,52px);line-height:1.5}
.country-subtitle {color:#9ba7b5;font-size:13px;line-height:2}
.country-code {display:inline-block;margin-top:12px;padding:7px 12px;border:1px solid rgba(217,189,119,.3);border-radius:30px;color:#d9bd77;font-size:11px;direction:ltr}
.country-main {padding:28px 0 55px}
.country-panel {padding:23px;margin-bottom:22px;border:1px solid rgba(185,242,124,.17);border-radius:17px;background:linear-gradient(140deg,#111b20,#0b1119 70%,#17150e)}
.country-panel h2 {margin:0 0 8px;font-size:20px}
.country-muted {color:#8794a4;font-size:11px;line-height:2}
.country-grid {display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:22px}
.country-stat {padding:17px 14px;border:1px solid rgba(255,255,255,.09);border-radius:13px;background:rgba(255,255,255,.025);min-width:0}
.country-stat-label {color:#9ba7b5;font-size:11px;line-height:1.9}
.country-stat-value {margin-top:10px;color:#b9f27c;font-size:clamp(16px,2.2vw,23px);font-weight:800;overflow-wrap:anywhere;direction:ltr;text-align:right}
.country-stat-year {margin-top:8px;color:#738091;font-size:10px}
.country-chart {display:grid;grid-template-columns:repeat(auto-fit,minmax(30px,1fr));align-items:end;gap:8px;min-height:220px;padding-top:22px}
.country-chart-item {display:flex;flex-direction:column;justify-content:end;align-items:center;gap:8px;min-width:0;height:210px}
.country-chart-value {font-size:9px;color:#b9f27c;direction:ltr;writing-mode:vertical-rl;transform:rotate(180deg);max-height:60px}
.country-chart-track {width:100%;max-width:38px;height:130px;display:flex;align-items:end;background:#060a10;border-radius:6px;overflow:hidden;border:1px solid rgba(255,255,255,.05)}
.country-chart-bar {width:100%;min-height:2px;background:linear-gradient(0deg,#779f48,#b9f27c,#e0d59a);border-radius:5px 5px 0 0}
.country-chart-year {font-size:9px;color:#9ba7b5;direction:ltr}
.country-table-wrap {overflow-x:auto;border:1px solid rgba(255,255,255,.1);border-radius:12px}
.country-table {width:100%;min-width:400px;border-collapse:collapse;text-align:right;font-size:12px}
.country-table th {padding:13px;background:rgba(255,255,255,.04);color:#9ba7b5;font-weight:500}
.country-table td {padding:13px;border-top:1px solid rgba(255,255,255,.07)}
.country-ltr {direction:ltr;text-align:right;color:#b9f27c;white-space:nowrap}
.country-status {padding:18px;border:1px solid rgba(255,255,255,.1);border-radius:12px;color:#c4cbd2;font-size:12px;line-height:2}
.country-error {border-color:rgba(240,100,100,.35);background:rgba(120,20,20,.13)}
.country-footer {margin-top:30px;padding-top:18px;border-top:1px solid rgba(255,255,255,.1);color:#7e8b99;font-size:10px;line-height:2.4}
.country-footer a {color:#d9bd77}
@media(max-width:760px) {
 .country-grid {grid-template-columns:repeat(2,minmax(0,1fr))}
 .country-panel {padding:16px}
 .country-chart {gap:4px}
 .country-chart-value {font-size:8px}
}
`;

function formatMoney(value: number | null) {
  if (value === null) return "داده موجود نیست";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number | null) {
  if (value === null) return "داده موجود نیست";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatGrowth(value: number | null) {
  if (value === null) return "داده موجود نیست";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}٪`;
}

function latestMetric(rows: any[]): Metric {
  const valid = rows
    .filter(
      (row) =>
        row?.value !== null &&
        row?.value !== undefined &&
        Number.isFinite(Number(row.value)) &&
        row?.date
    )
    .sort((a, b) => Number(b.date) - Number(a.date));

  if (!valid.length) return { value: null, year: null };

  return {
    value: Number(valid[0].value),
    year: String(valid[0].date),
  };
}
export default function CountryPage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code ?? "").toUpperCase();

  const [profile, setProfile] = useState<CountryProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!/^[A-Z]{3}$/.test(code)) {
      setError("کد کشور معتبر نیست.");
      setLoading(false);
      return;
    }

    let active = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const base = "https://api.worldbank.org/v2";
        const countryResponse = await fetch(
          `${base}/country/${code}?format=json`
        );

        if (!countryResponse.ok) {
          throw new Error("دریافت اطلاعات کشور ناموفق بود.");
        }

        const countryResult = await countryResponse.json();
        const country = countryResult?.[1]?.[0];

        if (
          !country?.id ||
          !country?.name ||
          !country?.region?.value ||
          country.region.value === "Aggregates"
        ) {
          throw new Error("این کد مربوط به یک کشور معتبر نیست.");
        }

        const requests = await Promise.all(
          Object.entries(INDICATORS).map(async ([key, indicator]) => {
            const dates =
              key === "gdp" ? "2000:2026" : "2018:2026";

            const response = await fetch(
              `${base}/country/${code}/indicator/${indicator}?format=json&per_page=100&date=${dates}`
            );

            if (!response.ok) {
              throw new Error(`دریافت شاخص ${indicator} ناموفق بود.`);
            }

            const result = await response.json();

            if (!Array.isArray(result?.[1])) {
              throw new Error(`داده شاخص ${indicator} معتبر نیست.`);
            }

            return [key, result[1]] as const;
          })
        );

        const data = new Map(requests);

        const gdpRows = data.get("gdp") ?? [];
        const gdp = latestMetric(gdpRows);
        const growth = latestMetric(data.get("growth") ?? []);
        const gdpPerCapita = latestMetric(
          data.get("gdpPerCapita") ?? []
        );
        const population = latestMetric(
          data.get("population") ?? []
        );

        const history = gdpRows
          .filter(
            (row: any) =>
              row?.value !== null &&
              row?.value !== undefined &&
              Number.isFinite(Number(row.value)) &&
              row?.date
          )
          .map((row: any) => ({
            year: String(row.date),
            value: Number(row.value),
          }))
          .sort(
            (a: { year: string }, b: { year: string }) =>
              Number(a.year) - Number(b.year)
          )
          .slice(-12);

        if (gdp.value === null) {
          throw new Error(
            "برای این کشور داده GDP قابل نمایش پیدا نشد."
          );
        }

        const nextProfile: CountryProfile = {
          name: country.name,
          code: country.id,
          region: country.region.value,
          incomeLevel:
            country.incomeLevel?.value ?? "اطلاعات موجود نیست",
          gdp,
          growth,
          gdpPerCapita,
          population,
          history,
        };

        if (active) setProfile(nextProfile);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "خطا در دریافت اطلاعات کشور."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [code]);

  const maxGDP = Math.max(
    1,
    ...(profile?.history.map((item) => item.value) ?? [1])
  );

  return (
    <main className="country-page">
      <style>{styles}</style>
      <div className="country-topline" />

      <header className="country-header">
        <div className="country-wrap">
          <a href="/economies" className="country-back">
            ← بازگشت به اقتصادهای جهان
          </a>

          <p className="country-eyebrow">
            ECONOVA • COUNTRY ECONOMIC PROFILE
          </p>

          <h1 className="country-title">
            {profile ? profile.name : "پروفایل اقتصادی کشور"}
          </h1>

          <p className="country-subtitle">
            اطلاعات اقتصادی بر اساس داده‌های منتشرشده بانک جهانی.
            آخرین سال موجود برای هر شاخص نمایش داده می‌شود.
          </p>

          {profile && (
            <span className="country-code">
              {profile.code} · {profile.region}
            </span>
          )}
        </div>
      </header>

      <section className="country-wrap country-main">
        {loading && (
          <div className="country-status">
            در حال دریافت اطلاعات واقعی کشور از بانک جهانی...
          </div>
        )}

        {!loading && error && (
          <div className="country-status country-error">
            <strong>بارگذاری اطلاعات ناموفق بود</strong>
            <p>{error}</p>
            <button
              className="eco-button"
              onClick={() => window.location.reload()}
            >
              تلاش دوباره
            </button>
          </div>
        )}

        {!loading && profile && (
          <>
            <div className="country-grid">
              <div className="country-stat">
                <div className="country-stat-label">
                  تولید ناخالص داخلی (GDP)
                </div>
                <div className="country-stat-value">
                  {formatMoney(profile.gdp.value)}
                </div>
                <div className="country-stat-year">
                  سال داده: {profile.gdp.year ?? "نامشخص"}
                </div>
              </div>

              <div className="country-stat">
                <div className="country-stat-label">
                  رشد سالانه GDP
                </div>
                <div
                  className="country-stat-value"
                  style={{
                    color:
                      profile.growth.value === null
                        ? "#8794a4"
                        : profile.growth.value >= 0
                          ? "#b9f27c"
                          : "#ff9292",
                  }}
                >
                  {formatGrowth(profile.growth.value)}
                </div>
                <div className="country-stat-year">
                  سال داده: {profile.growth.year ?? "نامشخص"}
                </div>
              </div>

              <div className="country-stat">
                <div className="country-stat-label">
                  GDP سرانه
                </div>
                <div className="country-stat-value">
                  {formatMoney(profile.gdpPerCapita.value)}
                </div>
                <div className="country-stat-year">
                  سال داده: {profile.gdpPerCapita.year ?? "نامشخص"}
                </div>
              </div>

              <div className="country-stat">
                <div className="country-stat-label">جمعیت</div>
                <div className="country-stat-value">
                  {formatNumber(profile.population.value)}
                </div>
                <div className="country-stat-year">
                  سال داده: {profile.population.year ?? "نامشخص"}
                </div>
              </div>
            </div>

            <section className="country-panel">
              <p className="country-eyebrow" style={{ marginTop: 0 }}>
                ECONOVA • HISTORICAL DATA
              </p>
              <h2>روند تاریخی GDP</h2>
              <p className="country-muted">
                تغییرات تولید ناخالص داخلی اسمی بر حسب دلار آمریکا؛
                آخرین ۱۲ سال دارای داده در دسترس.
              </p>

              {profile.history.length === 0 ? (
                <p className="country-status">
                  داده تاریخی برای نمودار موجود نیست.
                </p>
              ) : (
                <div className="country-chart">
                  {profile.history.map((item) => (
                    <div
                      key={item.year}
                      className="country-chart-item"
                      title={`${item.year}: ${formatMoney(item.value)}`}
                    >
                      <span className="country-chart-value">
                        {formatNumber(item.value)}
                      </span>

                      <div className="country-chart-track">
                        <div
                          className="country-chart-bar"
                          style={{
                            height: `${Math.max(
                              2,
                              (item.value / maxGDP) * 100
                            )}%`,
                          }}
                        />
                      </div>

                      <span className="country-chart-year">
                        {item.year}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="country-panel">
              <h2>اطلاعات کشور</h2>
              <p className="country-muted">
                جزئیات و سال آخرین داده هر شاخص
              </p>

              <div className="country-table-wrap">
                <table className="country-table">
                  <thead>
                    <tr>
                      <th>شاخص</th>
                      <th>مقدار</th>
                      <th>سال</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>GDP اسمی</td>
                      <td className="country-ltr">
                        {formatMoney(profile.gdp.value)}
                      </td>
                      <td>{profile.gdp.year ?? "—"}</td>
                    </tr>
                    <tr>
                      <td>رشد اقتصادی سالانه</td>
                      <td className="country-ltr">
                        {formatGrowth(profile.growth.value)}
                      </td>
                      <td>{profile.growth.year ?? "—"}</td>
                    </tr>
                    <tr>
                      <td>GDP سرانه</td>
                      <td className="country-ltr">
                        {formatMoney(profile.gdpPerCapita.value)}
                      </td>
                      <td>{profile.gdpPerCapita.year ?? "—"}</td>
                    </tr>
                    <tr>
                      <td>جمعیت</td>
                      <td className="country-ltr">
                        {formatNumber(profile.population.value)}
                      </td>
                      <td>{profile.population.year ?? "—"}</td>
                    </tr>
                    <tr>
                      <td>منطقه بانک جهانی</td>
                      <td colSpan={2}>{profile.region}</td>
                    </tr>
                    <tr>
                      <td>گروه درآمدی بانک جهانی</td>
                      <td colSpan={2}>{profile.incomeLevel}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <footer className="country-footer">
          منبع داده‌ها: World Bank Open Data
          <br />
          <a
            href="https://data.worldbank.org/"
            target="_blank"
            rel="noreferrer"
          >
            مشاهده وب‌سایت رسمی بانک جهانی
          </a>
          <br />
          توجه: GDP اسمی با GDP واقعی تفاوت دارد؛ نمودار بالا GDP اسمی
          را نشان می‌دهد و به‌تنهایی معیار کاملی برای رفاه مردم نیست.
        </footer>
      </section>
    </main>
  );
}
export default function CountryPage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code ?? "").toUpperCase();

  const [profile, setProfile] = useState<CountryProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!/^[A-Z]{3}$/.test(code)) {
      setError("کد کشور معتبر نیست.");
      setLoading(false);
      return;
    }

    let active = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const base = "https://api.worldbank.org/v2";
        const countryResponse = await fetch(
          `${base}/country/${code}?format=json`
        );

        if (!countryResponse.ok) {
          throw new Error("دریافت اطلاعات کشور ناموفق بود.");
        }

        const countryResult = await countryResponse.json();
        const country = countryResult?.[1]?.[0];

        if (
          !country?.id ||
          !country?.name ||
          !country?.region?.value ||
          country.region.value === "Aggregates"
        ) {
          throw new Error("این کد مربوط به یک کشور معتبر نیست.");
        }

        const requests = await Promise.all(
          Object.entries(INDICATORS).map(async ([key, indicator]) => {
            const dates =
              key === "gdp" ? "2000:2026" : "2018:2026";

            const response = await fetch(
              `${base}/country/${code}/indicator/${indicator}?format=json&per_page=100&date=${dates}`
            );

            if (!response.ok) {
              throw new Error(`دریافت شاخص ${indicator} ناموفق بود.`);
            }

            const result = await response.json();

            if (!Array.isArray(result?.[1])) {
              throw new Error(`داده شاخص ${indicator} معتبر نیست.`);
            }

            return [key, result[1]] as const;
          })
        );

        const data = new Map(requests);

        const gdpRows = data.get("gdp") ?? [];
        const gdp = latestMetric(gdpRows);
        const growth = latestMetric(data.get("growth") ?? []);
        const gdpPerCapita = latestMetric(
          data.get("gdpPerCapita") ?? []
        );
        const population = latestMetric(
          data.get("population") ?? []
        );

        const history = gdpRows
          .filter(
            (row: any) =>
              row?.value !== null &&
              row?.value !== undefined &&
              Number.isFinite(Number(row.value)) &&
              row?.date
          )
          .map((row: any) => ({
            year: String(row.date),
            value: Number(row.value),
          }))
          .sort(
            (a: { year: string }, b: { year: string }) =>
              Number(a.year) - Number(b.year)
          )
          .slice(-12);

        if (gdp.value === null) {
          throw new Error(
            "برای این کشور داده GDP قابل نمایش پیدا نشد."
          );
        }

        const nextProfile: CountryProfile = {
          name: country.name,
          code: country.id,
          region: country.region.value,
          incomeLevel:
            country.incomeLevel?.value ?? "اطلاعات موجود نیست",
          gdp,
          growth,
          gdpPerCapita,
          population,
          history,
        };

        if (active) setProfile(nextProfile);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "خطا در دریافت اطلاعات کشور."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [code]);

  const maxGDP = Math.max(
    1,
    ...(profile?.history.map((item) => item.value) ?? [1])
  );

  return (
    <main className="country-page">
      <style>{styles}</style>
      <div className="country-topline" />

      <header className="country-header">
        <div className="country-wrap">
          <a href="/economies" className="country-back">
            ← بازگشت به اقتصادهای جهان
          </a>

          <p className="country-eyebrow">
            ECONOVA • COUNTRY ECONOMIC PROFILE
          </p>

          <h1 className="country-title">
            {profile ? profile.name : "پروفایل اقتصادی کشور"}
          </h1>

          <p className="country-subtitle">
            اطلاعات اقتصادی بر اساس داده‌های منتشرشده بانک جهانی.
            آخرین سال موجود برای هر شاخص نمایش داده می‌شود.
          </p>

          {profile && (
            <span className="country-code">
              {profile.code} · {profile.region}
            </span>
          )}
        </div>
      </header>

      <section className="country-wrap country-main">
        {loading && (
          <div className="country-status">
            در حال دریافت اطلاعات واقعی کشور از بانک جهانی...
          </div>
        )}

        {!loading && error && (
          <div className="country-status country-error">
            <strong>بارگذاری اطلاعات ناموفق بود</strong>
            <p>{error}</p>
            <button
              className="eco-button"
              onClick={() => window.location.reload()}
            >
              تلاش دوباره
            </button>
          </div>
        )}

        {!loading && profile && (
          <>
            <div className="country-grid">
              <div className="country-stat">
                <div className="country-stat-label">
                  تولید ناخالص داخلی (GDP)
                </div>
                <div className="country-stat-value">
                  {formatMoney(profile.gdp.value)}
                </div>
                <div className="country-stat-year">
                  سال داده: {profile.gdp.year ?? "نامشخص"}
                </div>
              </div>

              <div className="country-stat">
                <div className="country-stat-label">
                  رشد سالانه GDP
                </div>
                <div
                  className="country-stat-value"
                  style={{
                    color:
                      profile.growth.value === null
                        ? "#8794a4"
                        : profile.growth.value >= 0
                          ? "#b9f27c"
                          : "#ff9292",
                  }}
                >
                  {formatGrowth(profile.growth.value)}
                </div>
                <div className="country-stat-year">
                  سال داده: {profile.growth.year ?? "نامشخص"}
                </div>
              </div>

              <div className="country-stat">
                <div className="country-stat-label">
                  GDP سرانه
                </div>
                <div className="country-stat-value">
                  {formatMoney(profile.gdpPerCapita.value)}
                </div>
                <div className="country-stat-year">
                  سال داده: {profile.gdpPerCapita.year ?? "نامشخص"}
                </div>
              </div>

              <div className="country-stat">
                <div className="country-stat-label">جمعیت</div>
                <div className="country-stat-value">
                  {formatNumber(profile.population.value)}
                </div>
                <div className="country-stat-year">
                  سال داده: {profile.population.year ?? "نامشخص"}
                </div>
              </div>
            </div>

            <section className="country-panel">
              <p className="country-eyebrow" style={{ marginTop: 0 }}>
                ECONOVA • HISTORICAL DATA
              </p>
              <h2>روند تاریخی GDP</h2>
              <p className="country-muted">
                تغییرات تولید ناخالص داخلی اسمی بر حسب دلار آمریکا؛
                آخرین ۱۲ سال دارای داده در دسترس.
              </p>

              {profile.history.length === 0 ? (
                <p className="country-status">
                  داده تاریخی برای نمودار موجود نیست.
                </p>
              ) : (
                <div className="country-chart">
                  {profile.history.map((item) => (
                    <div
                      key={item.year}
                      className="country-chart-item"
                      title={`${item.year}: ${formatMoney(item.value)}`}
                    >
                      <span className="country-chart-value">
                        {formatNumber(item.value)}
                      </span>

                      <div className="country-chart-track">
                        <div
                          className="country-chart-bar"
                          style={{
                            height: `${Math.max(
                              2,
                              (item.value / maxGDP) * 100
                            )}%`,
                          }}
                        />
                      </div>

                      <span className="country-chart-year">
                        {item.year}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="country-panel">
              <h2>اطلاعات کشور</h2>
              <p className="country-muted">
                جزئیات و سال آخرین داده هر شاخص
              </p>

              <div className="country-table-wrap">
                <table className="country-table">
                  <thead>
                    <tr>
                      <th>شاخص</th>
                      <th>مقدار</th>
                      <th>سال</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>GDP اسمی</td>
                      <td className="country-ltr">
                        {formatMoney(profile.gdp.value)}
                      </td>
                      <td>{profile.gdp.year ?? "—"}</td>
                    </tr>
                    <tr>
                      <td>رشد اقتصادی سالانه</td>
                      <td className="country-ltr">
                        {formatGrowth(profile.growth.value)}
                      </td>
                      <td>{profile.growth.year ?? "—"}</td>
                    </tr>
                    <tr>
                      <td>GDP سرانه</td>
                      <td className="country-ltr">
                        {formatMoney(profile.gdpPerCapita.value)}
                      </td>
                      <td>{profile.gdpPerCapita.year ?? "—"}</td>
                    </tr>
                    <tr>
                      <td>جمعیت</td>
                      <td className="country-ltr">
                        {formatNumber(profile.population.value)}
                      </td>
                      <td>{profile.population.year ?? "—"}</td>
                    </tr>
                    <tr>
                      <td>منطقه بانک جهانی</td>
                      <td colSpan={2}>{profile.region}</td>
                    </tr>
                    <tr>
                      <td>گروه درآمدی بانک جهانی</td>
                      <td colSpan={2}>{profile.incomeLevel}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <footer className="country-footer">
          منبع داده‌ها: World Bank Open Data
          <br />
          <a
            href="https://data.worldbank.org/"
            target="_blank"
            rel="noreferrer"
          >
            مشاهده وب‌سایت رسمی بانک جهانی
          </a>
          <br />
          توجه: GDP اسمی با GDP واقعی تفاوت دارد؛ نمودار بالا GDP اسمی
          را نشان می‌دهد و به‌تنهایی معیار کاملی برای رفاه مردم نیست.
        </footer>
      </section>
    </main>
  );
}
