import type { Metadata } from "next";

export const metadata: Metadata = {
metadataBase: new URL("https://econova-nine.vercel.app"),

title: {
default: "Econova | Global Markets, Currencies & Billionaire Rankings",
template: "%s | Econova",
},

description:
"Explore global financial markets, cryptocurrency, currency exchange rates, economic news, and billionaire net worth rankings with Econova.",

applicationName: "Econova",

keywords: [
"Econova",
"global financial markets",
"currency exchange rates",
"cryptocurrency prices",
"economic news",
"world's richest people",
"billionaire net worth",
"billionaire rankings",
"بازارهای مالی",
"قیمت ارز",
"اخبار اقتصادی",
"ثروتمندان جهان",
],

alternates: {
canonical: "/",
},

openGraph: {
type: "website",
url: "/",
siteName: "Econova",
title: "Econova | Global Financial Markets & Billionaire Rankings",
description:
"Track financial markets, currency rates, economic news, and the world's wealthiest people on Econova.",
locale: "en_US",
alternateLocale: ["fa_IR"],
},

twitter: {
card: "summary_large_image",
title: "Econova | Global Markets & Billionaire Rankings",
description:
"Explore financial markets, currency rates, economic news, and billionaire rankings.",
},

robots: {
index: true,
follow: true,
googleBot: {
index: true,
follow: true,
"max-image-preview": "large",
"max-snippet": -1,
"max-video-preview": -1,
},
},

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
