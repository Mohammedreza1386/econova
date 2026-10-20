"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js": "^2.0.0"

type Billionaire = {
  id: string | number;
  rank: number;
  name: string;
  company?: string | null;
  country?: string | null;
  image_url?: string | null;
  bio?: string | null;
  net_worth_billions: number | string;
  daily_change_pct?: number | string | null;
  daily_change_date?: string | null;
  yesterday_net_worth_billions?: number | string | null;
  source_url?: string | null;
  updated_at?: string | null;
};

type BillionaireNews = {
  id?: string | number;
  billionaire_rank?: number;
  rank?: number;
  title?: string | null;
  content?: string | null;
  body?: string | null;
  source_url?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

const FALLBACK_PHOTOS: Record<string, string> = {
  "Elon Musk":
    "https://unavatar.io/x/elonmusk",
  "Jeff Bezos":
    "https://unavatar.io/x/JeffBezos",
  "Larry Page":
    "https://commons.wikimedia.org/wiki/Special:FilePath/Larry_Page_in_the_European_Parliament%2C_17_July_2009.jpg",
  "Sergey Brin":
    "https://unavatar.io/x/sergeybrin",
  "Mark Zuckerberg":
    "https://unavatar.io/x/finkd",
  "Michael Dell":
    "https://unavatar.io/x/MichaelDell",
  "Jensen Huang":
    "https://unavatar.io/x/nvidia",
  "Larry Ellison":
    "https://unavatar.io/x/Oracle",
  "Steve Ballmer":
    "https://unavatar.io/x/SteveBallmer",
  "Warren Buffett":
    "https://unavatar.io/x/WarrenBuffett",
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 1,
  }).format(value);

