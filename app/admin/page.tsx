"use client";

import { useState, type FormEvent } from "react";

const SUPABASE_URL = "https://zusbebjskchgehdjvpsm.supabase.co";
const SUPABASE_KEY = "sb_publishable_WGMEA7-K8FAResrVCL8GJQ_6KCxrvmK";

type ChangeSource = "manual" | "forbes" | "superrich";

type WealthReport = {
  id: string;
  billionaire_id: string;
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
  rank: number | string;
  name: string;
  company: string | null;
  country: string | null;
  image_url: string | null;
  bio: string | null;
  net_worth_billions: number | string;
  daily_change_pct: number | string;
  forbes_change_pct?: number | string | null;
  forbes_change_period?: "day" | "week";
  daily_change_source?: ChangeSource;
  yesterday_net_worth_billions?: number | string | null;
  daily_change_date?: string | null;
  source_url?: string | null;
  source_checked_at?: string | null;
};

type NewPerson = {
  rank: string;
  name: string;
  company: string;
  country: string;
  image_url: string;
  bio: string;
  net_worth_billions: string;
};

type WealthPreview = {
  base: number;
  percentage: number;
  difference: number;
  result: number;
};

const emptyNewPerson: NewPerson = {
  rank: "",
  name: "",
  company: "",
  country: "",
  image_url: "",
  bio: "",
  net_worth_billions: "",
};

function normalizeName(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/\s+/g, " ");
}

function formatNumber(value: number | string | null | undefined) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
  }).format(number);
}

function getIranDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function parseNumericValue(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return NaN;
  }

  return Number(String(value).trim().replace(/,/g, "").replace(/٪/g, "").replace(/^＋/, "+"));
}

function calculateWealthPreview(
  person: Billionaire,
  percentage: number
): WealthPreview | null {
  if (!Number.isFinite(percentage) || percentage < -100) {
    return null;
  }

  const todayKey = getIranDateKey();

  const savedYesterday = parseNumericValue(
    person.yesterday_net_worth_billions
  );

  const currentWealth = parseNumericValue(
    person.net_worth_billions
  );

  let base: number;

  if (
    person.daily_change_date === todayKey &&
    Number.isFinite(savedYesterday) &&
    savedYesterday >= 0
  ) {
    base = savedYesterday;
  } else {
    base = currentWealth;
  }

  if (!Number.isFinite(base) || base < 0) {
    return null;
  }

  const difference = base * (percentage / 100);
  const result = base + difference;

  if (!Number.isFinite(result) || result < 0) {
    return null;
  }

  return {
    base,
    percentage,
    difference,
    result,
  };
}

