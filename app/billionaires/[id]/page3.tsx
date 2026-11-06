"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Article = {
  id: string;
  billionaire_rank: number;
  title: string;
  content: string | null;
  image_url: string | null;
  source_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};
type Person = { rank: number; name: string; image_url: string | null; company: string | null };
type PublicData = { news?: Article[]; billionaires?: Person[] };

const API = "https://zusbebjskchgehdjvpsm.supabase.co/functions/v1/econova-public-billionaires";

export default function BillionaireNewsDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [article, setArticle] = useState<Article | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let active = true;
    fetch(API, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("دریافت خبر ناموفق بود.");
        return response.json() as Promise<PublicData>;
      })
      .then((data) => {
        if (!active) return;
        const found = (data.news || []).find((item) => item.id === id);
        if (!found) throw new Error("این خبر پیدا نشد یا حذف شده است.");
        setArticle(found);
        setPerson((data.billionaires || []).find((p) => p.rank === found.billionaire_rank) || null);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "خطا در دریافت خبر.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const date = article?.created_at || article?.updated_at;
  return (
    <main dir="rtl" style={{ minHeight: "100vh", background: "#080d0a", color: "#f3f6f1", padding: "28px 16px", fontFamily: "Arial,sans-serif" }}>
      <article style={{ maxWidth: 900, margin: "0 auto" }}>
        <Link href="/billionaires/rankings" style={{ color: "#b9f27c", textDecoration: "none", display: "inline-block", marginBottom: 24 }}>← بازگشت به رتبه‌بندی میلیاردها</Link>
        {loading ? <p>در حال دریافت خبر...</p> : error ? <p role="alert">{error}</p> : article ? (
          <>
            <div style={{ color: "#b9f27c", fontSize: 13, marginBottom: 12 }}>اخبار ثروتمندان برتر · رتبه {article.billionaire_rank}</div>
            <h1 style={{ fontSize: "clamp(26px,5vw,42px)", lineHeight: 1.5, margin: "0 0 14px" }}>{article.title}</h1>
            {person && <div style={{ color: "#a8b6aa", marginBottom: 20 }}>{person.name}{person.company ? ` · ${person.company}` : ""}</div>}
            {article.image_url && <img src={article.image_url} alt={article.title} style={{ width: "100%", maxHeight: 480, objectFit: "cover", borderRadius: 18, marginBottom: 24, background: "#14271d" }} />}
            {date && <time dateTime={date} style={{ color: "#8d9b90", fontSize: 13 }}>{new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date))}</time>}
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 2.2, fontSize: 17, marginTop: 24 }}>{article.content}</div>
          </>
        ) : null}
      </article>
    </main>
  );
}
