
import type { Metadata } from "next";

const pageUrl = "https://econova-nine.vercel.app/billionaires";
const dataUrl =
  "https://zusbebjskchgehdjvpsm.supabase.co/functions/v1/econova-public-billionaires";

export const metadata: Metadata = {
  title: "ثروتمندترین افراد جهان | Econova",
  description:
    "رتبه‌بندی ثروتمندترین افراد جهان در اکونوا؛ بررسی ثروت تخمینی، تغییرات دارایی‌ها، شرکت‌ها و اخبار مرتبط با دسترسی عمومی به داده‌ها.",
  keywords: [
    "ثروتمندترین افراد جهان",
    "رتبه‌بندی ثروتمندان",
    "Econova",
    "ثروت تخمینی میلیاردرها",
    "تغییرات روزانه ثروت",
  ],
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "ثروتمندترین افراد جهان | Econova",
    description:
      "رتبه‌بندی و بررسی ثروت تخمینی میلیاردرهای جهان در اکونوا.",
    url: pageUrl,
    siteName: "Econova",
    type: "website",
    locale: "fa_IR",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "Econova — داده‌های ثروت میلیاردرهای جهان",
  description:
    "مجموعه‌دادهٔ عمومی اکونوا دربارهٔ رتبه‌بندی و برآورد ثروت افراد ثروتمند جهان. مقادیر برآوردی هستند و باید همراه با منابع و زمان به‌روزرسانی تفسیر شوند.",
  url: pageUrl,
  keywords: [
    "ثروتمندان جهان",
    "میلیاردرها",
    "ثروت تخمینی",
    "Econova",
  ],
  isAccessibleForFree: true,
  distribution: {
    "@type": "DataDownload",
    contentUrl: dataUrl,
    encodingFormat: "application/json",
  },
  creator: {
    "@type": "Organization",
    name: "Econova",
    url: "https://econova-nine.vercel.app/",
  },
};

export default function BillionairesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      {children}
    </>
  );
}
