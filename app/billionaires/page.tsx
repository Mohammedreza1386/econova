
"use client";

import { useState } from "react";

type Person = {
  name: string;
  company: string;
  wealth: string;
  source: string;
};

type Company = {
  name: string;
  field: string;
  value: string;
  source: string;
};

const initialPeople: Person[] = [];
const initialCompanies: Company[] = [];

export default function BillionairesPage() {
  const [tab, setTab] = useState<"people" | "companies">("people");
  const [people] = useState(initialPeople);
  const [companies] = useState(initialCompanies);

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#07111f",
        color: "#f1f5f9",
        fontFamily: "Arial, sans-serif",
        padding: "24px",
      }}
    >
      <header style={{ maxWidth: 1100, margin: "0 auto" }}>
        <a href="/" style={{ color: "#60a5fa", textDecoration: "none" }}>
          ← بازگشت به Econova
        </a>

        <p style={{ color: "#38bdf8", marginTop: 32 }}>
          ECONOVA • GLOBAL WEALTH
        </p>

        <h1 style={{ fontSize: 34, marginBottom: 12 }}>
          میلیاردرها و شرکت‌های بزرگ
        </h1>

        <p style={{ color: "#94a3b8", lineHeight: 2 }}>
          اطلاعات ثروت، شرکت‌ها و ارزش بازار با ذکر منبع معتبر.
        </p>

        <div
          style={{
            background: "#172337",
            border: "1px solid #334155",
            borderRadius: 12,
            padding: 14,
            marginTop: 24,
            lineHeight: 2,
          }}
        >
          این صفحه هنوز به منابع داده زنده متصل نشده است.
          اطلاعات تا زمان اتصال منبع معتبر نمایش داده نمی‌شوند.
        </div>

        <nav
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 24,
          }}
        >
          <button
            onClick={() => setTab("people")}
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              border: "1px solid #334155",
              background: tab === "people" ? "#2563eb" : "#111c2d",
              color: "white",
              cursor: "pointer",
            }}
          >
            میلیاردرها
          </button>

          <button
            onClick={() => setTab("companies")}
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              border: "1px solid #334155",
              background: tab === "companies" ? "#2563eb" : "#111c2d",
              color: "white",
              cursor: "pointer",
            }}
          >
            شرکت‌ها
          </button>
        </nav>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 16,
            marginTop: 24,
          }}
        >
          {tab === "people" &&
            (people.length ? (
              people.map((person) => (
                <article
                  key={person.name}
                  style={cardStyle}
                >
                  <h2>{person.name}</h2>
                  <p>{person.company}</p>
                  <p>ثروت: {person.wealth}</p>
                  <a href={person.source} target="_blank" rel="noreferrer">
                    مشاهده منبع
                  </a>
                </article>
              ))
            ) : (
              <p style={{ color: "#94a3b8", lineHeight: 2 }}>
                هنوز اطلاعات تأییدشده‌ای برای نمایش ثبت نشده است.
              </p>
            ))}

          {tab === "companies" &&
            (companies.length ? (
              companies.map((company) => (
                <article
                  key={company.name}
                  style={cardStyle}
                >
                  <h2>{company.name}</h2>
                  <p>حوزه فعالیت: {company.field}</p>
                  <p>ارزش بازار: {company.value}</p>
                  <a href={company.source} target="_blank" rel="noreferrer">
                    مشاهده منبع
                  </a>
                </article>
              ))
            ) : (
              <p style={{ color: "#94a3b8", lineHeight: 2 }}>
                هنوز اطلاعات تأییدشده‌ای برای نمایش ثبت نشده است.
              </p>
            ))}
        </section>

        <footer
          style={{
            marginTop: 48,
            paddingTop: 20,
            borderTop: "1px solid #334155",
            color: "#64748b",
            fontSize: 13,
          }}
        >
          Econova • اطلاعات مالی باید همراه با منبع و تاریخ به‌روزرسانی باشند.
        </footer>
      </header>
    </main>
  );
}

const cardStyle = {
  background: "#111c2d",
  border: "1px solid #334155",
  borderRadius: 14,
  padding: 20,
  lineHeight: 1.8,
  overflowWrap: "anywhere" as const,
};
          
