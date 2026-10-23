"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Billionaire = {
  id: string | number;
  rank: number;
  name: string;
  company: string | null;
  country: string | null;
  image_url: string | null;
  bio: string | null;
  net_worth_billions: number;
  daily_change_pct: number | null;
  daily_change_date?: string | null;
  updated_at?: string | null;
  source_url?: string | null;
  yesterday_net_worth_billions?: number | null;
};

type BillionaireNews = {
  billionaire_rank: number;
  title: string;
  content?: string | null;
  updated_at?: string | null;
};

type WealthHistoryPoint = {
  id: number;
  billionaire_id: string;
  billionaire_name: string;
  net_worth_billions: number | string;
  recorded_at: string;
  source_url: string | null;
};

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ||
  "https://zusbebjskchgehdjvpsm.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const API_HEADERS = {
  apikey: SUPABASE_KEY,
  "Content-Type": "application/json",
};

const GREEN = "#b9f27c";

function formatMoney(value: number | null | undefined): string {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatBillions(value: number): string {
  return `$${formatMoney(value)}B`;
}

function formatChange(value: number | null | undefined): string {
  const number = Number(value ?? 0);
  const sign = number > 0 ? "+" : "";

  return `${sign}${number.toFixed(2)}%`;
}

function photoFor(person: Billionaire): string {
  if (person.image_url?.trim()) {
    return person.image_url;
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    person.name || "Econova"
  )}&background=14271d&color=b9f27c&size=160&bold=true`;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "تنظیمات Supabase در Environment Variables سایت Vercel وارد نشده است."
    );
  }

  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      ...API_HEADERS,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  const text = await response.text();

  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as { message: unknown }).message)
        : `خطای درخواست: ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}


