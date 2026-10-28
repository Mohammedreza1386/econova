
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ثروتمندترین افراد جهان | Econova",
  description:
    "رتبه‌بندی ثروتمندترین افراد جهان در اکونوا؛ مشاهده ثروت تخمینی، تغییرات روزانه دارایی‌ها، اطلاعات شرکت‌ها و اخبار مرتبط.",
  keywords: [
    "ثروتمندترین افراد جهان",
    "رتبه‌بندی ثروتمندان",
    "Econova",
    "ثروت میلیاردرها",
    "تغییرات روزانه ثروت",
  ],
  alternates: {
    canonical: "https://econova-nine.vercel.app/billionaires",
  },
  openGraph: {
    title: "ثروتمندترین افراد جهان | Econova",
    description:
      "رتبه‌بندی و بررسی ثروت تخمینی میلیاردرهای جهان در اکونوا.",
    url: "https://econova-nine.vercel.app/billionaires",
    siteName: "Econova",
    type: "website",
    locale: "fa_IR",
  },
};

export default function BillionairesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

