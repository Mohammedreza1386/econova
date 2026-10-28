
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Econova | داشبورد اقتصادی",
  description: "بازارهای مالی، اخبار اقتصادی و رتبه‌بندی ثروتمندان جهان در اکونوا.",
  verification: {
    google: "0IhLwZnj_JSHAP01HsRjO9BX8IrpylhsEeSUTU40GpU",
  },
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
