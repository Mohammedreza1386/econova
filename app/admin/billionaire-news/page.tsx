"use client";

import { useMemo, useState, type FormEvent } from "react";

const SUPABASE_URL = "https://zusbebjskchgehdjvpsm.supabase.co";
const SUPABASE_KEY = "sb_publishable_WGMEA7-K8FAResrVCL8GJQ_6KCxrvmK";

type Person = {
  id: string;
  name: string;
  rank: number | null;
};

type News = {
  id: string;
  billionaire_id: string;
  title: string;
  summary: string | null;
  source_name: string;
  source_url: string;
  image_url: string | null;
  published_at: string | null;
};

type Draft = {
  billionaire_id: string;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  image_url: string;
  published_at: string;
};

const emptyDraft = (id = ""): Draft => ({
  billionaire_id: id,
  title: "",
  summary: "",
  source_name: "Forbes",
  source_url: "",
  image_url: "",
  published_at: "",
});

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #344638",
  borderRadius: 10,
  background: "#0b120d",
  color: "#f3f6f1",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  padding: "11px 18px",
  border: "1px solid #b9f27c",
  borderRadius: 10,
  background: "#b9f27c",
  color: "#101810",
  fontWeight: 800,
  cursor: "pointer",
};

export default function BillionaireNewsAdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [editingId, setEditingId] = useState("");
  const [filterId, setFilterId] = useState("all");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const headers = (accessToken: string) => ({
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  });

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    news.forEach((item) => {
      result[item.billionaire_id] =
        (result[item.billionaire_id] || 0) + 1;
    });
    return result;
  }, [news]);

  async function loadData(accessToken: string) {
    const [peopleResponse, newsResponse] = await Promise.all([
      fetch(
        `${SUPABASE_URL}/rest/v1/billionaires?select=id,name,rank&order=rank.asc&limit=1000`,
        { headers: headers(accessToken), cache: "no-store" }
      ),
      fetch(
        `${SUPABASE_URL}/rest/v1/billionaire_related_news?select=id,billionaire_id,title,summary,source_name,source_url,image_url,published_at&order=published_at.desc.nullslast&limit=2000`,
        { headers: headers(accessToken), cache: "no-store" }
      ),
    ]);

    if (!peopleResponse.ok || !newsResponse.ok) {
      throw new Error("دریافت اطلاعات از پایگاه داده ناموفق بود.");
    }

    const peopleData: Person[] = await peopleResponse.json();
    const newsData: News[] = await newsResponse.json();

    setPeople(peopleData);
    setNews(newsData);
    setDraft((old) =>
      old.billionaire_id
        ? old
        : emptyDraft(peopleData[0]?.id || "")
    );
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
            apikey: SUPABASE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.access_token) {
        throw new Error("ایمیل یا رمز عبور صحیح نیست.");
      }

      const adminResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/admin_users?select=user_id&user_id=eq.${data.user.id}`,
        { headers: headers(data.access_token) }
      );

      const admins = await adminResponse.json();

      if (!adminResponse.ok || !Array.isArray(admins) || !admins.length) {
        throw new Error("این حساب دسترسی مدیریت ندارد.");
      }

      setToken(data.access_token);
      await loadData(data.access_token);
      setMessage("ورود موفق بود.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "خطای ورود"
      );
    } finally {
      setBusy(false);
    }
   }
    function resetDraft() {
    setEditingId("");
    setDraft(emptyDraft(people[0]?.id || ""));
  }

  function startEdit(item: News) {
    setEditingId(item.id);
    setDraft({
      billionaire_id: item.billionaire_id,
      title: item.title,
      summary: item.summary || "",
      source_name: item.source_name || "Forbes",
      source_url: item.source_url,
      image_url: item.image_url || "",
      published_at: item.published_at
        ? item.published_at.slice(0, 16)
        : "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveNews(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setMessage("");

    if (draft.title.trim().length < 5) {
      setMessage("عنوان خبر باید حداقل ۵ حرف داشته باشد.");
      return;
    }

    if (!/^https?:\/\//i.test(draft.source_url.trim())) {
      setMessage("لینک منبع باید با http یا https شروع شود.");
      return;
    }

    if (
      draft.image_url.trim() &&
      !/^https?:\/\//i.test(draft.image_url.trim())
    ) {
      setMessage("لینک تصویر معتبر نیست.");
      return;
    }

    const currentCount = news.filter(
      (item) =>
        item.billionaire_id === draft.billionaire_id &&
        item.id !== editingId
    ).length;

    if (currentCount >= 2) {
      setMessage("برای هر میلیاردر حداکثر دو خبر می‌توان ثبت کرد.");
      return;
    }

    setBusy(true);

    try {
      const payload = {
        billionaire_id: draft.billionaire_id,
        title: draft.title.trim(),
        summary: draft.summary.trim() || null,
        source_name: draft.source_name.trim() || "منبع نامشخص",
        source_url: draft.source_url.trim(),
        image_url: draft.image_url.trim() || null,
        published_at: draft.published_at
          ? new Date(draft.published_at).toISOString()
          : null,
      };

      const url = editingId
        ? `${SUPABASE_URL}/rest/v1/billionaire_related_news?id=eq.${editingId}`
        : `${SUPABASE_URL}/rest/v1/billionaire_related_news`;

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: {
          ...headers(token),
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || "ذخیره خبر انجام نشد."
        );
      }

      await loadData(token);
      resetDraft();
      setMessage(editingId ? "خبر ویرایش شد." : "خبر جدید ثبت شد.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "خطا در ذخیره خبر"
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteNews(id: string) {
    if (!token || !window.confirm("این خبر حذف شود؟")) return;

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/billionaire_related_news?id=eq.${id}`,
        {
          method: "DELETE",
          headers: headers(token),
        }
      );

      if (!response.ok) {
        throw new Error("حذف خبر انجام نشد.");
      }

      if (editingId === id) resetDraft();

      await loadData(token);
      setMessage("خبر حذف شد.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "خطا در حذف خبر"
      );
    } finally {
      setBusy(false);
    }
  }

  const visibleNews =
    filterId === "all"
      ? news
      : news.filter((item) => item.billionaire_id === filterId);

  function personName(id: string) {
    return people.find((person) => person.id === id)?.name || "نامشخص";
  }

  if (!token) {
    return (
      <main style={pageStyle}>
        <section style={panelStyle}>
          <p style={eyebrowStyle}>ECONOVA ADMIN</p>
          <h1 style={{ fontSize: 26, margin: "8px 0 12px" }}>
            مدیریت اخبار میلیاردرها
          </h1>
          <p style={mutedStyle}>
            برای ورود از حساب مدیریت Econova استفاده کن.
          </p>

          <form onSubmit={login} style={formGridStyle}>
            <label style={labelStyle}>
              ایمیل
              <input
                style={inputStyle}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="username"
              />
            </label>

            <label style={labelStyle}>
              رمز عبور
              <input
                style={inputStyle}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
              />
            </label>

            <button style={buttonStyle} disabled={busy}>
              {busy ? "در حال ورود..." : "ورود به پنل"}
            </button>
          </form>

          {message && <p style={messageStyle}>{message}</p>}
          <a href="/admin" style={linkStyle}>
            بازگشت به پنل اصلی
          </a>
        </section>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>ECONOVA / CONTENT MANAGEMENT</p>
          <h1 style={{ fontSize: 27, margin: "8px 0" }}>
            مدیریت اخبار میلیاردرها
          </h1>
          <p style={mutedStyle}>
            برای هر شخص حداکثر دو خبر مرتبط ثبت کن.
          </p>
        </div>
        <a href="/admin" style={linkStyle}>
          پنل اصلی
        </a>
      </header>

      {message && <div style={messageStyle}>{message}</div>}

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>
          {editingId ? "ویرایش خبر" : "ثبت خبر جدید"}
        </h2>

        <form onSubmit={saveNews} style={formGridStyle}>
          <label style={labelStyle}>
            انتخاب میلیاردر
            <select
              style={inputStyle}
              value={draft.billionaire_id}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  billionaire_id: event.target.value,
                })
              }
              required
            >
              <option value="">انتخاب کن</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.rank ? `#${person.rank} - ` : ""}
                  {person.name} — {counts[person.id] || 0}/۲ خبر
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            عنوان خبر
            <input
              style={inputStyle}
              value={draft.title}
              onChange={(event) =>
                setDraft({ ...draft, title: event.target.value })
              }
              maxLength={240}
              required
            />
          </label>

          <label style={labelStyle}>
            خلاصه خبر
            <textarea
              style={{ ...inputStyle, minHeight: 95, resize: "vertical" }}
              value={draft.summary}
              onChange={(event) =>
                setDraft({ ...draft, summary: event.target.value })
              }
            />
          </label>
                    <div style={twoColumnsStyle}>
            <label style={labelStyle}>
              نام منبع
              <input
                style={inputStyle}
                value={draft.source_name}
                onChange={(event) =>
                  setDraft({ ...draft, source_name: event.target.value })
                }
                placeholder="Forbes"
              />
            </label>

            <label style={labelStyle}>
              تاریخ انتشار
              <input
                style={inputStyle}
                type="datetime-local"
                value={draft.published_at}
                onChange={(event) =>
                  setDraft({ ...draft, published_at: event.target.value })
                }
              />
            </label>
          </div>

          <label style={labelStyle}>
            لینک اصلی خبر
            <input
              style={inputStyle}
              type="url"
              value={draft.source_url}
              onChange={(event) =>
                setDraft({ ...draft, source_url: event.target.value })
              }
              placeholder="https://..."
              required
            />
          </label>

          <label style={labelStyle}>
            لینک تصویر خبر
            <input
              style={inputStyle}
              type="url"
              value={draft.image_url}
              onChange={(event) =>
                setDraft({ ...draft, image_url: event.target.value })
              }
              placeholder="https://..."
            />
          </label>

          <div style={actionsStyle}>
            <button style={buttonStyle} disabled={busy || !people.length}>
              {busy
                ? "در حال ذخیره..."
                : editingId
                  ? "ذخیره تغییرات"
                  : "ثبت خبر"}
            </button>

            {editingId && (
              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={resetDraft}
              >
                انصراف از ویرایش
              </button>
            )}
          </div>
        </form>
      </section>

      <section style={panelStyle}>
        <div style={listHeaderStyle}>
          <h2 style={sectionTitleStyle}>
            خبرهای ثبت‌شده ({visibleNews.length})
          </h2>

          <select
            style={{ ...inputStyle, maxWidth: 260 }}
            value={filterId}
            onChange={(event) => setFilterId(event.target.value)}
          >
            <option value="all">همه میلیاردرها</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>

        {visibleNews.length === 0 ? (
          <p style={mutedStyle}>هنوز خبری ثبت نشده است.</p>
        ) : (
          <div style={newsListStyle}>
            {visibleNews.map((item) => (
              <article key={item.id} style={newsItemStyle}>
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt=""
                    style={newsImageStyle}
                  />
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={eyebrowStyle}>{personName(item.billionaire_id)}</p>
                  <h3 style={{ margin: "6px 0", lineHeight: 1.8 }}>
                    {item.title}
                  </h3>
                  <p style={mutedStyle}>
                    {item.source_name}
                    {item.published_at
                      ? ` • ${new Date(item.published_at).toLocaleDateString("fa-IR")}`
                      : ""}
                  </p>
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkStyle}
                  >
                    مشاهده منبع خبر ↗
                  </a>

                  <div style={actionsStyle}>
                    <button
                      type="button"
                      style={secondaryButtonStyle}
                      onClick={() => startEdit(item)}
                    >
                      ویرایش
                    </button>
                    <button
                      type="button"
                      style={dangerButtonStyle}
                      onClick={() => deleteNews(item.id)}
                      disabled={busy}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer style={footerStyle}>
        Econova · Billionaire News Management
      </footer>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: "24px 16px 50px",
  background: "#080d0a",
  color: "#f3f6f1",
  fontFamily: "Arial, sans-serif",
  direction: "rtl",
};

const headerStyle: React.CSSProperties = {
  width: "min(1050px, 100%)",
  margin: "0 auto 22px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 16,
};

const panelStyle: React.CSSProperties = {
  width: "min(1050px, 100%)",
  margin: "0 auto 20px",
  padding: 22,
  border: "1px solid #293b2e",
  borderRadius: 16,
  background: "#101812",
  boxSizing: "border-box",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#b9f27c",
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 1,
  margin: 0,
};

const mutedStyle: React.CSSProperties = {
  color: "#94a397",
  fontSize: 12,
  lineHeight: 1.9,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 19,
  margin: "0 0 18px",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  color: "#cbd5cc",
  fontSize: 13,
};

const twoColumnsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 14,
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 12,
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "transparent",
  color: "#b9f27c",
};

const dangerButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#351817",
  borderColor: "#9c514b",
  color: "#ffb8ad",
};

const linkStyle: React.CSSProperties = {
  color: "#b9f27c",
  textDecoration: "none",
  fontSize: 13,
};

const messageStyle: React.CSSProperties = {
  width: "min(1050px, 100%)",
  margin: "12px auto",
  padding: 13,
  border: "1px solid #526b43",
  borderRadius: 10,
  color: "#b9f27c",
  background: "#142016",
  fontSize: 13,
};

const listHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 12,
};

const newsListStyle: React.CSSProperties = {
  display: "grid",
  gap: 14,
};

const newsItemStyle: React.CSSProperties = {
  display: "flex",
  gap: 16,
  padding: 14,
  border: "1px solid #293b2e",
  borderRadius: 13,
  background: "#0b120d",
  flexWrap: "wrap",
};

const newsImageStyle: React.CSSProperties = {
  width: 150,
  height: 110,
  objectFit: "cover",
  borderRadius: 9,
};

const footerStyle: React.CSSProperties = {
  width: "min(1050px, 100%)",
  margin: "24px auto 0",
  color: "#718076",
  textAlign: "center",
  fontSize: 11,
};
  