const formatBillions = (value: number) =>
  `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value)}B`;

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const photoFor = (person: Billionaire) =>
  person.image_url?.trim() ||
  FALLBACK_PHOTOS[person.name] ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    person.name || "Econova"
  )}&background=102b25&color=d7f8a8&size=256`;

const changeIsPositive = (value: number) => value >= 0;

export default function BillionairesPage() {
  const [people, setPeople] = useState<Billionaire[]>([]);
  const [news, setNews] = useState<BillionaireNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const [activeRank, setActiveRank] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingNewsRank, setEditingNewsRank] = useState(1);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsSource, setNewsSource] = useState("");

  const [animatedTotal, setAnimatedTotal] = useState(0);

  const loadData = useCallback(async () => {
    if (!supabase) {
      setErrorMessage(
        "اتصال Supabase تنظیم نشده است. متغیرهای محیطی را بررسی کن."
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const [peopleResult, newsResult] = await Promise.all([
        supabase
          .from("billionaires")
          .select("*")
          .order("rank", { ascending: true })
          .limit(30),

        supabase
          .from("billionaire_news")
          .select("*")
          .order("updated_at", { ascending: false }),
      ]);

      if (peopleResult.error) throw peopleResult.error;

      setPeople(
        ((peopleResult.data ?? []) as Billionaire[]).sort(
          (a, b) => Number(a.rank) - Number(b.rank)
        )
      );

      if (newsResult.error) {
        console.warn("News loading issue:", newsResult.error.message);
        setNews([]);
      } else {
        setNews((newsResult.data ?? []) as BillionaireNews[]);
      }

      setLastUpdated(new Date().toLocaleString("fa-IR"));
    } catch (error) {
      console.error(error);
      setErrorMessage(
        "دریافت اطلاعات انجام نشد. اتصال اینترنت و تنظیمات Supabase را بررسی کن."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      const role = data.session?.user.app_metadata?.role;
      setIsAdmin(role === "admin");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(session?.user.app_metadata?.role === "admin");
    });

    return () => subscription.unsubscribe();
  }, []);

  const sortedPeople = useMemo(
    () =>
      [...people].sort(
        (a, b) => Number(a.rank) - Number(b.rank)
      ),
    [people]
  );

  const topFive = useMemo(
    () => sortedPeople.filter((person) => person.rank <= 5),
    [sortedPeople]
  );

  const topTen = useMemo(
    () => sortedPeople.filter((person) => person.rank <= 10),
    [sortedPeople]
  );

  const topTenTotal = useMemo(
    () =>
      topTen.reduce(
        (sum, person) => sum + toNumber(person.net_worth_billions),
        0
      ),
    [topTen]
  );

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const duration = 1400;
    const initial = 0;

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);

      setAnimatedTotal(
        initial + (topTenTotal - initial) * eased
      );

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [topTenTotal]);

  const filteredPeople = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return sortedPeople;

    return sortedPeople.filter((person) =>
      [
        person.name,
        person.company ?? "",
        person.country ?? "",
        String(person.rank),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [sortedPeople, searchTerm]);

  const visiblePeople = showAll
    ? filteredPeople
    : filteredPeople.slice(0, 10);

  const newsForRank = (rank: number) =>
    news.find(
      (item) =>
        Number(item.billionaire_rank ?? item.rank) === rank
    );

  const activePerson =
    sortedPeople.find((person) => person.rank === activeRank) ??
    topFive[0];

  const openNewsEditor = (rank: number) => {
    const existing = newsForRank(rank);

    setEditingNewsRank(rank);
    setNewsTitle(String(existing?.title ?? ""));
    setNewsContent(
      String(existing?.content ?? existing?.body ?? "")
    );
    setNewsSource(String(existing?.source_url ?? ""));
    setAdminMessage("");
  };

  const loginAdmin = async () => {
    if (!supabase) {
      setAdminMessage("اتصال Supabase برقرار نیست.");
      return;
    }

    setSaving(true);
    setAdminMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword,
      });

      if (error) throw error;

      if (data.user?.app_metadata?.role !== "admin") {
        await supabase.auth.signOut();
        setIsAdmin(false);
        setAdminMessage("این حساب دسترسی مدیر ندارد.");
        return;
      }

      setIsAdmin(true);
      setLoginOpen(false);
      setAdminPassword("");
      setAdminMessage("ورود مدیر موفق بود.");
      openNewsEditor(activeRank);
    } catch (error) {
      console.error(error);
      setAdminMessage("ورود ناموفق بود. ایمیل و رمز را بررسی کن.");
    } finally {
      setSaving(false);
    }
  };

  const logoutAdmin = async () => {
    if (!supabase) return;

    await supabase.auth.signOut();
    setIsAdmin(false);
    setAdminMessage("");
  };

  const saveNews = async () => {
    if (!supabase || !isAdmin) {
      setAdminMessage("برای ذخیره خبر باید وارد حساب مدیر شوی.");
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
        source_url: newsSource.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const result = existing?.id
        ? await supabase
            .from("billionaire_news")
            .update(payload)
            .eq("id", existing.id)
        : await supabase
            .from("billionaire_news")
            .insert(payload);

      if (result.error) throw result.error;

      setAdminMessage("خبر ذخیره شد.");
      await loadData();
    } catch (error) {
      console.error(error);
      setAdminMessage(
        "ذخیره انجام نشد. ساختار جدول billionaire_news را بررسی کن."
      );
    } finally {
      setSaving(false);
    }
  };  return (
    <main className="eco-page" dir="rtl">
      <div className="eco-glow eco-glow-one" />
      <div className="eco-glow eco-glow-two" />

      <header className="eco-header">
        <a className="eco-brand" href="/billionaires">
          <span className="eco-brand-icon">E</span>
          <span>
            <strong>ECONOVA</strong>
            <small>WEALTH INTELLIGENCE</small>
          </span>
        </a>

        <nav className="eco-nav">
          <a href="#overview">نمای کلی</a>
          <a href="#top-five">ثروتمندان برتر</a>
          <a href="#ranking">رتبه‌بندی</a>
          <a href="#news">اخبار</a>
        </nav>

        <div className="eco-header-actions">
          <span className="eco-live">
            <i />
            داده‌های زنده
          </span>

          {isAdmin ? (
            <button
              className="eco-button eco-button-small"
              onClick={() => void logoutAdmin()}
            >
              خروج مدیر
            </button>
          ) : (
            <button
              className="eco-button eco-button-small"
              onClick={() => setLoginOpen(true)}
            >
              <span>♙</span> ورود مدیر
            </button>
          )}
        </div>
      </header>

      <section className="eco-hero" id="overview">
        <div className="eco-hero-copy">
          <span className="eco-eyebrow">
            <span className="eco-eyebrow-line" />
            نبض ثروت جهان
          </span>

          <h1>
            ثروت جهان را
            <br />
            <span>هوشمندانه</span> دنبال کن.
          </h1>

          <p>
            رتبه‌بندی ثروتمندترین افراد جهان، تغییرات دارایی و
            آخرین خبرها؛ در یک نمای اقتصادی مدرن.
          </p>

          <div className="eco-hero-actions">
            <a className="eco-button" href="#ranking">
              مشاهده رتبه‌بندی
              <span>←</span>
            </a>
            <a className="eco-text-link" href="#news">
              تازه‌ترین خبرها <span>↗</span>
            </a>
          </div>

          <div className="eco-hero-footnote">
            <span className="eco-status-dot" />
            <span>
              {lastUpdated
                ? `آخرین دریافت: ${lastUpdated}`
                : "در انتظار دریافت اطلاعات"}
            </span>
          </div>
        </div>

        <div className="eco-hero-art" aria-hidden="true">
          <div className="eco-orbit eco-orbit-outer" />
          <div className="eco-orbit eco-orbit-inner" />
          <div className="eco-hero-coin">
            <span>$</span>
          </div>
          <div className="eco-floating-card eco-card-top">
            <span className="eco-floating-icon">↗</span>
            <div>
              <small>نمایش هوشمند</small>
              <strong>WEALTH INDEX</strong>
            </div>
          </div>
          <div className="eco-floating-card eco-card-bottom">
            <span className="eco-mini-bars">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
            <div>
              <small>رتبه‌بندی</small>
              <strong>GLOBAL TOP 30</strong>
            </div>
          </div>
        </div>
      </section>

      {errorMessage && (
        <div className="eco-alert" role="status">
          <span>!</span>
          {errorMessage}
          <button onClick={() => void loadData()}>
            تلاش مجدد
          </button>
        </div>
      )}

      <section className="eco-stats-grid">
        <article className="eco-stat-card eco-stat-main">
          <div className="eco-stat-top">
            <span className="eco-stat-label">
              مجموع ثروت ۱۰ نفر اول
            </span>
            <span className="eco-stat-icon">◈</span>
          </div>

          <div className="eco-stat-value">
            <span className="eco-dollar">$</span>
            <strong>
              {animatedTotal.toLocaleString("en-US", {
                maximumFractionDigits: 1,
              })}
            </strong>
            <span className="eco-stat-unit">میلیارد</span>
          </div>

          <div className="eco-stat-bottom">
            <span className="eco-pulse" />
            مجموع دارایی ثبت‌شده در پایگاه داده
          </div>

          <div className="eco-stat-decoration">10</div>
        </article>

        <article className="eco-stat-card">
          <div className="eco-stat-top">
            <span className="eco-stat-label">افراد فهرست</span>
            <span className="eco-stat-icon">♙</span>
          </div>
          <div className="eco-stat-value">
            <strong>{people.length}</strong>
            <span className="eco-stat-unit">نفر</span>
          </div>
          <div className="eco-stat-bottom">
            اطلاعات دریافت‌شده از Supabase
          </div>
        </article>

        <article className="eco-stat-card">
          <div className="eco-stat-top">
            <span className="eco-stat-label">نفر اول فهرست</span>
            <span className="eco-stat-icon">♛</span>
          </div>
          <div className="eco-stat-value eco-stat-name">
            <strong>{sortedPeople[0]?.name ?? "—"}</strong>
          </div>
          <div className="eco-stat-bottom">
            {sortedPeople[0]
              ? `$${formatBillions(
                  toNumber(sortedPeople[0].net_worth_billions)
                )} دارایی ثبت‌شده`
              : "اطلاعات هنوز بارگذاری نشده"}
          </div>
        </article>
      </section>

      <section className="eco-section" id="top-five">
        <div className="eco-section-heading">
          <div>
            <span className="eco-section-kicker">THE ELITE FIVE</span>
            <h2>پنج چهرهٔ برتر ثروت</h2>
            <p>
              نمای نزدیک از پنج رتبهٔ اول فهرست Econova
            </p>
          </div>

          <span className="eco-section-count">01 — 05</span>
        </div>

        {loading && people.length === 0 ? (
          <div className="eco-loading">
            <span className="eco-spinner" />
            در حال دریافت اطلاعات...
          </div>
        ) : (
          <div className="eco-top-five-list">
            {topFive.map((person) => {
              const worth = toNumber(person.net_worth_billions);
              const change = toNumber(person.daily_change_pct);
              const selected = activeRank === person.rank;

              return (
                <button
                  type="button"
                  key={person.id}
                  className={`eco-person-row ${
                    selected ? "is-selected" : ""
                  }`}
                  onClick={() => {
                    setActiveRank(person.rank);
                    if (isAdmin) openNewsEditor(person.rank);
                  }}
                >
                  <span className="eco-person-rank">
                    {String(person.rank).padStart(2, "0")}
                  </span>

                  <span className="eco-person-photo-wrap">
                    <img
                      className="eco-person-photo"
                      src={photoFor(person)}
                      alt={person.name}
                      loading={person.rank <= 5 ? "eager" : "lazy"}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src =
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            person.name
                          )}&background=102b25&color=d7f8a8&size=256`;
                      }}
                    />
                    {person.rank === 1 && (
                      <span className="eco-crown">♛</span>
                    )}
                  </span>

                  <span className="eco-person-info">
                    <strong>{person.name}</strong>
                    <small>
                      {person.company || "شرکت ثبت نشده"}
                      {person.country ? ` · ${person.country}` : ""}
                    </small>
                  </span>

                  <span className="eco-person-worth">
                    <strong>${formatBillions(worth)}</strong>
                    <small>میلیارد دلار</small>
                  </span>

                  <span
                    className={`eco-change ${
                      changeIsPositive(change)
                        ? "eco-change-up"
                        : "eco-change-down"
                    }`}
                  >
                    <span>
                      {changeIsPositive(change) ? "↗" : "↘"}
                    </span>
                    {change > 0 ? "+" : ""}
                    {change.toFixed(2)}%
                  </span>

                  <span className="eco-row-arrow">←</span>
                </button>
              );
            })}
          </div>
        )}

        {activePerson && (
          <div className="eco-feature-person">
            <div className="eco-feature-image">
              <img
                src={photoFor(activePerson)}
                alt={activePerson.name}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src =
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      activePerson.name
                    )}&background=102b25&color=d7f8a8&size=256`;
                }}
              />
              <span className="eco-feature-rank">
                RANK #{activePerson.rank}
              </span>
            </div>

            <div className="eco-feature-content">
              <span className="eco-section-kicker">
                SPOTLIGHT PROFILE
              </span>
              <h3>{activePerson.name}</h3>
              <p className="eco-feature-company">
                {activePerson.company || "اطلاعات شرکت ثبت نشده"}
                {activePerson.country
                  ? ` · ${activePerson.country}`
                  : ""}
              </p>

              <p className="eco-feature-bio">
                {activePerson.bio ||
                  "برای این فرد هنوز زندگی‌نامه‌ای در پایگاه داده ثبت نشده است."}
              </p>

              <div className="eco-feature-metrics">
                <div>
                  <small>ثروت ثبت‌شده</small>
                  <strong>
                    ${formatBillions(
                      toNumber(activePerson.net_worth_billions)
                    )}
                  </strong>
                </div>
                <div>
                  <small>تغییر روزانه</small>
                  <strong
                    className={
                      toNumber(activePerson.daily_change_pct) >= 0
                        ? "eco-positive-text"
                        : "eco-negative-text"
                    }
                  >
                    {toNumber(activePerson.daily_change_pct) > 0
                      ? "+"
                      : ""}
                    {toNumber(
                      activePerson.daily_change_pct
                    ).toFixed(2)}
                    %
                  </strong>
                </div>
              </div>

              {activePerson.source_url && (
                <a
                  className="eco-text-link"
                  href={activePerson.source_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  مشاهده منبع اطلاعات ↗
                </a>
              )}
            </div>
          </div>
        )}
      </section>
        <section className="eco-section" id="ranking">
        <div className="eco-section-heading">
          <div>
            <span className="eco-section-kicker">GLOBAL RANKING</span>
            <h2>جدول ثروتمندان جهان</h2>
            <p>رتبه‌بندی بر اساس دارایی ثبت‌شده در پایگاه داده</p>
          </div>
          <span className="eco-section-count">
            {filteredPeople.length} نفر
          </span>
        </div>

        <div className="eco-table-tools">
          <label className="eco-search">
            <span>⌕</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="جست‌وجوی نام، شرکت یا کشور..."
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
            className="eco-outline-button"
            onClick={() => void loadData()}
            disabled={loading}
          >
            {loading ? "در حال دریافت..." : "↻ به‌روزرسانی"}
          </button>
        </div>

        <div className="eco-table-wrap">
          <table className="eco-table">
            <thead>
              <tr>
                <th>رتبه</th>
                <th>فرد</th>
                <th>شرکت</th>
                <th>کشور</th>
                <th>ثروت (میلیارد دلار)</th>
                <th>تغییر روزانه</th>
              </tr>
            </thead>
            <tbody>
              {visiblePeople.map((person) => {
                const change = toNumber(person.daily_change_pct);

                return (
                  <tr key={person.id}>
                    <td>
                      <span className="eco-table-rank">
                        {String(person.rank).padStart(2, "0")}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="eco-table-person"
                        onClick={() => {
                          setActiveRank(person.rank);
                          document
                            .getElementById("top-five")
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                        }}
                      >
                        <img
                          src={photoFor(person)}
                          alt=""
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src =
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                person.name
                              )}&background=102b25&color=d7f8a8&size=128`;
                          }}
                        />
                        <strong>{person.name}</strong>
                      </button>
                    </td>

                    <td>{person.company || "—"}</td>
                    <td>{person.country || "—"}</td>
                    <td className="eco-table-money">
                      ${formatBillions(
                        toNumber(person.net_worth_billions)
                      )}
                    </td>
                    <td>
                      <span
                        className={`eco-change ${
                          changeIsPositive(change)
                            ? "eco-change-up"
                            : "eco-change-down"
                        }`}
                      >
                        {changeIsPositive(change) ? "↗" : "↘"}
                        {change > 0 ? "+" : ""}
                        {change.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!loading && visiblePeople.length === 0 && (
            <div className="eco-empty">
              فردی با این مشخصات پیدا نشد.
            </div>
          )}

          {filteredPeople.length > 10 && (
            <button
              className="eco-show-more"
              onClick={() => setShowAll((current) => !current)}
            >
              {showAll ? "نمایش ۱۰ نفر اول" : "نمایش همه نتایج"}
              <span>{showAll ? "↑" : "↓"}</span>
            </button>
          )}
        </div>

        <p className="eco-data-note">
          ارزش دارایی‌ها ممکن است با منابع دیگر تفاوت داشته باشد.
          تغییر روزانه فقط زمانی قابل اتکاست که مقدار روز قبل و
          منبع اطلاعات به‌درستی ثبت شده باشند.
        </p>
      </section>

      <section className="eco-section" id="news">
        <div className="eco-section-heading">
          <div>
            <span className="eco-section-kicker">WEALTH NEWS</span>
            <h2>اخبار پنج چهرهٔ برتر</h2>
            <p>
              برای مشاهده خبرهای ثبت‌شده، یکی از افراد را انتخاب کن.
            </p>
          </div>
          <span className="eco-section-count">NEWSROOM</span>
        </div>

        <div className="eco-news-tabs">
          {topFive.map((person) => (
            <button
              key={person.id}
              className={
                activeRank === person.rank ? "is-active" : ""
              }
              onClick={() => {
                setActiveRank(person.rank);
                if (isAdmin) openNewsEditor(person.rank);
              }}
            >
              <img src={photoFor(person)} alt="" loading="lazy" />
              <span>{person.name}</span>
            </button>
          ))}
        </div>

        {activePerson && (
          <article className="eco-news-card">
            <div className="eco-news-avatar">
              <img src={photoFor(activePerson)} alt="" loading="lazy" />
            </div>

            <div className="eco-news-main">
              <span className="eco-section-kicker">
                NEWS · RANK #{activePerson.rank}
              </span>

              {newsForRank(activePerson.rank) ? (
                <>
                  <h3>
                    {String(
                      newsForRank(activePerson.rank)?.title ||
                        `اخبار ${activePerson.name}`
                    )}
                  </h3>
                  <p>
                    {String(
                      newsForRank(activePerson.rank)?.content ??
                        newsForRank(activePerson.rank)?.body ??
                        "متنی برای این خبر ثبت نشده است."
                    )}
                  </p>

                  {newsForRank(activePerson.rank)?.source_url && (
                    <a
                      href={String(
                        newsForRank(activePerson.rank)?.source_url
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="eco-text-link"
                    >
                      مطالعه منبع خبر ↗
                    </a>
                  )}
                </>
              ) : (
                <>
                  <h3>هنوز خبری ثبت نشده است</h3>
                  <p>
                    برای {activePerson.name} خبر اختصاصی در
                    پایگاه داده پیدا نشد.
                  </p>
                </>
              )}

              {isAdmin && (
                <button
                  className="eco-button eco-button-small"
                  onClick={() => openNewsEditor(activePerson.rank)}
                >
                  ویرایش خبر این فرد
                </button>
              )}
            </div>
          </article>
        )}
      </section>

      {isAdmin && (
        <section className="eco-section eco-admin-section" id="admin">
          <div className="eco-section-heading">
            <div>
              <span className="eco-section-kicker">ADMIN WORKSPACE</span>
              <h2>مدیریت خبرها</h2>
              <p>ویرایش خبر مربوط به یکی از پنج نفر اول</p>
            </div>
            <span className="eco-admin-badge">مدیر وارد شده</span>
          </div>

          <div className="eco-admin-form">
            <label>
              انتخاب ثروتمند
              <select
                value={editingNewsRank}
                onChange={(event) => {
                  const rank = Number(event.target.value);
                  openNewsEditor(rank);
                }}
              >
                {topFive.map((person) => (
                  <option key={person.id} value={person.rank}>
                    {person.rank}. {person.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              عنوان خبر
              <input
                value={newsTitle}
                onChange={(event) => setNewsTitle(event.target.value)}
                placeholder="عنوان کوتاه و دقیق خبر"
              />
            </label>

            <label>
              متن خبر
              <textarea
                rows={5}
                value={newsContent}
                onChange={(event) => setNewsContent(event.target.value)}
                placeholder="خلاصه خبر را اینجا وارد کن..."
              />
            </label>

            <label>
              لینک منبع
              <input
                type="url"
                value={newsSource}
                onChange={(event) => setNewsSource(event.target.value)}
                placeholder="https://example.com/news"
                dir="ltr"
              />
            </label>

            <button
              className="eco-button"
              onClick={() => void saveNews()}
              disabled={saving || !newsTitle.trim()}
            >
              {saving ? "در حال ذخیره..." : "ذخیره خبر"}
              <span>↗</span>
            </button>

            {adminMessage && (
              <p className="eco-admin-message" role="status">
                {adminMessage}
              </p>
            )}
          </div>
        </section>
      )}

      {loginOpen && (
        <div
          className="eco-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
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

            <div className="eco-login-icon">E</div>
            <span className="eco-section-kicker">SECURE ACCESS</span>
            <h2 id="eco-login-title">ورود مدیر Econova</h2>
            <p>با حساب مدیر ثبت‌شده در Supabase وارد شو.</p>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void loginAdmin();
              }}
            >
              <label>
                ایمیل مدیر
                <input
                  type="email"
                  autoComplete="username"
                  required
                  value={adminEmail}
                  onChange={(event) =>
                    setAdminEmail(event.target.value)
                  }
                  placeholder="admin@example.com"
                  dir="ltr"
                />
              </label>

              <label>
                رمز عبور
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={adminPassword}
                  onChange={(event) =>
                    setAdminPassword(event.target.value)
                  }
                  placeholder="رمز عبور"
                  dir="ltr"
                />
              </label>

              <button
                type="submit"
                className="eco-button eco-login-submit"
                disabled={saving}
              >
                {saving ? "در حال بررسی..." : "ورود امن"}
              </button>
            </form>

            {adminMessage && (
              <p className="eco-admin-message" role="status">
                {adminMessage}
              </p>
            )}
          </section>
        </div>
      )}
            <footer className="eco-footer">
        <a className="eco-brand" href="/billionaires">
          <span className="eco-brand-icon">E</span>
          <span>
            <strong>ECONOVA</strong>
            <small>WEALTH INTELLIGENCE</small>
          </span>
        </a>

        <p>
          اطلاعات اقتصادی برای آگاهی بیشتر؛ نه توصیهٔ سرمایه‌گذاری.
        </p>

        <a href="#overview" className="eco-back-top">
          بازگشت به بالا ↑
        </a>
      </footer>

      <style jsx global>{`
        :root {
          color-scheme: dark;
          --eco-bg: #07110f;
          --eco-panel: #0d1b17;
          --eco-panel-2: #11251e;
          --eco-border: rgba(206, 245, 214, 0.12);
          --eco-text: #edf7ee;
          --eco-muted: #8da69a;
          --eco-green: #b9f27c;
          --eco-green-dark: #6bbd72;
          --eco-red: #ff8585;
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
          background: var(--eco-bg);
          color: var(--eco-text);
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
          color: inherit;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .eco-page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          padding: 0 6.5%;
          background:
            radial-gradient(
              ellipse at 85% 7%,
              rgba(47, 105, 68, 0.15),
              transparent 35%
            ),
            var(--eco-bg);
          isolation: isolate;
        }

        .eco-glow {
          position: absolute;
          z-index: -1;
          pointer-events: none;
          width: 340px;
          height: 340px;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.12;
        }

        .eco-glow-one {
          top: 500px;
          right: -220px;
          background: #7bea90;
        }

        .eco-glow-two {
          top: 1500px;
          left: -230px;
          background: #369c79;
        }

        .eco-header {
          min-height: 82px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          border-bottom: 1px solid var(--eco-border);
        }

        .eco-brand {
          display: inline-flex;
          align-items: center;
          gap: 11px;
          flex-shrink: 0;
        }

        .eco-brand-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: var(--eco-green);
          color: #102017;
          font-size: 24px;
          font-weight: 900;
        }

        .eco-brand strong,
        .eco-brand small {
          display: block;
          direction: ltr;
          text-align: left;
        }

        .eco-brand strong {
          font-size: 16px;
          letter-spacing: 1.5px;
        }

        .eco-brand small {
          margin-top: 4px;
          font-size: 8px;
          letter-spacing: 1.6px;
          color: var(--eco-muted);
        }

        .eco-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 26px;
          font-size: 12px;
          color: #a9bcb0;
        }

        .eco-nav a,
        .eco-text-link,
        .eco-back-top {
          transition: color 0.2s ease;
        }

        .eco-nav a:hover,
        .eco-text-link:hover,
        .eco-back-top:hover {
          color: var(--eco-green);
        }

        .eco-header-actions {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .eco-live {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 10px;
          color: var(--eco-muted);
          white-space: nowrap;
        }

        .eco-live i,
        .eco-status-dot,
        .eco-pulse {
          display: inline-block;
          width: 7px;
          height: 7px;
          background: var(--eco-green);
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(185, 242, 124, 0.5);
        }

        .eco-button,
        .eco-outline-button {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 0 20px;
          border: 1px solid transparent;
          border-radius: 10px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          transition:
            transform 0.2s ease,
            background 0.2s ease,
            border-color 0.2s ease;
        }

        .eco-button {
          background: var(--eco-green);
          color: #132219;
        }

        .eco-button:hover {
          background: #d1ff9f;
          transform: translateY(-2px);
        }

        .eco-button:disabled,
        .eco-outline-button:disabled {
          opacity: 0.55;
          cursor: wait;
          transform: none;
        }

        .eco-button-small {
          min-height: 36px;
          padding: 0 13px;
          font-size: 11px;
        }

        .eco-outline-button {
          background: transparent;
          color: var(--eco-text);
          border-color: var(--eco-border);
        }

        .eco-outline-button:hover {
          border-color: var(--eco-green);
        }

        .eco-hero {
          min-height: 440px;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          align-items: center;
          gap: 30px;
          padding: 46px 0 35px;
        }

        .eco-hero-copy {
          max-width: 610px;
        }

        .eco-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: var(--eco-green);
          font-size: 12px;
        }

        .eco-eyebrow-line {
          width: 26px;
          height: 1px;
          background: var(--eco-green);
        }

        .eco-hero h1 {
          margin: 22px 0 17px;
          font-size: clamp(36px, 4.8vw, 62px);
          line-height: 1.5;
          letter-spacing: -1.7px;
        }

        .eco-hero h1 span {
          color: var(--eco-green);
        }

        .eco-hero-copy > p {
          max-width: 440px;
          margin: 0;
          color: var(--eco-muted);
          font-size: 13px;
          line-height: 2.2;
        }

        .eco-hero-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 23px;
          margin-top: 27px;
        }

        .eco-text-link {
          color: #c6d8ca;
          font-size: 12px;
        }

        .eco-hero-footnote {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 29px;
          color: var(--eco-muted);
          font-size: 10px;
        }

        .eco-hero-art {
          min-height: 340px;
          position: relative;
          display: grid;
          place-items: center;
        }

        .eco-orbit {
          position: absolute;
          border: 1px solid rgba(185, 242, 124, 0.18);
          border-radius: 50%;
          transform: rotate(-22deg);
        }

        .eco-orbit-outer {
          width: min(340px, 80%);
          height: 250px;
        }

        .eco-orbit-inner {
          width: min(270px, 65%);
          height: 340px;
          transform: rotate(35deg);
          border-color: rgba(185, 242, 124, 0.11);
        }

        .eco-hero-coin {
          width: 180px;
          height: 180px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          border: 1px solid rgba(185, 242, 124, 0.45);
          background:
            radial-gradient(circle at 30% 25%, #294a34, #0d1b13 72%);
          box-shadow:
            0 0 70px rgba(110, 218, 121, 0.13),
            inset 0 0 35px rgba(185, 242, 124, 0.08);
          animation: eco-float 5s ease-in-out infinite;
        }

        .eco-hero-coin span {
          color: var(--eco-green);
          font-family: Arial, sans-serif;
          font-size: 100px;
          font-weight: 300;
          text-shadow: 0 0 25px rgba(185, 242, 124, 0.25);
        }

        .eco-floating-card {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border: 1px solid var(--eco-border);
          border-radius: 13px;
          background: rgba(13, 27, 23, 0.92);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(12px);
        }

        .eco-card-top {
          top: 45px;
          right: 0;
        }

        .eco-card-bottom {
          bottom: 35px;
          left: 0;
        }

        .eco-floating-card small,
        .eco-floating-card strong {
          display: block;
          direction: ltr;
          text-align: left;
        }

        .eco-floating-card small {
          margin-bottom: 6px;
          color: var(--eco-muted);
          font-size: 9px;
        }

        .eco-floating-card strong {
          font-size: 10px;
          letter-spacing: 0.8px;
        }

        .eco-floating-icon {
          display: grid;
          place-items: center;
          width: 35px;
          height: 35px;
          border-radius: 10px;
          background: rgba(185, 242, 124, 0.12);
          color: var(--eco-green);
        }

        .eco-mini-bars {
          height: 33px;
          display: flex;
          align-items: end;
          gap: 4px;
        }

        .eco-mini-bars i {
          width: 5px;
          border-radius: 4px;
          background: var(--eco-green);
        }

        .eco-mini-bars i:nth-child(1) { height: 12px; }
        .eco-mini-bars i:nth-child(2) { height: 20px; }
        .eco-mini-bars i:nth-child(3) { height: 16px; }
        .eco-mini-bars i:nth-child(4) { height: 28px; }
        .eco-mini-bars i:nth-child(5) { height: 33px; }

        .eco-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin: 12px 0 20px;
          padding: 14px 16px;
          border: 1px solid rgba(255, 191, 100, 0.25);
          border-radius: 10px;
          background: rgba(255, 191, 100, 0.06);
          color: #f2d6a7;
          font-size: 12px;
          line-height: 1.8;
        }

        .eco-alert button {
          margin-right: auto;
          padding: 7px 11px;
          border: 1px solid var(--eco-border);
          border-radius: 7px;
          background: transparent;
          cursor: pointer;
        }

        .eco-stats-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr;
          gap: 15px;
          margin: 12px 0 85px;
        }

        .eco-stat-card {
          min-height: 165px;
          position: relative;
          overflow: hidden;
          padding: 22px;
          border: 1px solid var(--eco-border);
          border-radius: 16px;
          background: linear-gradient(145deg, #10221b, #0b1713);
        }

        .eco-stat-main {
          background:
            radial-gradient(circle at 85% 20%, rgba(185, 242, 124, 0.12), transparent 42%),
            linear-gradient(145deg, #142b20, #0b1713);
        }

        .eco-stat-top,
        .eco-stat-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .eco-stat-label {
          color: var(--eco-muted);
          font-size: 11px;
        }

        .eco-stat-icon {
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          border: 1px solid var(--eco-border);
          border-radius: 9px;
          color: var(--eco-green);
        }

        .eco-stat-value {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 7px;
          margin: 18px 0 14px;
        }

        .eco-stat-value strong {
          font-family: Arial, sans-serif;
          font-size: clamp(25px, 3vw, 38px);
          letter-spacing: -1px;
        }

        .eco-dollar {
          color: var(--eco-green);
          font-family: Arial, sans-serif;
          font-size: 24px;
        }

        .eco-stat-unit {
          color: var(--eco-muted);
          font-size: 10px;
        }

        .eco-stat-bottom {
          justify-content: flex-start;
          color: var(--eco-muted);
          font-size: 10px;
        }

        .eco-stat-name strong {
          font-family: Tahoma, Arial, sans-serif;
          font-size: clamp(17px, 2vw, 24px);
          letter-spacing: 0;
        }

        .eco-stat-decoration {
          position: absolute;
          left: 12px;
          bottom: -28px;
          color: rgba(185, 242, 124, 0.035);
          font-family: Arial, sans-serif;
          font-size: 125px;
          font-weight: 900;
          pointer-events: none;
        }

        .eco-section {
          margin: 0 0 88px;
          scroll-margin-top: 25px;
        }

        .eco-section-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 25px;
        }

        .eco-section-kicker {
          display: block;
          margin-bottom: 10px;
          color: var(--eco-green);
          font-family: Arial, sans-serif;
          font-size: 9px;
          letter-spacing: 2px;
          direction: ltr;
          text-align: right;
        }

        .eco-section-heading h2 {
          margin: 0;
          font-size: clamp(23px, 3vw, 31px);
        }

        .eco-section-heading p {
          margin: 11px 0 0;
          color: var(--eco-muted);
          font-size: 11px;
          line-height: 2;
        }

        .eco-section-count {
          color: var(--eco-muted);
          font-family: Arial, sans-serif;
          font-size: 11px;
          letter-spacing: 1px;
          white-space: nowrap;
        }

        .eco-top-five-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .eco-person-row {
          width: 100%;
          min-height: 92px;
          display: grid;
          grid-template-columns: 38px 58px minmax(120px, 1fr) minmax(110px, 0.6fr) 95px 20px;
          align-items: center;
          gap: 15px;
          padding: 14px 19px;
          border: 1px solid var(--eco-border);
          border-radius: 13px;
          background: rgba(13, 27, 23, 0.76);
          text-align: right;
          cursor: pointer;
          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            transform 0.2s ease;
        }

        .eco-person-row:hover,
        .eco-person-row.is-selected {
          border-color: rgba(185, 242, 124, 0.5);
          background: linear-gradient(100deg, rgba(185, 242, 124, 0.06), #102019);
        }

        .eco-person-row:hover {
          transform: translateX(-3px);
        }

        .eco-person-rank {
          color: #748b7d;
          font-family: Arial, sans-serif;
          font-size: 16px;
        }

        .eco-person-photo-wrap {
          position: relative;
          display: block;
          width: 54px;
          height: 54px;
        }

        .eco-person-photo {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          border: 1px solid rgba(185, 242, 124, 0.25);
          border-radius: 50%;
          background: var(--eco-panel-2);
        }

        .eco-crown {
          position: absolute;
          top: -9px;
          right: -6px;
          color: var(--eco-green);
          font-size: 17px;
          filter: drop-shadow(0 0 6px rgba(185, 242, 124, 0.4));
        }

        .eco-person-info,
        .eco-person-worth {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .eco-person-info strong {
          overflow-wrap: anywhere;
          font-size: 13px;
        }

        .eco-person-info small,
        .eco-person-worth small {
          color: var(--eco-muted);
          font-size: 10px;
          line-height: 1.8;
        }

        .eco-person-worth strong {
          direction: ltr;
          text-align: right;
          color: var(--eco-green);
          font-family: Arial, sans-serif;
          font-size: 18px;
        }

        .eco-change {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          direction: ltr;
          font-family: Arial, sans-serif;
          font-size: 11px;
          white-space: nowrap;
        }

        .eco-change-up,
        .eco-positive-text {
          color: #91e4a3;
        }

        .eco-change-down,
        .eco-negative-text {
          color: var(--eco-red);
        }

        .eco-row-arrow {
          color: var(--eco-muted);
          font-size: 15px;
        }

        .eco-feature-person {
          display: grid;
          grid-template-columns: 250px 1fr;
          gap: 30px;
          margin-top: 20px;
          padding: 23px;
          border: 1px solid var(--eco-border);
          border-radius: 16px;
          background: linear-gradient(135deg, #10231a, #0b1713);
        }

        .eco-feature-image {
          position: relative;
          min-height: 250px;
          overflow: hidden;
          border-radius: 12px;
          background: var(--eco-panel-2);
        }

        .eco-feature-image img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .eco-feature-rank {
          position: absolute;
          right: 12px;
          bottom: 12px;
          padding: 8px 10px;
          border: 1px solid var(--eco-border);
          border-radius: 7px;
          background: rgba(7, 17, 15, 0.85);
          color: var(--eco-green);
          font-family: Arial, sans-serif;
          font-size: 10px;
        }

        .eco-feature-content {
          padding: 7px 0;
        }

        .eco-feature-content h3 {
          margin: 12px 0 7px;
          font-size: 25px;
        }

        .eco-feature-company {
          color: var(--eco-green);
          font-size: 11px;
        }

        .eco-feature-bio {
          color: var(--eco-muted);
          font-size: 12px;
          line-height: 2.2;
        }

        .eco-feature-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 35px;
          margin: 22px 0;
        }

        .eco-feature-metrics div {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .eco-feature-metrics small {
          color: var(--eco-muted);
          font-size: 10px;
        }

        .eco-feature-metrics strong {
          font-family: Arial, sans-serif;
          font-size: 19px;
        }

        .eco-loading,
        .eco-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 130px;
          color: var(--eco-muted);
          font-size: 12px;
        }

        .eco-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--eco-border);
          border-top-color: var(--eco-green);
          border-radius: 50%;
          animation: eco-spin 0.8s linear infinite;
        }

        .eco-table-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 15px;
}

.eco-search {
  min-width: min(100%, 310px);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 13px;
  border: 1px solid var(--eco-border);
  border-radius: 10px;
  background: var(--eco-panel);
  color: var(--eco-muted);
}

.eco-search input {
  width: 100%;
  min-height: 43px;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--eco-text);
  font-size: 11px;
}

.eco-search button {
  border: 0;
  background: transparent;
  color: var(--eco-muted);
  cursor: pointer;
}

.eco-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--eco-border);
  border-radius: 13px;
  background: rgba(13, 27, 23, 0.76);
}

.eco-table {
  width: 100%;
  border-collapse: collapse;
  text-align: right;
  white-space: nowrap;
  font-size: 11px;
}

.eco-table th {
  padding: 17px 15px;
  background: rgba(185, 242, 124, 0.035);
  color: var(--eco-muted);
  font-size: 10px;
  font-weight: 500;
}

.eco-table td {
  padding: 13px 15px;
  border-top: 1px solid rgba(206, 245, 214, 0.07);
}

.eco-table tbody tr {
  transition: background 0.2s ease;
}

.eco-table tbody tr:hover {
  background: rgba(185, 242, 124, 0.035);
}

.eco-table-rank {
  color: var(--eco-green);
  font-family: Arial, sans-serif;
}

.eco-table-person {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: right;
  cursor: pointer;
}

.eco-table-person img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--eco-panel-2);
}

.eco-table-person strong {
  font-size: 11px;
}

.eco-table-money {
  color: var(--eco-green);
  font-family: Arial, sans-serif;
}

.eco-show-more {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 49px;
  border: 0;
  border-top: 1px solid var(--eco-border);
  background: transparent;
  color: var(--eco-green);
  cursor: pointer;
  font-size: 11px;
}

.eco-data-note {
  margin-top: 14px;
  color: var(--eco-muted);
  font-size: 10px;
  line-height: 2;
}

.eco-news-tabs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 3px 0 15px;
  scrollbar-width: thin;
  scrollbar-color: #355240 transparent;
}

.eco-news-tabs button {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 13px;
  border: 1px solid var(--eco-border);
  border-radius: 10px;
  background: var(--eco-panel);
  color: var(--eco-muted);
  cursor: pointer;
  font-size: 11px;
}

.eco-news-tabs button.is-active {
  border-color: var(--eco-green);
  background: rgba(185, 242, 124, 0.08);
  color: var(--eco-text);
}

.eco-news-tabs img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--eco-panel-2);
}

.eco-news-card {
  display: grid;
  grid-template-columns: 85px 1fr;
  gap: 20px;
  padding: 24px;
  border: 1px solid var(--eco-border);
  border-radius: 15px;
  background: linear-gradient(130deg, #10231a, #0b1713);
}

.eco-news-avatar img {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  object-fit: cover;
  background: var(--eco-panel-2);
}

.eco-news-main h3 {
  margin: 8px 0 12px;
  font-size: 19px;
  line-height: 1.8;
}

.eco-news-main p {
  color: var(--eco-muted);
  font-size: 12px;
  line-height: 2.2;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.eco-news-main .eco-button {
  margin-top: 10px;
}

.eco-admin-section {
  padding: 25px;
  border: 1px solid var(--eco-border);
  border-radius: 16px;
  background: rgba(13, 27, 23, 0.76);
}

.eco-admin-badge {
  padding: 8px 10px;
  border: 1px solid rgba(185, 242, 124, 0.25);
  border-radius: 8px;
  color: var(--eco-green);
  font-size: 10px;
}

.eco-admin-form,
.eco-login-modal form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.eco-admin-form label,
.eco-login-modal label {
  display: flex;
  flex-direction: column;
  gap: 9px;
  color: #b5c7ba;
  font-size: 11px;
}

.eco-admin-form input,
.eco-admin-form textarea,
.eco-admin-form select,
.eco-login-modal input {
  width: 100%;
  min-height: 43px;
  padding: 12px;
  border: 1px solid var(--eco-border);
  border-radius: 9px;
  outline: 0;
  background: #08130f;
  color: var(--eco-text);
  font-size:     12px;
}

.eco-admin-form textarea {
  resize: vertical;
  line-height: 2;
}

.eco-admin-form input:focus,
.eco-admin-form textarea:focus,
.eco-admin-form select:focus,
.eco-login-modal input:focus {
  border-color: rgba(185, 242, 124, 0.6);
}

.eco-admin-form .eco-button {
  align-self: flex-start;
}

.eco-admin-message {
  margin: 0;
  color: var(--eco-green);
  font-size: 11px;
  line-height: 1.9;
}

.eco-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  overflow-y: auto;
  padding: 20px;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(8px);
}

.eco-login-modal {
  width: min(100%, 420px);
  position: relative;
  padding: 30px;
  border: 1px solid var(--eco-border);
  border-radius: 18px;
  background: #0d1b17;
  box-shadow: 0 25px 100px rgba(0, 0, 0, 0.4);
}

.eco-modal-close {
  position: absolute;
  top: 12px;
  left: 14px;
  width: 33px;
  height: 33px;
  border: 1px solid var(--eco-border);
  border-radius: 8px;
  background: transparent;
  color: var(--eco-muted);
  cursor: pointer;
  font-size: 20px;
}

.eco-login-icon {
  width: 45px;
  height: 45px;
  display: grid;
  place-items: center;
  margin-bottom: 20px;
  border-radius: 13px;
  background: var(--eco-green);
  color: #102017;
  font-size: 26px;
  font-weight: 900;
}

.eco-login-modal h2 {
  margin: 8px 0;
  font-size: 23px;
}

.eco-login-modal > p {
  margin: 0 0 24px;
  color: var(--eco-muted);
  font-size: 11px;
  line-height: 2;
}

.eco-login-submit {
  width: 100%;
  margin-top: 5px;
}

.eco-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 18px;
  padding: 25px 0;
  border-top: 1px solid var(--eco-border);
}

.eco-footer > p {
  color: var(--eco-muted);
  font-size: 10px;
  line-height: 1.8;
}

.eco-back-top {
  color: var(--eco-muted);
  font-size: 11px;
}

@keyframes eco-float {
  0%, 100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-9px);
  }
}

@keyframes eco-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1000px) {
  .eco-stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .eco-stat-main {
    grid-column: 1 / -1;
  }

  .eco-feature-person {
    grid-template-columns: 210px 1fr;
  }
}

@media (max-width: 720px) {
  .eco-header {
    flex-wrap: wrap;
    gap: 12px;
    padding: 13px 0;
  }

  .eco-nav {
    order: 3;
    width: 100%;
    justify-content: flex-start;
    overflow-x: auto;
    padding: 8px 0 2px;
    gap: 22px;
    white-space: nowrap;
  }

  .eco-hero {
    grid-template-columns: 1fr;
    padding: 44px 0 25px;
  }

  .eco-hero-art {
    min-height: 290px;
  }

  .eco-stats-grid {
    gap: 10px;
    margin-bottom: 60px;
  }

  .eco-section {
    margin-bottom: 60px;
  }

  .eco-person-row {
    grid-template-columns: 24px 43px minmax(0, 1fr) auto;
    grid-template-rows: auto auto;
    gap: 9px;
    min-height: 78px;
    padding: 10px;
  }

  .eco-person-row .eco-person-info {
    grid-column: 3 / 5;
    grid-row: 1;
  }

  .eco-person-row .eco-person-worth {
    grid-column: 3;
    grid-row: 2;
    flex-direction: row;
    gap: 5px;
  }

  .eco-person-row .eco-change {
    grid-column: 4;
    grid-row: 2;
    justify-self: end;
  }

  .eco-person-row .eco-row-arrow {
    display: none;
  }

  .eco-person-row .eco-person-rank,
  .eco-person-row .eco-person-photo-wrap {
    grid-row: 1 / 3;
  }

  .eco-feature-person {
    grid-template-columns: 1fr;
  }

  .eco-table {
    min-width: 680px;
  }

  .eco-news-card {
    grid-template-columns: 55px 1fr;
    gap: 13px;
    padding: 15px;
  }

  .eco-news-avatar img {
    width: 54px;
    height: 54px;
  }

  .eco-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
    `}</style>
  </main>
);
}
