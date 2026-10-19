
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Econova | داشبورد اقتصادی",
  description: "بازارهای مالی و اخبار اقتصادی در یک نگاه",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
