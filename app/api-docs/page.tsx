import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "مستندات API عمومی | Econova",
  description:
    "مستندات API عمومی اکونوا برای دسترسی به رتبه‌بندی ثروتمندان جهان، ثروت تخمینی، تغییرات روزانه و اطلاعات منابع.",
  alternates: {
    canonical: "https://econova-nine.vercel.app/api-docs",
  },
};

const apiUrl =
  "https://zusbebjskchgehdjvpsm.supabase.co/functions/v1/econova-public-billionaires";

const fields = [
  ["name", "string", "نام مجموعه‌داده"],
  ["description", "string", "توضیح مجموعه‌داده"],
  ["updated_at", "string (ISO 8601)", "زمان آخرین به‌روزرسانی مجموعه"],
  ["count", "number", "تعداد رکوردهای اعلام‌شده"],
  ["billionaires", "array", "فهرست افراد ثروتمند"],
  ["id", "string (UUID)", "شناسهٔ رکورد"],
  ["rank", "number", "رتبه در فهرست اکونوا"],
  ["name", "string", "نام فرد"],
  ["company", "string | null", "شرکت یا حوزهٔ فعالیت"],
  ["country", "string | null", "کشور یا محل انتساب در داده"],
  ["image_url", "string | null", "نشانی تصویر، در صورت وجود"],
  ["bio", "string | null", "توضیحات فرد، در صورت وجود"],
  ["net_worth_billions", "number", "ثروت تخمینی به میلیارد دلار"],
  ["daily_change_pct", "number | null", "درصد تغییر روزانه"],
  ["daily_change_date", "string | null", "تاریخ تغییر روزانه"],
  ["updated_at", "string (ISO 8601)", "زمان آخرین به‌روزرسانی رکورد"],
  ["source_url", "string | null", "نشانی منبع، در صورت وجود"],
  ["source_checked_at", "string | null", "زمان بررسی منبع"],
  ["yesterday_net_worth_billions", "number | null", "ثروت ثبت‌شده برای روز قبل، در صورت وجود"],
] as const;

const sampleResponse = `{
  "name": "Econova Public Billionaire Data",
  "description": "Public read-only billionaire ranking and wealth estimates maintained by Econova.",
  "updated_at": "2026-10-28T16:20:55.179+00:00",
  "count": 45,
  "billionaires": [
    {
      "id": "example-uuid",
      "rank": 1,
      "name": "Elon Musk",
      "company": "Tesla · SpaceX",
      "country": "United States",
      "image_url": "https://example.com/image.jpg",
      "bio": null,
      "net_worth_billions": 932.1,
      "daily_change_pct": -2.704,
      "daily_change_date": "2026-10-28",
      "updated_at": "2026-10-28T16:08:52.28+00:00",
      "source_url": "https://www.forbes.com/real-time-billionaires/",
      "source_checked_at": "2026-10-20T16:40:35.287724+00:00",
      "yesterday_net_worth_billions": 958
    }
  ]
}`;

const jsExample = `const response = await fetch("${apiUrl}");
if (!response.ok) {
  throw new Error(\`Econova API error: \${response.status}\`);
}
const data = await response.json();

console.log("Total records:", data.count);

for (const person of data.billionaires ?? []) {
  console.log(
    person.rank,
    person.name,
    person.net_worth_billions
  );
}`;

