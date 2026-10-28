import type { Metadata } from "next";

const pageUrl = "https://econova-nine.vercel.app/billionaires";
const dataUrl =
"https://zusbebjskchgehdjvpsm.supabase.co/functions/v1/econova-public-billionaires";

const pageTitle =
"World's Richest People & Billionaire Rankings | Econova";

const pageDescription =
"Explore billionaire rankings, estimated net worth, daily wealth changes, and company information on Econova. View public data with sources and update information where available.";

const pageDescriptionFa =
"رتبه‌بندی ثروتمندترین افراد جهان در اکونوا؛ مشاهده ثروت تخمینی، تغییرات دارایی‌ها، اطلاعات شرکت‌ها و داده‌های عمومی، همراه با منابع و زمان به‌روزرسانی در صورت دسترس بودن.";

export const metadata: Metadata = {
title: pageTitle,
description: pageDescription,
keywords: [
"Econova",
"world's richest people",
"billionaire rankings",
"billionaire net worth",
"richest people in the world",
"wealth rankings",
"ثروتمندترین افراد جهان",
"رتبه‌بندی ثروتمندان",
"ثروت تخمینی میلیاردرها",
"تغییرات روزانه ثروت",
],
alternates: {
canonical: pageUrl,
},
openGraph: {
title: pageTitle,
description: pageDescription,
url: pageUrl,
siteName: "Econova",
type: "website",
locale: "en_US",
alternateLocale: ["fa_IR"],
},
twitter: {
card: "summary",
title: pageTitle,
description: pageDescription,
},
robots: {
index: true,
follow: true,
googleBot: {
index: true,
follow: true,
"max-image-preview": "large",
"max-snippet": -1,
},
},
};

const structuredData = {
"@context": "https://schema.org",
"@type": "Dataset",
name: "Econova — Global Billionaire Net Worth Dataset",
alternateName: [
"داده‌های ثروت میلیاردرهای جهان اکونوا",
"رتبه‌بندی ثروتمندترین افراد جهان",
],
description:
"A public dataset of billionaire rankings and estimated net worth maintained by Econova. Values are estimates and should be interpreted alongside available sources and update information.",
url: pageUrl,
keywords: [
"billionaires",
"net worth estimates",
"richest people",
"wealth rankings",
"Econova",
"ثروتمندان جهان",
],
inLanguage: ["en", "fa"],
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
__html: JSON.stringify(structuredData).replace(/</g, "\u003c"),
}}
/>
{children}
</>
);
}
