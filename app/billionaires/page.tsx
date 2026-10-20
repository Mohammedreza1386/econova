"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const SUPABASE_URL =
  "https://zusbebjskchgehdjvpsm.supabase.co || "";
  "https://zusbebjskchgehdjvpsm.supabase.co";

const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

type Billionaire = {
  rank: number;
  name: string;
  company?: string | null;
  country?: string | null;
  net_worth_billions: number | string;
  daily_change_pct?: number | string | null;
  updated_at?: string | null;
  source_url?: string | null;
  source_checked_at?: string | null;
  image_url?: string | null;
};

type BillionaireNews = {
  billionaire_rank: number;
  title: string;
  content: string;
  updated_at?: string;
};

const EMPTY_NEWS: BillionaireNews[] = [1, 2, 3, 4, 5].map((rank) => ({
  billionaire_rank: rank,
  title: "",
  content: "",
}));

const formatWealth = (value: number) =>
  "$" +
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value) +
  "B";

const formatDate = (value?: string | null) => {
  if (!value) return "نامشخص";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "نامشخص";
  return date.toLocaleString("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function BillionairesPage() {
  const [people, setPeople] = useState<Billionaire[]>([]);
  const [news, setNews] = useState<BillionaireNews[]>(EMPTY_NEWS);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [animatedTotal, setAnimatedTotal] = useState(0);

  const [accessToken, setAccessToken] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [editingRank, setEditingRank] = useState<number | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [savingNews, setSavingNews] = useState(false);
  const [newsMessage, setNewsMessage] = useState("");

  const apiHeaders = useMemo(
    () => ({
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
    }),
    []
  );

  const topFive = useMemo(
    () => people.filter((person) => person.rank >= 1 && person.rank <= 5)
      .sort((a, b) => a.rank - b.rank),
    [people]
  );

  const topThirty = useMemo(
    () => [...people].sort((a, b) => a.rank - b.rank).slice(0, 30),
    [people]
  );

  const topTenTotal = useMemo(
    () =>
      people
        .filter((person) => person.rank <= 10)
        .reduce(
          (total, person) => total + Number(person.net_worth_billions || 0),
          0
        ),
    [people]
  );

  const getNews = useCallback(async () => {
    if (!SUPABASE_KEY) return;

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/billionaire_news?select=billionaire_rank,title,content,updated_at&order=billionaire_rank.asc`,
        { headers: apiHeaders, cache: "no-store" }
      );

      if (!response.ok) throw new Error("خواندن خبرها موفق نبود.");

      const rows = (await response.json()) as BillionaireNews[];
      setNews(
        EMPTY_NEWS.map(
          (empty) =>
            rows.find(
              (item) => item.billionaire_rank === empty.billionaire_rank
            ) ?? empty
        )
      );
    } catch {
      setNews(EMPTY_NEWS);
      setNewsMessage("خبرها بارگذاری نشدند؛ اتصال Supabase را بررسی کن.");
    }
  }, [apiHeaders]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAccessToken(window.localStorage.getItem("econova_admin_token") ?? "");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPeople() {
      setLoading(true);
      setPageError("");

      try {
        if (!SUPABASE_KEY) {
          throw new Error(
            "کلید عمومی Supabase تنظیم نشده است. متغیر NEXT_PUBLIC_SUPABASE_ANON_KEY را در تنظیمات پروژه وارد کن."
          );
        }

        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/billionaires?select=rank,name,company,country,net_worth_billions,daily_change_pct,updated_at,source_url,source_checked_at&order=rank.asc&limit=30`,
          { headers: apiHeaders, cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("دریافت فهرست ثروتمندان از Supabase ناموفق بود.");
        }

        const rows = (await response.json()) as Billionaire[];
        if (!cancelled) setPeople(rows);

        const newsResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/billionaire_news?select=billionaire_rank,title,content,updated_at&order=billionaire_rank.asc`,
          { headers: apiHeaders, cache: "no-store" }
        );

        if (newsResponse.ok) {
          const newsRows = (await newsResponse.json()) as BillionaireNews[];
          if (!cancelled) {
            setNews(
              EMPTY_NEWS.map(
                (empty) =>
                  newsRows.find(
                    (item) =>
                      item.billionaire_rank === empty.billionaire_rank
                  ) ?? empty
              )
            );
          }
        }
      } catch (error) {
        if (!cancelled) {
          setPageError(
            error instanceof Error ? error.message : "خطای نامشخص رخ داد."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPeople();
    return () => {
      cancelled = true;
    };
  }, [apiHeaders]);

  useEffect(() => {
    if (topFive.length === 0) return;

    let cancelled = false;
    const names = topFive.map((person) => person.name).filter(Boolean);

    async function loadPhotos() {
      const entries = await Promise.all(
        names.map(async (name) => {
          try {
            const url =
              "https://en.wikipedia.org/w/api.php?action=query&generator=search" +
              `&gsrsearch=${encodeURIComponent(name)}` +
              "&gsrnamespace=0&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=300&format=json&origin=*";

            const response = await fetch(url);
            if (!response.ok) return [name, ""] as const;

            const data = await response.json();
            const page = Object.values(
              data?.query?.pages ?? {}
            )[0] as { thumbnail?: { source?: string } } | undefined;

            return [name, page?.thumbnail?.source ?? ""] as const;
          } catch {
            return [name, ""] as const;
          }
        })
      );

      if (!cancelled) {
        setPhotos((previous) => ({
          ...previous,
          ...Object.fromEntries(entries.filter((entry) => entry[1])),
        }));
      }
    }

    void loadPhotos();
    return () => {
      cancelled = true;
    };
  }, [topFive]);

  useEffect(() => {
    const target = topTenTotal;
    const duration = 1200;
    const start = performance.now();
    let frame = 0;

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedTotal(target * eased);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [topTenTotal]);

  async function handleAdminLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginBusy(true);
    setLoginError("");

    try {
      const response = await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: apiHeaders,
          body: JSON.stringify({
            email: adminEmail,
            password: adminPassword,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.access_token) {
        throw new Error("ورود انجام نشد؛ ایمیل و رمز را بررسی کن.");
      }

      const role = result.user?.app_metadata?.role;
      if (role !== "admin") {
        throw new Error(
          "این حساب نقش مدیر ندارد. ابتدا app_metadata نقش admin را برای حساب مدیر تنظیم کن."
        );
      }

      window.localStorage.setItem("econova_admin_token", result.access_token);
      setAccessToken(result.access_token);
      setAdminPassword("");
      setLoginOpen(false);
      setLoginError("");
      setNewsMessage("ورود مدیر با موفقیت انجام شد.");
    } catch (error) {
      setLoginError(
        error instanceof Error ? error.message : "ورود ناموفق بود."
      );
    } finally {
      setLoginBusy(false);
    }
  }

  function handleLogout() {
    window.localStorage.removeItem("econova_admin_token");
    setAccessToken("");
    setEditingRank(null);
    setNewsMessage("از حساب مدیر خارج شدی.");
  }

  function beginEdit(item: Billionaire) {
    const current = news.find((entry) => entry.billionaire_rank === item.rank);
    setEditingRank(item.rank);
    setDraftTitle(current?.title ?? "");
    setDraftContent(current?.content ?? "");
    setNewsMessage("");
  }

  async function saveNews(rank: number) {
    if (!accessToken) {
      setNewsMessage("برای ذخیره خبر باید وارد حساب مدیر شوی.");
      return;
    }

    setSavingNews(true);
    setNewsMessage("");

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/billionaire_news?on_conflict=billionaire_rank`,
        {
          method: "POST",
          headers: {
            ...apiHeaders,
            Authorization: `Bearer ${accessToken}`,
            Prefer: "resolution=merge-duplicates,return=representation",
          },
          body: JSON.stringify({
            billionaire_rank: rank,
            title: draftTitle.trim(),
            content: draftContent.trim(),
            updated_at: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        const details = await response.text();
        throw new Error(
          details.includes("403") || details.includes("42501")
            ? "اجازه ذخیره نداری؛ نقش مدیر و سیاست‌های RLS را بررسی کن."
            : "ذخیره خبر ناموفق بود. اتصال و تنظیمات Supabase را بررسی کن."
        );
      }

      const updated: BillionaireNews = {
        billionaire_rank: rank,
        title: draftTitle.trim(),
        content: draftContent.trim(),
        updated_at: new Date().toISOString(),
      };

      setNews((previous) => [
        ...previous.filter((item) => item.billionaire_rank !== rank),
        updated,
      ].sort((a, b) => a.billionaire_rank - b.billionaire_rank));

      setEditingRank(null);
      setNewsMessage(`خبر نفر رتبه ${rank} ذخیره شد.`);
    } catch (error) {
      setNewsMessage(
        error instanceof Error ? error.message : "ذخیره خبر ناموفق بود."
      );
    } finally {
      setSavingNews(false);
    }
  }

  return (    <>
      <main className="econova-page" dir="rtl">
        <header className="page-header">
          <a className="brand" href="/">ECONOVA<span>.</span></a>
          <div className="header-label">شاخص ثروت جهان</div>
        </header>

        <section className="hero">
          <div className="eyebrow">GLOBAL WEALTH TRACKER</div>
          <h1>ثروتمندترین افراد <span>جهان</span></h1>
          <p>
            رتبه‌بندی ثروتمندان جهان، ارزش دارایی‌ها و آخرین خبرهای اختصاصی
            هرکدام از پنج نفر برتر.
          </p>
          <div className="hero-stats">
            <div className="stat-box">
              <span>مجموع ثروت ۱۰ نفر اول</span>
              <strong>{formatWealth(animatedTotal)}</strong>
            </div>
            <div className="stat-box">
              <span>افراد نمایش‌داده‌شده</span>
              <strong>{topThirty.length} نفر</strong>
            </div>
          </div>
        </section>

        {pageError && (
          <div className="notice error-notice">
            {pageError}
          </div>
        )}

        <section className="section-block">
          <div className="section-heading">
            <div>
              <div className="eyebrow">THE TOP FIVE</div>
              <h2>پنج ثروتمند برتر</h2>
              <p>برای هر شخص، بخش خبر جداگانه در نظر گرفته شده است.</p>
            </div>
            <span className="gold-chip">TOP 5</span>
          </div>

          {loading ? (
            <div className="loading-panel">در حال دریافت اطلاعات ثروتمندان…</div>
          ) : topFive.length === 0 ? (
            <div className="loading-panel">
              اطلاعاتی برای نمایش پیدا نشد. اتصال جدول billionaires را بررسی کن.
            </div>
          ) : (
            <div className="top-list">
              {topFive.map((person) => {
                const personNews = news.find(
                  (item) => item.billionaire_rank === person.rank
                );
                const isEditing = editingRank === person.rank;
                const imageUrl =
                  person.image_url || photos[person.name] || "";

                return (
                  <article className="person-card" key={person.rank}>
                    <div className="person-main">
                      <div className="rank-badge">
                        {String(person.rank).padStart(2, "0")}
                      </div>

                      <div className="person-photo">
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageUrl} alt={person.name} />
                        ) : (
                          <div className="photo-placeholder">
                            {person.name?.trim().charAt(0) || "?"}
                          </div>
                        )}
                      </div>

                      <div className="person-info">
                        <h3>{person.name}</h3>
                        <p className="person-company">
                          {person.company || "شرکت ثبت نشده"}
                        </p>
                        <p className="person-country">
                          {person.country || "کشور نامشخص"}
                        </p>
                      </div>

                      <div className="person-wealth">
                        <span>ثروت تخمینی</span>
                        <strong>
                          {formatWealth(Number(person.net_worth_billions || 0))}
                        </strong>
                        {person.daily_change_pct !== null &&
                          person.daily_change_pct !== undefined && (
                            <small
                              className={
                                Number(person.daily_change_pct) >= 0
                                  ? "change-positive"
                                  : "change-negative"
                              }
                            >
                              {Number(person.daily_change_pct) > 0 ? "+" : ""}
                              {Number(person.daily_change_pct)}%
                            </small>
                          )}
                      </div>
                    </div>

                    <section className="person-news">
                      <div className="news-heading">
                        <div>
                          <span className="news-kicker">NEWS / #{person.rank}</span>
                          <h4>خبر اختصاصی {person.name}</h4>
                        </div>

                        {accessToken && !isEditing && (
                          <button
                            className="outline-button"
                            onClick={() => beginEdit(person)}
                          >
                            ویرایش خبر
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="news-editor">
                          <label>
                            عنوان خبر
                            <input
                              value={draftTitle}
                              onChange={(event) =>
                                setDraftTitle(event.target.value)
                              }
                              maxLength={180}
                              placeholder="عنوان خبر این شخص را بنویس…"
                            />
                          </label>

                          <label>
                            متن خبر
                            <textarea
                              value={draftContent}
                              onChange={(event) =>
                                setDraftContent(event.target.value)
                              }
                              rows={5}
                              maxLength={12000}
                              placeholder="متن خبر را اینجا بنویس…"
                            />
                          </label>

                          <div className="editor-actions">
                            <button
                              className="primary-button"
                              disabled={savingNews}
                              onClick={() => void saveNews(person.rank)}
                            >
                              {savingNews ? "در حال ذخیره…" : "ذخیره خبر"}
                            </button>
                            <button
                              className="quiet-button"
                              disabled={savingNews}
                              onClick={() => setEditingRank(null)}
                            >
                              انصراف
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="news-content">
                          {personNews?.title || personNews?.content ? (
                            <>
                              {personNews.title && (
                                <h5>{personNews.title}</h5>
                              )}
                              {personNews.content ? (
                                <p className="news-body">
                                  {personNews.content}
                                </p>
                              ) : (
                                <p className="empty-news">
                                  هنوز متنی برای این خبر ثبت نشده است.
                                </p>
                              )}
                              {personNews.updated_at && (
                                <small className="news-date">
                                  آخرین ویرایش: {formatDate(personNews.updated_at)}
                                </small>
                              )}
                            </>
                          ) : (
                            <div className="empty-news">
                              هنوز خبری برای این شخص منتشر نشده است.
                              {accessToken && (
                                <button
                                  className="text-button"
                                  onClick={() => beginEdit(person)}
                                >
                                  اولین خبر را اضافه کن
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <div className="eyebrow">RANKING / 01—30</div>
              <h2>فهرست ۳۰ ثروتمند برتر</h2>
              <p>فهرست فشرده با رتبه، نام، کشور و ثروت تخمینی.</p>
            </div>
            <span className="gold-chip">{topThirty.length} نفر</span>
          </div>

          <div className="table-wrap">
            <table className="billionaires-table">
              <thead>
                <tr>
                  <th>رتبه</th>
                  <th>نام</th>
                  <th>شرکت</th>
                  <th>کشور</th>
                  <th>ثروت</th>
                </tr>
              </thead>
              <tbody>
                {topThirty.map((person) => (
                  <tr key={person.rank}>
                    <td>
                      <span className="table-rank">
                        {String(person.rank).padStart(2, "0")}
                      </span>
                    </td>
                    <td className="table-name">{person.name}</td>
                    <td>{person.company || "—"}</td>
                    <td>{person.country || "—"}</td>
                    <td className="table-wealth">
                      {formatWealth(Number(person.net_worth_billions || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="page-footer">
          <span>ECONOVA</span>
          <span>اطلاعات دارایی‌ها ممکن است با تأخیر به‌روزرسانی شوند.</span>
          <button
            className="admin-link"
            onClick={() => {
              setLoginOpen((open) => !open);
              setLoginError("");
            }}
          >
            {accessToken ? "مدیریت خبرها" : "ورود مدیر"}
          </button>
        </footer>

        {newsMessage && (
          <div className="status-message" role="status">
            {newsMessage}
          </div>
        )}

        {loginOpen && (
          <div className="modal-backdrop" onClick={() => setLoginOpen(false)}>
            <section
              className="admin-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="modal-close"
                aria-label="بستن"
                onClick={() => setLoginOpen(false)}
              >
                ×
              </button>

              {accessToken ? (
                <>
                  <div className="eyebrow">ADMIN SESSION</div>
                  <h3>مدیریت خبرها</h3>
                  <p>وارد حساب مدیر شده‌ای و می‌توانی خبرهای پنج نفر اول را ویرایش کنی.</p>
                  <button className="primary-button full-button" onClick={handleLogout}>
                    خروج از حساب مدیر
                  </button>
                </>
              ) : (
                <form onSubmit={handleAdminLogin}>
                  <div className="eyebrow">SECURE ACCESS</div>
                  <h3>ورود مدیر</h3>
                  <p>برای ویرایش و ذخیره خبرها، با حساب مدیر وارد شو.</p>

                  <label>
                    ایمیل
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(event) => setAdminEmail(event.target.value)}
                      autoComplete="username"
                      required
                    />
                  </label>

                  <label>
                    رمز عبور
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(event) => setAdminPassword(event.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </label>

                  {loginError && (
                    <p className="form-error">{loginError}</p>
                  )}

                  <button
                    className="primary-button full-button"
                    type="submit"
                    disabled={loginBusy}
                  >
                    {loginBusy ? "در حال ورود…" : "ورود امن"}
                  </button>
                </form>
              )}
            </section>
          </div>
        )}
      </main>
          <style jsx global>{`
        :root {
          color-scheme: dark;
          --eco-bg: #080b12;
          --eco-panel: #111722;
          --eco-panel2: #161e2b;
          --eco-gold: #e5c76b;
          --eco-gold2: #b89543;
          --eco-text: #f4f5f8;
          --eco-muted: #98a3b5;
          --eco-border: rgba(229, 199, 107, 0.18);
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: var(--eco-bg);
          color: var(--eco-text);
          font-family: Tahoma, Arial, sans-serif;
        }

        button,
        input,
        textarea {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .econova-page {
          min-height: 100vh;
          padding: 0 20px 36px;
          background:
            radial-gradient(ellipse at 80% 0%, rgba(178, 140, 50, 0.11), transparent 34%),
            var(--eco-bg);
        }

        .page-header {
          max-width: 1120px;
          min-height: 76px;
          margin: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }

        .brand {
          color: #fff;
          font-family: Arial, sans-serif;
          font-size: 23px;
          font-weight: 900;
          letter-spacing: 1px;
          text-decoration: none;
        }

        .brand span {
          color: var(--eco-gold);
        }

        .header-label {
          color: var(--eco-muted);
          font-size: 12px;
        }

        .hero,
        .section-block,
        .page-footer {
          max-width: 1120px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero {
          padding: 56px 0 34px;
        }

        .eyebrow {
          margin-bottom: 10px;
          color: var(--eco-gold);
          font-family: Arial, sans-serif;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .hero h1 {
          margin: 0;
          font-size: clamp(27px, 5vw, 44px);
          line-height: 1.5;
          font-weight: 900;
        }

        .hero h1 span {
          color: var(--eco-gold);
        }

        .hero > p {
          max-width: 650px;
          margin: 12px 0 24px;
          color: var(--eco-muted);
          font-size: 13px;
          line-height: 2;
        }

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          max-width: 650px;
        }

        .stat-box {
          padding: 17px 19px;
          border: 1px solid var(--eco-border);
          border-radius: 15px;
          background: linear-gradient(140deg, #171d29, #0d121c);
        }

        .stat-box span,
        .person-wealth span {
          display: block;
          color: var(--eco-muted);
          font-size: 11px;
        }

        .stat-box strong {
          display: block;
          margin-top: 9px;
          color: var(--eco-gold);
          font-family: Arial, sans-serif;
          font-size: clamp(19px, 3vw, 28px);
          direction: ltr;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .section-block {
          margin-top: 34px;
        }

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 18px;
        }

        .section-heading h2 {
          margin: 0;
          font-size: clamp(19px, 3vw, 25px);
        }

        .section-heading p {
          margin: 7px 0 0;
          color: var(--eco-muted);
          font-size: 11px;
          line-height: 1.9;
        }

        .gold-chip {
          flex-shrink: 0;
          padding: 7px 11px;
          border: 1px solid var(--eco-border);
          border-radius: 9px;
          color: var(--eco-gold);
          background: rgba(229, 199, 107, 0.06);
          font-size: 11px;
          font-weight: 700;
        }

        .top-list {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 14px;
        }

        .person-card {
          min-width: 0;
          padding: 16px;
          overflow: hidden;
          border: 1px solid var(--eco-border);
          border-radius: 18px;
          background: linear-gradient(145deg, #151c29, #0e131d 80%);
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.13);
          transition: border-color 0.2s, transform 0.2s;
        }

        .person-card:hover {
          border-color: rgba(229, 199, 107, 0.42);
          transform: translateY(-2px);
        }

        .person-main {
          display: grid;
          grid-template-columns: 38px 76px minmax(0, 1fr) auto;
          align-items: center;
          gap: 15px;
          min-width: 0;
        }

        .rank-badge {
          display: grid;
          place-items: center;
          width: 36px;
          height: 36px;
          border: 1px solid var(--eco-border);
          border-radius: 11px;
          color: var(--eco-gold);
          font-family: Arial, sans-serif;
          font-size: 13px;
          font-weight: 800;
        }

        .person-photo {
          width: 76px;
          height: 76px;
          overflow: hidden;
          border: 1px solid rgba(229, 199, 107, 0.3);
          border-radius: 14px;
          background: #202939;
        }

        .person-photo img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-placeholder {
          display: grid;
          width: 100%;
          height: 100%;
          place-items: center;
          color: var(--eco-gold);
          font-size: 25px;
          font-weight: 800;
        }

        .person-info {
          min-width: 0;
        }

        .person-info h3 {
          margin: 0 0 7px;
          font-size: 16px;
          overflow-wrap: anywhere;
        }

        .person-company,
        .person-country {
          margin: 4px 0 0;
          color: var(--eco-muted);
          font-size: 11px;
          line-height: 1.7;
        }

        .person-wealth {
          min-width: 120px;
          text-align: left;
          direction: ltr;
        }

        .person-wealth span {
          margin-bottom: 7px;
          font-size: 10px;
        }

        .person-wealth strong {
          display: block;
          color: var(--eco-gold);
          font-family: Arial, sans-serif;
          font-size: 20px;
          white-space: nowrap;
        }

        .person-wealth small {
          display: inline-block;
          margin-top: 7px;
          font-family: Arial, sans-serif;
          font-size: 11px;
        }

        .change-positive {
          color: #6ed8a0;
        }

        .change-negative {
          color: #ff8888;
        }

        .person-news {
          margin-top: 16px;
          padding: 15px;
          border: 1px solid rgba(255, 255, 255, 0.065);
          border-radius: 13px;
          background: rgba(4, 8, 15, 0.45);
        }

        .news-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .news-kicker {
          color: var(--eco-gold2);
          font-family: Arial, sans-serif;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .news-heading h4 {
          margin: 5px 0 0;
          font-size: 13px;
        }

        .news-content {
          margin-top: 12px;
        }

        .news-content h5 {
          margin: 0 0 8px;
          color: #f4d98b;
          font-size: 14px;
          line-height: 1.9;
        }

        .news-body {
          margin: 0;
          color: #d0d5df;
          font-size: 12px;
          line-height: 2.1;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .empty-news {
          margin: 10px 0 0;
          color: var(--eco-muted);
          font-size: 11px;
          line-height: 1.9;
        }

        .news-date {
          display: block;
          margin-top: 12px;
          color: #8792a3;
          font-size: 10px;
        }

        .news-editor {
          display: grid;
          gap: 12px;
          margin-top: 16px;
        }

        .news-editor label,
        .admin-modal label {
          display: grid;
          gap: 7px;
          color: #c8d0dd;
          font-size: 11px;
        }

        .news-editor input,
        .news-editor textarea,
        .admin-modal input {
          width: 100%;
          min-width: 0;
          padding: 11px 12px;
          border: 1px solid #30394a;
          border-radius: 9px;
          outline: none;
          color: #f7f8fa;
          background: #0b1019;
          font-size: 12px;
          line-height: 1.8;
        }

        .news-editor textarea {
          resize: vertical;
        }

        .news-editor input:focus,
        .news-editor textarea:focus,
        .admin-modal input:focus {
          border-color: var(--eco-gold2);
        }

        .editor-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .primary-button,
        .outline-button,
        .quiet-button {
          padding: 10px 14px;
          border-radius: 9px;
          font-size: 11px;
          font-weight: 700;
          transition: opacity 0.2s, background 0.2s;
        }

        .primary-button {
          border: 1px solid var(--eco-gold);
          color: #14110a;
          background: var(--eco-gold);
        }

        .primary-button:hover {
          background: #f2d984;
        }

        .outline-button {
          border: 1px solid var(--eco-border);
          color: var(--eco-gold);
          background: transparent;
        }

        .outline-button:hover {
          background: rgba(229, 199, 107, 0.08);
        }

        .quiet-button {
          border: 1px solid #30394a;
          color: #c2cad6;
          background: transparent;
        }

        .text-button {
          display: block;
          margin-top: 7px;
          padding: 0;
          border: 0;
          color: var(--eco-gold);
          background: transparent;
          font-size: 11px;
        }

        .table-wrap {
          overflow-x: auto;
          border: 1px solid var(--eco-border);
          border-radius: 15px;
          background: #0e141e;
        }

        .billionaires-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          text-align: right;
        }

        .billionaires-table th {
          padding: 12px 10px;
          color: var(--eco-gold);
          background: #171e2a;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .billionaires-table td {
          padding: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.055);
          color: #c6cedb;
          font-size: 10px;
          line-height: 1.7;
        }

        .billionaires-table tbody tr:hover {
          background: rgba(229, 199, 107, 0.035);
        }

        .table-rank {
          color: var(--eco-gold);
          font-family: Arial, sans-serif;
          font-size: 10px;
          font-weight: 800;
        }

        .table-name {
          color: #f4f5f8 !important;
          font-weight: 700;
        }

        .table-wealth {
          color: var(--eco-gold) !important;
          direction: ltr;
          text-align: right;
          white-space: nowrap;
          font-family: Arial, sans-serif;
        }

        .page-footer {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-top: 42px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--eco-muted);
          font-size: 10px;
        }

        .page-footer > span:first-child {
          color: var(--eco-gold);
          font-family: Arial, sans-serif;
          font-size: 14px;
          font-weight: 900;
        }

        .admin-link {
          padding: 8px 10px;
          border: 1px solid var(--eco-border);
          border-radius: 8px;
          color: var(--eco-gold);
          background: transparent;
          font-size: 10px;
        }

        .notice,
        .loading-panel,
        .status-message {
          max-width: 1120px;
          margin: 16px auto;
          padding: 13px 15px;
          border: 1px solid var(--eco-border);
          border-radius: 11px;
          color: #d7dce5;
          background: var(--eco-panel);
          font-size: 12px;
          line-height: 1.9;
        }

        .error-notice {
          border-color: rgba(255, 120, 120, 0.3);
          color: #ffb6b6;
        }

        .status-message {
          position: fixed;
          z-index: 100;
          right: 20px;
          bottom: 18px;
          left: 20px;
          max-width: 520px;
          margin: auto;
          border-color: rgba(229, 199, 107, 0.4);
          background: #171e2a;
          box-shadow: 0 10px 35px rgba(0, 0, 0, 0.4);
        }

        .modal-backdrop {
          position: fixed;
          z-index: 200;
          inset: 0;
          display: grid;
          place-items: center;
          padding: 18px;
          background: rgba(0, 0, 0, 0.72);
          backdrop-filter: blur(6px);
        }

        .admin-modal {
          position: relative;
          width: 100%;
          max-width: 420px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 26px;
          border: 1px solid var(--eco-border);
          border-radius: 18px;
          background: #111722;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
        }

        .admin-modal h3 {
          margin: 0 0 10px;
          font-size: 22px;
        }

        .admin-modal p {
          color: var(--eco-muted);
          font-size: 12px;
          line-height: 2;
        }

        .admin-modal form {
          display: grid;
          gap: 15px;
        }

        .modal-close {
          position: absolute;
          top: 10px;
          left: 12px;
          width: 32px;
          height: 32px;
          border: 0;
          border-radius: 8px;
          color: #fff;
          background: #242d3b;
          font-size: 23px;
        }

        .full-button {
          width: 100%;
          margin-top: 6px;
        }

        .form-error {
          color: #ffaaaa !important;
        }

        @media (max-width: 650px) {
          .econova-page {
            padding-right: 12px;
            padding-left: 12px;
          }

          .page-header {
            min-height: 62px;
          }

          .brand {
            font-size: 20px;
          }

          .hero {
            padding-top: 36px;
          }

          .hero-stats {
            gap: 8px;
          }

          .stat-box {
            padding: 13px 11px;
          }

          .stat-box span {
            font-size: 10px;
            line-height: 1.8;
          }

          .person-card {
            padding: 10px;
            border-radius: 13px;
          }

          .person-main {
            grid-template-columns: 27px 54px minmax(0, 1fr);
            gap: 9px;
          }

          .rank-badge {
            width: 27px;
            height: 29px;
            border-radius: 8px;
            font-size: 10px;
          }

          .person-photo {
            width: 54px;
            height: 54px;
            border-radius: 10px;
          }

          .person-info h3 {
            margin-bottom: 4px;
            font-size: 12px;
          }

          .person-company,
          .person-country {
            margin-top: 2px;
            font-size: 9px;
          }

          .person-wealth {
            grid-column: 2 / -1;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 7px;
            min-width: 0;
            text-align: right;
            direction: rtl;
          }

          .person-wealth span {
            margin: 0;
            font-size: 9px;
          }

          .person-wealth strong {
            font-size: 16px;
          }

          .person-wealth small {
            margin-top: 0;
            font-size: 10px;
          }

          .person-news {
            margin-top: 12px;
            padding: 11px;
          }

          .news-heading h4 {
            font-size: 11px;
          }

          .outline-button,
          .primary-button,
          .quiet-button {
            padding: 9px 10px;
            font-size: 10px;
          }

          .billionaires-table {
            min-width: 470px;
          }

          .billionaires-table th,
          .billionaires-table td {
            padding: 8px 7px;
            font-size: 9px;
          }

          .page-footer {
            align-items: flex-start;
          }

          .section-heading p {
            max-width: 250px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  );
}