export default function ApiDocsPage() {
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#080b0a",
        color: "#f2f5ef",
        padding: "32px 18px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <a href="/" style={{ color: "#b9f27c", textDecoration: "none" }}>
          ← بازگشت به اکونوا
        </a>

        <header style={{ margin: "34px 0" }}>
          <p style={{ color: "#b9f27c", letterSpacing: 2 }}>
            ECONOVA DEVELOPERS
          </p>
          <h1 style={{ fontSize: 36, lineHeight: 1.5 }}>
            مستندات API عمومی اکونوا
          </h1>
          <p style={{ color: "#b9c0b7", lineHeight: 2 }}>
            دسترسی برنامه‌نویسان، وب‌سایت‌ها و ابزارهای تحلیل داده به
            فهرست عمومی ثروتمندان اکونوا از طریق یک نقطهٔ دسترسی JSON.
          </p>
        </header>

        <section style={card}>
          <h2 style={heading}>۱. نقطهٔ دسترسی</h2>
          <p style={paragraph}>
            برای دریافت داده‌ها از درخواست HTTP با روش GET استفاده کنید.
          </p>
          <code style={code}>{apiUrl}</code>
          <p style={paragraph}>
            <strong>Method:</strong> GET
            {"  "}·{"  "}
            <strong>Response:</strong> application/json
          </p>
          <a href={apiUrl} target="_blank" rel="noreferrer" style={button}>
            مشاهدهٔ پاسخ زندهٔ JSON ↗
          </a>
        </section>

        <section style={card}>
          <h2 style={heading}>۲. ساختار پاسخ</h2>
          <p style={paragraph}>
            پاسخ شامل اطلاعات کلی مجموعه و آرایهٔ
            {" "}
            <code>billionaires</code>
            {" "}است. نمونهٔ زیر برای نمایش ساختار تهیه شده و ممکن است
            با دادهٔ زنده تفاوت داشته باشد.
          </p>
          <pre style={pre} dir="ltr">{sampleResponse}</pre>
        </section>

        <section style={card}>
          <h2 style={heading}>۳. فهرست فیلدها</h2>
          <p style={paragraph}>
            فیلدهای زیر بر اساس نمونهٔ پاسخ API اکونوا مستند شده‌اند.
            ممکن است برخی مقدارها null باشند.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>فیلد</th>
                  <th style={th}>نوع داده</th>
                  <th style={th}>توضیح</th>
                </tr>
              </thead>
              <tbody>
                {fields.map(([name, type, description], index) => (
                  <tr key={`${name}-${index}`}>
                    <td style={td}>
                      <code dir="ltr">{name}</code>
                    </td>
                    <td style={td}>
                      <code dir="ltr">{type}</code>
                    </td>
                    <td style={td}>{description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={card}>
          <h2 style={heading}>۴. نمونهٔ استفاده با JavaScript</h2>
          <p style={paragraph}>
            این نمونه درخواست را ارسال می‌کند، وضعیت پاسخ را بررسی می‌کند
            و رتبه، نام و ثروت تخمینی هر رکورد را می‌خواند.
          </p>
          <pre style={pre} dir="ltr">{jsExample}</pre>
        </section>

        <section style={card}>
          <h2 style={heading}>۵. تفسیر و اعتبار داده‌ها</h2>
          <ul style={{ color: "#d3d9d0", lineHeight: 2.2 }}>
            <li>
              تمام مقادیر ثروت باید برآورد تلقی شوند و لزوماً رقم قطعی
              یا تأییدشده توسط فوربز نیستند.
            </li>
            <li>
              مقدار <code>net_worth_billions</code> بر حسب میلیارد دلار است.
            </li>
            <li>
              مقدار مثبت <code>daily_change_pct</code> افزایش و مقدار منفی
              کاهش ثبت‌شده را نشان می‌دهد.
            </li>
            <li>
              تاریخ <code>daily_change_date</code> را همراه با درصد تغییر
              نمایش دهید.
            </li>
            <li>
              ممکن است <code>source_url</code> یا
              <code>source_checked_at</code> برای بعضی رکوردها خالی باشد.
            </li>
            <li>
              <code>updated_at</code> زمان به‌روزرسانی ثبت‌شده است و به‌تنهایی
              ثابت نمی‌کند که منبع بیرونی در همان لحظه بررسی شده است.
            </li>
          </ul>
        </section>

        <section style={card}>
          <h2 style={heading}>۶. دسترسی و محدودیت‌ها</h2>
          <p style={paragraph}>
            این نقطهٔ دسترسی برای خواندن داده‌های عمومی طراحی شده است.
            مصرف‌کنندگان باید خطاهای HTTP، مقدارهای خالی و تغییرات احتمالی
            ساختار پاسخ را مدیریت کنند.
          </p>
          <p style={paragraph}>
            این مستندات نرخ درخواست تضمین‌شده‌ای تعریف نمی‌کنند. دسترسی
            عمومی نیز به‌تنهایی مجوز بازنشر نامحدود تصاویر یا داده‌های
            متعلق به منابع دیگر نیست.
          </p>
        </section>

        <footer style={{ borderTop: "1px solid #293329", paddingTop: 24, color: "#8e9a8d", lineHeight: 2 }}>
          Econova — داده‌های اقتصادی و ثروت تخمینی
          <br />
          <a href="/billionaires" style={{ color: "#b9f27c" }}>
            مشاهدهٔ رتبه‌بندی ثروتمندان اکونوا
          </a>
          {" · "}
          <a href={apiUrl} target="_blank" rel="noreferrer" style={{ color: "#b9f27c" }}>
            API عمومی
          </a>
        </footer>
      </div>
    </main>
  );
}

const card: React.CSSProperties = {
  border: "1px solid #293329",
  borderRadius: 16,
  padding: 24,
  marginBottom: 24,
  background: "#101512",
};

const heading: React.CSSProperties = {
  color: "#b9f27c",
  marginTop: 0,
  lineHeight: 1.7,
};

const paragraph: React.CSSProperties = {
  color: "#b9c0b7",
  lineHeight: 2,
};

const code: React.CSSProperties = {
  display: "block",
  direction: "ltr",
  textAlign: "left",
  overflowWrap: "anywhere",
  background: "#070907",
  padding: 16,
  borderRadius: 10,
  color: "#b9f27c",
  lineHeight: 1.8,
};

const pre: React.CSSProperties = {
  direction: "ltr",
  textAlign: "left",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  overflowX: "auto",
  background: "#070907",
  padding: 16,
  borderRadius: 10,
  color: "#d8e4d2",
  lineHeight: 1.8,
  fontSize: 13,
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "right",
  minWidth: 620,
};

const th: React.CSSProperties = {
  borderBottom: "1px solid #394339",
  padding: 12,
  color: "#b9f27c",
  whiteSpace: "nowrap",
};

const td: React.CSSProperties = {
  borderBottom: "1px solid #293329",
  padding: 12,
  color: "#d3d9d0",
  lineHeight: 1.8,
};

const button: React.CSSProperties = {
  display: "inline-block",
  marginTop: 12,
  background: "#b9f27c",
  color: "#101510",
  padding: "12px 18px",
  borderRadius: 8,
  textDecoration: "none",
  fontWeight: "bold",
};
