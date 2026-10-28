
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "مستندات API عمومی | Econova",
  description:
    "مستندات رسمی API عمومی اکونوا برای دسترسی به داده‌های ثروتمندان جهان، برآورد دارایی‌ها و اطلاعات مرتبط.",
  alternates: {
    canonical: "https://econova-nine.vercel.app/api-docs",
  },
};

const apiUrl =
  "https://zusbebjskchgehdjvpsm.supabase.co/functions/v1/econova-public-billionaires";

export default function ApiDocsPage() {
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#080b0a",
        color: "#f2f5ef",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <a
          href="/"
          style={{ color: "#b9f27c", textDecoration: "none" }}
        >
          ← بازگشت به اکونوا
        </a>

        <header style={{ margin: "36px 0" }}>
          <p style={{ color: "#b9f27c", letterSpacing: 2 }}>
            ECONOVA DEVELOPERS
          </p>
          <h1 style={{ fontSize: 38, marginBottom: 16 }}>
            مستندات API عمومی اکونوا
          </h1>
          <p style={{ color: "#b9c0b7", lineHeight: 2 }}>
            راهنمای دسترسی برنامه‌نویسان و سرویس‌های نرم‌افزاری به
            داده‌های عمومی ثروتمندان اکونوا.
          </p>
        </header>

        <section
          style={{
            border: "1px solid #293329",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            background: "#101512",
          }}
        >
          <h2 style={{ color: "#b9f27c" }}>۱. نقطهٔ دسترسی API</h2>
          <p style={{ color: "#b9c0b7", lineHeight: 2 }}>
            این نشانی برای دریافت پاسخ عمومی API استفاده می‌شود.
          </p>

          <code
            dir="ltr"
            style={{
              display: "block",
              overflowWrap: "anywhere",
              background: "#070907",
              padding: 16,
              borderRadius: 10,
              color: "#b9f27c",
              lineHeight: 1.8,
            }}
          >
            {apiUrl}
          </code>

          <p style={{ lineHeight: 2 }}>
            روش درخواست: <strong>GET</strong>
          </p>

          <a
            href={apiUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              marginTop: 12,
              background: "#b9f27c",
              color: "#101510",
              padding: "12px 18px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            مشاهدهٔ پاسخ JSON
          </a>
        </section>

        <section
          style={{
            border: "1px solid #293329",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            background: "#101512",
          }}
        >
          <h2 style={{ color: "#b9f27c" }}>۲. قالب پاسخ</h2>
          <p style={{ color: "#b9c0b7", lineHeight: 2 }}>
            پاسخ API در قالب JSON ارائه می‌شود. ساختار دقیق فیلدها را
            از پاسخ زندهٔ API بررسی کنید؛ نام فیلدها و نوع داده‌ها
            باید مطابق همان پاسخ استفاده شوند.
          </p>

          <pre
            dir="ltr"
            style={{
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              background: "#070907",
              padding: 16,
              borderRadius: 10,
              color: "#d8e4d2",
              lineHeight: 1.8,
            }}
          >
{`GET ${apiUrl}

Accept: application/json`}
          </pre>
        </section>

        <section
          style={{
            border: "1px solid #293329",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            background: "#101512",
          }}
        >
          <h2 style={{ color: "#b9f27c" }}>۳. تفسیر داده‌ها</h2>
          <ul style={{ color: "#d3d9d0", lineHeight: 2.2 }}>
            <li>
              ارزش دارایی‌ها را برآورد بدانید، نه رقم قطعی و تضمین‌شده.
            </li>
            <li>
              در صورت وجود منبع و زمان به‌روزرسانی، آن‌ها را همراه داده
              نمایش دهید.
            </li>
            <li>
              تغییر روزانهٔ ثروت را با تاریخ مربوط به همان داده تفسیر کنید.
            </li>
            <li>
              پیش از انتشار یا استفادهٔ تجاری، صحت و شرایط استفاده از
              منابع را بررسی کنید.
            </li>
          </ul>
        </section>

        <section
          style={{
            border: "1px solid #293329",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            background: "#101512",
          }}
        >
          <h2 style={{ color: "#b9f27c" }}>۴. دسترسی و محدودیت‌ها</h2>
          <p style={{ color: "#b9c0b7", lineHeight: 2 }}>
            این نقطهٔ دسترسی برای داده‌های عمومی طراحی شده است.
            در صورت تغییر ساختار پاسخ، خطاهای موقت یا محدودیت درخواست،
            مصرف‌کنندگان API باید پاسخ را اعتبارسنجی کنند و از فرض
            ثابت بودن همهٔ فیلدها خودداری کنند.
          </p>
          <p style={{ color: "#b9c0b7", lineHeight: 2 }}>
            دسترسی عمومی به API به معنی مجوز نامحدود برای بازنشر داده‌ها
            یا تضمین در دسترس بودن دائمی سرویس نیست.
          </p>
        </section>

        <footer
          style={{
            borderTop: "1px solid #293329",
            paddingTop: 24,
            color: "#8e9a8d",
            lineHeight: 2,
          }}
        >
          Econova — داده‌های اقتصادی و ثروت تخمینی
          <br />
          <a
            href="/billionaires"
            style={{ color: "#b9f27c" }}
          >
            صفحهٔ ثروتمندان اکونوا
          </a>
        </footer>
      </div>
    </main>
  );
            }