function getSuperRichReport(
  person: Billionaire,
  reports: WealthReport[]
): WealthReport | undefined {
  return reports.find((report) => {
    const isSuperRich = report.source_name
      ?.toLowerCase()
      .includes("superrich");

    const isUsable =
      report.status !== "rejected" &&
      report.change_pct !== null &&
      Number.isFinite(Number(report.change_pct));

    const matchesPerson = report.billionaire_id
      ? report.billionaire_id === person.id
      : normalizeName(report.billionaire_name) ===
        normalizeName(person.name);

    return Boolean(isSuperRich && isUsable && matchesPerson);
  });
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

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPerson, setNewPerson] =
    useState<NewPerson>(emptyNewPerson);

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
      `${SUPABASE_URL}/rest/v1/billionaires?select=id,rank,name,company,country,image_url,bio,net_worth_billions,daily_change_pct,forbes_change_pct,forbes_change_period,daily_change_source,yesterday_net_worth_billions,daily_change_date,source_url,source_checked_at&order=rank.asc&limit=500`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText || "خواندن اطلاعات میلیاردرها ناموفق بود."
      );
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

  async function loadReports(
    accessToken: string
  ): Promise<boolean> {
    setReportsLoading(true);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/billionaire_wealth_change_reports?select=id,billionaire_id,billionaire_name,change_billions,change_pct,source_name,source_url,observed_at,status,notes&order=observed_at.desc&limit=500`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || "خواندن گزارش‌های تغییر ثروت ناموفق بود."
        );
      }

      setReports(await response.json());
      return true;
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "خطا در دریافت گزارش‌ها."
      );

      return false;
    } finally {
      setReportsLoading(false);
    }
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
          result.error ||
            "دریافت اطلاعات SuperRich ناموفق بود."
        );
      }

      const reportsLoaded = await loadReports(token);

      if (!reportsLoaded) {
        throw new Error(
          "اطلاعات دریافت شد اما بارگذاری گزارش‌ها ناموفق بود."
        );
      }

      setMessage(
        `دریافت تمام شد: ${result.provider_records ?? 0} رکورد از منبع، ` +
          `${result.matched_people ?? 0} میلیاردر تطبیق‌یافته، ` +
          `${result.inserted_reports ?? 0} گزارش جدید.`
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
        const errorText = await response.text();
        throw new Error(
          errorText || "ثبت نتیجه بررسی گزارش ناموفق بود."
        );
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

  async function login(event: FormEvent<HTMLFormElement>) {
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
          data.msg ||
            data.message ||
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

  function changeNewPerson(
    field: keyof NewPerson,
    value: string
  ) {
    setNewPerson((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function createPerson(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!token) {
      setMessage("ابتدا وارد حساب مدیر شو.");
      return;
    }

    const name = newPerson.name.trim();
    const wealth = parseNumericValue(
      newPerson.net_worth_billions
    );
    const rank = Number(newPerson.rank);

    if (!name) {
      setMessage("نام میلیاردر را وارد کن.");
      return;
    }

    if (!Number.isFinite(wealth) || wealth <= 0) {
      setMessage(
        "میزان ثروت باید عددی معتبر و بیشتر از صفر باشد."
      );
      return;
    }

    if (!Number.isInteger(rank) || rank < 1 || rank > 500) {
      setMessage("رتبه باید عدد صحیح بین ۱ تا ۵۰۰ باشد.");
      return;
    }

    if (
      people.some(
        (person) =>
          normalizeName(person.name) === normalizeName(name)
      )
    ) {
      setMessage("این فرد قبلاً در فهرست ثبت شده است.");
      return;
    }

    if (
      people.some(
        (person) => Number(person.rank) === rank
      )
    ) {
      setMessage(
        "این رتبه قبلاً استفاده شده است؛ یک رتبه دیگر انتخاب کن."
      );
      return;
    }

    setBusy(true);
    setMessage("در حال افزودن میلیاردر جدید...");

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/billionaires`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            rank,
            name,
            company: newPerson.company.trim() || null,
            country: newPerson.country.trim() || null,
            image_url: newPerson.image_url.trim() || null,
            bio: newPerson.bio.trim() || null,
            net_worth_billions: wealth,
            daily_change_pct: 0,
            forbes_change_pct: null,
            forbes_change_period: "day",
            daily_change_source: "manual",
            yesterday_net_worth_billions: null,
            daily_change_date: null,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            result?.details ||
            "افزودن فرد جدید ناموفق بود."
        );
      }

      const createdPerson = Array.isArray(result)
        ? result[0]
        : result;

      if (createdPerson?.id) {
        const historyResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/billionaire_wealth_history`,
          {
            method: "POST",
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              billionaire_id: createdPerson.id,
              billionaire_name: name,
              net_worth_billions: wealth,
              recorded_at: new Date().toISOString(),
            }),
          }
        );

        if (!historyResponse.ok) {
          const historyError = await historyResponse.text();

          setMessage(
            `میلیاردر اضافه شد، اما ثبت تاریخچه اولیه ناموفق بود: ${historyError}`
          );
        }
      }

      await loadPeople(token);

      setNewPerson(emptyNewPerson);
      setShowAddForm(false);

      setMessage(
        `میلیاردر ${name} با موفقیت به فهرست اضافه شد.`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "خطا در افزودن میلیاردر."
      );
    } finally {
      setBusy(false);
    }
}
    async function savePerson(person: Billionaire) {
    if (!token) {
      setMessage("ابتدا وارد حساب مدیر شو.");
      return;
    }

    const source = person.daily_change_source ?? "manual";

    const currentWealth = parseNumericValue(
      person.net_worth_billions
    );

    const rank = Number(person.rank);

    if (!Number.isInteger(rank) || rank < 1 || rank > 500) {
      setMessage("رتبه باید عدد صحیح بین ۱ تا ۵۰۰ باشد.");
      return;
    }

    if (!person.name.trim()) {
      setMessage("نام میلیاردر نمی‌تواند خالی باشد.");
      return;
    }

    if (!Number.isFinite(currentWealth) || currentWealth < 0) {
      setMessage("ثروت واردشده معتبر نیست.");
      return;
    }

    const forbesValue = String(
      person.forbes_change_pct ?? ""
    ).trim();

    const forbesNumber =
      forbesValue === ""
        ? null
        : parseNumericValue(forbesValue);

    if (
      forbesNumber !== null &&
      !Number.isFinite(forbesNumber)
    ) {
      setMessage("درصد Forbes معتبر نیست.");
      return;
    }

    if (
      source === "forbes" &&
      forbesNumber === null
    ) {
      setMessage(
        "برای انتخاب Forbes ابتدا درصد تغییر Forbes را وارد کن."
      );
      return;
    }

    const superRichReport =
      source === "superrich"
        ? getSuperRichReport(person, reports)
        : undefined;

    if (
      source === "superrich" &&
      (!superRichReport ||
        superRichReport.change_pct === null ||
        !Number.isFinite(Number(superRichReport.change_pct)))
    ) {
      setMessage(
        `برای ${person.name} گزارش معتبر SuperRich پیدا نشد. ابتدا گزارش‌ها را دریافت کن.`
      );
      return;
    }

    const isForbesWeekly =
      source === "forbes" &&
      (person.forbes_change_period ?? "day") === "week";

    let selectedChange = 0;
    let preview: WealthPreview | null = null;

    if (!isForbesWeekly) {
      if (source === "manual") {
        selectedChange = parseNumericValue(
          person.daily_change_pct
        );
      } else if (source === "forbes") {
        selectedChange = forbesNumber as number;
      } else {
        selectedChange = Number(
          superRichReport!.change_pct
        );
      }

      if (
        !Number.isFinite(selectedChange) ||
        selectedChange < -100
      ) {
        setMessage(
          "درصد تغییر باید عددی معتبر و بزرگ‌تر یا مساوی ۱۰۰- باشد."
        );
        return;
      }

      preview = calculateWealthPreview(
        person,
        selectedChange
      );

      if (!preview) {
        setMessage(
          "محاسبه ثروت ناموفق بود؛ ثروت پایه و درصد تغییر را بررسی کن."
        );
        return;
      }
    }

    setBusy(true);
    setMessage("در حال ذخیره اطلاعات و محاسبه ثروت...");

    try {
      const todayKey = getIranDateKey();

      const updateData: Record<string, unknown> = {
        rank,
        name: person.name.trim(),
        company: person.company?.trim() || null,
        country: person.country?.trim() || null,
        image_url: person.image_url?.trim() || null,
        bio: person.bio?.trim() || null,
        forbes_change_pct: forbesNumber,
        forbes_change_period:
          person.forbes_change_period ?? "day",
        updated_at: new Date().toISOString(),
      };

      if (isForbesWeekly) {
        // درصد هفتگی فقط ذخیره می‌شود و روی ثروت روزانه اعمال نمی‌شود.
        // منبع و درصد روزانه قبلی دست‌نخورده باقی می‌مانند.
        updateData.daily_change_pct = parseNumericValue(
          person.daily_change_pct
        );

        updateData.daily_change_source =
          person.daily_change_source === "forbes"
            ? "manual"
            : person.daily_change_source;
      } else {
        updateData.net_worth_billions = Number(
          preview!.result.toFixed(6)
        );

        updateData.yesterday_net_worth_billions = Number(
          preview!.base.toFixed(6)
        );

        updateData.daily_change_date = todayKey;
        updateData.daily_change_pct = selectedChange;
        updateData.daily_change_source = source;
      }

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/billionaires?id=eq.${person.id}`,
        {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          errorText ||
            "ذخیره ناموفق بود؛ دسترسی مدیر و مقادیر را بررسی کن."
        );
      }

      const updatedRows = await response.json();

      if (!Array.isArray(updatedRows) || updatedRows.length === 0) {
        throw new Error(
          "هیچ رکوردی به‌روزرسانی نشد. دسترسی مدیر یا مجوزهای دیتابیس را بررسی کن."
        );
      }

      if (!isForbesWeekly && preview) {
        const historyResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/billionaire_wealth_history`,
          {
            method: "POST",
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              billionaire_id: person.id,
              billionaire_name: person.name.trim(),
              net_worth_billions: Number(
                preview.result.toFixed(6)
              ),
              recorded_at: new Date().toISOString(),
              source_url:
                source === "superrich"
                  ? superRichReport?.source_url ?? null
                  : null,
            }),
          }
        );

        if (!historyResponse.ok) {
          const historyError = await historyResponse.text();

          await loadPeople(token);

          setMessage(
            `ثروت جدید ذخیره شد، اما ثبت تاریخچه ناموفق بود: ${historyError}`
          );

          return;
        }

        setMessage(
          `اطلاعات ${person.name} ذخیره شد. ` +
            `ثروت پایه: ${formatNumber(preview.base)} میلیارد دلار؛ ` +
            `تغییر: ${selectedChange > 0 ? "+" : ""}${formatNumber(selectedChange)}٪؛ ` +
            `ثروت جدید: ${formatNumber(preview.result)} میلیارد دلار. ` +
            `تاریخچه نیز ثبت شد.`
        );
      } else {
        setMessage(
          `درصد هفتگی Forbes برای ${person.name} ذخیره شد؛ ` +
            `ثروت روزانه تغییر نکرد.`
        );
      }

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
    setSearch("");
    setShowAddForm(false);
    setNewPerson(emptyNewPerson);
    setMessage("از پنل خارج شدی.");
  }

  const visiblePeople = people.filter((person) =>
    `${person.name} ${person.company ?? ""} ${person.country ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const pendingReports = reports.filter(
    (report) => report.status === "pending"
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
          مدیریت اطلاعات ثروتمندان و تغییرات ثروت
        </p>

        {message && (
          <p
            role="status"
            style={{
              background: "#13243a",
              padding: "12px",
              borderRadius: "9px",
              lineHeight: 1.8,
              overflowWrap: "anywhere",
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
              style={{
                ...buttonStyle,
                opacity: busy ? 0.6 : 1,
              }}
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
                alignItems: "center",
              }}
            >
              <input
                style={{
                  ...inputStyle,
                  flex: "1 1 220px",
                  marginTop: 0,
                }}
                placeholder="جست‌وجوی نام، شرکت یا کشور"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              <button
                type="button"
                onClick={async () => {
                  setBusy(true);

                  try {
                    await loadPeople(token);
                    await loadReports(token);
                    setMessage(
                      "اطلاعات با موفقیت بارگذاری شد."
                    );
                  } catch (error) {
                    setMessage(
                      error instanceof Error
                        ? error.message
                        : "خطا در بارگذاری اطلاعات."
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
                style={buttonStyle}
              >
                بارگذاری دوباره
              </button>

              <button
                type="button"
                onClick={logout}
                style={{
                  ...buttonStyle,
                  background: "#475569",
                }}
              >
                خروج
              </button>
            </div>

            <p style={{ color: "#94a3b8" }}>
              تعداد رکوردها: {people.length}
            </p>

            {/* افزودن میلیاردر جدید */}
            <section
              style={{
                background: "#111e30",
                border: "1px solid #36533b",
                borderRadius: "14px",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2
                    style={{
                      color: "#b9f27c",
                      margin: 0,
                    }}
                  >
                    افزودن میلیاردر جدید
                  </h2>

                  <p
                    style={{
                      color: "#94a3b8",
                      fontSize: "13px",
                      marginBottom: 0,
                    }}
                  >
                    ثبت فرد جدید در فهرست اصلی Econova
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowAddForm((current) => !current)
                  }
                  style={{
                    ...buttonStyle,
                    marginTop: 0,
                    background: showAddForm
                      ? "#475569"
                      : "#15803d",
                  }}
                >
                  {showAddForm
                    ? "بستن فرم"
                    : "+ افزودن فرد"}
                </button>
              </div>

              {showAddForm && (
                <form
                  onSubmit={createPerson}
                  style={{
                    marginTop: "16px",
                    borderTop: "1px solid #334155",
                    paddingTop: "12px",
                  }}
                >
                  <Field
                    label="رتبه"
                    value={newPerson.rank}
                    onChange={(value) =>
                      changeNewPerson("rank", value)
                    }
                  />

                  <Field
                    label="نام و نام خانوادگی"
                    value={newPerson.name}
                    onChange={(value) =>
                      changeNewPerson("name", value)
                    }
                  />

                  <Field
                    label="شرکت"
                    value={newPerson.company}
                    onChange={(value) =>
                      changeNewPerson("company", value)
                    }
                  />

                  <Field
                    label="کشور"
                    value={newPerson.country}
                    onChange={(value) =>
                      changeNewPerson("country", value)
                    }
                  />

                  <Field
                    label="لینک تصویر (URL)"
                    value={newPerson.image_url}
                    onChange={(value) =>
                      changeNewPerson("image_url", value)
                    }
                  />

                  <Field
                    label="ثروت اولیه (میلیارد دلار)"
                    value={newPerson.net_worth_billions}
                    onChange={(value) =>
                      changeNewPerson(
                        "net_worth_billions",
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
                    بیوگرافی
                    <textarea
                      value={newPerson.bio}
                      onChange={(event) =>
                        changeNewPerson(
                          "bio",
                          event.target.value
                        )
                      }
                      rows={4}
                      style={{
                        ...inputStyle,
                        resize: "vertical",
                      }}
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={busy}
                    style={{
                      ...buttonStyle,
                      width: "100%",
                      background: "#15803d",
                    }}
                  >
                    {busy
                      ? "در حال ثبت..."
                      : "ثبت میلیاردر جدید"}
                  </button>
                </form>
              )}
            </section>

            {/* دریافت گزارش‌های SuperRich */}
            <section
              style={{
                background: "#111e30",
                border: "1px solid #24354b",
                borderRadius: "12px",
                padding: "14px",
                marginBottom: "20px",
              }}
            >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>
                      گزارش‌های دریافتی SuperRich
                    </strong>

                    <p
                      style={{
                        color: "#94a3b8",
                        fontSize: "13px",
                        marginBottom: 0,
                      }}
                    >
                      گزارش‌ها جدا از ثروت اصلی ذخیره می‌شوند.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={fetchSuperRichReports}
                    disabled={busy || reportsLoading}
                    style={{
                      ...buttonStyle,
                      marginTop: 0,
                      background: "#365b32",
                    }}
                  >
                    {reportsLoading
                      ? "در حال بارگذاری..."
                      : "دریافت گزارش‌های جدید"}
                  </button>
                </div>

                <p
                  style={{
                    color: "#b9f27c",
                    marginBottom: 0,
                    fontSize: "13px",
                  }}
                >
                  گزارش‌های در انتظار بررسی:{" "}
                  {pendingReports.length}
                </p>
            </section>

            {/* کارت‌های میلیاردرها */}
            {visiblePeople.map((person) => {
              const source =
                person.daily_change_source ?? "manual";

              const superRichReport =
                getSuperRichReport(person, reports);

              const manualPercentage = parseNumericValue(
                person.daily_change_pct
              );

              const forbesPercentage = parseNumericValue(
                person.forbes_change_pct
              );

              const selectedPercentage =
                source === "forbes"
                  ? forbesPercentage
                  : source === "superrich"
                    ? Number(superRichReport?.change_pct)
                    : manualPercentage;

              const isWeeklyForbes =
                source === "forbes" &&
                person.forbes_change_period === "week";

              const preview =
                !isWeeklyForbes &&
                Number.isFinite(selectedPercentage)
                  ? calculateWealthPreview(
                      person,
                      selectedPercentage
                    )
                  : null;
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
                    label="ثروت فعلی (میلیارد دلار)"
                    value={String(person.net_worth_billions)}
                    onChange={(value) =>
                      changeField(
                        person.id,
                        "net_worth_billions",
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
                    بیوگرافی
                    <textarea
                      rows={3}
                      value={person.bio ?? ""}
                      onChange={(event) =>
                        changeField(
                          person.id,
                          "bio",
                          event.target.value
                        )
                      }
                      style={{
                        ...inputStyle,
                        resize: "vertical",
                      }}
                    />
                  </label>

                  {/* تنظیم منبع درصد تغییر */}
                  <div
                    style={{
                      marginTop: "18px",
                      padding: "15px",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                    }}
                  >
                    <h3 style={{ marginTop: 0 }}>
                      منبع درصد تغییر ثروت
                    </h3>

                    <select
                      value={source}
                      onChange={(event) => {
                        const nextSource =
                          event.target.value as ChangeSource;

                        changeField(
                          person.id,
                          "daily_change_source",
                          nextSource
                        );

                        if (
                          nextSource === "superrich" &&
                          !getSuperRichReport(person, reports)
                        ) {
                          setMessage(
                            "برای این میلیاردر هنوز گزارش معتبر SuperRich موجود نیست."
                          );
                        }
                      }}
                      style={selectStyle}
                    >
                      <option value="manual">
                        ورود دستی
                      </option>
                      <option value="forbes">
                        Forbes
                      </option>
                      <option value="superrich">
                        SuperRich
                      </option>
                    </select>

                    {source === "manual" && (
                      <div>
                        <Field
                          label="درصد تغییر دستی"
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
                          درصد واردشده بر اساس ثروت پایه روز قبل
                          محاسبه می‌شود.
                        </p>
                      </div>
                    )}

                    {source === "forbes" && (
                      <div>
                        <Field
                          label="درصد تغییر Forbes"
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
                          بازه گزارش Forbes

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
                            <option value="day">
                              روزانه
                            </option>
                            <option value="week">
                              هفتگی
                            </option>
                          </select>
                        </label>

                        <p
                          style={{
                            color: "#94a3b8",
                            fontSize: "12px",
                            lineHeight: 1.8,
                          }}
                        >
                          درصد Forbes به‌صورت دستی وارد می‌شود
                          و به API زنده Forbes متصل نیست.
                        </p>

                        {person.forbes_change_period === "week" && (
                          <p
                            style={{
                              color: "#fbbf24",
                              fontSize: "12px",
                              lineHeight: 1.8,
                            }}
                          >
                            درصد هفتگی فقط به‌عنوان گزارش ذخیره
                            می‌شود و ثروت روزانه را تغییر نمی‌دهد.
                          </p>
                        )}
                      </div>
                    )}

                    {source === "superrich" && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "12px",
                          borderRadius: "10px",
                          background: "#0b1c1b",
                          border: "1px solid #36533b",
                          lineHeight: 1.9,
                          fontSize: "13px",
                        }}
                      >
                        {superRichReport ? (
                          <>
                            <strong
                              style={{ color: "#b9f27c" }}
                            >
                              گزارش معتبر پیدا شد
                            </strong>

                            <div>
                              درصد تغییر:{" "}
                              {Number(
                                superRichReport.change_pct
                              ).toFixed(3)}٪
                            </div>

                            <div>
                              وضعیت گزارش:{" "}
                              {superRichReport.status === "pending"
                                ? "در انتظار بررسی"
                                : superRichReport.status === "approved"
                                  ? "تأییدشده"
                                  : "ردشده"}
                            </div>

                            <div>
                              زمان گزارش:{" "}
                              {new Date(
                                superRichReport.observed_at
                              ).toLocaleString("fa-IR")}
                            </div>
                          </>
                        ) : (
                          <p style={{ margin: 0 }}>
                            گزارشی برای این میلیاردر پیدا نشد.
                            از دکمه دریافت گزارش‌های جدید استفاده کن.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* پیش‌نمایش محاسبه */}
                  {source !== "forbes" || !isWeeklyForbes ? (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px",
                        border: "1px solid #36533b",
                        borderRadius: "10px",
                        background: "#0b1c1b",
                        color: "#cbd5e1",
                        lineHeight: 1.9,
                        fontSize: "13px",
                      }}
                    >
                      {preview ? (
                        <>
                          <strong
                            style={{ color: "#b9f27c" }}
                          >
                            پیش‌نمایش محاسبه خودکار
                          </strong>

                          <div>
                            منبع:{" "}
                            {source === "forbes"
                              ? "Forbes"
                              : source === "superrich"
                                ? "SuperRich"
                                : "ورود دستی"}
                          </div>

                          <div>
                            ثروت پایه روز قبل:{" "}
                            {formatNumber(preview.base)} میلیارد دلار
                          </div>

                          <div>
                            درصد تغییر:{" "}
                            {preview.percentage > 0 ? "+" : ""}
                            {formatNumber(preview.percentage)}٪
                          </div>

                          <div>
                            مقدار تغییر:{" "}
                            {preview.difference > 0 ? "+" : ""}
                            {formatNumber(preview.difference)} میلیارد دلار
                          </div>

                          <div
                            style={{
                              color: "#b9f27c",
                              fontWeight: "bold",
                            }}
                          >
                            ثروت پس از ثبت:{" "}
                            {formatNumber(preview.result)} میلیارد دلار
                          </div>

                          <div
                            style={{
                              color: "#94a3b8",
                              fontSize: "12px",
                            }}
                          >
                            ذخیره مجدد در همین روز از ثروت پایه
                            ذخیره‌شده استفاده می‌کند؛ بنابراین
                            درصد تغییر دوباره روی ثروت جدید اعمال
                            نمی‌شود.
                          </div>
                        </>
                      ) : (
                        <span>
                          برای محاسبه خودکار، درصد معتبر بزرگ‌تر
                          یا مساوی ۱۰۰-٪ وارد کن.
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px",
                        borderRadius: "10px",
                        background: "#2b2412",
                        border: "1px solid #785b24",
                        color: "#fbbf24",
                        fontSize: "13px",
                        lineHeight: 1.8,
                      }}
                    >
                      گزارش هفتگی Forbes ذخیره خواهد شد؛
                      ثروت روزانه در این عملیات تغییر نمی‌کند.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => savePerson(person)}
                    disabled={busy}
                    style={{
                      ...buttonStyle,
                      marginTop: "16px",
                      width: "100%",
                      background: "#15803d",
                      opacity: busy ? 0.6 : 1,
                    }}
                  >
                    {busy
                      ? "در حال ذخیره..."
                      : "ذخیره تغییرات و محاسبه ثروت"}
                  </button>
                </section>
              );
            })}

            {visiblePeople.length === 0 && (
              <p
                style={{
                  color: "#94a3b8",
                  textAlign: "center",
                  padding: "24px",
                }}
              >
                هیچ میلیاردر‌ی با این جست‌وجو پیدا نشد.
              </p>
            )}

            {/* بررسی گزارش‌های دریافتی */}
            <section
              style={{
                marginTop: "28px",
                padding: "16px",
                borderRadius: "14px",
                background: "#111e30",
                border: "1px solid #24354b",
              }}
            >
              <h2 style={{ color: "#b9f27c" }}>
                بررسی گزارش‌های SuperRich
              </h2>

              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "13px",
                  lineHeight: 1.8,
                }}
              >
                تأیید یا رد گزارش‌ها به‌تنهایی ثروت اصلی
                میلیاردرها را تغییر نمی‌دهد.
              </p>

              {reportsLoading ? (
                <p>در حال بارگذاری گزارش‌ها...</p>
              ) : reports.length === 0 ? (
                <p style={{ color: "#94a3b8" }}>
                  هنوز گزارشی ثبت نشده است.
                </p>
              ) : (
                reports.slice(0, 30).map((report) => (
                  <div
                    key={report.id}
                    style={{
                      padding: "13px",
                      marginTop: "12px",
                      borderRadius: "10px",
                      background: "#0b1728",
                      border: "1px solid #334155",
                    }}
                  >
                    <strong>
                      {report.billionaire_name}
                    </strong>

                    <div
                      style={{
                        color: "#cbd5e1",
                        fontSize: "13px",
                        lineHeight: 1.9,
                        marginTop: "6px",
                      }}
                    >
                      <div>
                        درصد تغییر:{" "}
                        {report.change_pct ?? "نامشخص"}٪
                      </div>

                      <div>
                        مقدار تغییر:{" "}
                        {report.change_billions} میلیارد دلار
                      </div>

                      <div>
                        منبع: {report.source_name}
                      </div>

                      <div>
                        وضعیت:{" "}
                        {report.status === "pending"
                          ? "در انتظار بررسی"
                          : report.status === "approved"
                            ? "تأییدشده"
                            : "ردشده"}
                      </div>

                      <div>
                        زمان:{" "}
                        {new Date(
                          report.observed_at
                        ).toLocaleString("fa-IR")}
                      </div>

                      {report.notes && (
                        <p style={{ color: "#94a3b8" }}>
                          {report.notes}
                        </p>
                      )}

                      {report.source_url && (
                        <a
                          href={report.source_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#b9f27c" }}
                        >
                          مشاهده منبع
                        </a>
                      )}
                    </div>

                    {report.status === "pending" && (
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            reviewReport(
                              report.id,
                              "approved"
                            )
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
                          type="button"
                          onClick={() =>
                            reviewReport(
                              report.id,
                              "rejected"
                            )
                            
