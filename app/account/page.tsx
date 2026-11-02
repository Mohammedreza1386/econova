"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://zusbebjskchgehdjvpsm.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let client: any = null;

function getSupabase() {
  if (!SUPABASE_KEY) {
    throw new Error("کلید عمومی Supabase تنظیم نشده است.");
  }

  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  return client;
}

type Billionaire = {
  id: string;
  rank: number;
  name: string;
  company: string | null;
  country: string | null;
  image_url: string | null;
  net_worth_billions: number | string;
  daily_change_pct: number | string | null;
};

type Profile = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type Mode = "login" | "signup" | "reset" | "new-password";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [editName, setEditName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [people, setPeople] = useState<Billionaire[]>([]);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    try {
      const sb = getSupabase();

      const params = new URLSearchParams(window.location.search);

      if (params.get("mode") === "reset") {
        setMode("new-password");
      }

      if (params.get("confirmed") === "1") {
        setMessage("ایمیل شما تأیید شد. اکنون وارد شوید.");
      }

      sb.auth.getSession().then(({ data, error }) => {
        if (!active) return;

        if (error) {
          setMessage(error.message);
          return;
        }

        setUser(data.session?.user ?? null);
      });

      const {
        data: { subscription },
      } = sb.auth.onAuthStateChange((_event, session) => {
        if (active) {
          setUser(session?.user ?? null);
        }
      });

      return () => {
        active = false;
        subscription.unsubscribe();
      };
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "خطا در اتصال به Supabase"
      );
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setPeople([]);
      setFollowedIds([]);
      return;
    }

    let active = true;

    async function loadAccount() {
      try {
        const sb = getSupabase();

        const { data: existingProfile, error: profileError } =
          await sb
            .from("member_profiles")
            .select("*")
            .eq("user_id", user!.id)
            .maybeSingle();

        if (profileError) throw profileError;

        let currentProfile = existingProfile as Profile | null;

        if (!currentProfile) {
          const initialName =
            user!.user_metadata?.full_name ||
            user!.user_metadata?.name ||
            user!.email?.split("@")[0] ||
            "عضو Econova";

          const { data, error } = await sb
            .from("member_profiles")
            .insert({
              user_id: user!.id,
              display_name: initialName,
              avatar_url:
                user!.user_metadata?.avatar_url ||
                user!.user_metadata?.picture ||
                null,
            })
            .select()
            .single();

          if (error) throw error;

          currentProfile = data as Profile;
        }

        const [peopleResult, followsResult] = await Promise.all([
          sb
            .from("billionaires")
            .select(
              "id,rank,name,company,country,image_url,net_worth_billions,daily_change_pct"
            )
            .order("rank", { ascending: true })
            .limit(100),

          sb
            .from("billionaire_follows")
            .select("billionaire_id")
            .eq("user_id", user!.id),
        ]);

        if (peopleResult.error) throw peopleResult.error;
        if (followsResult.error) throw followsResult.error;

        if (!active) return;

        setProfile(currentProfile);
        setEditName(currentProfile.display_name || "");
        setAvatarUrl(currentProfile.avatar_url || "");

        setPeople((peopleResult.data || []) as Billionaire[]);

        setFollowedIds(
          (followsResult.data || []).map(
            (item) => item.billionaire_id
          )
        );
      } catch (error) {
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : "خطا در دریافت اطلاعات حساب"
          );
        }
      }
    }

    loadAccount();

    return () => {
      active = false;
    };
  }, [user]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const sb = getSupabase();

      if (mode === "signup") {
        if (password.length < 8) {
          throw new Error("رمز عبور باید حداقل ۸ کاراکتر باشد.");
        }

        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              `${window.location.origin}/account?confirmed=1`,
            data: {
              display_name: displayName,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          setMessage("حساب شما با موفقیت ساخته شد.");
        } else {
          setMessage(
            "ثبت‌نام انجام شد. ایمیل خود را برای تأیید حساب بررسی کن."
          );
        }
      }

      if (mode === "login") {
        const { error } = await sb.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setMessage("ورود موفقیت‌آمیز بود.");
      }

      if (mode === "reset") {
        const { error } = await sb.auth.resetPasswordForEmail(
          email,
          {
            redirectTo:
              `${window.location.origin}/account?mode=reset`,
          }
        );

        if (error) throw error;

        setMessage("لینک بازیابی رمز عبور ارسال شد.");
      }

      if (mode === "new-password") {
        const { error } = await sb.auth.updateUser({
          password,
        });

        if (error) throw error;

        setMessage("رمز عبور جدید ذخیره شد.");
        setMode("login");
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "عملیات ناموفق بود."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle() {
    setLoading(true);
    setMessage("");

    try {
      const sb = getSupabase();

      const { error } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/account`,
        },
      });

      if (error) throw error;
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "ورود با Google ناموفق بود."
      );

      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!user) return;

    setLoading(true);
    setMessage("");

    try {
      const sb = getSupabase();

      const { data, error } = await sb
        .from("member_profiles")
        .update({
          display_name: editName.trim(),
          avatar_url: avatarUrl.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data as Profile);
      setMessage("پروفایل ذخیره شد.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "ذخیره پروفایل ناموفق بود."
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleFollow(person: Billionaire) {
    if (!user) return;

    setLoading(true);
    setMessage("");

    const isFollowing = followedIds.includes(person.id);

    try {
      const sb = getSupabase();

      if (isFollowing) {
        const { error } = await sb
          .from("billionaire_follows")
          .delete()
          .eq("user_id", user.id)
          .eq("billionaire_id", person.id);

        if (error) throw error;

        setFollowedIds((old) =>
          old.filter((id) => id !== person.id)
        );

        setMessage(`${person.name} از فهرست دنبال‌شده‌ها حذف شد.`);
      } else {
        const { error } = await sb
          .from("billionaire_follows")
          .insert({
            user_id: user.id,
            billionaire_id: person.id,
          });

        if (error) throw error;

        setFollowedIds((old) => [...old, person.id]);

        setMessage(`${person.name} را دنبال می‌کنی.`);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "عملیات دنبال‌کردن ناموفق بود."
      );
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    const { error } = await getSupabase().auth.signOut();

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("از حساب خارج شدی.");
    setUser(null);
  }

  const filteredPeople = people.filter((person) =>
    person.name.toLowerCase().includes(search.toLowerCase())
  );

  const followedPeople = people.filter((person) =>
    followedIds.includes(person.id)
  );

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px",
    borderRadius: "10px",
    border: "1px solid #344438",
    background: "#101812",
    color: "white",
    outline: "none",
    marginTop: "7px",
  };

  return (
    <main className="account-page" dir="rtl">
      <header className="account-header">
        <a href="/" className="brand">ECONOVA<span>.</span></a>
        <a href="/billionaires" className="back">میلیاردرها</a>
      </header>

      <section className="account-container">
        {!user ? (
          <div className="auth-card">
            <div className="logo-circle">E</div>

            <p className="eyebrow">ECONOVA MEMBERS</p>

            <h1>
              {mode === "signup"
                ? "ساخت حساب کاربری"
                : mode === "reset"
                  ? "بازیابی رمز عبور"
                  : mode === "new-password"
                    ? "رمز عبور جدید"
                    : "ورود به Econova"}
            </h1>

            <p className="description">
              حساب شخصی بساز و میلیاردرهای موردعلاقه‌ات را دنبال کن.
            </p>

            <form onSubmit={handleAuth}>
              {mode === "signup" && (
                <label>
                  نام نمایشی
                  <input
                    style={inputStyle}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={60}
                    placeholder="نام شما"
                  />
                </label>
              )}

              {mode !== "new-password" && (
                <label>
                  ایمیل
                  <input
                    style={inputStyle}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    dir="ltr"
                  />
                </label>
              )}

              {(mode === "login" ||
                mode === "signup" ||
                mode === "new-password") && (
                <label>
                  {mode === "new-password"
                    ? "رمز عبور جدید"
                    : "رمز عبور"}
                  <input
                    style={inputStyle}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="حداقل ۸ کاراکتر"
                    dir="ltr"
                  />
                </label>
              )}

              <button className="primary-button" disabled={loading}>
                {loading
                  ? "لطفاً صبر کن..."
                  : mode === "signup"
                    ? "ساخت حساب"
                    : mode === "reset"
                      ? "ارسال لینک بازیابی"
                      : mode === "new-password"
                        ? "ذخیره رمز جدید"
                        : "ورود"}
              </button>
            </form>

            {mode === "login" && (
              <>
                <button
                  className="google-button"
                  onClick={loginWithGoogle}
                  disabled={loading}
                >
                  <b>G</b>
                  ورود با Google
                </button>

                <button
                  className="text-button"
                  onClick={() => setMode("reset")}
                >
                  رمز عبور را فراموش کرده‌ام
                </button>

                <button
                  className="text-button"
                  onClick={() => setMode("signup")}
                >
                  حساب ندارم؛ ثبت‌نام می‌کنم
                </button>
              </>
            )}

            {mode !== "login" && (
              <button
                className="text-button"
                onClick={() => setMode("login")}
              >
                بازگشت به ورود
              </button>
            )}

            {message && <p className="message">{message}</p>}
          </div>
        ) : (
          <div className="dashboard">
            <div className="dashboard-top">
              <div>
                <p className="eyebrow">PERSONAL DASHBOARD</p>
                <h1>حساب کاربری من</h1>
                <p className="muted">{user.email}</p>
              </div>

              <button className="logout-button" onClick={logout}>
                خروج
              </button>
            </div>

            <div className="stats">
              <div className="stat">
                <strong>{followedIds.length}</strong>
                <span>میلیاردر دنبال‌شده</span>
              </div>

              <div className="stat">
                <strong>{people.length}</strong>
                <span>افراد قابل دنبال‌کردن</span>
              </div>
            </div>

            <section className="panel">
              <h2>پروفایل من</h2>

              <label>
                نام نمایشی
                <input
                  style={inputStyle}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={60}
                />
              </label>

              <label>
                لینک تصویر پروفایل
                <input
                  style={inputStyle}
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                />
              </label>

              <button
                className="primary-button"
                onClick={saveProfile}
                disabled={loading}
              >
                ذخیره پروفایل
              </button>
            </section>

            <section className="panel">
              <h2>میلیاردرهای دنبال‌شده</h2>

              {followedPeople.length === 0 ? (
                <p className="muted">
                  هنوز کسی را دنبال نکرده‌ای.
                </p>
              ) : (
                <div className="people-list">
                  {followedPeople.map((person) => (
                    <div className="person" key={person.id}>
                      <div className="person-info">
                        <strong>#{person.rank} {person.name}</strong>
                        <span>{person.company || "شرکت ثبت نشده"}</span>
                      </div>

                      <button
                        className="unfollow"
                        onClick={() => toggleFollow(person)}
                        disabled={loading}
                      >
                        لغو دنبال‌کردن
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel">
              <h2>پیدا کردن میلیاردرها</h2>

              <input
                style={inputStyle}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جست‌وجوی نام میلیاردر..."
              />

              <div className="people-list">
                {filteredPeople.map((person) => {
                  const following = followedIds.includes(person.id);

                  return (
                    <div className="person" key={person.id}>
                      <div className="person-info">
                        <strong>#{person.rank} {person.name}</strong>
                        <span>
                          {person.company || "شرکت ثبت نشده"}
                          {" · "}
                          ${Number(
                            person.net_worth_billions
                          ).toLocaleString("en-US")}
                          B
                        </span>
                      </div>

                      <button
                        className={following ? "unfollow" : "follow"}
                        onClick={() => toggleFollow(person)}
                        disabled={loading}
                      >
                        {following ? "دنبال می‌کنی" : "+ دنبال‌کردن"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {message && <p className="message">{message}</p>}
          </div>
        )}
      </section>

      <style jsx>{`
        .account-page {
          min-height: 100vh;
          background: #080d0a;
          color: #f3f6f1;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        .account-header {
          max-width: 1050px;
          margin: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0 25px;
          border-bottom: 1px solid #26352a;
        }

        .brand {
          color: white;
          font-size: 24px;
          font-weight: 900;
          text-decoration: none;
          letter-spacing: 2px;
        }

        .brand span {
          color: #b9f27c;
        }

        .back {
          color: #b9f27c;
          text-decoration: none;
        }

        .account-container {
          max-width: 850px;
          margin: 35px auto;
        }

        .auth-card {
          max-width: 430px;
          margin: 50px auto;
          padding: 30px;
          border: 1px solid #344438;
          border-radius: 20px;
          background: #101812;
        }

        .logo-circle {
          width: 55px;
          height: 55px;
          display: grid;
          place-items: center;
          border-radius: 16px;
          background: #b9f27c;
          color: #101812;
          font-size: 28px;
          font-weight: 900;
                    margin-bottom: 20px;
        }

        .eyebrow {
          color: #b9f27c;
          font-size: 11px;
          letter-spacing: 2px;
          font-weight: bold;
        }

        h1 {
          font-size: 27px;
          margin: 12px 0;
        }

        .description,
        .muted {
          color: #9aaa9d;
          line-height: 1.9;
          font-size: 13px;
        }

        label {
          display: block;
          margin-top: 18px;
          color: #cbd5ce;
          font-size: 13px;
        }

        .primary-button,
        .google-button {
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          margin-top: 18px;
          cursor: pointer;
          font-weight: bold;
        }

        .primary-button {
          background: #b9f27c;
          color: #101812;
          border: none;
        }

        .google-button {
          background: #17221a;
          border: 1px solid #435746;
          color: white;
        }

        .google-button b {
          margin-left: 10px;
          color: #b9f27c;
        }

        .text-button {
          display: block;
          width: 100%;
          padding: 11px;
          background: transparent;
          border: none;
          color: #b9f27c;
          cursor: pointer;
          margin-top: 7px;
        }

        .message {
          padding: 13px;
          margin-top: 17px;
          border-radius: 10px;
          background: #1c2b20;
          color: #b9f27c;
          font-size: 13px;
          line-height: 1.8;
          overflow-wrap: anywhere;
        }

        .dashboard-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }

        .logout-button,
        .unfollow {
          background: #291919;
          color: #ff9999;
          border: 1px solid #593333;
          border-radius: 9px;
          padding: 10px 13px;
          cursor: pointer;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin: 25px 0;
        }

        .stat,
        .panel {
          background: #101812;
          border: 1px solid #344438;
          border-radius: 15px;
          padding: 18px;
        }

        .stat strong {
          display: block;
          color: #b9f27c;
          font-size: 27px;
          margin-bottom: 7px;
        }

        .stat span {
          color: #9aaa9d;
          font-size: 12px;
        }

        .panel {
          margin-top: 18px;
        }

        .panel h2 {
          font-size: 18px;
          margin: 0 0 15px;
        }

        .people-list {
          margin-top: 15px;
        }

        .person {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 13px 0;
          border-bottom: 1px solid #26352a;
        }

        .person:last-child {
          border-bottom: none;
        }

        .person-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .person-info strong {
          font-size: 13px;
        }

        .person-info span {
          color: #91a095;
          font-size: 11px;
          overflow-wrap: anywhere;
        }

        .follow {
          flex-shrink: 0;
          background: #b9f27c;
          color: #101812;
          border: none;
          border-radius: 9px;
          padding: 10px 12px;
          cursor: pointer;
        }

        .unfollow {
          flex-shrink: 0;
          font-size: 11px;
        }

        button:disabled {
          opacity: 0.55;
          cursor: wait;
        }

        @media (max-width: 550px) {
          .account-page {
            padding: 12px;
          }

          .auth-card {
            padding: 21px;
            margin-top: 25px;
          }

          .person {
            align-items: flex-start;
          }

          .person-info strong {
            font-size: 12px;
          }

          .follow,
          .unfollow {
            padding: 9px;
            font-size: 10px;
          }
        }
      `}</style>
    </main>
  );
}
     
