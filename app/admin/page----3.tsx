"use client";

import { useState, type FormEvent } from "react";

const SUPABASE_URL = "https://zusbebjskchgehdjvpsm.supabase.co";
const SUPABASE_KEY = "sb_publishable_WGMEA7-K8FAResrVCL8GJQ_6KCxrvmK";

type ChangeSource = "manual" | "forbes" | "superrich";

type Billionaire = {
  id: string;
  rank: number;
  name: string;
  company: string | null;
  country: string | null;
  image_url: string | null;
  bio: string | null;
  net_worth_billions: number | string;
  daily_change_pct: number | string;
  forbes_change_pct: number | string | null;
  forbes_change_period: "day" | "week";
  daily_change_source: ChangeSource;
  yesterday_net_worth_billions: number | string | null;
  daily_change_date: string | null;
  source_url: string | null;
  source_checked_at: string | null;
};

type SourceComparison = {
  id: string;
  billionaire_id: string;
  source_name: "forbes" | "bloomberg";
  net_worth_billions: number | string;
  observed_at: string;
  source_url: string | null;
  notes: string | null;
};

type ComparisonDraft = {
  net_worth_billions: string;
  observed_at: string;
  source_url: string;
  notes: string;
};

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

type NewPerson = {
  name: string;
  company: string;
  country: string;
  image_url: string;
  bio: string;
  net_worth_billions: string;
};

type Preview = {
  base: number;
  percentage: number;
  difference: number;
  result: number;
};

const emptyNewPerson: NewPerson = {
  name: "",
  company: "",
  country: "",
  image_url: "",
  bio: "",
  net_worth_billions: "",
};

function numberValue(value: unknown): number {
  if (value === null || value === undefined || String(value).trim() === "") {
    return NaN;
  }

  return Number(
    String(value)
      .trim()
      .replace(/,/g, "")
      .replace(/٪/g, "")
      .replace(/^＋/, "+")
  );
}

function formatNumber(value: number | string | null | undefined) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "—";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
  }).format(number);
}

function iranDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((item) => item.type === "year")?.value;
  const month = parts.find((item) => item.type === "month")?.value;
  const day = parts.find((item) => item.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

function calculatePreview(
  person: Billionaire,
  percentage: number
): Preview | null {
  if (!Number.isFinite(percentage) || percentage < -100) return null;

  const current = numberValue(person.net_worth_billions);
  const yesterday = numberValue(person.yesterday_net_worth_billions);
  const today = iranDateKey();

  // اگر امروز قبلاً ذخیره شده، همیشه از پایه قبلی استفاده کن.
  const base =
    person.daily_change_date === today &&
    Number.isFinite(yesterday) &&
    yesterday >= 0
      ? yesterday
      : current;

  if (!Number.isFinite(base) || base < 0) return null;

  const difference = base * (percentage / 100);
  const result = base + difference;

  if (!Number.isFinite(result) || result < 0) return null;

  return { base, percentage, difference, result };
}

function getReport(
  person: Billionaire,
  reports: WealthReport[]
) {
  return reports.find((report) => {
    const source = report.source_name?.toLowerCase().includes("superrich");
    const matches = report.billionaire_id
      ? report.billionaire_id === person.id
      : normalizeName(report.billionaire_name) === normalizeName(person.name);

    return (
      source &&
      matches &&
      report.status !== "rejected" &&
      report.change_pct !== null &&
      Number.isFinite(Number(report.change_pct))
    );
  });
}

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");

  const [people, setPeople] = useState<Billionaire[]>([]);
  const [reports, setReports] = useState<WealthReport[]>([]);
  const [comparisons, setComparisons] = useState<SourceComparison[]>([]);
  const [comparisonDrafts, setComparisonDrafts] = useState<Record<string, ComparisonDraft>>({});
  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPerson, setNewPerson] = useState<NewPerson>(emptyNewPerson);

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
    const fields =
      "id,rank,name,company,country,image_url,bio,net_worth_billions,daily_change_pct,forbes_change_pct,forbes_change_period,daily_change_source,yesterday_net_worth_billions,daily_change_date,source_url,source_checked_at";

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/billionaires?select=${fields}&order=rank.asc&limit=1000`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();

    setPeople(
      data.map((person: Billionaire) => ({
        ...person,
        forbes_change_period: person.forbes_change_period ?? "day",
        daily_change_source: person.daily_change_source ?? "manual",
      }))
    );
  }

  async function loadComparisons(accessToken: string) {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/billionaire_source_comparisons?select=id,billionaire_id,source_name,net_worth_billions,observed_at,source_url,notes&order=observed_at.desc&limit=2000`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        "دریافت اطلاعات مقایسه ممکن نشد. ابتدا دستور SQL همراه فایل را در Supabase اجرا کن. " +
        (await response.text())
      );
    }

    const rows: SourceComparison[] = await response.json();
    setComparisons(rows);

    const drafts: Record<string, ComparisonDraft> = {};
    for (const row of rows) {
      drafts[`${row.billionaire_id}:${row.source_name}`] = {
        net_worth_billions: String(row.net_worth_billions ?? ""),
        observed_at: row.observed_at ? new Date(row.observed_at).toISOString().slice(0, 16) : "",
        source_url: row.source_url ?? "",
        notes: row.notes ?? "",
      };
    }
    setComparisonDrafts(drafts);
  }

  function changeComparisonDraft(
    personId: string,
    sourceName: "forbes" | "bloomberg",
    field: keyof ComparisonDraft,
    value: string
  ) {
    const key = `${personId}:${sourceName}`;
    setComparisonDrafts((current) => ({
      ...current,
      [key]: {
        net_worth_billions: "",
        observed_at: "",
        source_url: "",
        notes: "",
        ...current[key],
        [field]: value,
      },
    }));
  }

  async function saveComparison(person: Billionaire, sourceName: "forbes" | "bloomberg") {
    if (!token) {
      setMessage("ابتدا وارد حساب مدیر شو.");
      return;
    }

    const key = `${person.id}:${sourceName}`;
    const draft = comparisonDrafts[key];
    const wealth = numberValue(draft?.net_worth_billions);

    if (!Number.isFinite(wealth) || wealth < 0) {
      setMessage(`ارزش ثروت ${sourceName} باید عددی معتبر و صفر یا بیشتر باشد.`);
      return;
    }

    if (!draft?.observed_at) {
      setMessage("زمان مشاهده منبع را وارد کن.");
      return;
    }

    setBusy(true);
    setMessage(`در حال ذخیره داده مقایسه ${sourceName} برای ${person.name}...`);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/billionaire_source_comparisons?on_conflict=billionaire_id,source_name`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=representation",
          },
          body: JSON.stringify({
            billionaire_id: person.id,
            billionaire_name: person.name,
            source_name: sourceName,
            net_worth_billions: wealth,
            observed_at: new Date(draft.observed_at).toISOString(),
            source_url: draft.source_url.trim() || null,
            notes: draft.notes.trim() || null,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) throw new Error(await response.text());

      const saved = await response.json();
      if (Array.isArray(saved) && saved[0]) {
        setComparisons((current) => [
          ...current.filter(
            (item) =>
              !(item.billionaire_id === person.id && item.source_name === sourceName)
          ),
          saved[0],
        ]);
      } else {
        await loadComparisons(token);
      }

      setMessage(`داده ${sourceName} برای ${person.name} ذخیره شد؛ ثروت اصلی Econova تغییر نکرد.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ذخیره اطلاعات مقایسه ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  async function loadReports(accessToken: string) {
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

      if (!response.ok) throw new Error(await response.text());

      setReports(await response.json());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "خطا در دریافت گزارش‌ها");
    } finally {
      setReportsLoading(false);
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
        throw new Error(data.msg || data.message || "ورود ناموفق بود.");
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

      if (!adminResponse.ok || !Array.isArray(admins) || admins.length === 0) {
        throw new Error("این حساب دسترسی مدیر ندارد.");
      }

      setToken(accessToken);
      setPassword("");

      await loadPeople(accessToken);
      await loadReports(accessToken);
      await loadComparisons(accessToken);

      setMessage("ورود موفق بود.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "خطا در ورود.");
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
        person.id === id ? { ...person, [field]: value } : person
      )
    );
  }

  function changeNewPerson(field: keyof NewPerson, value: string) {
    setNewPerson((current) => ({ ...current, [field]: value }));
  }

  async function uploadPhoto(file: File, owner: string) {
    if (!token) throw new Error("ابتدا وارد حساب مدیر شو.");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error("فقط عکس‌های JPG، PNG یا WEBP مجاز هستند.");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("حجم عکس نباید بیشتر از ۵ مگابایت باشد.");
    }
    const extension = file.type === "image/png" ? "png" :
      file.type === "image/webp" ? "webp" : "jpg";
    const filename = owner + "-" + Date.now() + "-" +
      Math.random().toString(36).slice(2, 8) + "." + extension;
    const path = "billionaires/" + filename;
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const response = await fetch(
      SUPABASE_URL + "/storage/v1/object/billionaire-photos/" + encodedPath,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + token,
          "Content-Type": file.type,
          "x-upsert": "true",
        },
        body: file,
      }
    );
    if (!response.ok) throw new Error("آپلود عکس ناموفق بود: " + await response.text());
    return SUPABASE_URL + "/storage/v1/object/public/billionaire-photos/" + encodedPath;
  }

  async function uploadNewPhoto(file: File) {
    setBusy(true);
    setMessage("در حال آپلود عکس...");
    try {
      const url = await uploadPhoto(file, "new");
      changeNewPerson("image_url", url);
      setMessage("عکس آپلود شد؛ با ثبت میلیاردر ذخیره نهایی می‌شود.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "خطا در آپلود عکس.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadPersonPhoto(person: Billionaire, file: File) {
    setBusy(true);
    setMessage("در حال آپلود عکس " + person.name + "...");
    try {
      const url = await uploadPhoto(file, person.id);
      const response = await fetch(
        SUPABASE_URL + "/rest/v1/billionaires?id=eq." + person.id,
        {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            image_url: url,
            updated_at: new Date().toISOString(),
          }),
        }
      );
      if (!response.ok) throw new Error(await response.text());
      setPeople((current) =>
        current.map((item) =>
          item.id === person.id ? { ...item, image_url: url } : item
        )
      );
      setMessage("عکس " + person.name + " با موفقیت ذخیره شد.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "خطا در ذخیره عکس.");
    } finally {
      setBusy(false);
    }
  }

  async function fetchSuperRichReports() {
    if (!token) return;

    setBusy(true);
    setMessage("در حال دریافت گزارش‌های SuperRich...");

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
        throw new Error(result.error || "دریافت گزارش‌ها ناموفق بود.");
      }

      await loadReports(token);

      setMessage(
        `دریافت انجام شد: ${result.provider_records ?? 0} رکورد، ` +
          `${result.matched_people ?? 0} تطبیق، ` +
          `${result.inserted_reports ?? 0} گزارش جدید.`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "خطای SuperRich");
    } finally {
      setBusy(false);
    }
  }

  async function reviewReport(
    reportId: string,
    status: "approved" | "rejected"
  ) {
    setBusy(true);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/billionaire_wealth_change_reports?id=eq.${reportId}`,
                  {          method: "PATCH",
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

      if (!response.ok) throw new Error(await response.text());

      setMessage(
        status === "approved"
          ? "گزارش تأیید شد؛ ثروت اصلی تغییر نکرد."
          : "گزارش رد شد."
      );

      await loadReports(token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "خطا در بررسی گزارش.");
    } finally {
      setBusy(false);
    }
}
    async function createPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = newPerson.name.trim();
    const wealth = numberValue(newPerson.net_worth_billions);

    if (!name) {
      setMessage("نام میلیاردر را وارد کن.");
      return;
    }

    if (!Number.isFinite(wealth) || wealth <= 0) {
      setMessage("ثروت باید عددی معتبر و بیشتر از صفر باشد.");
      return;
    }

    if (people.some((person) => normalizeName(person.name) === normalizeName(name))) {
      setMessage("این فرد قبلاً ثبت شده است.");
      return;
    }

    setBusy(true);
    setMessage("در حال افزودن میلیاردر...");

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/billionaires`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          rank: Math.max(0, ...people.map((person) => Number(person.rank) || 0)) + 1,
          name,
          company: newPerson.company.trim() || null,
          country: newPerson.country.trim() || null,
          image_url: newPerson.image_url.trim() || null,
          bio: newPerson.bio.trim() || null,
          net_worth_billions: wealth,
          daily_change_pct: 0,
          daily_change_source: "manual",
          forbes_change_pct: null,
          forbes_change_period: "day",
          yesterday_net_worth_billions: null,
          daily_change_date: null,
          updated_at: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.details || "افزودن فرد ناموفق بود.");
      }

      const created = Array.isArray(result) ? result[0] : result;

      if (created?.id) {
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
              billionaire_id: created.id,
              billionaire_name: name,
              net_worth_billions: wealth,
              recorded_at: new Date().toISOString(),
            }),
          }
        );

        if (!historyResponse.ok) {
          setMessage(
            `فرد اضافه شد؛ اما تاریخچه اولیه ثبت نشد: ${await historyResponse.text()}`
          );
        }
      }

      await loadPeople(token);
      setNewPerson(emptyNewPerson);
      setShowAddForm(false);
      setMessage(`میلیاردر ${name} اضافه شد.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "خطا در افزودن میلیاردر.");
    } finally {
      setBusy(false);
    }
  }

  async function savePerson(person: Billionaire) {
    if (!token) {
      setMessage("ابتدا وارد حساب مدیر شو.");
      return;
    }

    const wealth = numberValue(person.net_worth_billions);
    const source = person.daily_change_source ?? "manual";

    if (!person.name.trim()) {
      setMessage("نام میلیاردر نمی‌تواند خالی باشد.");
      return;
    }

    if (!Number.isFinite(wealth) || wealth < 0) {
      setMessage("ثروت واردشده معتبر نیست.");
      return;
    }

    const forbesText = String(person.forbes_change_pct ?? "").trim();
    const forbesNumber = forbesText === "" ? null : numberValue(forbesText);

    if (forbesNumber !== null && !Number.isFinite(forbesNumber)) {
      setMessage("درصد Forbes معتبر نیست.");
      return;
    }

    const isWeekly =
      source === "forbes" && person.forbes_change_period === "week";

    let percentage = NaN;
    let preview: Preview | null = null;

    if (source === "manual") {
      percentage = numberValue(person.daily_change_pct);
    } else if (source === "forbes" && !isWeekly) {
      percentage = forbesNumber ?? NaN;
    } else if (source === "superrich") {
      const report = getReport(person, reports);
      percentage = report ? Number(report.change_pct) : NaN;

      if (!report) {
        setMessage(`گزارش معتبر SuperRich برای ${person.name} پیدا نشد.`);
        return;
      }
    }

    if (!isWeekly) {
      if (!Number.isFinite(percentage) || percentage < -100) {
        setMessage("درصد تغییر باید عددی معتبر و بزرگ‌تر یا مساوی ۱۰۰- باشد.");
        return;
      }

      preview = calculatePreview(person, percentage);

      if (!preview) {
        setMessage("محاسبه ثروت ممکن نیست؛ مقدار پایه را بررسی کن.");
        return;
      }
    }

    setBusy(true);
    setMessage("در حال ذخیره تغییرات...");

    try {
      const today = iranDateKey();
      const now = new Date().toISOString();

      const updateData: Record<string, unknown> = {
        name: person.name.trim(),
        company: person.company?.trim() || null,
        country: person.country?.trim() || null,
        image_url: person.image_url?.trim() || null,
        bio: person.bio?.trim() || null,
        updated_at: now,
      };

      if (source === "forbes") {
        updateData.forbes_change_pct = forbesNumber;
        updateData.forbes_change_period = person.forbes_change_period ?? "day";
      }

      if (!isWeekly) {
        updateData.net_worth_billions = preview!.result;
        updateData.yesterday_net_worth_billions = preview!.base;
        updateData.daily_change_date = today;
        updateData.daily_change_pct = percentage;
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
            Prefer: "return=minimal",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) throw new Error(await response.text());

      if (!isWeekly && preview) {
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
              net_worth_billions: preview.result,
              recorded_at: now,
              source_url: person.source_url || null,
            }),
          }
        );

        if (!historyResponse.ok) {
          const historyError = await historyResponse.text();
          await loadPeople(token);
          throw new Error(
            `ثروت ذخیره شد، اما ثبت تاریخچه ناموفق بود: ${historyError}`
          );
        }
      }

      await loadPeople(token);

      if (isWeekly) {
        setMessage(
          `گزارش هفتگی Forbes برای ${person.name} ذخیره شد؛ ثروت روزانه تغییر نکرد.`
        );
      } else {
        setMessage(
          `${person.name}: ثروت جدید ${formatNumber(preview!.result)} میلیارد دلار ذخیره شد.`
        );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "خطا در ذخیره تغییرات.");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    setToken("");
    setPeople([]);
    setReports([]);
    setComparisons([]);
    setComparisonDrafts({});
    setMessage("از حساب مدیر خارج شدی.");
  }

  const visiblePeople = people.filter((person) => {
    const query = search.trim().toLowerCase();

    return (
      !query ||
      person.name.toLowerCase().includes(query) ||
      String(person.rank).includes(query) ||
      (person.company ?? "").toLowerCase().includes(query)
    );
  });

  const pendingReports = reports.filter((report) => report.status === "pending");

  if (!token) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#07111f",
          color: "#f8fafc",
          padding: "24px",
          display: "grid",
          placeItems: "center",
        }}
      >
        <form
          onSubmit={login}
          style={{
            width: "100%",
            maxWidth: "420px",
            background: "#111e30",
            border: "1px solid #24354b",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <h1 style={{ color: "#b9f27c", marginTop: 0 }}>Econova Admin</h1>
          <p style={{ color: "#94a3b8" }}>ورود به پنل مدیریت</p>

          <Field
            label="ایمیل مدیر"
            value={email}
            onChange={setEmail}
            type="email"
            style={inputStyle}
          />

          <Field
            label="رمز عبور"
            value={password}
            onChange={setPassword}
            type="password"
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={busy}
            style={{ ...buttonStyle, width: "100%" }}
          >
            {busy ? "در حال ورود..." : "ورود"}
          </button>

          {message && <p style={{ color: "#b9f27c" }}>{message}</p>}
        </form>
      </main>
    );
  }
    return (
    <main
      style={{
        minHeight: "100vh",
        background: "#07111f",
        color: "#f8fafc",
        padding: "16px",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ color: "#b9f27c", marginBottom: "4px" }}>
            پنل مدیریت Econova
          </h1>
          <p style={{ color: "#94a3b8", margin: 0 }}>
            مدیریت ثروت و اطلاعات میلیاردرها
          </p>
        </div>

        <button onClick={logout} style={buttonStyle}>
          خروج از پنل
        </button>
      </header>

      {message && (
        <div
          style={{
            padding: "12px",
            marginBottom: "16px",
            borderRadius: "10px",
            background: "#13251d",
            border: "1px solid #36533b",
            color: "#b9f27c",
            overflowWrap: "anywhere",
          }}
        >
          {message}
        </div>
      )}

      <section
        style={{
          background: "#111e30",
          border: "1px solid #24354b",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "18px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>فهرست میلیاردرها</h2>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="جست‌وجوی نام، رتبه یا شرکت..."
          style={inputStyle}
        />

        <button
          onClick={() => setShowAddForm((value) => !value)}
          style={{ ...buttonStyle, background: "#15803d" }}
        >
          {showAddForm ? "بستن فرم افزودن" : "افزودن میلیاردر جدید"}
        </button>

        {showAddForm && (
          <form
            onSubmit={createPerson}
            style={{
              marginTop: "16px",
              padding: "14px",
              border: "1px solid #36533b",
              borderRadius: "12px",
            }}
          >
            <h3 style={{ color: "#b9f27c", marginTop: 0 }}>
              ثبت میلیاردر جدید
            </h3>

            <p style={{ color: "#94a3b8", fontSize: "13px" }}>
              رتبه پس از ثبت، به‌صورت خودکار بر اساس ثروت تعیین می‌شود.
            </p>

            <Field label="نام" value={newPerson.name}
              onChange={(value) => changeNewPerson("name", value)}
              style={inputStyle} />

            <Field label="شرکت" value={newPerson.company}
              onChange={(value) => changeNewPerson("company", value)}
                            style={inputStyle} />

            <Field label="کشور" value={newPerson.country}
              onChange={(value) => changeNewPerson("country", value)}
              style={inputStyle} />

            <Field label="لینک تصویر (اختیاری)" value={newPerson.image_url}
              onChange={(value) => changeNewPerson("image_url", value)}
              style={inputStyle} />

            <label style={{ display: "block", marginTop: "12px" }}>
              انتخاب عکس از گالری گوشی
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadNewPhoto(file);
                  event.currentTarget.value = "";
                }}
                style={{ ...inputStyle, padding: "9px" }}
              />
            </label>

            {newPerson.image_url && (
              <img
                src={newPerson.image_url}
                alt="پیش‌نمایش عکس"
                style={{ width: "90px", height: "90px", objectFit: "cover", borderRadius: "12px", marginTop: "10px" }}
              />
            )}

            <Field label="ثروت اولیه (میلیارد دلار)"
              value={newPerson.net_worth_billions}
              onChange={(value) => changeNewPerson("net_worth_billions", value)}
              style={inputStyle} type="number" />

            <label style={{ display: "block", marginTop: "12px" }}>
              بیوگرافی
              <textarea
                value={newPerson.bio}
                onChange={(event) => changeNewPerson("bio", event.target.value)}
                rows={3}
                style={inputStyle}
              />
            </label>

            <button type="submit" disabled={busy}
              style={{ ...buttonStyle, width: "100%", background: "#15803d" }}>
              ثبت میلیاردر جدید
            </button>
          </form>
        )}
      </section>

      <section
        style={{
          background: "#111e30",
          border: "1px solid #24354b",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "20px",
        }}
      >
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}>
          <div>
            <strong>گزارش‌های دریافتی SuperRich</strong>
            <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: 0 }}>
              گزارش‌ها جدا از ثروت اصلی ذخیره می‌شوند.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchSuperRichReports}
            disabled={busy || reportsLoading}
            style={{ ...buttonStyle, background: "#365b32" }}
          >
            {reportsLoading ? "در حال بارگذاری..." : "دریافت گزارش‌های جدید"}
          </button>
        </div>

        <p style={{ color: "#b9f27c", fontSize: "13px" }}>
          گزارش‌های در انتظار بررسی: {pendingReports.length}
        </p>
      </section>

      {visiblePeople.map((person) => {
        const source = person.daily_change_source ?? "manual";
        const report = getReport(person, reports);
        const weekly = source === "forbes" && person.forbes_change_period === "week";

        let percentage = NaN;

        if (source === "manual") {
          percentage = numberValue(person.daily_change_pct);
        } else if (source === "forbes") {
          percentage = numberValue(person.forbes_change_pct);
        } else if (source === "superrich" && report) {
          percentage = Number(report.change_pct);
        }

        const preview = weekly
          ? null
          : calculatePreview(person, percentage);

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
            <h3 style={{ color: "#b9f27c" }}>
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

            <p style={{ color: "#b9f27c", fontSize: "13px" }}>
              رتبه خودکار فعلی: {person.rank} · براساس ثروت ثبت‌شده
            </p>

            <Field label="نام" value={person.name}
              onChange={(value) => changeField(person.id, "name", value)}
              style={inputStyle} />

            <Field label="شرکت" value={person.company ?? ""}
              onChange={(value) => changeField(person.id, "company", value)}
              style={inputStyle} />

            <Field label="کشور" value={person.country ?? ""}
              onChange={(value) => changeField(person.id, "country", value)}
              style={inputStyle} />

            <Field label="لینک تصویر (اختیاری)" value={person.image_url ?? ""}
              onChange={(value) => changeField(person.id, "image_url", value)}
              style={inputStyle} />

            <label style={{ display: "block", marginTop: "12px" }}>
              تغییر عکس از گالری گوشی
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadPersonPhoto(person, file);
                  event.currentTarget.value = "";
                }}
                style={{ ...inputStyle, padding: "9px" }}
              />
            </label>

            <Field label="ثروت فعلی (میلیارد دلار)"
              value={String(person.net_worth_billions)}
              onChange={(value) => changeField(person.id, "net_worth_billions", value)}
              style={inputStyle} type="number" />

            <label style={{ display: "block", marginTop: "12px" }}>
              بیوگرافی
              <textarea
                rows={3}
                value={person.bio ?? ""}
                onChange={(event) => changeField(person.id, "bio", event.target.value)}
                style={inputStyle}
              />
            </label>

            <div
              style={{
                marginTop: "18px",
                padding: "15px",
                border: "1px solid #334155",
                borderRadius: "12px",
              }}
            >
              <h3 style={{ marginTop: 0 }}>منبع درصد تغییر ثروت</h3>

              <select
                value={source}
                onChange={(event) =>
                  changeField(
                    person.id,
                    "daily_change_source",
                    event.target.value
                  )
                }
                style={selectStyle}
              >
                <option value="manual">ورود دستی</option>
                <option value="forbes">Forbes</option>
                <option value="superrich">SuperRich</option>
              </select>

              {source === "manual" && (
                <Field
                  label="درصد تغییر روزانه دستی"
                  value={String(person.daily_change_pct ?? "")}
                  onChange={(value) => changeField(person.id, "daily_change_pct", value)}
                  style={inputStyle}
                  type="number"
                />
              )}

              {source === "forbes" && (
                <>
                  <Field
                    label="درصد تغییر Forbes"
                    value={String(person.forbes_change_pct ?? "")}
                    onChange={(value) => changeField(person.id, "forbes_change_pct", value)}
                    style={inputStyle}
                    type="number"
                  />

                  <label style={{ display: "block", marginTop: "12px" }}>
                    بازه گزارش Forbes
                    <select
                      value={person.forbes_change_period ?? "day"}
                      onChange={(event) =>
                        changeField(person.id, "forbes_change_period", event.target.value)
                      }
                      style={selectStyle}
                    >
                      <option value="day">روزانه</option>
                      <option value="week">هفتگی</option>
                    </select>
                  </label>

                  <p style={{ color: "#94a3b8", fontSize: "12px", lineHeight: 1.8 }}>
                    درصد Forbes به‌صورت دستی وارد می‌شود و به API زنده متصل نیست.
                    گزارش هفتگی فقط ذخیره می‌شود و ثروت روزانه را تغییر نمی‌دهد.
                  </p>
                </>
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
                  {report ? (
                    <>
                      <strong style={{ color: "#b9f27c" }}>گزارش پیدا شد</strong>
                      <div>درصد تغییر: {Number(report.change_pct).toFixed(3)}٪</div>
                      <div>وضعیت: {report.status}</div>
                      <div>
                        زمان گزارش: {new Date(report.observed_at).toLocaleString("fa-IR")}
                      </div>
                    </>
                  ) : (
                    <p>گزارشی برای این میلیاردر پیدا نشد. گزارش‌های جدید را دریافت کن.</p>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: "18px",
                padding: "15px",
                border: "1px solid #52613b",
                borderRadius: "12px",
                background: "#101b22",
              }}
            >
              <h3 style={{ color: "#b9f27c", marginTop: 0 }}>
                مقایسه داخلی منابع (فقط پنل مدیریت)
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "12px", lineHeight: 1.8 }}>
                این اطلاعات جداگانه ذخیره می‌شوند و هیچ اثری روی ثروت اصلی Econova یا سایت عمومی ندارند.
              </p>
              {(["forbes", "bloomberg"] as const).map((sourceName) => {
                const key = `${person.id}:${sourceName}`;
                const draft = comparisonDrafts[key] ?? {
                  net_worth_billions: "",
                  observed_at: "",
                  source_url: "",
                  notes: "",
                };
                const stored = comparisons.find(
                  (item) => item.billionaire_id === person.id && item.source_name === sourceName
                );
                const sourceValue = numberValue(draft.net_worth_billions);
                const econovaValue = numberValue(person.net_worth_billions);
                const difference = Number.isFinite(sourceValue) && Number.isFinite(econovaValue)
                  ? sourceValue - econovaValue
                  : null;

                return (
                  <div
                    key={sourceName}
                    style={{
                      marginTop: "12px",
                      padding: "12px",
                      border: "1px solid #334155",
                      borderRadius: "10px",
                    }}
                  >
                    <strong style={{ color: "#e2e8f0" }}>
                      {sourceName === "forbes" ? "Forbes" : "Bloomberg"}
                    </strong>
                    {stored && (
                      <p style={{ color: "#94a3b8", fontSize: "12px" }}>
                        آخرین ثبت: {new Date(stored.observed_at).toLocaleString("fa-IR")}
                      </p>
                    )}
                    <Field
                      label="ثروت اعلام‌شده (میلیارد دلار)"
                      value={draft.net_worth_billions}
                      onChange={(value) => changeComparisonDraft(person.id, sourceName, "net_worth_billions", value)}
                      style={inputStyle}
                      type="number"
                    />
                    <label style={{ display: "block", marginTop: "12px" }}>
                      زمان مشاهده داده
                      <input
                        type="datetime-local"
                        value={draft.observed_at}
                        onChange={(event) => changeComparisonDraft(person.id, sourceName, "observed_at", event.target.value)}
                        style={inputStyle}
                      />
                    </label>
                    <Field
                      label="لینک منبع (اختیاری)"
                      value={draft.source_url}
                      onChange={(value) => changeComparisonDraft(person.id, sourceName, "source_url", value)}
                      style={inputStyle}
                    />
                    <label style={{ display: "block", marginTop: "12px" }}>
                      یادداشت (اختیاری)
                      <textarea
                        rows={2}
                        value={draft.notes}
                        onChange={(event) => changeComparisonDraft(person.id, sourceName, "notes", event.target.value)}
                        style={inputStyle}
                      />
                    </label>
                    <p style={{ color: difference === null ? "#94a3b8" : difference > 0 ? "#86efac" : difference < 0 ? "#fca5a5" : "#cbd5e1", fontSize: "13px" }}>
                      اختلاف با Econova: {difference === null ? "—" : `${difference > 0 ? "+" : ""}${formatNumber(difference)} میلیارد دلار`}
                    </p>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => saveComparison(person, sourceName)}
                      style={{ ...buttonStyle, width: "100%", background: "#365b32" }}
                    >
                      ذخیره داده {sourceName === "forbes" ? "Forbes" : "Bloomberg"}
                    </button>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: "12px",
                padding: "12px",
                border: "1px solid #36533b",
                borderRadius: "10px",
                background: "#0b1c1b",
                lineHeight: 1.9,
                fontSize: "13px",
              }}
            >
              {weekly ? (
                <p style={{ color: "#fbbf24" }}>
                  گزارش هفتگی Forbes ذخیره می‌شود؛ ثروت روزانه تغییر نمی‌کند.
                </p>
              ) : preview ? (
                <>
                  <strong style={{ color: "#b9f27c" }}>
                    پیش‌نمایش محاسبه خودکار
                  </strong>
                  <div>ثروت پایه روز قبل: {formatNumber(preview.base)} میلیارد دلار</div>
                  <div>درصد تغییر: {preview.percentage > 0 ? "+" : ""}{formatNumber(preview.percentage)}٪</div>
                  <div>مقدار تغییر: {preview.difference > 0 ? "+" : ""}{formatNumber(preview.difference)} میلیارد دلار</div>
                  <strong style={{ color: "#b9f27c" }}>
                    ثروت پس از ثبت: {formatNumber(preview.result)} میلیارد دلار
                  </strong>
                  <p style={{ color: "#94a3b8", marginBottom: 0 }}>
                    ذخیره مجدد در همین روز از ثروت پایه روز قبل استفاده می‌کند؛
                    بنابراین درصد تغییر دوباره روی ثروت جدید اعمال نمی‌شود.
                  </p>
                </>
              ) : (
                <span>برای نمایش پیش‌نمایش، درصد تغییر معتبر وارد کن.</span>
              )}
            </div>

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
              {busy ? "در حال ذخیره..." : "ذخیره تغییرات و محاسبه ثروت"}
            </button>
          </section>
        );
      })}

      {visiblePeople.length === 0 && (
        <p style={{ color: "#94a3b8", textAlign: "center", padding: "24px" }}>
          هیچ میلیاردر‌ی با این جست‌وجو پیدا نشد.
        </p>
      )}

      <section
        style={{
          marginTop: "28px",
          padding: "16px",
          borderRadius: "14px",
          background: "#111e30",
          border: "1px solid #24354b",
        }}
      >
        <h2 style={{ color: "#b9f27c" }}>بررسی گزارش‌های SuperRich</h2>

        <p style={{ color: "#94a3b8", fontSize: "13px", lineHeight: 1.8 }}>
          تأیید یا رد گزارش‌ها به‌تنهایی ثروت اصلی میلیاردرها را تغییر نمی‌دهد.
        </p>

        {reportsLoading ? (
          <p>در حال بارگذاری گزارش‌ها...</p>
        ) : reports.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>هنوز گزارشی ثبت نشده است.</p>
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
              <strong>{report.billionaire_name}</strong>

              <div style={{ color: "#cbd5e1", fontSize: "13px", lineHeight: 1.9 }}>
                <div>درصد تغییر: {report.change_pct ?? "نامشخص"}٪</div>
                <div>مقدار تغییر: {report.change_billions} میلیارد دلار</div>
                <div>منبع: {report.source_name}</div>
                <div>وضعیت: {report.status}</div>
                <div>زمان: {new Date(report.observed_at).toLocaleString("fa-IR")}</div>

                {report.notes && <p style={{ color: "#94a3b8" }}>{report.notes}</p>}

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
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => reviewReport(report.id, "approved")}
                    disabled={busy}
                    style={{ ...buttonStyle, background: "#15803d" }}
                  >
                    تأیید گزارش
                  </button>

                  <button
                    type="button"
                    onClick={() => reviewReport(report.id, "rejected")}
                    disabled={busy}
                    style={{ ...buttonStyle, background: "#991b1b" }}
                  >
                    رد گزارش
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  style,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  style?: React.CSSProperties;
}) {
  return (
    <label style={{ display: "block", marginTop: "12px" }}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={style}
      />
    </label>
  );
                    }
                    
