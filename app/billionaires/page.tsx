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

export default function BillionairesPage() {
  const [people, setPeople] = useState<Billionaire[]>([]);
  const [news, setNews] = useState<BillionaireNews[]>([]);

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
    const dailyChange = Number(personDailyChange);

    if (!editingPersonId || !personName.trim()) {
      setAdminMessage("فرد و نام او را مشخص کن.");
      return;
    }

    if (
      !Number.isInteger(rank) ||
      rank < 1 ||
      !Number.isFinite(worth) ||
      worth < 0 ||
      !Number.isFinite(dailyChange)
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

  const dailyChange =
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
            daily_change_pct: Number(dailyChange.toFixed(2)),
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

      {errorMessage && (
        <div className="eco-error-message" role="alert">
          <strong>دریافت اطلاعات ناموفق بود</strong>
          <p>{errorMessage}</p>
          <button onClick={() => void loadData()}>تلاش دوباره</button>
        </div>
      )}

      {/* پارت ۳ از این خط ادامه پیدا می‌کند. */}
            <section className="eco-section" id="top-five">
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
                        setActiveRank(person.rank);
                        document
                          .getElementById("top-five")
                          ?.scrollIntoView({ behavior: "smooth" });
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
                    {formatChange(person.daily_change_pct)}
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
          padding: 65px 0 20px;
          scroll-margin-top: 35px;
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
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
          gap: 22px;
          align-items: stretch;
        }

        .eco-top-five-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
      
.eco-person-row {
  display: grid;
  grid-template-columns: 42px 52px minmax(0, 1fr);
  grid-template-areas: "rank avatar info" "rank avatar worth";
  align-items: center;
  column-gap: 12px;
  row-gap: 8px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 14px;
  color: #e8f0ea;
  text-align: right;
  background: linear-gradient(135deg, #101b15, #0c1511);
  border: 1px solid #294333;
  border-radius: 15px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.2s, box-shadow 0.2s;
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
          padding: 24px;
          background:
            radial-gradient(ellipse at 80% 0%, #245f373d, transparent 52%),
            linear-gradient(145deg, #15251b, #0b120e 75%);
          border: 1px solid #31583a;
          border-radius: 20px;
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
          color: #a3b8a8;
          font-size: 12px;
          font-weight: 700;
        }

        .eco-featured-badge {
          padding: 6px 10px;
          color: #7be995;
          background: #173824;
          border: 1px solid #2f7042;
          border-radius: 20px;
          font-size: 11px;
        }

        .eco-featured-main {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 20px;
        }

        .eco-featured-avatar {
          width: 112px;
          height: 112px;
          flex-shrink: 0;
          object-fit: cover;
          background: #203126;
          border: 2px solid #4c9b60;
          border-radius: 18px;
          box-shadow: 0 8px 32px #0005;
        }

        .eco-featured-rank {
          margin-bottom: 8px;
          color: #7ce493;
          font-size: 12px;
          font-weight: 800;
        }
   
.eco-featured-name {
  margin: 0 0 10px;
  color: #f1f7f2;
  font-size: 26px;
  font-weight: 900;
  line-height: 1.35;
  letter-spacing: -0.4px;
  overflow-wrap: anywhere;
}

        .eco-featured-company {
          color: #a0b2a4;
          font-size: 13px;
        }

        .eco-featured-divider {
          height: 1px;
          margin: 4px 0 18px;
          background: #2a3b2e;
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
          overflow-x: auto;
          border: 1px solid #23372a;
          border-radius: 14px;
        }

        .eco-ranking-table {
          width: 100%;
          border-collapse: collapse;
          text-align: right;
          white-space: nowrap;
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
      `}</style>
    </main>
  );
}


      