function MiniWealthChart({ person }: { person: Billionaire }) {
  const [points, setPoints] = useState<WealthHistoryPoint[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rows = await apiRequest<WealthHistoryPoint[]>(
          `/rest/v1/billionaire_wealth_history?billionaire_id=eq.${encodeURIComponent(String(person.id))}&select=id,billionaire_id,billionaire_name,net_worth_billions,recorded_at,source_url&order=recorded_at.asc&limit=30`
        );
        if (!cancelled) {
          const validRows = (Array.isArray(rows) ? rows : []).filter(p => Number.isFinite(Number(p.net_worth_billions)));
          setPoints(validRows);
          setSelectedIndex(validRows.length ? validRows.length - 1 : null);
        }
      } catch {
        if (!cancelled) {
          setPoints([]);
          setSelectedIndex(null);
        }
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [person.id]);

  if (points.length < 2) {
    return <span className="eco-mini-chart-empty">نمودار ثروت: برای رسم خط، حداقل ۲ رکورد تاریخی لازم است.</span>;
  }
  const values = points.map(p => Number(p.net_worth_billions));
  const min = Math.min(...values), max = Math.max(...values), range = max - min || Math.max(Math.abs(max) * 0.01, 1);
  const plotted = values.map((v, i) => ({
    x: 3 + i * (94 / (values.length - 1)),
    y: 25 - ((v - min) / range) * 18,
  }));
  const linePath = plotted.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const areaPath = `${linePath} L${plotted[plotted.length - 1].x.toFixed(2)},29 L${plotted[0].x.toFixed(2)},29 Z`;
  const last = plotted[plotted.length - 1];
  const up = values[values.length - 1] >= values[0];
  const gradientId = `wealthGradient-${String(person.id).replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const activeIndex = selectedIndex !== null && selectedIndex < points.length ? selectedIndex : points.length - 1;
  const activePoint = points[activeIndex];
  const activePlot = plotted[activeIndex];
  const activeDate = activePoint?.recorded_at
    ? new Date(activePoint.recorded_at).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" })
    : "تاریخ نامشخص";
  const choosePoint = (clientX: number, currentTarget: SVGSVGElement) => {
    const rect = currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const chartX = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    let nearest = 0;
    for (let i = 1; i < plotted.length; i++) {
      if (Math.abs(plotted[i].x - chartX) < Math.abs(plotted[nearest].x - chartX)) nearest = i;
    }
    setSelectedIndex(nearest);
  };
  return (
    <div className="eco-mini-chart-wrap">
      <div className="eco-mini-chart-tooltip" aria-live="polite">
        <span>{activeDate}</span>
        <strong>${values[activeIndex].toLocaleString("en-US", { maximumFractionDigits: 1 })}B</strong>
      </div>
      <svg
        className={`eco-mini-chart ${up ? "is-up" : "is-down"}`}
        viewBox="0 0 100 32"
        role="img"
        aria-label={`نمودار تاریخچه ثروت ${person.name}. روی نمودار لمس کنید تا ثروت ثبت‌شده در آن تاریخ نمایش داده شود.`}
        preserveAspectRatio="none"
        onPointerDown={event => choosePoint(event.clientX, event.currentTarget)}
        onPointerMove={event => { if (event.buttons === 1 || event.pointerType === "touch") choosePoint(event.clientX, event.currentTarget); }}
        onPointerLeave={() => setSelectedIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.015" />
          </linearGradient>
        </defs>
        <path className="eco-mini-chart-grid" d="M1 8 H99 M1 18 H99 M1 28 H99" fill="none" stroke="currentColor" strokeOpacity="0.13" strokeDasharray="1.5 3" />
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {plotted.map((point, index) => (
          <circle key={`${points[index]?.id ?? index}`} cx={point.x} cy={point.y} r={index === activeIndex ? 3.2 : 1.5} fill="currentColor" fillOpacity={index === activeIndex ? 1 : 0.42} />
        ))}
        <line x1={activePlot.x} y1="2" x2={activePlot.x} y2="30" stroke="currentColor" strokeOpacity="0.55" strokeDasharray="1.5 2" strokeWidth="0.8" />
        <circle cx={activePlot.x} cy={activePlot.y} r="5" fill="currentColor" fillOpacity="0.14" />
        <circle cx={activePlot.x} cy={activePlot.y} r="2.4" fill="currentColor" />
        <rect x="0" y="0" width="100" height="32" fill="transparent" />
      </svg>
    </div>
  );
}

function changeAmount(person: Billionaire): number | null {
  const current = Number(person.net_worth_billions);
  const previous = person.yesterday_net_worth_billions;
  if (previous === null || previous === undefined || !Number.isFinite(Number(previous))) return null;
  return current - Number(previous);
}

export default function BillionairesPage() {
  const [people, setPeople] = useState<Billionaire[]>([]);
  const [news, setNews] = useState<BillionaireNews[]>([]);
const [wealthHistory, setWealthHistory] = useState<WealthHistoryPoint[]>([]);
const [historyLoading, setHistoryLoading] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [activeRank, setActiveRank] = useState(1);

  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [lastUpdated, setLastUpdated] = useState("");

  const [loginOpen, setLoginOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminToken, setAdminToken] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");

  const [editingNewsRank, setEditingNewsRank] = useState(1);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsSource, setNewsSource] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState("");
  const [personName, setPersonName] = useState("");
  const [personRank, setPersonRank] = useState("1");
  const [personCompany, setPersonCompany] = useState("");
  const [personCountry, setPersonCountry] = useState("");
  const [personBio, setPersonBio] = useState("");
  const [personImageUrl, setPersonImageUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [personWorth, setPersonWorth] = useState("");
  const [personDailyChange, setPersonDailyChange] = useState("0");
  const [personSource, setPersonSource] = useState("");
  
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const [peopleData, newsData] = await Promise.all([
        apiRequest<Billionaire[]>(
          "/rest/v1/billionaires?select=*&order=rank.asc&limit=100"
        ),
        apiRequest<BillionaireNews[]>(
          "/rest/v1/billionaire_news?select=*&order=billionaire_rank.asc"
        ).catch(() => [] as BillionaireNews[]),
      ]);

      const sorted = [...peopleData].sort(
        (a, b) => Number(a.rank) - Number(b.rank)
      );

      setPeople(sorted);
      setNews(newsData || []);

      if (sorted.length > 0) {
        setLastUpdated(
          sorted[0].updated_at
            ? new Date(sorted[0].updated_at).toLocaleString("fa-IR")
            : "اطلاعات دریافت شد"
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "دریافت اطلاعات با خطا مواجه شد."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const sortedPeople = useMemo(
    () => [...people].sort((a, b) => a.rank - b.rank),
    [people]
  );

  const topFive = useMemo(
    () => sortedPeople.slice(0, 5),
    [sortedPeople]
  );

  const topTenTotal = useMemo(
    () =>
      sortedPeople
        .slice(0, 10)
        .reduce(
          (total, person) =>
            total + Number(person.net_worth_billions || 0),
          0
        ),
    [sortedPeople]
  );

  useEffect(() => {
    let frame = 0;
    const duration = 1000;
    const start = Date.now();
    const initial = animatedTotal;
    const difference = topTenTotal - initial;

    let animationFrame = 0;

    const animate = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedTotal(initial + difference * eased);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      frame++;
      void frame;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topTenTotal]);

  const filteredPeople = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();

    if (!query) return sortedPeople;

    return sortedPeople.filter((person) =>
      [
        person.name,
        person.company || "",
        person.country || "",
        String(person.rank),
      ].some((value) => value.toLocaleLowerCase().includes(query))
    );
  }, [sortedPeople, searchTerm]);

  const visiblePeople = showAll
    ? filteredPeople
    : filteredPeople.slice(0, 10);

  const activePerson =
    sortedPeople.find((person) => person.rank === activeRank) ||
    sortedPeople[0];
  
  useEffect(() => {
  if (!activePerson?.id) {
    setWealthHistory([]);
    return;
  }

  let cancelled = false;

  async function loadWealthHistory() {
    setHistoryLoading(true);

    try {
      const rows = await apiRequest<WealthHistoryPoint[]>(
        `/rest/v1/billionaire_wealth_history?billionaire_id=eq.${encodeURIComponent(
          String(activePerson.id)
        )}&select=id,billionaire_id,billionaire_name,net_worth_billions,recorded_at,source_url&order=recorded_at.asc&limit=100`
      );

      if (!cancelled) {
        setWealthHistory(Array.isArray(rows) ? rows : []);
      }
    } catch (error) {
      console.error("Wealth history loading failed:", error);

      if (!cancelled) {
        setWealthHistory([]);
      }
    } finally {
      if (!cancelled) {
        setHistoryLoading(false);
      }
    }
  }

  void loadWealthHistory();

  return () => {
    cancelled = true;
  };
}, [activePerson?.id]);

  const newsForRank = (rank: number) =>
  news.find((item) => Number(item.billionaire_rank) === rank);

  const changeIsPositive = (person: Billionaire) =>
    Number(person.daily_change_pct || 0) >= 0;

  const loginAdmin = async () => {
    setAdminMessage("");

    try {
      const result = await apiRequest<{
        access_token: string;
        user?: { id: string; email?: string };
      }>("/auth/v1/token?grant_type=password", {
        method: "POST",
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
        }),
      });

      const userId = result.user?.id;

      if (!userId) {
        throw new Error("حساب کاربری معتبر نیست.");
      }

      const admins = await apiRequest<{ user_id: string }[]>(
        `/rest/v1/admin_users?select=user_id&user_id=eq.${encodeURIComponent(
          userId
        )}`,
        {},
        result.access_token
      );

      if (!admins.some((admin) => admin.user_id === userId)) {
        throw new Error("این حساب دسترسی مدیر ندارد.");
      }

      setAdminToken(result.access_token);
      setIsAdmin(true);
      setLoginOpen(false);
      setAdminPassword("");
      setAdminMessage("ورود مدیر موفق بود.");
    } catch (error) {
      setAdminMessage(
        error instanceof Error ? error.message : "ورود ناموفق بود."
      );
    }
  };

  const logoutAdmin = () => {
    setAdminToken("");
    setIsAdmin(false);
    setAdminMessage("");
    setLoginOpen(false);
  };

  const openNewsEditor = (rank: number) => {
    const item = newsForRank(rank);

    setEditingNewsRank(rank);
    setNewsTitle(item?.title || "");
    setNewsContent(item?.content || "");
setNewsSource("");
    setAdminMessage("");
  };

  
const saveNews = async () => {
  if (!isAdmin || !adminToken) {
    setAdminMessage("برای ذخیره خبر باید وارد حساب مدیر شوی.");
    return;
  }

  if (!newsTitle.trim() || !newsContent.trim()) {
    setAdminMessage("عنوان و متن خبر را وارد کن.");
    return;
  }

  setSaving(true);
  setAdminMessage("");

  try {
    const existing = newsForRank(editingNewsRank);

    const payload = {
      billionaire_rank: editingNewsRank,
      title: newsTitle.trim(),
      content: newsContent.trim(),
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await apiRequest(
        `/rest/v1/billionaire_news?billionaire_rank=eq.${encodeURIComponent(
          String(editingNewsRank)
        )}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify(payload),
        },
        adminToken
      );
    } else {
      await apiRequest(
        "/rest/v1/billionaire_news",
        {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify(payload),
        },
        adminToken
      );
    }

    await loadData();
    setAdminMessage("خبر ذخیره شد.");
  } catch (error) {
    setAdminMessage(
      error instanceof Error
        ? `ذخیره خبر ناموفق بود: ${error.message}`
        : "ذخیره خبر ناموفق بود."
    );
  } finally {
    setSaving(false);
  }
};
  
  const openPersonEditor = (person: Billionaire) => {
    setEditingPersonId(String(person.id));
    setPersonName(person.name || "");
    setPersonRank(String(person.rank));
    setPersonCompany(person.company || "");
    setPersonCountry(person.country || "");
    setPersonBio(person.bio || "");
    setPersonImageUrl(person.image_url || "");
    setPersonWorth(String(person.net_worth_billions ?? 0));
    setPersonDailyChange(String(person.daily_change_pct ?? 0));
    setPersonSource(person.source_url || "");
    setAdminMessage("");
  };

  
  const uploadPersonPhoto = async (file: File | undefined) => {
    if (!file) return;

    if (!isAdmin || !adminToken) {
      setAdminMessage("ابتدا وارد حساب مدیر شو.");
      return;
    }

    if (!editingPersonId) {
      setAdminMessage("ابتدا یک ثروتمند را برای ویرایش انتخاب کن.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAdminMessage("فقط عکس JPG، PNG یا WebP مجاز است.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAdminMessage("حجم عکس باید حداکثر ۵ مگابایت باشد.");
      return;
    }

    setUploadingPhoto(true);
    setAdminMessage("");

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${editingPersonId}/${Date.now()}-${safeName}`;

      const response = await fetch(
        `${SUPABASE_URL}/storage/v1/object/billionaire-photos/${path}`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": file.type,
            "x-upsert": "false",
          },
          body: file,
        }
      );

      const responseText = await response.text();

      if (!response.ok) {
        let message = responseText;
        try {
          const data = JSON.parse(responseText);
          message = data.message || data.error || responseText;
        } catch {}
        throw new Error(message || "آپلود عکس ناموفق بود.");
      }

      const publicUrl =
        `${SUPABASE_URL}/storage/v1/object/public/billionaire-photos/${path}`;

      setPersonImageUrl(publicUrl);
      setAdminMessage(
        "عکس آپلود شد؛ حالا ذخیره اطلاعات ثروتمند را بزن."
      );
    } catch (error) {
      setAdminMessage(
        error instanceof Error
          ? `آپلود ناموفق بود: ${error.message}`
          : "آپلود عکس ناموفق بود."
      );
    } finally {
      setUploadingPhoto(false);
    }
  };
  
  const savePerson = async () => {
    if (!isAdmin || !adminToken) {
      setAdminMessage("برای ویرایش اطلاعات باید وارد حساب مدیر شوی.");
      return;
    }

    const rank = Number(personRank);
    const worth = Number(personWorth);
    const enteredDailyChange = Number(personDailyChange);

    if (!editingPersonId || !personName.trim()) {
      setAdminMessage("فرد و نام او را مشخص کن.");
      return;
    }

    if (
      !Number.isInteger(rank) ||
      rank < 1 ||
      !Number.isFinite(worth) ||
      worth < 0 ||
      !Number.isFinite(enteredDailyChange)
    ) {
      setAdminMessage("رتبه، ثروت یا تغییر روزانه معتبر نیست.");
      return;
    }

    setSaving(true);
    setAdminMessage("");

    try {
      // خواندن ثروت فعلی از دیتابیس، پیش از ثبت مقدار جدید
      const previousResponse = await apiRequest(
        `/rest/v1/billionaires?id=eq.${encodeURIComponent(editingPersonId)}&select=net_worth_billions,daily_change_date,yesterday_net_worth_billions`,
        { method: "GET" },
        adminToken
      );
const previousRows = previousResponse as {
  net_worth_billions: number | string;
  daily_change_date: string | null;
  yesterday_net_worth_billions: number | string | null;
}[];
      const previousPerson = previousRows?.[0];

      if (!previousPerson) {
        throw new Error("اطلاعات قبلی این فرد پیدا نشد.");
      }

      const oldWorth = Number(previousPerson.net_worth_billions);

  // تاریخ روز بر اساس ساعت ایران
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const lastDate = previousPerson.daily_change_date;
  const storedYesterday = previousPerson.yesterday_net_worth_billions;

  let yesterdayWorth: number;

  if (lastDate === today) {
    // در ثبت‌های بعدی همان روز، مبنای دیروز ثابت می‌ماند.
    if (storedYesterday === null || storedYesterday === undefined) {
      throw new Error(
        "مقدار ثروت روز قبل ثبت نشده است؛ برای جلوگیری از محاسبه اشتباه، ابتدا باید مبنای روز قبل تکمیل شود."
      );
    }

    yesterdayWorth = Number(storedYesterday);
  } else {
    // اولین ثبت روز جدید: ثروت قبلی، مبنای امروز است.
    yesterdayWorth = oldWorth;
  }

  const calculatedDailyChange =
    yesterdayWorth > 0
      ? ((worth - yesterdayWorth) / yesterdayWorth) * 100
      : 0;

      await apiRequest(
        `/rest/v1/billionaires?id=eq.${encodeURIComponent(editingPersonId)}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            name: personName.trim(),
            rank,
            company: personCompany.trim() || null,
            country: personCountry.trim() || null,
            bio: personBio.trim() || null,
            image_url: personImageUrl.trim() || null,
            net_worth_billions: worth,
            daily_change_pct: Number(calculatedDailyChange.toFixed(2)),
            yesterday_net_worth_billions: yesterdayWorth,
            source_url: personSource.trim() || null,
            updated_at: new Date().toISOString(),
            daily_change_date: today,
          }),
        },
        adminToken
      );

      await loadData();
      setAdminMessage("اطلاعات ثروتمند با موفقیت ذخیره شد.");
    } catch (error) {
      setAdminMessage(
        error instanceof Error
          ? `ذخیره اطلاعات ناموفق بود: ${error.message}`
          : "ذخیره اطلاعات ناموفق بود."
      );
    } finally {
      setSaving(false);
    }
  };
  
  // پارت ۲ از این خط ادامه پیدا می‌کند.
  return (
    <main className="eco-page" dir="rtl">
      <div className="eco-glow eco-glow-one" />
      <div className="eco-glow eco-glow-two" />

      <header className="eco-header">
        <a href="#home" className="eco-logo">
          <span className="eco-logo-mark">E</span>
          <span>
            <strong>ECONOVA</strong>
            <small>اقتصاد، فراتر از خبر</small>
          </span>
        </a>

        <nav className="eco-nav">
          <a href="#home">خانه</a>
          <a href="#top-five">ثروتمندان برتر</a>
          <a href="#trillionaires">تریلیونرها</a>
          <a href="#ranking">رتبه‌بندی</a>
          <a href="#news">اخبار</a>
        </nav>

        <button
          className="eco-admin-button"
          onClick={() => {
            if (isAdmin) {
              logoutAdmin();
            } else {
              setLoginOpen(true);
            }
          }}
        >
          {isAdmin ? "خروج از حساب" : "حساب کاربری"}
        </button>
      </header>

      <section className="eco-hero" id="home">
        <div className="eco-hero-content">
          <span className="eco-eyebrow">
            <span className="eco-live-dot" />
            نمای زنده ثروت جهان
          </span>

          <h1>
            دنیای ثروت را
            <br />
            <span>متفاوت ببین.</span>
          </h1>

          <p>
            رتبه‌بندی ثروتمندترین افراد جهان، تغییرات ثروت و
            تازه‌ترین اطلاعات اقتصادی را در یک نگاه دنبال کن.
          </p>

          <div className="eco-hero-actions">
            <a href="#top-five" className="eco-button eco-button-primary">
              مشاهده ثروتمندان
              <span>←</span>
            </a>

            <a href="#news" className="eco-button eco-button-secondary">
              آخرین اخبار
            </a>
          </div>

          <div className="eco-hero-meta">
            <span>
              <i className="eco-meta-dot" />
              اطلاعات متصل به پایگاه داده
            </span>
            <span>به‌روزرسانی: {lastUpdated || "در انتظار دریافت اطلاعات"}</span>
          </div>
        </div>

        <div className="eco-hero-art">
          <div className="eco-orbit eco-orbit-one" />
          <div className="eco-orbit eco-orbit-two" />

          <div className="eco-hero-coin">
            <span>$</span>
          </div>

          <div className="eco-floating-card eco-floating-card-top">
            <span className="eco-floating-icon">↗</span>
            <span>
              <small>مجموع ثروت ۱۰ نفر اول</small>
              <strong>{formatBillions(animatedTotal)}</strong>
            </span>
          </div>

          <div className="eco-floating-card eco-floating-card-bottom">
            <span className="eco-floating-icon">◎</span>
            <span>
              <small>افراد رتبه‌بندی‌شده</small>
              <strong>{people.length} نفر</strong>
            </span>
          </div>
        </div>
      </section>

      <section className="eco-stats-grid">
        <article className="eco-stat-card eco-stat-main">
          <span className="eco-stat-label">
            مجموع ثروت ۱۰ نفر اول
          </span>

          <strong className="eco-stat-value">
            {formatBillions(animatedTotal)}
          </strong>

          <span className="eco-stat-description">
            بر اساس اطلاعات ثبت‌شده در پایگاه داده
          </span>

          <div className="eco-stat-decoration">$</div>
        </article>

        <article className="eco-stat-card">
          <span className="eco-stat-label">افراد در فهرست</span>
          <strong className="eco-stat-value">{people.length}</strong>
          <span className="eco-stat-description">
            نفر در رتبه‌بندی Econova
          </span>
        </article>

        <article className="eco-stat-card">
          <span className="eco-stat-label">ثروتمندترین فرد</span>
          <strong className="eco-stat-value eco-stat-name">
            {topFive[0]?.name || "—"}
          </strong>
          <span className="eco-stat-description">
            {topFive[0]
              ? formatBillions(topFive[0].net_worth_billions)
              : "در انتظار دریافت اطلاعات"}
          </span>
        </article>
      </section>

      <div className="eco-status-line">
        <span>
          {loading ? "در حال دریافت اطلاعات..." : "اطلاعات پایگاه داده"}
        </span>

        <button onClick={() => void loadData()} disabled={loading}>
          {loading ? "در حال بارگذاری..." : "↻ به‌روزرسانی"}
        </button>
      </div>

      <section className="eco-global-ticker" aria-label="آمار ثروت جهان">
        <div className="eco-ticker-item">
          <span className="eco-ticker-icon">↗</span>
          <span className="eco-ticker-copy"><small>مجموع ثروت ۱۰ نفر اول در Econova</small><strong>{formatBillions(animatedTotal)}</strong></span>
        </div>
        <div className="eco-ticker-separator" />
        <div className="eco-ticker-item">
          <span className="eco-ticker-icon">♛</span>
          <span className="eco-ticker-copy"><small>میلیاردرهای جهان · Forbes Real-Time</small><strong>۳٬۴۲۸ نفر</strong><em>فهرست سالانه Forbes · ۱۰ مارس ۲۰۲۶</em></span>
        </div>
        <a className="eco-ticker-source" href="https://www.forbes.com/real-time-billionaires/" target="_blank" rel="noreferrer">منبع آمار جهانی ↗</a>
      </section>


      <section className="eco-forbes-top-five" id="top-five" aria-label="پنج ثروتمند اول">
        <div className="eco-forbes-heading">
          <div>
            <span>FORBES-STYLE REAL-TIME VIEW</span>
            <h2>۵ ثروتمند برتر جهان</h2>
            <p>کارت‌ها را افقی به چپ و راست بکش؛ ثروت و تغییر روزانه هر نفر جلوی چشم است.</p>
          </div>
          <small>TOP 5</small>
        </div>
        {topFive.length ? (
          <div className="eco-forbes-carousel">
            {topFive.map((person) => (
              <button
                type="button"
                key={person.id}
                className={`eco-forbes-card ${activeRank === person.rank ? "is-selected" : ""}`}
                onClick={() => setActiveRank(person.rank)}
              >
                <div className="eco-forbes-card-head">
                  <span className="eco-forbes-rank">{person.rank}.</span>
                  <div className="eco-forbes-person">
                    <strong>{person.name}</strong>
                    <small>{person.company || person.country || "اطلاعات تکمیلی ثبت نشده"}</small>
                  </div>
                  <img
                    src={photoFor(person)}
                    alt={person.name}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = "https://ui-avatars.com/api/?name=Econova&background=14271d&color=b9f27c&size=160";
                    }}
                  />
                </div>
                <div className="eco-forbes-rule" />
                <span className="eco-forbes-label">ثروت فعلی تخمینی</span>
                <strong className="eco-forbes-worth">{formatBillions(person.net_worth_billions)}</strong>
                <span className={`eco-forbes-change ${changeIsPositive(person) ? "eco-positive" : "eco-negative"}`}>
                  {changeIsPositive(person) ? "▲" : "▼"} {formatChange(person.daily_change_pct)} امروز
                </span>
                <span className={`eco-change-amount ${changeIsPositive(person) ? "eco-positive" : "eco-negative"}`}>
                  {(() => {
                    const exact = changeAmount(person);
                    const pct = Number(person.daily_change_pct);
                    const current = Number(person.net_worth_billions);
                    const approximate = Number.isFinite(pct) && Math.abs(pct) < 100 && (1 + pct / 100) !== 0
                      ? current - current / (1 + pct / 100)
                      : null;
                    const amount = exact !== null ? exact : approximate;
                    if (amount === null || !Number.isFinite(amount)) return "مبلغ تغییر ثبت نشده";
                    return `${amount >= 0 ? "+" : "−"}$${Math.abs(amount).toFixed(2)} میلیارد${exact === null ? " (تقریبی)" : ""}`;
                  })()}
                </span>
                <MiniWealthChart person={person} />
                <span className="eco-forbes-select">{activeRank === person.rank ? "در حال مشاهده" : "مشاهده جزئیات ←"}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="eco-trillionaire-empty">در انتظار دریافت اطلاعات ثروتمندان از پایگاه داده…</div>
        )}
      </section>

      <section className="eco-trillionaire-section" id="trillionaires" aria-label="تریلیونرها">
        <div className="eco-trillionaire-heading">
          <div>
            <span className="eco-trillionaire-kicker">THE TRILLION CLUB</span>
            <h2>باشگاه تریلیونرها</h2>
            <p>افرادی که ثروت ثبت‌شده‌شان به یک تریلیون دلار یا بیشتر می‌رسد.</p>
          </div>
          <span className="eco-trillionaire-count">{people.filter((person) => Number(person.net_worth_billions) >= 1000).length} نفر</span>
        </div>
        {people.filter((person) => Number(person.net_worth_billions) >= 1000).length > 0 ? (
          <div className="eco-trillionaire-grid">
            {people.filter((person) => Number(person.net_worth_billions) >= 1000).map((person) => (
              <button key={person.id} className="eco-trillionaire-card" onClick={() => { setActiveRank(person.rank); document.getElementById("top-five")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
                <img src={photoFor(person)} alt={person.name} loading="lazy" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "https://ui-avatars.com/api/?name=Econova&background=14271d&color=b9f27c&size=160"; }} />
                <span className="eco-trillionaire-rank">RANK #{person.rank}</span>
                <strong>{person.name}</strong>
                <small>{person.company || person.country || "اطلاعات تکمیلی ثبت نشده"}</small>
                <b>{formatBillions(person.net_worth_billions)}</b>
                <em>{formatChange(person.daily_change_pct)} امروز</em>
              </button>
            ))}
          </div>
        ) : (
          <div className="eco-trillionaire-empty">
            <span>♛</span>
            <strong>هنوز تریلیونری در داده‌های ثبت‌شده Econova وجود ندارد</strong>
            <p>این بخش خودکار پر می‌شود؛ به‌محض اینکه ثروت یکی از افراد در پایگاه داده به ۱٬۰۰۰ میلیارد دلار برسد، کارت او اینجا نمایش داده می‌شود.</p>
          </div>
        )}
      </section>

      {errorMessage && (
        <div className="eco-error-message" role="alert">
          <strong>دریافت اطلاعات ناموفق بود</strong>
          <p>{errorMessage}</p>
          <button onClick={() => void loadData()}>تلاش دوباره</button>
        </div>
      )}

      {/* پارت ۳ از این خط ادامه پیدا می‌کند. */}
            <section className="eco-section eco-legacy-top-five" id="top-five-legacy">
        <div className="eco-section-heading">
          <div>
            <span className="eco-section-kicker">THE ELITE</span>
            <h2>پنج ثروتمند برتر جهان</h2>
            <p>نگاهی نزدیک به افراد صدرنشین فهرست ثروت</p>
          </div>
          <span className="eco-section-number">01 / TOP 05</span>
        </div>

        {topFive.length > 0 ? (
          <div className="eco-top-five-layout">
            <div className="eco-top-five-list">
              {topFive.map((person) => (
                <button
                  key={person.id}
                  className={`eco-person-row ${
                    activeRank === person.rank ? "is-active" : ""
                  }`}
                  onClick={() => setActiveRank(person.rank)}
                >
                  <span className="eco-person-rank">
                    {String(person.rank).padStart(2, "0")}
                  </span>

                  <img
                    className="eco-person-avatar"
                    src={photoFor(person)}
                    alt={person.name}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        "https://ui-avatars.com/api/?name=Econova&background=14271d&color=b9f27c&size=160";
                    }}
                  />

                  <span className="eco-person-info">
                    <strong>{person.name}</strong>
                    <small>
                      {person.company || person.country || "اطلاعات تکمیلی ثبت نشده"}
                    </small>
                  </span>

                  <span className="eco-person-worth">
                    <strong>
                      {formatBillions(person.net_worth_billions)}
                    </strong>

                    <small
                      className={
                        changeIsPositive(person)
                          ? "eco-positive"
                          : "eco-negative"
                      }
                    >
                      {formatChange(person.daily_change_pct)}
                    </small>

                    <small
                      className={
                        Number(person.net_worth_billions) -
                          Number(
                            person.yesterday_net_worth_billions ??
                              person.net_worth_billions
                          ) >= 0
                          ? "eco-positive"
                          : "eco-negative"
                      }
                    >
                      {(() => {
                        const difference =
                          Number(person.net_worth_billions) -
                          Number(
                            person.yesterday_net_worth_billions ??
                              person.net_worth_billions
                          );

                        return `${difference >= 0 ? "+" : "−"}$${Math.abs(
                          difference
                        ).toFixed(2)} میلیارد`;
                      })()}
                    </small>
                    <MiniWealthChart person={person} />
                  </span>

                  <span className="eco-person-arrow">←</span>
                </button>
              ))}
            </div>

            {activePerson ? (
              <article className="eco-featured-person">
                <div className="eco-featured-topline">
                  <span className="eco-featured-badge">
                    RANK #{activePerson.rank}
                  </span>
                  <span className="eco-featured-star">✦</span>
                </div>

                <img
                  className="eco-featured-image"
                  src={photoFor(activePerson)}
                  alt={activePerson.name}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src =
                      "https://ui-avatars.com/api/?name=Econova&background=14271d&color=b9f27c&size=160";
                  }}
                />

                <span className="eco-featured-label">
                  ثروت تخمینی ثبت‌شده
                </span>

                <h3>{activePerson.name}</h3>

                <p className="eco-featured-company">
                  {activePerson.company || "شرکت ثبت نشده"}
                  {activePerson.country
                    ? ` · ${activePerson.country}`
                    : ""}
                </p>

                <strong className="eco-featured-worth">
                  {formatBillions(activePerson.net_worth_billions)}
                </strong>

                <div className="eco-featured-divider" />

                <div className="eco-featured-details">
                  <span>تغییر روزانه</span>
                  <strong
                    className={
                      changeIsPositive(activePerson)
                        ? "eco-positive"
                        : "eco-negative"
                    }
                  >
                    {formatChange(activePerson.daily_change_pct)}
                  </strong>
                </div>

                {activePerson.bio && (
                  <p className="eco-featured-bio">{activePerson.bio}</p>
                )}
                            
<div className="eco-history-panel">
  <div className="eco-chart-heading">
    <div>
      <span className="eco-chart-eyebrow">WEALTH PERFORMANCE</span>
      <h3>تاریخچه ثروت</h3>
      <p>روند تغییرات ثبت‌شده ثروت {activePerson.name}</p>
    </div>

    <div className="eco-chart-unit">USD · میلیارد</div>
  </div>

  {historyLoading ? (
    <p>در حال دریافت تاریخچه...</p>
  ) : wealthHistory.length === 0 ? (
    <p>هنوز اطلاعاتی برای تاریخچه ثبت نشده است.</p>
  ) : (
    <>
      {wealthHistory.length < 2 && (
        <p className="eco-chart-note">
          فعلاً فقط یک نقطهٔ ثبت‌شده داریم. با ثبت اطلاعات در زمان‌های بعد،
          نمودار روند تغییرات ساخته می‌شود.
        </p>
      )}

      <div className="eco-chart-scroll">
        <svg
          className="eco-wealth-chart"
          viewBox="0 0 600 240"
          role="img"
          aria-label={`نمودار تاریخچه ثروت ${activePerson.name}`}
        >
          <defs>
            <linearGradient id="ecoWealthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#65df86" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#65df86" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {[35, 80, 125, 170, 215].map((y) => (
            <line
              key={y}
              x1="35"
              y1={y}
              x2="580"
              y2={y}
              stroke="#294333"
              strokeDasharray="4 6"
            />
          ))}

          {(() => {
            const points = [...wealthHistory].sort(
              (a, b) =>
                new Date(a.recorded_at).getTime() -
                new Date(b.recorded_at).getTime()
            );

            const values = points.map((p) => Number(p.net_worth_billions));
            const min = Math.min(...values);
            const max = Math.max(...values);
            const range = max - min || Math.max(Math.abs(max) * 0.01, 1);

            const coords = points.map((p, i) => ({
              x: points.length === 1 ? 307 : 40 + (i / (points.length - 1)) * 535,
              y: 195 - ((Number(p.net_worth_billions) - min) / range) * 145,
              value: Number(p.net_worth_billions),
              date: p.recorded_at,
              id: p.id,
            }));

            const line = coords
              .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
              .join(" ");

            const area =
              coords.length > 1
                ? `${line} L ${coords[coords.length - 1].x} 215 L ${coords[0].x} 215 Z`
                : "";

            return (
              <>
                {area && <path d={area} fill="url(#ecoWealthFill)" />}
                {coords.length > 1 && (
                  <path
                    d={line}
                    fill="none"
                    stroke="#65df86"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {coords.map((p) => (
                  <circle
                    key={p.id}
                    cx={p.x}
                    cy={p.y}
                    r="5"
                    fill="#0b1510"
                    stroke="#65df86"
                    strokeWidth="3"
                  >
                    <title>
                      {new Date(p.date).toLocaleString("fa-IR")} — $
                      {p.value.toLocaleString("en-US")} میلیارد
                    </title>
                  </circle>
                ))}
              
{coords.length > 0 && (
  <>
    {coords.map((p, i) => {
      const isFirst = i === 0;
      const isLast = i === coords.length - 1;

      return (
        <text
          key={`label-${p.id}`}
          x={Math.max(85, Math.min(530, p.x))}
          y={Math.max(24, p.y - 17)}
          fill="#a9f4bb"
          fontSize="12"
          textAnchor={
            coords.length === 1
              ? "middle"
              : isFirst
                ? "start"
                : isLast
                  ? "end"
                  : "middle"
          }
        >
          ${p.value.toLocaleString("en-US", {
            maximumFractionDigits: 2,
          })}B
        </text>
      );
    })}
  </>
)}
                              </>
            );
          })()}
        </svg>
      </div>

      <div className="eco-chart-footer">
        <span>تعداد ثبت‌ها: {wealthHistory.length}</span>
        <span>آخرین ثبت: {new Date(
          Math.max(...wealthHistory.map((p) => new Date(p.recorded_at).getTime()))
        ).toLocaleDateString("fa-IR")}</span>
      </div>

      <details className="eco-history-details">
        <summary>مشاهده سوابق ثبت‌شده</summary>
        <div className="eco-history-list">
          {[...wealthHistory]
            .sort(
              (a, b) =>
                new Date(b.recorded_at).getTime() -
                new Date(a.recorded_at).getTime()
            )
            .map((point) => (
              <div className="eco-history-row" key={point.id}>
                <span>
                  {new Date(point.recorded_at).toLocaleString("fa-IR")}
                </span>
                <strong>
                  ${Number(point.net_worth_billions).toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })} میلیارد
                </strong>
              </div>
            ))}
        </div>
      </details>
    </>
  )}
