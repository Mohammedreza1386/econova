
"use client";

import { useEffect, useState } from "react";

type Billionaire = {
  id: number;
  rank: number;
  name: string;
  company: string | null;
  country: string | null;
  net_worth_billions: number;
  daily_change_pct: number | null;
  updated_at: string | null;
  source_url: string | null;
  source_checked_at: string | null;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);

export default function BillionairesPage() {
  const [people, setPeople] = useState<Billionaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPeople() {
      try {
        const url = "https://zusbebjskchgehdjvpsm.supabase.co";
        const key = "sb_publishable_WGMEA7-K8FAResrVCL8GJQ_6KCxrvmK";;

        if (!url || !key) {
          throw new Error(
            "تنظیمات اتصال به دیتابیس در سایت کامل نیست."
          );
        }

        const response = await fetch(
          `${url}/rest/v1/billionaires?select=id,rank,name,company,country,net_worth_billions,daily_change_pct,updated_at,source_url,source_checked_at&order=rank.asc&limit=50`,
          {
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
            },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `خطا در دریافت اطلاعات (${response.status})`
          );
        }

        const data: Billionaire[] = await response.json();
        setPeople(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "دریافت اطلاعات ناموفق بود."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPeople();
  }, []);

  const topFive = people.slice(0, 5);
  const topTenTotal = people
    .filter((person) => person.rank <= 10)
    .reduce(
      (total, person) => total + Number(person.net_worth_billions || 0),
      0
    );

  return (
    <main style={{minHeight:"100vh",background:"linear-gradient(135deg,#07111f,#101d32,#07111f)",padding:"32px 16px",color:"#f8fafc",direction:"rtl",fontFamily:"Arial,sans-serif"}}>
      <div style={{maxWidth:"1152px",margin:"0 auto"}}>
        <header className="mb-8 text-center">
          <p className="mb-2 text-sm font-semibold tracking-widest text-emerald-400">
            ECONOVA • WEALTH TRACKER
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">
            ثروتمندترین افراد جهان
          </h1>
          <p className="mt-3 text-slate-400">
            رتبه‌بندی میلیاردرهای جهان بر اساس اطلاعات دیتابیس
          </p>
        </header>

        <section className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
          <p className="text-sm text-emerald-300">
            مجموع ثروت ۱۰ نفر اول
          </p>
          <p className="mt-2 text-3xl font-bold">
            ${money(topTenTotal)} میلیارد
          </p>
          <p className="mt-2 text-xs text-slate-400">
            این عدد از اطلاعات ثبت‌شده در دیتابیس محاسبه می‌شود.
          </p>
        </section>

        {loading && (
          <p className="py-10 text-center text-slate-300">
            در حال دریافت اطلاعات...
          </p>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-5 text-center text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && people.length === 0 && (
          <p className="rounded-xl bg-slate-900 p-6 text-center text-slate-300">
            هنوز اطلاعاتی در جدول میلیاردرها موجود نیست.
          </p>
        )}

        {!loading && !error && people.length > 0 && (
          <>
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">
                پنج نفر ثروتمند برتر
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {topFive.map((person) => (
                  <article
                    key={person.id}
                    className="rounded-2xl border border-slate-700 bg-slate-900 p-5"
                  >
                    <p className="text-sm text-emerald-400">
                      رتبهٔ {person.rank}
                    </p>
                    <h3 className="mt-3 text-lg font-bold">
                      {person.name}
                    </h3>
                    <p className="mt-2 text-2xl font-bold">
                      ${money(Number(person.net_worth_billions))}B
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      {person.company || "شرکت ثبت نشده"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {person.country || "کشور ثبت نشده"}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <div className="border-b border-slate-800 p-5">
                <h2 className="text-2xl font-bold">
                  فهرست میلیاردرها
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {people.length} نفر از اطلاعات ثبت‌شده
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-right">
                  <thead className="bg-slate-800 text-sm text-slate-300">
                    <tr>
                      <th className="p-4">رتبه</th>
                      <th className="p-4">نام</th>
                      <th className="p-4">شرکت</th>
                      <th className="p-4">کشور</th>
                      <th className="p-4">ثروت (میلیارد دلار)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.map((person) => (
                      <tr
                        key={person.id}
                        className="border-t border-slate-800 hover:bg-slate-800/60"
                      >
                        <td className="p-4">{person.rank}</td>
                        <td className="p-4 font-semibold">
                          {person.name}
                        </td>
                        <td className="p-4 text-slate-300">
                          {person.company || "—"}
                        </td>
                        <td className="p-4 text-slate-300">
                          {person.country || "—"}
                        </td>
                        <td className="p-4 font-semibold text-emerald-400">
                          ${money(Number(person.net_worth_billions))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <footer className="mt-6 text-center text-sm text-slate-400">
              منبع مرجع:{" "}
              <a
                href="https://www.forbes.com/real-time-billionaires/"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 underline"
              >
                Forbes Real-Time Billionaires
              </a>
              <p className="mt-2">
                نمایش اطلاعات دیتابیس به معنی به‌روزرسانی خودکار ثروت‌ها نیست.
              </p>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}
