"use client";

import { useState } from "react";

const SUPABASE_URL = "https://zusbebjskchgehdjvpsm.supabase.co";
const SUPABASE_KEY = "sb_publishable_WGMEA7-K8FAResrVCL8GJQ_6KCxrvmK";

type WealthReport = {
  id: string;
  billionaire_name: string;
  change_billions: number | string;
  change_pct: number | string | null;
  source_name: string;
  source_url: string | null;
  observed_at: string;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
};

type Billionaire = {
  id: string;
  rank: number;
  name: string;
  company: string | null;
  country: string | null;
  image_url: string | null;
  bio: string | null;
  net_worth_billions: number;
  daily_change_pct: number | string;
  forbes_change_pct?: number | string | null;
  forbes_change_period?: "day" | "week";
  daily_change_source?: "manual" | "forbes" | "superrich";
};

function normalizeName(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/\s+/g, " ");
}

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");

  const [people, setPeople] = useState<Billionaire[]>([]);
  const [reports, setReports] = useState<WealthReport[]>([]);

  const [reportsLoading, setReportsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "11px",
    borderRadius: "9px",
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#f8fafc",
    marginTop: "5px",
  };

  const selectStyle = {
    ...inputStyle,
    cursor: "pointer",
  };

  const buttonStyle = {
    marginTop: "12px",
    padding: "12px 18px",
    border: 0,
    borderRadius: "9px",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold" as const,
    cursor: "pointer",
  };

  async function loadPeople(accessToken: string) {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/billionaires?select=id,rank,name,company,country,image_url,bio,net_worth_billions,daily_change_pct,forbes_change_pct,forbes_change_period,daily_change_source&order=rank.asc&limit=500`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("خواندن اطلاعات میلیاردرها ناموفق بود.");
    }

    const data = await response.json();

    setPeople(
      data.map((person: Billionaire) => ({
        ...person,
        forbes_change_pct: person.forbes_change_pct ?? "",
        forbes_change_period:
          person.forbes_change_period ?? "day",
        daily_change_source:
          person.daily_change_source ?? "manual",
      }))
    );
  }

  async function loadReports(accessToken: string) {
    setReportsLoading(true);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/billionaire_wealth_change_reports?select=id,billionaire_name,change_billions,change_pct,source_name,source_url,observed_at,status,notes&order=observed_at.desc&limit=500`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("خواندن گزارش‌های تغییر ثروت ناموفق بود.");
      }

      setReports(await response.json());
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "خطا در دریافت گزارش‌ها."
      );
    } finally {
      setReportsLoading(false);
    }
  }

  function getSuperRichReport(
    person: Billionaire
  ): WealthReport | undefined {
    return reports.find(
      (report) =>
        report.source_name
          ?.toLowerCase()
          .includes("superrich") &&
        normalizeName(report.billionaire_name) ===
          normalizeName(person.name)
    );
  }

  async function fetchSuperRichReports() {
    if (!token) {
      setMessage("ابتدا وارد حساب مدیر شو.");
      return;
    }

    setBusy(true);
    setMessage("در حال دریافت اطلاعات از SuperRich...");

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/econova-superrich-reports`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "دریافت اطلاعات SuperRich ناموفق بود."
        );
      }

      await loadReports(token);

      setMessage(
        `دریافت اطلاعات انجام شد؛ ${
          result.inserted_reports ?? 0
        } گزارش جدید ثبت شد.`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "خطا در دریافت اطلاعات SuperRich."
      );
    } finally {
      setBusy(false);
    }
  }

  async function reviewReport(
    reportId: string,
    status: "approved" | "rejected"
  ) {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/billionaire_wealth_change_reports?id=eq.${reportId}`,
        {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            status,
            reviewed_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("ثبت نتیجه بررسی گزارش ناموفق بود.");
      }

      setMessage(
        status === "approved"
          ? "گزارش تأیید شد؛ ثروت اصلی تغییر نکرد."
          : "گزارش رد شد."
      );

      await loadReports(token);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "خطا در بررسی گزارش."
      );
    } finally {
      setBusy(false);
    }
  }

  async function login(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_KEY,
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.access_token) {
        throw new Error(
          "ورود ناموفق بود؛ ایمیل و رمز عبور را بررسی کن."
        );
      }

      const accessToken = data.access_token;

      const adminResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/admin_users?select=user_id&user_id=eq.${data.user.id}`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const admins = await adminResponse.json();

      if (
        !adminResponse.ok ||
        !Array.isArray(admins) ||
        admins.length === 0
      ) {
        throw new Error("این حساب دسترسی مدیر ندارد.");
      }

      setToken(accessToken);
      setPassword("");

      await loadPeople(accessToken);
      await loadReports(accessToken);

      setMessage("ورود موفق بود.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "خطایی هنگام ورود رخ داد."
      );
    } finally {
      setBusy(false);
    }
  }

  function changeField(
    id: string,
    field: keyof Billionaire,
    value: string
  ) {
    setPeople((current) =>
      current.map((person) =>
        person.id === id
          ? { ...person, [field]: value }
          : person
      )
    );
  }

  async function savePerson(person: Billionaire) {
    const forbesValue = String(
      person.forbes_change_pct ?? ""
    ).trim();

    if (
      person.daily_change_source === "forbes" &&
      (forbesValue === "" ||
        !Number.isFinite(Number(forbesValue)))
    ) {
      setMessage(
        "برای انتخاب فوربز، ابتدا درصد تغییر فوربز را وارد کن."
      );
      return;
    }

    const superRichReport =
      person.daily_change_source === "superrich"
        ? getSuperRichReport(person)
        : undefined;

    if (
      person.daily_change_source === "superrich" &&
      (!superRichReport ||
        superRichReport.change_pct === null ||
        !Number.isFinite(Number(superRichReport.change_pct)))
    ) {
      setMessage(
        `برای ${person.name} گزارش معتبر SuperRich پیدا نشد. ابتدا اطلاعات جدید را دریافت کن.`
      );
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      let selectedChange: number;

      if (person.daily_change_source === "superrich") {
        selectedChange = Number(superRichReport!.change_pct);
      } else if (
        person.daily_change_source === "forbes" &&
        (person.forbes_change_period ?? "day") === "day"
      ) {
        selectedChange = Number(
          forbesValue.replace(/^\+/, "")
        );
      } else {
        selectedChange = Number(
          String(person.daily_change_pct).replace(/^\+/, "")
        );
      }

      if (!Number.isFinite(selectedChange)) {
        throw new Error("درصد تغییر واردشده معتبر نیست.");
      }

      const forbesNumber =
        forbesValue === ""
          ? null
          : Number(forbesValue.replace(/^\+/, ""));

      if (
        forbesNumber !== null &&
        !Number.isFinite(forbesNumber)
      ) {
        throw new Error("درصد فوربز معتبر نیست.");
      }

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/billionaires?id=eq.${person.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            rank: Number(person.rank),
            name: person.name,
            company: person.company,
            country: person.country,
            image_url: person.image_url,
            bio: person.bio,
            net_worth_billions: Number(
              person.net_worth_billions
            ),
            daily_change_pct: selectedChange,
            forbes_change_pct: forbesNumber,
            forbes_change_period:
              person.forbes_change_period ?? "day",
            daily_change_source:
              person.daily_change_source ?? "manual",
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "ذخیره ناموفق بود؛ دسترسی مدیر و مقادیر را بررسی کن."
        );
      }

      setMessage(`اطلاعات ${person.name} ذخیره شد.`);
      await loadPeople(token);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "خطا در ذخیره اطلاعات."
      );
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    setToken("");
    setPeople([]);
    setReports([]);
    setEmail("");
    setPassword("");
    setMessage("از پنل خارج شدی.");
  }

  const visiblePeople = people.filter((person) =>
    `${person.name} ${person.company ?? ""} ${person.country ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#07111f",
        color: "#f8fafc",
        padding: "24px 14px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "auto" }}>
        <h1 style={{ color: "#b9f27c" }}>
          پنل مدیریت Econova
        </h1>

        <p style={{ color: "#94a3b8" }}>
          مدیریت اطلاعات ثروتمندان و گزارش‌های تغییر ثروت
        </p>

        {message && (
          <p
            role="status"
            style={{
              background: "#13243a",
              padding: "12px",
              borderRadius: "9px",
              lineHeight: 1.8,
            }}
          >
            {message}
          </p>
        )}

        {!token ? (
          <form
            onSubmit={login}
            style={{
              background: "#111e30",
              padding: "20px",
              borderRadius: "14px",
              maxWidth: "440px",
            }}
          >
            <h2>ورود مدیر</h2>

            <label>
              ایمیل حساب Supabase
              <input
                style={inputStyle}
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />
            </label>

            <label
              style={{
                display: "block",
                marginTop: "14px",
              }}
            >
              رمز عبور
              <input
                style={inputStyle}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />
            </label>

            <button
              disabled={busy}
              type="submit"
              style={buttonStyle}
            >
              {busy ? "در حال ورود..." : "ورود به پنل"}
            </button>
          </form>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                margin: "20px 0",
              }}
            >
              <input
                style={{
                  ...inputStyle,
                  flex: "1 1 220px",
                }}
                placeholder="جست‌وجوی نام، شرکت یا کشور"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              <button
                onClick={async () => {
                  await loadPeople(token);
                  await loadReports(token);
                }}
                disabled={busy}
                style={buttonStyle}
              >
                بارگذاری دوباره
              </button>

              <button
                onClick={logout}
                style={buttonStyle}
              >
                خروج
              </button>
            </div>

            <p style={{ color: "#94a3b8" }}>
              تعداد رکوردها: {people.length}
            </p>

            {/* گزارش‌های خودکار تغییر ثروت */}
            <section
              style={{
                background: "#111e30",
                border: "1px solid #36533b",
                borderRadius: "14px",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  color: "#b9f27c",
                  marginTop: 0,
                }}
              >
                گزارش‌های خودکار تغییر ثروت
              </h2>

              <p
                style={{
                  color: "#94a3b8",
                  lineHeight: 1.8,
                }}
              >
                گزارش‌های دریافتی از SuperRich در این قسمت
                نمایش داده می‌شوند. گزارش‌ها ابتدا در انتظار
                بررسی هستند. تأیید گزارش به‌تنهایی ثروت اصلی
                را تغییر نمی‌دهد.
              </p>

              <button
                onClick={fetchSuperRichReports}
                disabled={busy}
                style={{
                  ...buttonStyle,
                  background: "#15803d",
                  marginTop: "5px",
                }}
              >
                {busy
                  ? "در حال دریافت..."
                  : "دریافت اطلاعات جدید از SuperRich"}
              </button>

              <p style={{ color: "#cbd5e1" }}>
                در انتظار بررسی:{" "}
                {
                  reports.filter(
                    (report) => report.status === "pending"
                  ).length
                }
                {" · "}کل گزارش‌ها: {reports.length}
              </p>

              {reportsLoading && (
                <p style={{ color: "#94a3b8" }}>
                  در حال دریافت گزارش‌ها...
                </p>
              )}

              {!reportsLoading && reports.length === 0 && (
                <p style={{ color: "#94a3b8" }}>
                  فعلاً گزارشی برای نمایش وجود ندارد.
                </p>
              )}

              {reports.map((report) => (
                <div
                  key={report.id}
                  style={{
                    borderTop: "1px solid #334155",
                    padding: "13px 0",
                    marginTop: "10px",
                  }}
                >
                  <strong>
                    {report.billionaire_name}
                  </strong>

                  <p
                    style={{
                      margin: "7px 0",
                      color: "#cbd5e1",
                      lineHeight: 1.8,
                    }}
                  >
                    منبع: {report.source_name}
                    {" · "}تغییر ثروت:{" "}
                    {Number(report.change_billions).toFixed(3)}
                    {" "}میلیارد دلار
                    {" · "}درصد:{" "}
                    {report.change_pct == null
                      ? "—"
                      : `${report.change_pct}%`}
                  </p>

                  <p
                    style={{
                      margin: "5px 0",
                      color: "#94a3b8",
                      fontSize: "12px",
                    }}
                  >
                    {new Date(
                      report.observed_at
                    ).toLocaleString("fa-IR")}
                    {" · "}وضعیت:{" "}
                    {report.status === "pending"
                      ? "در انتظار بررسی"
                      : report.status === "approved"
                      ? "تأییدشده"
                      : "ردشده"}
                  </p>

                  {report.notes && (
                    <p
                      style={{
                        color: "#94a3b8",
                        fontSize: "12px",
                        lineHeight: 1.7,
                      }}
                    >
                      {report.notes}
                    </p>
                  )}

                  {report.source_url && (
                    <a
                      href={report.source_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: "#93c5fd",
                        fontSize: "13px",
                      }}
                    >
                      مشاهده منبع
                    </a>
                  )}

                  {report.status === "pending" && (
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() =>
                          reviewReport(report.id, "approved")
                        }
                        disabled={busy}
                        style={{
                          ...buttonStyle,
                          background: "#15803d",
                        }}
                      >
                        تأیید گزارش
                      </button>

                      <button
                        onClick={() =>
                          reviewReport(report.id, "rejected")
                        }
                        disabled={busy}
                        style={{
                          ...buttonStyle,
                          background: "#b91c1c",
                        }}
                      >
                        رد گزارش
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "12px",
                  lineHeight: 1.8,
                }}
              >
                تأیید گزارش فقط وضعیت بررسی را ثبت می‌کند؛
                ثروت اصلی باید جداگانه توسط مدیر تغییر کند.
              </p>
            </section>

            {/* کارت‌های میلیاردرها */}
            {visiblePeople.map((person) => {
              const superRichReport =
                getSuperRichReport(person);

              const hasSuperRichReport =
                superRichReport !== undefined &&
                superRichReport.change_pct !== null &&
                Number.isFinite(
                  Number(superRichReport.change_pct)
                );

              const superRichAmount = hasSuperRichReport
                ? Number(superRichReport!.change_billions)
                : 0;

              return (
                <section
                  key={person.id}
                  style={{
                    background: "#111e30",
                    border: "1px solid #24354b",
                    borderRadius: "14px",
                    padding: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <h3>
                    رتبه {person.rank}: {person.name}
                  </h3>

                  {person.image_url && (
                    <img
                      src={person.image_url}
                      alt={person.name}
                      style={{
                        width: "76px",
                        height: "76px",
                        objectFit: "cover",
                        borderRadius: "12px",
                      }}
                    />
                  )}

                  <Field
                    label="رتبه"
                    value={String(person.rank)}
                    onChange={(value) =>
                      changeField(person.id, "rank", value)
                    }
                  />

                  <Field
                    label="نام"
                    value={person.name}
                    onChange={(value) =>
                      changeField(person.id, "name", value)
                    }
                  />

                  <Field
                    label="شرکت"
                    value={person.company ?? ""}
                    onChange={(value) =>
                      changeField(person.id, "company", value)
                    }
                  />

                  <Field
                    label="کشور"
                    value={person.country ?? ""}
                    onChange={(value) =>
                      changeField(person.id, "country", value)
                    }
                  />

                  <Field
                    label="لینک تصویر (URL)"
                    value={person.image_url ?? ""}
                    onChange={(value) =>
                      changeField(
                        person.id,
                        "image_url",
                        value
                      )
                    }
                  />

                  <Field
                    label="ثروت (میلیارد دلار)"
                    value={String(person.net_worth_billions)}
                    onChange={(value) =>
                      changeField(
                        person.id,
                        "net_worth_billions",
                        value
                      )
                    }
                  />
                                    {/* گزارش فوربز */}
                  <div
                    style={{
                      marginTop: "20px",
                      padding: "15px",
                      border: "1px solid #36533b",
                      borderRadius: "12px",
                      background: "#0b1c1b",
                    }}
                  >
                    <h3
                      style={{
                        color: "#b9f27c",
                        marginTop: 0,
                      }}
                    >
                      گزارش تغییر ثروت Forbes
                    </h3>

                    <Field
                      label="درصد تغییر اعلام‌شده توسط فوربز"
                      value={String(
                        person.forbes_change_pct ?? ""
                      )}
                      onChange={(value) =>
                        changeField(
                          person.id,
                          "forbes_change_pct",
                          value
                        )
                      }
                    />

                    <label
                      style={{
                        display: "block",
                        marginTop: "12px",
                      }}
                    >
                      بازه گزارش فوربز
                      <select
                        value={
                          person.forbes_change_period ?? "day"
                        }
                        onChange={(event) =>
                          changeField(
                            person.id,
                            "forbes_change_period",
                            event.target.value
                          )
                        }
                        style={selectStyle}
                      >
                        <option value="day">روزانه</option>
                        <option value="week">هفتگی</option>
                      </select>
                    </label>

                    {(() => {
                      const percentageText = String(
                        person.forbes_change_pct ?? ""
                      ).trim();

                      const percentage = Number(
                        percentageText.replace(/^\+/, "")
                      );

                      const wealth = Number(
                        person.net_worth_billions
                      );

                      if (
                        percentageText === "" ||
                        !Number.isFinite(percentage) ||
                        !Number.isFinite(wealth)
                      ) {
                        return null;
                      }

                      const amount =
                        (wealth * percentage) / 100;

                      return (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "12px",
                            borderRadius: "9px",
                            background: "#132a20",
                            border: "1px solid #36533b",
                          }}
                        >
                          <div
                            style={{
                              color: "#94a3b8",
                              fontSize: "12px",
                            }}
                          >
                            مبلغ تغییر محاسبه‌شده بر اساس فوربز
                            {" ("}
                            {person.forbes_change_period === "week"
                              ? "هفتگی"
                              : "روزانه"}
                            {")"}
                          </div>

                          <strong
                            style={{
                              display: "block",
                              marginTop: "6px",
                              color:
                                amount > 0
                                  ? "#b9f27c"
                                  : amount < 0
                                  ? "#fca5a5"
                                  : "#f8fafc",
                              fontSize: "18px",
                            }}
                          >
                            {amount > 0 ? "+" : ""}
                            {amount.toFixed(2)} میلیارد دلار
                          </strong>

                          <div
                            style={{
                              color: "#94a3b8",
                              fontSize: "12px",
                              marginTop: "5px",
                            }}
                          >
                            این مبلغ تخمینی است و ثروت اصلی را
                            تغییر نمی‌دهد.
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* انتخاب منبع اصلی */}
                  <div
                    style={{
                      marginTop: "14px",
                      padding: "15px",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                    }}
                  >
                    <h3 style={{ marginTop: 0 }}>
                      منبع درصد تغییر اصلی Econova
                    </h3>

                    <select
                      value={
                        person.daily_change_source ?? "manual"
                      }
                      onChange={(event) => {
                        const source = event.target.value as
                          | "manual"
                          | "forbes"
                          | "superrich";

                        changeField(
                          person.id,
                          "daily_change_source",
                          source
                        );

                        if (
                          source === "superrich" &&
                          !getSuperRichReport(person)
                        ) {
                          fetchSuperRichReports();
                        }
                      }}
                      style={selectStyle}
                    >
                      <option value="manual">ورود دستی</option>
                      <option value="forbes">Forbes</option>
                      <option value="superrich">SuperRich</option>
                    </select>

                    {/* نمایش فوری گزارش SuperRich */}
                    {person.daily_change_source === "superrich" && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "13px",
                          borderRadius: "10px",
                          background: "#132a20",
                          border: "1px solid #36533b",
                        }}
                      >
                        <strong
                          style={{
                            color: "#b9f27c",
                            display: "block",
                            marginBottom: "9px",
                          }}
                        >
                          گزارش SuperRich
                        </strong>

                        {hasSuperRichReport ? (
                          <>
                            <p
                              style={{
                                color: "#e2e8f0",
                                margin: "6px 0",
                              }}
                            >
                              درصد تغییر:{" "}
                              <strong>
                                {Number(
                                  superRichReport!.change_pct
                                ) > 0
                                  ? "+"
                                  : ""}
                                {Number(
                                  superRichReport!.change_pct
                                ).toFixed(3)}
                                ٪
                              </strong>
                            </p>

                            <p
                              style={{
                                color: "#e2e8f0",
                                margin: "6px 0",
                              }}
                            >
                              مقدار تغییر ثروت:{" "}
                              <strong>
                                {superRichAmount > 0 ? "+" : ""}
                                {superRichAmount.toFixed(3)}
                                {" "}میلیارد دلار
                              </strong>
                            </p>

                            <p
                              style={{
                                color: "#94a3b8",
                                fontSize: "12px",
                                lineHeight: 1.7,
                              }}
                            >
                              زمان گزارش:{" "}
                              {new Date(
                                superRichReport!.observed_at
                              ).toLocaleString("fa-IR")}
                            </p>
                          </>
                        ) : (
                          <p
                            style={{
                              color: "#fbbf24",
                              fontSize: "13px",
                              lineHeight: 1.8,
                            }}
                          >
                            هنوز گزارشی برای این میلیاردر پیدا
                            نشده است. از دکمه دریافت اطلاعات
                            SuperRich استفاده کن.
                          </p>
                        )}

                        <p
                          style={{
                            color: "#94a3b8",
                            fontSize: "12px",
                            lineHeight: 1.8,
                            marginBottom: 0,
                          }}
                        >
                          اطلاعات این قسمت فقط برای نمایش درصد
                          و مقدار تغییر است؛ ثروت اصلی به‌صورت
                          خودکار تغییر نمی‌کند.
                        </p>
                      </div>
                    )}

                    {/* درصد تغییر دستی */}
                    <Field
                      label="درصد تغییر اصلی"
                      value={String(
                        person.daily_change_pct ?? ""
                      )}
                      onChange={(value) =>
                        changeField(
                          person.id,
                          "daily_change_pct",
                          value
                        )
                      }
                    />

                    <p
                      style={{
                        color: "#94a3b8",
                        fontSize: "12px",
                        lineHeight: 1.8,
                      }}
                    >
                      اگر Forbes انتخاب شود، درصد روزانه فوربز
                      هنگام ذخیره به‌عنوان درصد تغییر اصلی ثبت
                      می‌شود. در حالت دستی یا SuperRich، درصد
                      تغییر اصلی از منبع انتخاب‌شده گرفته می‌شود.
                    </p>
                  </div>

                  <button
                    onClick={() => savePerson(person)}
                    disabled={busy}
                    style={{
                      ...buttonStyle,
                      marginTop: "16px",
                      width: "100%",
                      background: "#15803d",
                    }}
                  >
                    {busy
                      ? "در حال ذخیره..."
                      : "ذخیره تغییرات"}
                  </button>
                </section>
              );
            })}
          </>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label
      style={{
        display: "block",
        marginTop: "12px",
      }}
    >
      <span>{label}</span>

      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "11px",
          marginTop: "5px",
          borderRadius: "9px",
          border: "1px solid #334155",
          background: "#0f172a",
          color: "#f8fafc",
        }}
      />
    </label>
  );
}