</div>

                {activePerson.source_url && (
                  <a
                    className="eco-source-link"
                    href={activePerson.source_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    مشاهده منبع اطلاعات ↗
                  </a>
                )}
              </article>
            ) : null}
          </div>
        ) : (
          <div className="eco-empty-state">
            هنوز اطلاعاتی برای نمایش ثبت نشده است.
          </div>
        )}
      </section>

      {/* پارت ۴ از این خط ادامه پیدا می‌کند. */}
            <section className="eco-section" id="ranking">
        <div className="eco-section-heading">
          <div>
            <span className="eco-section-kicker">GLOBAL RANKING</span>
            <h2>رتبه‌بندی ثروتمندان</h2>
            <p>جست‌وجو و مقایسه اطلاعات افراد ثبت‌شده</p>
          </div>
          <span className="eco-section-number">
            {filteredPeople.length} نفر
          </span>
        </div>

        <div className="eco-ranking-toolbar">
          <label className="eco-search-box">
            <span>⌕</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="نام، شرکت، کشور یا رتبه..."
              aria-label="جست‌وجوی ثروتمندان"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="پاک کردن جست‌وجو"
              >
                ×
              </button>
            )}
          </label>

          <button
            className="eco-show-all-button"
            onClick={() => setShowAll((current) => !current)}
          >
            {showAll ? "نمایش ۱۰ نفر اول" : "نمایش همه افراد"}
          </button>
        </div>

        <div className="eco-ranking-table-wrap">
          <table className="eco-ranking-table">
            <thead>
              <tr>
                <th>رتبه</th>
                <th>شخص</th>
                <th>شرکت</th>
                <th>کشور</th>
                <th>ثروت تخمینی</th>
                <th>تغییر روزانه</th>
              </tr>
            </thead>

            <tbody>
              {visiblePeople.map((person) => (
                <tr key={person.id}>
                  <td>
                    <span className="eco-table-rank">
                      {String(person.rank).padStart(2, "0")}
                    </span>
                  </td>

                  <td>
                    <button
  className="eco-table-person"
  onClick={() => {
    window.location.href = `/billionaires/${person.id}`;
  }}
>
                      <img
                        src={photoFor(person)}
                        alt=""
                        loading="lazy"
                      />
                      <strong>{person.name}</strong>
                    </button>
                  </td>

                  <td>{person.company || "—"}</td>
                  <td>{person.country || "—"}</td>

                  <td className="eco-table-worth">
                    {formatBillions(person.net_worth_billions)}
                  </td>

                  <td
                    className={
                      changeIsPositive(person)
                        ? "eco-positive"
                        : "eco-negative"
                    }
                  >
                    <span className="eco-change-percent">{formatChange(person.daily_change_pct)}</span>
                    <small className="eco-change-amount">
                      {changeAmount(person) === null
                        ? "مبنای دیروز ثبت نشده"
                        : `${changeAmount(person)! >= 0 ? "+" : "−"}$${Math.abs(changeAmount(person)!).toFixed(2)} میلیارد`}
                    </small>
                  </td>
                </tr>
              ))}

              {visiblePeople.length === 0 && (
                <tr>
                  <td colSpan={6} className="eco-table-empty">
                    فردی با این مشخصات پیدا نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="eco-section" id="news">
        <div className="eco-section-heading">
          <div>
            <span className="eco-section-kicker">LATEST UPDATES</span>
            <h2>اخبار ثروتمندان برتر</h2>
            <p>خبرهای ثبت‌شده برای پنج رتبه نخست</p>
          </div>
          <span className="eco-section-number">NEWS / 05</span>
        </div>

        <div className="eco-news-grid">
          {topFive.map((person) => {
            const item = newsForRank(person.rank);

            return (
              <article
                className="eco-news-card"
                key={`news-${person.id}`}
              >
                <div className="eco-news-card-top">
                  <span className="eco-news-rank">
                    رتبه {person.rank}
                  </span>
                  <span className="eco-news-symbol">↗</span>
                </div>

                <div className="eco-news-person">
                  <img
                    src={photoFor(person)}
                    alt=""
                    loading="lazy"
                  />
                  <div>
                    <strong>{person.name}</strong>
                    <small>
                      {person.company || person.country || "ثروتمند برتر"}
                    </small>
                  </div>
                </div>

                {item ? (
                  <>
                    <h3>{item.title}</h3>
                    <p className="eco-news-content">
                      {item.content || "متن خبر ثبت نشده است."}
                    </p>

                                    {item.updated_at && (
                  <span className="eco-news-date">
                    {new Date(item.updated_at).toLocaleDateString("fa-IR")}
                  </span>
                )}
    
              </>
            ) : (
              <div className="eco-news-empty">
                <span>◇</span>
                <h3>هنوز خبری ثبت نشده است</h3>
                <p>
                  خبر این فرد پس از ثبت در پنل مدیریت اینجا نمایش داده می‌شود.
                </p>
              </div>
            )}

            {isAdmin && (
              <button
                className="eco-edit-news-button"
                onClick={() => openNewsEditor(person.rank)}
              >
                ویرایش خبر این فرد
              </button>
            )}
          </article>
        );
      })}

      {topFive.length === 0 && (
        <div className="eco-empty-state">
          پس از دریافت اطلاعات ثروتمندان، اخبار این بخش نمایش داده می‌شود.
        </div>
      )}
    </div>
  </section>

  {/* پارت ۵ از این خط ادامه پیدا می‌کند. */}
            {loginOpen && (
        <div
          className="eco-modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setLoginOpen(false);
            }
          }}
        >
          <section
            className="eco-login-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="eco-login-title"
          >
            <button
              className="eco-modal-close"
              onClick={() => setLoginOpen(false)}
              aria-label="بستن پنجره"
            >
              ×
            </button>

            <span className="eco-modal-icon">E</span>
            <span className="eco-section-kicker">ADMIN ACCESS</span>
            <h2 id="eco-login-title">ورود مدیر</h2>
            <p>برای مدیریت اخبار، با حساب مجاز مدیر وارد شو.</p>

            <form
              className="eco-admin-form"
              onSubmit={(event) => {
                event.preventDefault();
                void loginAdmin();
              }}
            >
              <label htmlFor="eco-admin-email">ایمیل</label>
              <input
                id="eco-admin-email"
                type="email"
                autoComplete="username"
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
                placeholder="admin@example.com"
                required
              />

              <label htmlFor="eco-admin-password">رمز عبور</label>
              <input
                id="eco-admin-password"
                type="password"
                autoComplete="current-password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                placeholder="رمز عبور حساب مدیر"
                required
              />

              <button
                className="eco-button eco-button-primary eco-submit-button"
                type="submit"
              >
                ورود به پنل مدیریت
              </button>
            </form>
          </section>
        </div>
      )}

      {isAdmin && (
        <section className="eco-admin-panel" id="admin-panel">
          <div className="eco-section-heading">
            <div>
              <span className="eco-section-kicker">CONTROL CENTER</span>
              <h2>پنل مدیریت اخبار</h2>
              <p>خبر مربوط به یکی از پنج رتبه نخست را ثبت یا ویرایش کن.</p>
            </div>
            <span className="eco-admin-status">مدیر وارد شده</span>
          </div>

<form
  className="eco-admin-form"
  onSubmit={(event) => {
    event.preventDefault();
    void savePerson();
  }}
>
  <h3>ویرایش اطلاعات ثروتمندان</h3>

  <label htmlFor="eco-person-select">انتخاب فرد</label>
  <select
    id="eco-person-select"
    value={editingPersonId}
    onChange={(event) => {
      const selected = people.find(
        (person) => String(person.id) === event.target.value
      );
      if (selected) openPersonEditor(selected);
    }}
    required
  >
    <option value="">یک فرد را انتخاب کن</option>
    {people.map((person) => (
      <option key={person.id} value={String(person.id)}>
        رتبه {person.rank} — {person.name}
      </option>
    ))}
  </select>

  <label htmlFor="eco-person-name">نام</label>
  <input
    id="eco-person-name"
    value={personName}
    onChange={(event) => setPersonName(event.target.value)}
    required
  />

  <label htmlFor="eco-person-rank">رتبه</label>
  <input
    id="eco-person-rank"
    type="number"
    min="1"
    value={personRank}
    onChange={(event) => setPersonRank(event.target.value)}
    required
  />

  <label htmlFor="eco-person-company">شرکت</label>
  <input
    id="eco-person-company"
    value={personCompany}
    onChange={(event) => setPersonCompany(event.target.value)}
  />

  <label htmlFor="eco-person-country">کشور</label>
  <input
    id="eco-person-country"
    value={personCountry}
    onChange={(event) => setPersonCountry(event.target.value)}
  />

  <label htmlFor="eco-person-worth">ثروت (میلیارد دلار)</label>
  <input
    id="eco-person-worth"
    type="number"
    min="0"
    step="0.1"
    value={personWorth}
    onChange={(event) => setPersonWorth(event.target.value)}
    required
  />

  <label htmlFor="eco-person-change">تغییر روزانه (درصد)</label>
  <input
    id="eco-person-change"
    type="number"
    step="0.01"
    value={personDailyChange}
    onChange={(event) => setPersonDailyChange(event.target.value)}
    required
  />

  <label htmlFor="eco-person-bio">توضیحات</label>
  <textarea
    id="eco-person-bio"
    value={personBio}
    onChange={(event) => setPersonBio(event.target.value)}
    rows={4}
  />

  <label htmlFor="eco-person-photo-file">
  انتخاب عکس از گالری گوشی
</label>
<input
  id="eco-person-photo-file"
  type="file"
  accept="image/jpeg,image/png,image/webp"
  disabled={uploadingPhoto || !editingPersonId}
  onChange={(event) => {
    void uploadPersonPhoto(event.currentTarget.files?.[0]);
    event.currentTarget.value = "";
  }}
/>

<small>JPG، PNG یا WebP؛ حداکثر ۵ مگابایت</small>

{uploadingPhoto && <p>در حال آپلود عکس...</p>}

{personImageUrl && (
  <img
    src={personImageUrl}
    alt="پیش‌نمایش عکس ثروتمند"
    style={{
      width: 96,
      height: 96,
      objectFit: "cover",
      borderRadius: 12,
    }}
  />
)}

<label htmlFor="eco-person-image">یا لینک عکس را وارد کن</label>
<input
  id="eco-person-image"
  type="url"
  value={personImageUrl}
  onChange={(event) => setPersonImageUrl(event.target.value)}
/>

  <label htmlFor="eco-person-source">لینک منبع اطلاعات</label>
  <input
    id="eco-person-source"
    type="url"
    value={personSource}
    onChange={(event) => setPersonSource(event.target.value)}
  />

  <button
    className="eco-button eco-button-primary eco-submit-button"
    type="submit"
    disabled={saving || !editingPersonId}
  >
    {saving ? "در حال ذخیره..." : "ذخیره اطلاعات ثروتمند"}
  </button>
</form>
          
          <form
            className="eco-admin-form eco-news-editor"
            onSubmit={(event) => {
              event.preventDefault();
              void saveNews();
            }}
          >
            <label htmlFor="eco-news-rank">انتخاب رتبه</label>
            <select
              id="eco-news-rank"
              value={editingNewsRank}
              onChange={(event) => openNewsEditor(Number(event.target.value))}
            >
              {topFive.map((person) => (
                <option key={person.id} value={person.rank}>
                  رتبه {person.rank} — {person.name}
                </option>
              ))}
            </select>

            <label htmlFor="eco-news-title">عنوان خبر</label>
            <input
              id="eco-news-title"
              value={newsTitle}
              onChange={(event) => setNewsTitle(event.target.value)}
              placeholder="عنوان خبر را وارد کن"
              required
            />

            <label htmlFor="eco-news-content">متن خبر</label>
            <textarea
              id="eco-news-content"
              value={newsContent}
              onChange={(event) => setNewsContent(event.target.value)}
              placeholder="متن خبر را بنویس..."
              rows={5}
              required
            />

            <label htmlFor="eco-news-source">لینک منبع خبر (اختیاری)</label>
            <input
              id="eco-news-source"
              type="url"
              value={newsSource}
              onChange={(event) => setNewsSource(event.target.value)}
              placeholder="https://example.com/news"
            />

            <button
              className="eco-button eco-button-primary eco-submit-button"
              type="submit"
              disabled={saving || topFive.length === 0}
            >
              {saving ? "در حال ذخیره..." : "ذخیره خبر"}
            </button>
          </form>
        </section>
      )}

      {adminMessage && (
        <div className="eco-admin-message" role="status">
          {adminMessage}
        </div>
      )}

      <footer className="eco-footer">
        <a href="#home" className="eco-logo">
          <span className="eco-logo-mark">E</span>
          <span>
            <strong>ECONOVA</strong>
            <small>اقتصاد، فراتر از خبر</small>
          </span>
        </a>

                <p>
          اطلاعات این صفحه بر اساس داده‌های ثبت‌شده ارائه می‌شود؛
          ارزش ثروت‌ها تخمینی است و ممکن است با منابع دیگر تفاوت داشته باشد.
        </p>

        <span className="eco-footer-copy">
          © {new Date().getFullYear()} ECONOVA
        </span>
      </footer>

      {/* پارت ۶ از این خط ادامه پیدا می‌کند. */}
            <style jsx global>{`
        :root {
          color-scheme: dark;
        }

.eco-featured-image {
  display: block;
  width: 112px;
  height: 112px;
  flex-shrink: 0;
  object-fit: cover;
  object-position: center;
  border: 2px solid #56e88a;
  border-radius: 18px;
  background: #10251b;
  box-shadow:
    0 0 0 5px #56e88a12,
    0 0 28px #48ed8630;
}

@media (max-width: 700px) {
  .eco-featured-image {
    width: 82px;
    height: 82px;
    border-radius: 14px;
  }
}
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
          scroll-padding-top: 90px;
        }

        body {
          margin: 0;
          background: #07100c;
          color: #f2f6f0;
          font-family: Tahoma, Arial, sans-serif;
        }

        button,
        input,
        textarea,
        select {
          font: inherit;
        }

        button,
        a {
          -webkit-tap-highlight-color: transparent;
        }

        button {
          cursor: pointer;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .eco-page {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          padding: 0 6%;
          background:
            radial-gradient(
              ellipse at 85% 5%,
              rgba(57, 111, 65, 0.16),
              transparent 34%
            ),
            #07100c;
          color: #f2f6f0;
          isolation: isolate;
        }

        .eco-glow {
          position: absolute;
          z-index: -1;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          filter: blur(110px);
          opacity: 0.12;
          pointer-events: none;
        }

        .eco-glow-one {
          top: 500px;
          right: -200px;
          background: #b9f27c;
        }

        .eco-glow-two {
          top: 1200px;
          left: -220px;
          background: #38b87a;
        }

        .eco-header {
          position: relative;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          min-height: 88px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .eco-logo {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          flex-shrink: 0;
        }

        .eco-logo-mark {
          display: grid;
          width: 43px;
          height: 43px;
          place-items: center;
          border-radius: 14px;
          background: #b9f27c;
          color: #102015;
          font-size: 25px;
          font-weight: 900;
        }

        .eco-logo strong,
        .eco-logo small {
          display: block;
        }

        .eco-logo strong {
          font-size: 18px;
          letter-spacing: 2px;
        }

        .eco-logo small {
          margin-top: 5px;
          color: #849489;
          font-size: 10px;
        }

        .eco-nav {
          display: flex;
          align-items: center;
          gap: 30px;
          color: #b6c2b8;
          font-size: 13px;
        }

        .eco-nav a:hover {
          color: #b9f27c;
        }

        .eco-admin-button,
        .eco-show-all-button {
          border: 1px solid rgba(185, 242, 124, 0.28);
          border-radius: 11px;
          background: rgba(185, 242, 124, 0.06);
          color: #c8f69b;
          padding: 11px 17px;
          font-size: 12px;
        }

        .eco-hero {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          align-items: center;
          gap: 35px;
          min-height: 490px;
          padding: 65px 0 55px;
        }

        .eco-hero-content {
          position: relative;
          z-index: 1;
        }

        .eco-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(185, 242, 124, 0.17);
          border-radius: 30px;
          padding: 9px 14px;
          background: rgba(185, 242, 124, 0.05);
          color: #c4f59a;
          font-size: 12px;
        }

        .eco-live-dot,
        .eco-meta-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #b9f27c;
          box-shadow: 0 0 12px rgba(185, 242, 124, 0.7);
        }

        .eco-hero h1 {
          margin: 25px 0 20px;
          font-size: clamp(38px, 5.2vw, 67px);
          line-height: 1.45;
          letter-spacing: -2px;
        }

        .eco-hero h1 span {
          color: #b9f27c;
        }

        .eco-hero-content > p {
          max-width: 490px;
          color: #9ca99f;
          font-size: 15px;
          line-height: 2.2;
        }

        .eco-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 27px;
        }

        .eco-button {
          display: inline-flex;
          min-height: 47px;
          align-items: center;
          justify-content: center;
          gap: 13px;
          border: 1px solid transparent;
          border-radius: 12px;
          padding: 12px 20px;
          font-size: 13px;
          transition: transform 0.2s ease;
        }

        .eco-button:hover {
          transform: translateY(-2px);
        }

        .eco-button-primary {
          background: #b9f27c;
          color: #112014;
          font-weight: 800;
        }

        .eco-button-secondary {
          border-color: rgba(255, 255, 255, 0.13);
          background: rgba(255, 255, 255, 0.025);
          color: #e1e9e1;
        }

        .eco-hero-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 15px 22px;
          margin-top: 30px;
          color: #77867b;
          font-size: 10px;
        }

        .eco-hero-meta span:first-child {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .eco-meta-dot {
          width: 6px;
          height: 6px;
        }

        .eco-hero-art {
          position: relative;
          display: grid;
          min-height: 350px;
          place-items: center;
        }

        .eco-orbit {
          position: absolute;
          width: min(330px, 75%);
          aspect-ratio: 1;
          border: 1px solid rgba(185, 242, 124, 0.11);
          border-radius: 50%;
          animation: eco-orbit 24s linear infinite;
        }

        .eco-orbit-one {
          transform: rotateX(65deg) rotate(-25deg);
        }

        .eco-orbit-two {
          width: min(270px, 62%);
          transform: rotateX(65deg) rotate(35deg);
          animation-direction: reverse;
        }

        .eco-hero-coin {
          display: grid;
          width: clamp(145px, 19vw, 215px);
          aspect-ratio: 1;
          place-items: center;
          border: 1px solid rgba(210, 255, 174, 0.55);
          border-radius: 50%;
          background: radial-gradient(
            circle at 35% 28%,
            #e1ffc0 0,
            #b9f27c 12%,
            #548e40 42%,
            #173522 73%,
            #09150d 100%
          );
          box-shadow:
            0 0 60px rgba(139, 217, 100, 0.14),
            inset 0 0 25px rgba(255, 255, 255, 0.15);
          animation: eco-float 5s ease-in-out infinite;
        }

        .eco-hero-coin span {
          color: #efffdb;
          font-size: clamp(75px, 10vw, 120px);
          font-weight: 300;
          text-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
        }

        .eco-floating-card {
          position: absolute;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 15px;
          background: rgba(14, 26, 18, 0.91);
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.23);
          backdrop-filter: blur(12px);
        }

        .eco-floating-card-top {
          top: 30px;
          right: 0;
        }

        .eco-floating-card-bottom {
          bottom: 30px;
          left: 0;
        }

        .eco-floating-icon {
          display: grid;
          width: 38px;
          height: 38px;
          place-items: center;
          border-radius: 12px;
          background: rgba(185, 242, 124, 0.1);
          color: #b9f27c;
          font-size: 21px;
        }

        .eco-floating-card small,
        .eco-floating-card strong {
          display: block;
        }

        .eco-floating-card small {
          margin-bottom: 6px;
          color: #91a094;
          font-size: 10px;
        }

        .eco-floating-card strong {
          color: #e9f6e5;
          font-size: 17px;
          direction: ltr;
          text-align: right;
        }

        @keyframes eco-orbit {
          to {
            rotate: 360deg;
          }
        }

        @keyframes eco-float {
          0%,
          100% {
            translate: 0 0;
          }
          50% {
            translate: 0 -10px;
          }
        }

        .eco-stats-grid {
          display: grid;
          grid-template-columns: 1.25fr 1fr 1fr;
          gap: 15px;
          margin-bottom: 28px;
        }

        .eco-stat-card {
          position: relative;
          min-width: 0;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 25px;
          background: linear-gradient(
            145deg,
            rgba(23, 38, 27, 0.86),
            rgba(12, 22, 15, 0.75)
          );
        }

        .eco-stat-main {
          border-color: rgba(185, 242, 124, 0.19);
          background: linear-gradient(
            125deg,
            rgba(53, 83, 40, 0.42),
            rgba(15, 28, 18, 0.9)
          );
        }

        .eco-stat-label,
        .eco-stat-value,
        .eco-stat-description {
          position: relative;
          z-index: 1;
          display: block;
        }

        .eco-stat-label {
          color: #9baa9d;
          font-size: 12px;
        }

        .eco-stat-value {
          margin: 17px 0 9px;
          color: #f1f7ed;
          font-size: clamp(23px, 3vw, 34px);
          direction: ltr;
          text-align: right;
          overflow-wrap: anywhere;
        }

        .eco-stat-main .eco-stat-value {
          color: #c5f99a;
        }

        .eco-stat-name {
          font-size: clamp(18px, 2vw, 26px);
          direction: rtl;
        }

        .eco-stat-description {
          color: #718174;
          font-size: 10px;
          line-height: 1.9;
        }

        .eco-stat-decoration {
          position: absolute;
          left: 12px;
          bottom: -35px;
          color: rgba(185, 242, 124, 0.055);
          font-size: 130px;
          font-weight: 900;
        }

        .eco-status-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin: 28px 0 10px;
          color: #819083;
          font-size: 11px;
        }

        .eco-status-line button {
          border: 0;
          background: transparent;
          color: #b9f27c;
          font-size: 11px;
        }

        .eco-error-message,
        .eco-admin-message {
          margin: 15px 0;
          border: 1px solid rgba(255, 139, 139, 0.25);
          border-radius: 13px;
          padding: 17px;
          background: rgba(105, 28, 28, 0.12);
          color: #ffb3b3;
          font-size: 12px;
          line-height: 1.9;
          overflow-wrap: anywhere;
        }

        .eco-error-message p {
          margin: 8px 0;
        }

        .eco-error-message button {
          border: 0;
          background: transparent;
          color: #ffd0d0;
          text-decoration: underline;
        }

        .eco-section {
          padding: 38px 0 18px;
          scroll-margin-top: 24px;
        }

        #top-five {
          padding-top: 18px;
        }

        #top-five .eco-section-heading {
          margin-bottom: 30px;
        }

        #top-five .eco-section-heading h2 {
          font-size: clamp(28px, 4vw, 36px);
        }

        #top-five .eco-top-five-layout {
          gap: 26px;
        }

        .eco-section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 27px;
        }

        .eco-section-kicker {
          color: #b9f27c;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .eco-section-heading h2 {
          margin: 11px 0 9px;
          font-size: clamp(23px, 3vw, 32px);
          line-height: 1.5;
        }

        .eco-section-heading p {
          margin: 0;
          color: #839187;
          font-size: 12px;
          line-height: 1.9;
        }

        .eco-section-number {
          flex-shrink: 0;
          padding-bottom: 5px;
          color: #68786c;
          font-size: 11px;
          direction: ltr;
        }
           
.eco-top-five-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr);
  gap: 24px;
  align-items: stretch;
  width: 100%;
}

.eco-top-five-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.eco-person-row {
  display: grid;
  grid-template-columns: 34px 54px minmax(0, 1fr) auto 18px;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 15px 14px;
  text-align: right;
  background: linear-gradient(135deg, #141b17, #0c110e);
  border: 1px solid #28382d;
  border-radius: 14px;
  transition: border-color 0.2s ease, background 0.2s ease;
  cursor: pointer;
}

.eco-person-row:hover,
.eco-person-row.is-active {
  background: linear-gradient(135deg, #1b2b20, #101712);
  border-color: #7be995;
}

.eco-person-rank {
  color: #b9f27c;
  font-size: 17px;
  font-weight: 800;
}

.eco-person-avatar {
  width: 54px;
  height: 54px;
  object-fit: cover;
  border-radius: 12px;
  background: #1a2a20;
}

.eco-person-info,
.eco-person-worth {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.eco-person-info strong {
  overflow: hidden;
  color: #f2f5f0;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eco-person-info small {
  overflow: hidden;
  color: #91a196;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eco-person-worth {
  text-align: left;
}

.eco-person-worth strong {
  color: #f2f5f0;
  font-size: 14px;
  white-space: nowrap;
}

.eco-person-worth small {
  font-size: 11px;
  white-space: nowrap;
}

.eco-person-arrow {
  color: #b9f27c;
  font-size: 18px;
}

@media (max-width: 760px) {
  .eco-top-five-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .eco-person-row {
    grid-template-columns: 26px 46px minmax(0, 1fr) auto 12px;
    gap: 9px;
    padding: 12px 9px;
  }

  .eco-person-avatar {
    width: 46px;
    height: 46px;
  }

  .eco-person-info strong,
  .eco-person-worth strong {
    font-size: 12px;
  }

  .eco-person-info small,
  .eco-person-worth small {
    font-size: 10px;
  }
}

.eco-top-five-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.eco-person-row {
  display: grid;
  grid-template-columns: 42px 52px minmax(0, 1fr);
  grid-template-areas:
    "rank avatar info"
    "rank avatar worth";
  align-items: center;
  column-gap: 12px;
  row-gap: 8px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 14px;
  color: #e8f0ea;
  text-align: right;
  background: linear-gradient(135deg, #101b15, #14251a);
  border: 1px solid #294333;
  border-radius: 15px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
}

.eco-person-row:hover {
  border-color: #4c9b60;
  background: linear-gradient(135deg, #15251a, #0d1912);
  transform: translateY(-2px);
  box-shadow: 0 8px 22px #0003;
}

.eco-person-row.active,
.eco-person-row.is-active {
  border-color: #70e88c;
  background: linear-gradient(135deg, #193522, #101d15);
  box-shadow: 0 0 0 1px #70e88c25, 0 8px 24px #0003;
}

@media (max-width: 760px) {
  .eco-top-five-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
}

        .eco-person-row:hover {
          background: #13231a;
          border-color: #3b8050;
          transform: translateY(-2px);
        }

        .eco-person-row.active,
.eco-person-row.is-active {
          background: linear-gradient(110deg, #173b25, #102019);
          border-color: #46c66b;
          box-shadow: 0 0 20px #1b9b4720;
        }
    
.eco-person-rank {
  grid-area: rank;
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 30px;
  height: 30px;
  color: #a7e8b4;
  background: #1c3525;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 800;
  direction: ltr;
}

.eco-person-avatar {
  grid-area: avatar;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  object-fit: cover;
  background: #1b2920;
  border: 1px solid #344c3a;
  border-radius: 12px;
}

.eco-person-info {
  grid-area: info;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}

.eco-person-info strong {
  color: #f1f7f2;
  font-size: 14px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.eco-person-info small {
  color: #879b8c;
  font-size: 11px;
  overflow-wrap: anywhere;
}

.eco-person-worth {
  grid-area: worth;
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  direction: ltr;
  text-align: left;
}

.eco-person-worth strong {
  color: #65df86;
  font-size: 13px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.eco-person-worth small {
  max-width: 100%;
  font-size: 11px;
  overflow-wrap: anywhere;
  white-space: normal;
}

        .eco-person-name {
          overflow: hidden;
          color: #f1f7f2;
          font-size: 14px;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .eco-person-company {
          overflow: hidden;
          color: #879b8c;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .eco-person-wealth {
          flex-shrink: 0;
          color: #65df86;
          font-size: 13px;
          font-weight: 800;
          direction: ltr;
          text-align: left;
        }
        
.eco-featured-person {
  position: relative;
  display: flex;
  min-height: 100%;
  flex-direction: column;
  overflow: hidden;
  isolation: isolate;
  padding: 28px;
  background:
    radial-gradient(ellipse at 85% 5%, #38e98b20, transparent 42%),
    radial-gradient(ellipse at 10% 100%, #0a694522, transparent 48%),
    linear-gradient(145deg, #0a2118 0%, #06150f 52%, #030b07 100%);
  border: 1px solid #287a50;
  border-radius: 24px;
  box-shadow:
    inset 0 1px 0 #b9f27c18,
    0 20px 55px #00000050,
    0 0 30px #21d8750a;
}

.eco-featured-person::before {
  position: absolute;
  z-index: -1;
  inset: 0;
  background:
    linear-gradient(115deg, transparent 25%, #55f39b0a 55%, transparent 80%);
  content: "";
  pointer-events: none;
}

.eco-featured-person::after {
  position: absolute;
  top: 0;
  right: 28px;
  left: 28px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #b9f27c, #55f39b, transparent);
  content: "";
}

@media (max-width: 700px) {
  .eco-featured-person {
    padding: 18px;
    border-radius: 18px;
  }

  .eco-featured-person::after {
    right: 18px;
    left: 18px;
  }
}

.eco-featured-person::before {
  position: absolute;
  z-index: -1;
  inset: 0;
  background:
    linear-gradient(115deg, transparent 30%, #37e68b0b 58%, transparent 78%);
  content: "";
  pointer-events: none;
}

.eco-featured-person::after {
  position: absolute;
  top: 0;
  right: 24px;
  left: 24px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #55f39b, transparent);
  content: "";
}

        .eco-featured-person::before {
          position: absolute;
          top: 0;
          right: 24px;
          left: 24px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #65df86, transparent);
          content: "";
        }

        .eco-featured-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }

        .eco-featured-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  margin-bottom: 10px;
  padding: 7px 12px;
  color: #b9f27c;
  background: linear-gradient(135deg, #b9f27c18, #55e88a08);
  border: 1px solid #b9f27c35;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.3px;
  line-height: 1.5;
  box-shadow: inset 0 1px 0 #ffffff08;
}

        .eco-featured-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: 7px 12px;
  color: #b9f27c;
  background: linear-gradient(135deg, #1b432b, #10271a);
  border: 1px solid #4d995c;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1px;
  box-shadow: inset 0 1px 0 #ffffff0c, 0 0 18px #b9f27c0b;
}
    
.eco-featured-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding: 18px;
  background: linear-gradient(120deg, #10251b, #09150f);
  border: 1px solid #244b34;
  border-radius: 18px;
}

.eco-featured-avatar {
  width: 112px;
  height: 112px;
  object-fit: cover;
  border: 2px solid #56e88a;
  border-radius: 18px;
  box-shadow: 0 0 28px #48ed8625;
}

@media (max-width: 700px) {
  .eco-featured-main {
    grid-template-columns: minmax(0, 1fr) 82px;
    gap: 13px;
    padding: 13px;
  }

  .eco-featured-avatar {
    width: 82px;
    height: 82px;
  }
}

        .eco-person-avatar {
  grid-area: avatar;
  display: block;
  width: 52px;
  height: 52px;
  min-width: 52px;
  max-width: 52px;
  min-height: 52px;
  max-height: 52px;
  flex-shrink: 0;
  object-fit: cover;
  object-position: center;
  overflow: hidden;
  background: #1b2920;
  border: 1px solid #344c3a;
  border-radius: 12px;
  box-sizing: border-box;
}

        .eco-featured-rank {
          margin-bottom: 8px;
          color: #7ce493;
          font-size: 12px;
          font-weight: 800;
        }
   
.eco-featured-name {
  margin: 0 0 14px;
  color: #f3fff6;
  font-size: clamp(28px, 3.2vw, 38px);
  font-weight: 900;
  line-height: 1.3;
  letter-spacing: -0.8px;
  overflow-wrap: anywhere;
  text-shadow:
    0 0 18px #5af49b20,
    0 2px 12px #00000040;
}

@media (max-width: 700px) {
  .eco-featured-name {
    margin-bottom: 10px;
    font-size: clamp(23px, 6vw, 30px);
    line-height: 1.35;
    letter-spacing: -0.3px;
  }
}
  
.eco-featured-company {
  display: block;
  margin-top: 6px;
  margin-bottom: 20px;
  color: #a9c7b4;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.25px;
  line-height: 1.9;
  overflow-wrap: anywhere;
}

.eco-featured-company strong {
  color: #b9f27c;
  font-weight: 800;
}

@media (max-width: 700px) {
  .eco-featured-company {
    margin-top: 4px;
    margin-bottom: 16px;
    font-size: 12px;
    line-height: 1.8;
  }
}

        .eco-featured-divider {
  position: relative;
  height: 1px;
  margin: 8px 0 20px;
  background: linear-gradient(
    90deg,
    transparent,
    #28543a 15%,
    #b9f27c 50%,
    #28543a 85%,
    transparent
  );
  opacity: 0.85;
}

.eco-featured-divider::after {
  position: absolute;
  top: -2px;
  left: 50%;
  width: 5px;
  height: 5px;
  background: #b9f27c;
  border-radius: 50%;
  box-shadow: 0 0 10px #b9f27c80;
  content: "";
  transform: translateX(-50%);
}

@media (max-width: 700px) {
  .eco-featured-divider {
    margin: 6px 0 16px;
  }
}

        .eco-featured-wealth-label {
          margin-bottom: 8px;
          color: #8fa495;
          font-size: 12px;
        }

.eco-featured-wealth {
  color: #70e88c;
  font-size: clamp(27px, 3.2vw, 40px);
  font-weight: 900;
  direction: ltr;
  text-align: right;
  letter-spacing: -0.8px;
  line-height: 1.25;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 22px #70e88c20;
  overflow-wrap: anywhere;
}

        .eco-featured-description {
          margin-top: 16px;
          color: #a5b5a9;
          font-size: 13px;
          line-height: 2;
        }

        .eco-featured-footer {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: auto;
          padding-top: 20px;
        }

        .eco-mini-tag {
          padding: 7px 10px;
          color: #c4d7c9;
          background: #1a2b20;
          border: 1px solid #304a36;
          border-radius: 9px;
          font-size: 11px;
        }

        .eco-ranking-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }
        
.eco-search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 420px;
  min-height: 48px;
  padding: 0 14px;
  color: #e8f0ea;
  background: linear-gradient(135deg, #101b15, #0b120e);
  border: 1px solid #294333;
  border-radius: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.eco-search-box:focus-within {
  border-color: #70e88c;
  box-shadow: 0 0 0 3px #70e88c18;
}

.eco-search-box input {
  flex: 1;
  width: 100%;
  min-width: 0;
  padding: 12px 0;
  color: #f1f7f2;
  background: transparent;
  border: 0;
  outline: none;
  font: inherit;
}

.eco-search-box input::placeholder {
  color: #84958a;
}

.eco-search-box button {
  padding: 4px 8px;
  color: #b8c9bd;
  background: transparent;
  border: 0;
  cursor: pointer;
  font-size: 22px;
}


        .eco-search-input {
          width: min(100%, 340px);
          min-height: 44px;
          padding: 10px 14px;
          color: #edf5ef;
          background: #0b130e;
          border: 1px solid #2a4030;
          border-radius: 11px;
          outline: none;
          font: inherit;
          font-size: 13px;
        }

        .eco-search-input:focus {
          border-color: #58b96f;
          box-shadow: 0 0 0 3px #58b96f18;
        }

        .eco-ranking-count {
          color: #8da393;
          font-size: 12px;
        }

.eco-ranking-table-wrap {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  border: 1px solid #23372a;
  border-radius: 14px;
  box-sizing: border-box;
}

@media (max-width: 700px) {
  .eco-ranking-table-wrap {
    overflow-x: hidden;
  }
}
        
.eco-ranking-table {
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  text-align: right;
  white-space: normal;
  box-sizing: border-box;
}

.eco-ranking-table th,
.eco-ranking-table td {
  padding: 8px 5px;
  overflow-wrap: anywhere;
  word-break: normal;
  box-sizing: border-box;
}

        .eco-ranking-table th {
          padding: 15px 16px;
          color: #93aa99;
          background: #111d15;
          border-bottom: 1px solid #2a3c2f;
          font-size: 11px;
          font-weight: 700;
        }

        .eco-ranking-table td {
          padding: 13px 16px;
          color: #dce8df;
          border-bottom: 1px solid #1e2d22;
          font-size: 12px;
        }

        .eco-ranking-table tbody tr {
          background: #0d1510;
          transition: background 0.2s;
        }

        .eco-ranking-table tbody tr:hover {
          background: #16241a;
        }

        .eco-ranking-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .eco-table-person {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 190px;
        }
        
.eco-table-person img {
  display: block;
  width: 48px;
  height: 48px;
  min-width: 48px;
  max-width: 48px;
  min-height: 48px;
  max-height: 48px;
  flex: 0 0 48px;
  object-fit: cover;
  object-position: center;
  border-radius: 10px;
  overflow: hidden;
  box-sizing: border-box;
}

        .eco-table-avatar {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          object-fit: cover;
          background: #1d2c21;
          border-radius: 9px;
        }

        .eco-table-person-name {
          color: #eef6ef;
          font-weight: 800;
        }

        .eco-table-rank {
          color: #83dc98;
          font-weight: 900;
          direction: ltr;
        }

        .eco-table-wealth {
          color: #69df85 !important;
          font-weight: 800;
          direction: ltr;
        }

        .eco-news-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }
        
        .eco-news-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        /* کنترل اندازه تصاویر اخبار */
        .eco-news-card img {
          display: block;
          width: 100%;
          max-width: 100%;
          height: 220px;
          object-fit: cover;
          object-position: center 25%;
          border-radius: 12px;
        }

        /* بزرگ‌تر و برجسته‌تر شدن پنج ثروتمند اول */
        .eco-top-five-layout {
          gap: 24px;
        }

        .eco-top-five-list {
          gap: 14px;
        }

        .eco-person-avatar {
          width: 62px;
          height: 62px;
        }

        .eco-person-row {
          padding: 17px;
        }

        .eco-featured-person {
          padding: 28px;
        }

.eco-person-row .eco-person-avatar {
  display: block !important;
  width: 52px !important;
  height: 52px !important;
  min-width: 52px !important;
  max-width: 52px !important;
  min-height: 52px !important;
  max-height: 52px !important;
  object-fit: cover !important;
  flex: 0 0 52px !important;
  align-self: center;
}

        @media (max-width: 700px) {
          .eco-news-card img {
            height: 200px;
          }

          .eco-person-avatar {
            width: 58px;
            height: 58px;
          }

          .eco-featured-person {
            padding: 18px;
          }
        }

        .eco-news-card {
          display: flex;
          min-width: 0;
          flex-direction: column;
          padding: 18px;
          background: linear-gradient(145deg, #142019, #0c130f);
          border: 1px solid #263a2c;
          border-radius: 16px;
          transition: transform 0.2s, border-color 0.2s;
        }

        .eco-news-card:hover {
          transform: translateY(-3px);
          border-color: #477a51;
        }

        .eco-news-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 15px;
        }

        .eco-news-category {
          padding: 5px 9px;
          color: #88e49d;
          background: #193623;
          border-radius: 7px;
          font-size: 10px;
          font-weight: 800;
        }

        .eco-news-date {
          color: #788d7e;
          font-size: 10px;
        }

        .eco-news-title {
          margin: 0 0 10px;
          color: #edf5ef;
          font-size: 15px;
          font-weight: 800;
          line-height: 1.8;
        }

        .eco-news-content {
          flex: 1;
          color: #a0b0a4;
          font-size: 12px;
          line-height: 2;
          overflow-wrap: anywhere;
        }

        .eco-news-source {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 18px;
          color: #73df8b;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
        }

        .eco-news-source:hover {
          color: #a1f5b1;
          text-decoration: underline;
        }

        .eco-empty-state {
          grid-column: 1 / -1;
          padding: 32px 18px;
          color: #849889;
          background: #0c1510;
          border: 1px dashed #304536;
          border-radius: 14px;
          text-align: center;
          font-size: 13px;
          line-height: 2;
        }

        .eco-loading {
          padding: 32px 16px;
          color: #91a797;
          text-align: center;
          font-size: 13px;
        }

        .eco-error-message {
          margin-top: 12px;
          padding: 12px 14px;
          color: #ffb4a8;
          background: #351b19;
          border: 1px solid #65302a;
          border-radius: 10px;
          font-size: 12px;
          line-height: 1.8;
        }

        .eco-success-message {
          margin-top: 12px;
          padding: 12px 14px;
          color: #9bf0ad;
          background: #142e1d;
          border: 1px solid #2c6740;
          border-radius: 10px;
          font-size: 12px;
          line-height: 1.8;
        }

        .eco-admin-panel {
          padding: 24px;
          background:
            radial-gradient(ellipse at 100% 0%, #24472a2b, transparent 45%),
            #0d1510;
          border: 1px solid #2d4432;
          border-radius: 18px;
        }

        .eco-admin-heading {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }

        .eco-admin-title {
          margin: 0;
          color: #eef6ef;
          font-size: 19px;
          font-weight: 900;
        }

        .eco-admin-subtitle {
          margin-top: 7px;
          color: #91a596;
          font-size: 12px;
          line-height: 1.8;
        }
        
.eco-admin-form label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #c9d8ce;
  font-size: 13px;
  font-weight: 700;
}

.eco-admin-form input,
.eco-admin-form select,
.eco-admin-form textarea {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 12px 13px;
  color: #f1f7f2;
  background: #0a130d;
  border: 1px solid #294333;
  border-radius: 12px;
  outline: none;
  font: inherit;
}

.eco-admin-form input:focus,
.eco-admin-form select:focus,
.eco-admin-form textarea:focus {
  border-color: #70e88c;
  box-shadow: 0 0 0 3px #70e88c18;
}

.eco-admin-form textarea {
  min-height: 110px;
  resize: vertical;
}

@media (max-width: 600px) {
  .eco-admin-form {
    grid-template-columns: minmax(0, 1fr);
  }
}

        .eco-admin-form {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .eco-form-field {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 7px;
        }

        .eco-form-field.full {
          grid-column: 1 / -1;
        }

        .eco-form-label {
          color: #b8c9bc;
          font-size: 12px;
          font-weight: 700;
        }

        .eco-form-input,
        .eco-form-textarea,
        .eco-form-select {
          width: 100%;
          min-width: 0;
          padding: 12px 13px;
          color: #edf5ef;
          background: #080f0b;
          border: 1px solid #2a4030;
          border-radius: 10px;
          outline: none;
          font: inherit;
          font-size: 13px;
        }

        .eco-form-input:focus,
        .eco-form-textarea:focus,
        .eco-form-select:focus {
          border-color: #5bc273;
          box-shadow: 0 0 0 3px #5bc27318;
        }

        .eco-form-textarea {
          min-height: 125px;
          resize: vertical;
          line-height: 1.9;
        }

        .eco-admin-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .eco-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 42px;
          padding: 10px 16px;
          color: #f2fff4;
          background: #246b38;
          border: 1px solid #388a4e;
          border-radius: 10px;
          cursor: pointer;
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          transition: background 0.2s, transform 0.2s;
        }

        .eco-button:hover {
          background: #2c8244;
          transform: translateY(-1px);
        }

        .eco-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }

        .eco-button.secondary {
          color: #c6d5ca;
          background: #17231a;
          border-color: #344a39;
        }

        .eco-button.secondary:hover {
          background: #223328;
        }

        .eco-button.danger {
          color: #ffc0b7;
          background: #321c1a;
          border-color: #67352e;
        }

        .eco-admin-login {
          max-width: 520px;
          margin: 0 auto;
        }

        .eco-admin-lock {
          display: grid;
          width: 54px;
          height: 54px;
          margin-bottom: 16px;
          place-items: center;
          color: #8be6a0;
          background: #183522;
          border: 1px solid #356d43;
          border-radius: 15px;
          font-size: 22px;
        }

        .eco-admin-note {
          margin-top: 14px;
          color: #819687;
          font-size: 11px;
          line-height: 1.9;
        }

        .eco-footer {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 24px 0 12px;
          color: #718476;
          border-top: 1px solid #213126;
          font-size: 11px;
          line-height: 1.8;
        }

        .eco-footer-brand {
          color: #a8c4af;
          font-size: 14px;
          font-weight: 900;
        }

        .eco-footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .eco-footer-links a {
          color: #8da192;
          text-decoration: none;
        }

        .eco-footer-links a:hover {
          color: #75e18d;
        }
        
        @media (max-width: 1000px) {
          .eco-top-five-layout {
            grid-template-columns: 1fr;
          }

          .eco-top-five-list {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .eco-news-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .eco-top-five-list {
            grid-template-columns: 1fr;
          }

          .eco-featured-person {
            padding: 18px;
          }

          .eco-featured-main {
            align-items: flex-start;
            gap: 13px;
          }

          .eco-featured-avatar {
            width: 82px;
            height: 82px;
          }

          .eco-featured-name {
            font-size: 20px;
          }

          .eco-featured-wealth {
            font-size: 27px;
            overflow-wrap: anywhere;
          }

          .eco-ranking-toolbar {
            align-items: stretch;
            flex-direction: column;
          }

          .eco-search-input {
            width: 100%;
          }

          .eco-news-grid {
            grid-template-columns: 1fr;
          }

          .eco-admin-panel {
            padding: 17px;
          }

          .eco-admin-form {
            grid-template-columns: 1fr;
          }

          .eco-form-field.full {
            grid-column: auto;
          }

          .eco-footer {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 420px) {
          .eco-person-row {
            gap: 9px;
            padding: 10px;
          }

          .eco-person-avatar {
            width: 44px;
            height: 44px;
          }

          .eco-person-wealth {
            font-size: 11px;
          }

          .eco-featured-main {
            flex-direction: column;
          }

          .eco-featured-avatar {
            width: 96px;
            height: 96px;
          }

          .eco-admin-actions .eco-button {
            width: 100%;
          }
        }
.eco-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(10px);
}

.eco-login-modal {
  position: relative;
  width: 100%;
  max-width: 440px;
  padding: 32px 24px 26px;
  color: #f1f7f2;
  background: linear-gradient(145deg, #142219, #0a100c);
  border: 1px solid #345640;
  border-radius: 24px;
  box-shadow: 0 24px 80px #0009;
}

.eco-modal-close {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 36px;
  height: 36px;
  color: #c9d8ce;
  background: #ffffff0b;
  border: 1px solid #ffffff16;
  border-radius: 10px;
  cursor: pointer;
  font-size: 24px;
}

.eco-modal-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  color: #07120a;
  background: linear-gradient(135deg, #8bf5a0, #45b967);
  border-radius: 15px;
  font-size: 24px;
  font-weight: 900;
  box-shadow: 0 8px 24px #70e88c25;
}

.eco-login-modal h2 {
  margin: 10px 0;
  color: #f1f7f2;
  font-size: 27px;
  font-weight: 900;
}

.eco-login-modal p {
  margin: 0 0 20px;
  color: #a8b9ad;
  line-height: 1.9;
}

.eco-login-modal input,
.eco-login-modal select {
  box-sizing: border-box;
  width: 100%;
  min-height: 46px;
  padding: 11px 13px;
  color: #f1f7f2;
  background: #0a130d;
  border: 1px solid #294333;
  border-radius: 12px;
  outline: none;
}

.eco-login-modal input:focus,
.eco-login-modal select:focus {
  border-color: #70e88c;
  box-shadow: 0 0 0 3px #70e88c18;
}

@media (max-width: 480px) {
  .eco-login-modal {
    padding: 28px 18px 22px;
    border-radius: 20px;
  }
}

.eco-admin-form button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  padding: 12px 18px;
  color: #07120a;
  background: linear-gradient(135deg, #8bf5a0, #45b967);
  border: 1px solid #70e88c;
  border-radius: 12px;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
}

.eco-admin-form button:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 22px #70e88c20;
  filter: brightness(1.06);
}

.eco-admin-form button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.eco-admin-form button:focus-visible {
  outline: 2px solid #a8ffb8;
  outline-offset: 3px;
}

@media (max-width: 700px) {
  .eco-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 14px 0;
    min-height: auto;
  }

  .eco-logo {
    order: 1;
  }

  .eco-admin-button {
    order: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 11px 14px;
    flex-shrink: 0;
    font-size: 13px;
  }

  .eco-nav {
    order: 3;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow-x: auto;
    flex-wrap: nowrap;
    gap: 22px;
    padding: 8px 0;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch;
  }
}

.eco-chart-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.eco-chart-eyebrow {
  color: #70e88c;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.eco-chart-heading h3 {
  margin: 8px 0;
  color: #f1f7f2;
  font-size: 21px;
}

.eco-chart-heading p,
.eco-chart-note {
  color: #a3b8a8;
  font-size: 12px;
  line-height: 1.9;
}

.eco-chart-unit {
  padding: 8px 10px;
  color: #a9f4bb;
  background: #14281b;
  border: 1px solid #294333;
  border-radius: 9px;
  font-size: 11px;
  white-space: nowrap;
}

.eco-chart-scroll {
  width: 100%;
  overflow-x: auto;
  background: linear-gradient(180deg, #0d1a12, #0a120d);
  border: 1px solid #203a2a;
  border-radius: 14px;
}

.eco-wealth-chart {
  display: block;
  width: 100%;
  min-width: 320px;
  height: auto;
}

.eco-chart-footer {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  color: #8da695;
  font-size: 11px;
}

.eco-chart-note {
  padding: 10px 12px;
  background: #122219;
  border-right: 3px solid #65df86;
  border-radius: 8px;
}

.eco-history-details {
  margin-top: 16px;
  color: #cbd8ce;
  font-size: 12px;
}

.eco-history-details summary {
  padding: 12px 0;
  cursor: pointer;
  color: #a9f4bb;
}

@media (max-width: 480px) {
  .eco-chart-heading {
    flex-direction: column;
  }
}

@media (max-width: 700px) {
  .eco-ranking-table-wrap {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }

  .eco-ranking-table {
    width: 100%;
    table-layout: fixed;
    white-space: normal;
    font-size: 10px;
  }

  .eco-ranking-table th,
  .eco-ranking-table td {
    padding: 8px 3px;
    line-height: 1.5;
    white-space: normal;
    overflow-wrap: anywhere;
    vertical-align: middle;
    box-sizing: border-box;
  }

  .eco-ranking-table th:nth-child(1),
  .eco-ranking-table td:nth-child(1) { width: 10%; }

  .eco-ranking-table th:nth-child(2),
  .eco-ranking-table td:nth-child(2) { width: 29%; }

  .eco-ranking-table th:nth-child(3),
  .eco-ranking-table td:nth-child(3) { width: 17%; }

  .eco-ranking-table th:nth-child(4),
  .eco-ranking-table td:nth-child(4) { width: 14%; }

  .eco-ranking-table th:nth-child(5),
  .eco-ranking-table td:nth-child(5) { width: 17%; }

  .eco-ranking-table th:nth-child(6),
  .eco-ranking-table td:nth-child(6) { width: 13%; }

  .eco-ranking-table .eco-table-person {
    display: flex;
    align-items: center;
    gap: 5px;
    width: 100%;
    min-width: 0;
    padding: 0;
    white-space: normal;
  }

  .eco-ranking-table .eco-table-person img {
    width: 27px;
    height: 27px;
    min-width: 27px;
    max-width: 27px;
    flex: 0 0 27px;
    object-fit: cover;
    border-radius: 7px;
  }

  .eco-ranking-table .eco-table-person strong {
    display: block;
    min-width: 0;
    font-size: 10px;
    line-height: 1.4;
    white-space: normal;
    word-break: normal;
    overflow-wrap: break-word;
  }
}
.eco-featured-worth {
  display: block;
  margin: 8px 0 18px;
  color: #b9f27c;
  font-size: clamp(30px, 4vw, 44px);
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
  text-shadow: 0 0 26px #b9f27c25;
}

@media (max-width: 700px) {
  .eco-featured-worth {
    margin: 6px 0 14px;
    font-size: clamp(26px, 7vw, 34px);
    letter-spacing: -0.5px;
  }
}
.eco-featured-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  padding: 15px 17px;
  background: linear-gradient(110deg, #10271b, #0a1710);
  border: 1px solid #294b34;
  border-radius: 15px;
}

.eco-featured-details > span {
  color: #b0c4b5;
  font-size: 13px;
  font-weight: 700;
}

.eco-featured-details > strong {
  direction: ltr;
  font-size: 17px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.eco-featured-details .eco-positive {
  color: #72f0a0;
  text-shadow: 0 0 16px #72f0a020;
}

.eco-featured-details .eco-negative {
  color: #ff8585;
  text-shadow: 0 0 16px #ff858520;
}

@media (max-width: 700px) {
  .eco-featured-details {
    margin-top: 12px;
    padding: 13px;
    border-radius: 12px;
  }

  .eco-featured-details > span {
    font-size: 12px;
  }

  .eco-featured-details > strong {
    font-size: 15px;
  }
}
.eco-featured-bio {
  margin: 18px 0 0;
  padding: 17px 18px;
  color: #c1d1c5;
  background: linear-gradient(135deg, #102219, #09150f);
  border: 1px solid #263f2e;
  border-right: 3px solid #b9f27c;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 400;
  line-height: 2;
  overflow-wrap: anywhere;
  white-space: pre-line;
}

@media (max-width: 700px) {
  .eco-featured-bio {
    margin-top: 14px;
    padding: 13px;
    font-size: 12px;
    line-height: 1.9;
    border-radius: 11px;
  }
}
.eco-featured-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  width: 100%;
  margin-bottom: 22px;
}

.eco-featured-star {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  color: #b9f27c;
  background: linear-gradient(135deg, #1b3b27, #0b1b11);
  border: 1px solid #376647;
  border-radius: 12px;
  font-size: 22px;
  box-shadow: 0 0 20px #b9f27c12;
}

@media (max-width: 700px) {
  .eco-featured-topline {
    margin-bottom: 17px;
  }

  .eco-featured-star {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    font-size: 20px;
  }
}
/* === ECONOVA REFERENCE REDESIGN OVERRIDES === */
.eco-page {
  --eco-lime: #b9f27c;
  --eco-bg: #070b09;
  --eco-panel: #101713;
  --eco-line: rgba(185,242,124,.16);
  background:
    radial-gradient(ellipse at 78% 18%, rgba(82,132,64,.12), transparent 35%),
    radial-gradient(ellipse at 8% 60%, rgba(185,242,124,.045), transparent 32%),
    #070b09 !important;
  color: #f2f6ef !important;
}
.eco-page::before { opacity:.18; }
.eco-header {
  background:rgba(8,13,10,.86)!important;
  border:1px solid var(--eco-line)!important;
  border-radius:18px!important;
  backdrop-filter:blur(22px);
  box-shadow:0 16px 55px #0005;
}
.eco-logo-mark { box-shadow:0 0 28px #b9f27c25; }
.eco-hero {
  min-height:250px;
  padding:42px clamp(20px,4vw,48px)!important;
  border:1px solid var(--eco-line)!important;
  border-radius:26px!important;
  background:linear-gradient(115deg,rgba(185,242,124,.075),rgba(16,23,19,.94) 50%,rgba(8,13,10,.98))!important;
  overflow:hidden;
}
.eco-hero h1 { letter-spacing:-.045em; line-height:1.2; }
.eco-section { margin-top:42px!important; }
.eco-section-heading { align-items:end; }
.eco-section-kicker,.eco-eyebrow { color:var(--eco-lime)!important; letter-spacing:.15em; }
.eco-top-five-layout {
  display:grid!important;
  grid-template-columns:minmax(0, .92fr) minmax(0, 1.35fr)!important;
  gap:22px!important;
  align-items:stretch;
}
.eco-top-five-list {
  display:flex!important;
  flex-direction:column!important;
  gap:10px!important;
  min-width:0;
}
.eco-person-row {
  display:grid!important;
  grid-template-columns:32px 52px minmax(0,1fr) auto 14px!important;
  gap:12px!important;
  align-items:center!important;
  min-height:88px!important;
  padding:13px!important;
  border:1px solid rgba(255,255,255,.065)!important;
  border-radius:17px!important;
  background:linear-gradient(115deg,#111914,#0c110e)!important;
  text-align:right;
  transition:transform .2s,border-color .2s,background .2s;
}
.eco-person-row:hover,.eco-person-row.is-active {
  transform:translateY(-1px);
  border-color:rgba(185,242,124,.55)!important;
  background:linear-gradient(115deg,rgba(185,242,124,.11),#101713 70%)!important;
  box-shadow:0 8px 28px #0003,inset 3px 0 var(--eco-lime);
}
.eco-person-rank { color:var(--eco-lime)!important;font-weight:800; }
.eco-person-avatar {
  width:52px!important;height:52px!important;border-radius:14px!important;
  object-fit:cover;border:1px solid #b9f27c35;
}
.eco-person-info { min-width:0; }
.eco-person-info strong { display:block;font-size:14px!important;line-height:1.5; }
.eco-person-info small { display:block;color:#8f9a90!important;font-size:11px!important;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.eco-person-worth { display:flex;flex-direction:column;align-items:flex-end;gap:4px; }
.eco-person-worth strong { font-size:13px!important;white-space:nowrap; }
.eco-person-worth small { font-size:10px!important;white-space:nowrap; }
.eco-person-arrow { color:#78857a!important; }
.eco-featured-person {
  position:relative;
  min-width:0;
  padding:clamp(22px,3vw,36px)!important;
  border:1px solid rgba(185,242,124,.23)!important;
  border-radius:24px!important;
  background:
    radial-gradient(ellipse at 50% 18%,rgba(185,242,124,.1),transparent 40%),
    linear-gradient(145deg,#141c16,#0b100d 72%)!important;
  box-shadow:0 25px 70px #0005,inset 0 1px #ffffff08!important;
  overflow:hidden;
}
.eco-featured-person::after {
  content:"";position:absolute;inset:auto -10% -100px 20%;height:180px;
  background:radial-gradient(ellipse,rgba(185,242,124,.08),transparent 70%);pointer-events:none;
}
.eco-featured-topline { display:flex;justify-content:space-between;align-items:center;margin-bottom:20px; }
.eco-featured-badge { border:1px solid #b9f27c45!important;background:#b9f27c0d!important;color:var(--eco-lime)!important;border-radius:99px!important;padding:7px 12px!important;font-size:10px!important;letter-spacing:.12em; }
.eco-featured-star { color:var(--eco-lime)!important;background:#b9f27c0d!important;border:1px solid #b9f27c2b!important; }
.eco-featured-image {
  display:block;width:clamp(115px,18vw,175px)!important;height:clamp(115px,18vw,175px)!important;
  margin:0 auto 20px!important;border-radius:50%!important;object-fit:cover;
  border:3px solid #b9f27c8c!important;box-shadow:0 0 0 9px #b9f27c0a,0 15px 55px #0008!important;
}
.eco-featured-label { display:block;text-align:center;color:#91a093!important;font-size:11px!important; }
.eco-featured-person h3 { text-align:center;font-size:clamp(24px,3vw,34px)!important;letter-spacing:-.035em;margin:8px 0!important; }
.eco-featured-company { text-align:center;color:#9ba69c!important;font-size:13px!important; }
.eco-featured-worth { display:block;text-align:center;color:var(--eco-lime)!important;font-size:clamp(32px,4vw,46px)!important;letter-spacing:-.04em;margin:18px 0!important; }
.eco-featured-divider { height:1px;background:linear-gradient(90deg,transparent,#b9f27c3d,transparent)!important;margin:22px 0!important; }
.eco-featured-details { display:flex;justify-content:space-between;gap:16px;padding:9px 0;color:#aab4aa!important;font-size:13px!important; }
.eco-positive { color:#b9f27c!important; }
.eco-negative { color:#ff8b86!important; }
.eco-stat-card,.eco-card,.eco-news-card,.eco-ranking-table,.eco-chart-card {
  border:1px solid rgba(255,255,255,.075)!important;
  background:linear-gradient(145deg,#121914,#0b100d)!important;
  border-radius:18px!important;
  box-shadow:0 14px 35px #0002!important;
}
.eco-page input,.eco-page select,.eco-page textarea {
  background:#090e0b!important;color:#eef4ec!important;border-color:#29382b!important;
}
.eco-page input:focus,.eco-page select:focus,.eco-page textarea:focus {
  outline:1px solid #b9f27c!important;border-color:#b9f27c!important;
}
.eco-page button { -webkit-tap-highlight-color:transparent; }
.eco-page a { transition:color .2s; }
.eco-page a:hover { color:var(--eco-lime); }
@media(max-width:850px) {
  .eco-top-five-layout { grid-template-columns:1fr!important; }
  .eco-featured-person { grid-row:1; }
  .eco-top-five-list { grid-row:2; }
}
@media(max-width:560px) {
  .eco-hero { padding:26px 18px!important;min-height:auto; }
  .eco-person-row { grid-template-columns:25px 43px minmax(0,1fr) auto!important;gap:8px!important;padding:10px!important;min-height:76px!important; }
  .eco-person-avatar { width:43px!important;height:43px!important;border-radius:12px!important; }
  .eco-person-worth strong { font-size:11px!important; }
  .eco-person-worth small { font-size:9px!important; }
  .eco-person-arrow { display:none; }
  .eco-featured-person { padding:22px 17px!important; }
}

/* Reference dashboard layout and live wealth ticker */
.eco-page { padding: 0 clamp(16px,2.5vw,40px)!important; }
.eco-header { min-height:76px!important; margin:0 calc(-1 * clamp(16px,2.5vw,40px)) 28px!important; padding:12px clamp(18px,3vw,52px)!important; border-radius:0!important; border-width:0 0 1px!important; box-shadow:none!important; display:flex!important; }
.eco-logo strong { font-size:clamp(20px,2vw,29px)!important; }
.eco-hero,.eco-stats-grid { display:none!important; }
.eco-status-line { margin:0 0 12px!important; }
.eco-global-ticker { display:flex; align-items:center; gap:clamp(12px,2vw,28px); margin:0 0 22px; padding:13px 18px; border:1px solid rgba(185,242,124,.2); border-radius:14px; background:linear-gradient(100deg,#0e1711,#09100c); }
.eco-ticker-item { display:flex; align-items:center; gap:12px; min-width:0; }
.eco-ticker-icon { display:grid;place-items:center;width:42px;height:42px;flex-shrink:0;border:1px solid #b9f27c35;border-radius:50%;color:#b9f27c;font-size:24px;background:#b9f27c0a; }
.eco-ticker-copy { display:flex;flex-direction:column;gap:3px; }
.eco-ticker-copy small { color:#aab8ad;font-size:11px; }
.eco-ticker-copy strong { color:#f5f8f4;font-size:clamp(17px,2vw,25px);font-weight:800; }
.eco-ticker-copy em { color:#7f8c81;font-size:10px;font-style:normal; }
.eco-ticker-separator { height:42px;width:1px;flex-shrink:0;background:#b9f27c2b; }
.eco-ticker-source { margin-inline-start:auto;color:#b9f27c!important;font-size:11px;white-space:nowrap; }
#top-five.eco-section { margin-top:0!important; }
#top-five > .eco-section-heading { display:none!important; }
.eco-top-five-layout { grid-template-columns:minmax(350px,.82fr) minmax(0,1.55fr)!important; gap:22px!important; }
.eco-top-five-list { grid-column:1; grid-row:1; }
.eco-featured-person { grid-column:2; grid-row:1; display:grid; grid-template-columns:minmax(0,1fr) minmax(180px,.72fr); grid-template-rows:auto auto auto auto auto auto; column-gap:20px; align-content:start; padding:clamp(18px,2.4vw,34px)!important; }
.eco-featured-topline { grid-column:1/-1; grid-row:1; }
.eco-featured-image { grid-column:2; grid-row:2/6; width:100%!important;height:clamp(210px,28vw,370px)!important;max-width:320px;margin:0 auto!important;border:0!important;border-radius:18px!important;object-fit:cover;box-shadow:0 15px 50px #0008!important; }
.eco-featured-label { grid-column:1; grid-row:2; text-align:right!important; align-self:end; }
.eco-featured-person h3 { grid-column:1;grid-row:3;text-align:right!important;font-size:clamp(28px,3.4vw,46px)!important;margin:8px 0!important; }
.eco-featured-company { grid-column:1;grid-row:4;text-align:right!important; }
.eco-featured-worth { grid-column:1;grid-row:5;text-align:right!important;font-size:clamp(30px,3.8vw,48px)!important;margin:12px 0!important; }
.eco-featured-divider { grid-column:1/-1;grid-row:6;margin:18px 0!important; }
.eco-featured-details,.eco-featured-bio,.eco-history-panel,.eco-source-link { grid-column:1/-1; }
.eco-history-panel { min-width:0; }
.eco-person-row { grid-template-columns:32px 58px minmax(0,1fr) auto 14px!important; min-height:96px!important; }
.eco-person-avatar { width:58px!important;height:58px!important;border-radius:14px!important; }
.eco-person-info strong { font-size:15px!important; }
.eco-person-worth strong { font-size:15px!important; }
.eco-featured-person .eco-history-panel { margin-top:12px; }
@media(max-width:1000px) {
 .eco-top-five-layout { grid-template-columns:minmax(0,1fr)!important; }
 .eco-featured-person { grid-column:1;grid-row:1; }
 .eco-top-five-list { grid-column:1;grid-row:2; }
}
@media(max-width:640px) {
 .eco-global-ticker { align-items:stretch; flex-direction:column; }
 .eco-ticker-separator { height:1px;width:100%; }
 .eco-ticker-source { margin-inline-start:0; }
 .eco-featured-person { display:flex!important;flex-direction:column; }
 .eco-featured-image { width:100%!important;height:230px!important;max-width:none;object-position:center 30%; }
 .eco-featured-label,.eco-featured-person h3,.eco-featured-company,.eco-featured-worth { text-align:center!important; }
 .eco-header { flex-wrap:wrap!important;gap:10px!important; }
 .eco-nav { order:3;width:100%;overflow-x:auto; }
}

   
/* Forbes-inspired hierarchy: combined top-10 wealth first, top five immediately below */
.eco-global-ticker { order: 1; }
.eco-trillionaire-section { margin: 0 0 28px; padding: 22px; border: 1px solid rgba(185,242,124,.18); border-radius: 18px; background: linear-gradient(145deg,#0c1510,#080d0a); }
.eco-trillionaire-heading { display:flex; align-items:center; justify-content:space-between; gap:18px; margin-bottom:16px; }
.eco-trillionaire-kicker { color:#b9f27c; font-size:10px; letter-spacing:.18em; }
.eco-trillionaire-heading h2 { margin:6px 0; color:#f5f8f4; font-size:clamp(22px,2.3vw,30px); }
.eco-trillionaire-heading p { margin:0; color:#93a397; font-size:12px; }
.eco-trillionaire-count { flex-shrink:0; padding:9px 14px; border:1px solid #b9f27c40; border-radius:999px; color:#b9f27c; font-weight:800; }
.eco-trillionaire-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; }
.eco-trillionaire-card { display:flex; flex-direction:column; align-items:flex-start; gap:7px; min-width:0; padding:14px; text-align:right; border:1px solid #ffffff12; border-radius:14px; background:#ffffff04; color:#f5f8f4; cursor:pointer; }
.eco-trillionaire-card:hover { border-color:#b9f27c80; background:#b9f27c09; }
.eco-trillionaire-card img { width:64px; height:64px; border-radius:13px; object-fit:cover; }
.eco-trillionaire-rank { color:#b9f27c; font-size:10px; }
.eco-trillionaire-card strong { font-size:15px; }
.eco-trillionaire-card small { color:#94a399; font-size:11px; }
.eco-trillionaire-card b { color:#b9f27c; font-size:22px; direction:ltr; unicode-bidi:plaintext; }
.eco-trillionaire-card em { color:#9aa69d; font-size:11px; font-style:normal; }
.eco-trillionaire-empty { display:flex; flex-direction:column; align-items:center; gap:8px; padding:24px 12px; text-align:center; border:1px dashed #b9f27c30; border-radius:14px; }
.eco-trillionaire-empty span { color:#b9f27c; font-size:30px; }
.eco-trillionaire-empty strong { color:#eaf1eb; }
.eco-trillionaire-empty p { max-width:600px; margin:0; color:#93a397; font-size:12px; line-height:1.9; }
/* Keep net worth visible in each Forbes-style top-five row, with list left and profile right */
.eco-top-five-layout { grid-template-columns:minmax(390px,.9fr) minmax(0,1.45fr)!important; align-items:start!important; }
.eco-person-row { grid-template-columns:30px 54px minmax(95px,1fr) minmax(100px,auto) 14px!important; gap:10px!important; }
.eco-person-worth { min-width:100px; display:flex!important; flex-direction:column!important; align-items:flex-end!important; gap:3px!important; }
.eco-person-worth strong { display:block!important; color:#f5f8f4!important; white-space:nowrap!important; font-size:clamp(12px,1.1vw,15px)!important; font-variant-numeric:tabular-nums; }
.eco-person-worth small { white-space:nowrap!important; }
@media(max-width:1000px) { .eco-top-five-layout { grid-template-columns:minmax(0,1fr)!important; } }
@media(max-width:560px) { .eco-trillionaire-section { padding:15px; } .eco-trillionaire-heading { align-items:flex-start; } .eco-trillionaire-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .eco-trillionaire-card { padding:10px; } .eco-trillionaire-card b { font-size:17px; } .eco-person-row { grid-template-columns:22px 40px minmax(0,1fr) auto!important; gap:7px!important; } .eco-person-worth { min-width:0; } .eco-person-worth strong { font-size:11px!important; } }


/* Forbes-like horizontal top five cards: mobile swipe, desktop side-by-side */
.eco-forbes-top-five { margin: 0 0 26px; padding: 0; scroll-margin-top: 18px; }
.eco-forbes-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin:0 0 16px; }
.eco-forbes-heading span { color:#b9f27c; font-size:10px; letter-spacing:.13em; font-weight:800; }
.eco-forbes-heading h2 { margin:6px 0; color:#f5f7f4; font-size:clamp(23px,3vw,32px); }
.eco-forbes-heading p { margin:0; color:#a4ada5; font-size:12px; line-height:1.8; }
.eco-forbes-heading > small { color:#b9f27c; border:1px solid #b9f27c45; border-radius:999px; padding:8px 12px; white-space:nowrap; }
.eco-forbes-carousel { display:grid; grid-auto-flow:column; grid-auto-columns:calc((100% - 48px)/3); gap:16px; overflow-x:auto; overscroll-behavior-inline:contain; scroll-snap-type:x mandatory; padding:2px 2px 14px; scrollbar-width:thin; scrollbar-color:#526c50 #111712; direction:ltr; }
.eco-forbes-card { display:flex; flex-direction:column; min-width:0; min-height:280px; padding:20px; text-align:right; color:#f5f7f4; background:#151615; border:1px solid #343734; border-radius:13px; scroll-snap-align:start; cursor:pointer; transition:border-color .2s,background .2s; }
.eco-forbes-card:hover,.eco-forbes-card.is-selected { border-color:#b9f27c9c; background:linear-gradient(150deg,#191e19,#111311); }
.eco-forbes-card-head { display:grid; grid-template-columns:auto minmax(0,1fr) 70px; align-items:start; gap:10px; min-height:78px; }
.eco-forbes-rank { color:#b6b9b5; font-family:Georgia,serif; font-size:26px; }
.eco-forbes-person { display:flex; flex-direction:column; gap:5px; min-width:0; padding-top:2px; }
.eco-forbes-person strong { font-family:Georgia,serif; font-size:clamp(16px,1.5vw,22px); line-height:1.35; overflow-wrap:anywhere; }
.eco-forbes-person small { color:#b3b7b3; font-size:12px; }
.eco-forbes-card-head img { width:70px; height:70px; border-radius:9px; object-fit:cover; background:#202520; }
.eco-forbes-rule { height:1px; background:#3b3d3b; margin:12px 0 22px; }
.eco-forbes-label { color:#aeb2ae; font-size:11px; font-weight:700; }
.eco-forbes-worth { display:block; direction:ltr; unicode-bidi:plaintext; text-align:left; margin:8px 0; font-size:clamp(27px,2.4vw,36px); letter-spacing:-.03em; white-space:nowrap; }
.eco-forbes-change { display:block; font-size:12px; line-height:1.7; }
.eco-forbes-select { margin-top:auto; padding-top:18px; color:#9eaa9f; font-size:11px; }
.eco-legacy-top-five { display:none!important; }
@media(max-width:850px) {
 .eco-forbes-carousel { grid-auto-columns:minmax(280px,78%); gap:12px; }
 .eco-forbes-card { min-height:260px; }
}
@media(max-width:420px) {
 .eco-forbes-carousel { grid-auto-columns:88%; }
 .eco-forbes-card { padding:16px; }
 .eco-forbes-heading { align-items:flex-start; }
 .eco-forbes-heading p { max-width:280px; }
}

/* Forbes-like daily change amounts and per-person wealth sparkline */
.eco-mini-chart-wrap { width:100%; position:relative; }
.eco-mini-chart-tooltip { display:flex; align-items:center; justify-content:space-between; gap:8px; max-width:260px; min-height:22px; margin-top:7px; color:#9ca9a0; font-size:10px; line-height:1.4; font-variant-numeric:tabular-nums; }
.eco-mini-chart-tooltip strong { color:#e7f5ec; font-size:11px; white-space:nowrap; }
.eco-mini-chart { touch-action:pan-y; cursor:crosshair; }
.eco-forbes-card .eco-mini-chart-tooltip { max-width:none; }
.eco-mini-chart {
  display: block;
  width: 100%;
  max-width: 260px;
  height: 48px;
  margin: 6px 0 2px;
  color: #58d889;
  overflow: visible;
}
.eco-mini-chart.is-down { color:#f16e78; }
.eco-mini-chart-grid { opacity:.8; }
.eco-mini-chart-empty { display:flex; align-items:center; max-width:260px; min-height:58px; margin:12px 0 2px; padding:8px 10px; color:#89958d; background:linear-gradient(90deg,rgba(255,255,255,.025),transparent); border-top:1px solid rgba(255,255,255,.07); font-size:10px; line-height:1.6; }
.eco-change-percent { display:block; font-weight:800; }
.eco-change-amount { display:block; margin-top:4px; font-size:11px; font-weight:700; direction:ltr; text-align:right; white-space:nowrap; }
.eco-forbes-card .eco-mini-chart {
  display: block;
  width: 100%;
  max-width: none;
  height: 110px;
  margin: 6px 0 0;
  stroke-width: 1.5;
}
.eco-forbes-card .eco-mini-chart-empty { display:flex; max-width:none; min-height:58px; margin-top:12px; font-size:10px; line-height:1.6; }
.eco-person-worth { min-width:120px; }
.eco-person-row { align-items:center; }
.eco-ranking-table td .eco-change-amount { direction:ltr; text-align:right; }
@media(max-width:640px) {
 .eco-mini-chart { max-width:none; height:48px; }
 .eco-person-worth { min-width:105px; }
}
`}
</style>
    </main>
  );
}


      
