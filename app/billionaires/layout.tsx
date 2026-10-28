import type { Metadata } from "next";

const pageUrl = "https://econova-nine.vercel.app/billionaires";
const dataUrl =
"https://zusbebjskchgehdjvpsm.supabase.co/functions/v1/econova-public-billionaires";

const pageTitle =
"World's Richest People & Billionaire Rankings | Econova";

const pageDescription =
"Explore Econova's billionaire rankings, estimated net worth, daily wealth changes, company information, and public data API. Estimates are maintained by Econova and should be read with their sources and update dates.";

export const metadata: Metadata = {
title: pageTitle,
description: pageDescription,

keywords: [
"world's richest people",
"billionaire rankings",
"billionaire net worth",
"daily wealth changes",
"richest people in the world",
"Econova billionaire tracker",
"public billionaire data API",
"ثروتمندترین افراد جهان",
"رتبه‌بندی ثروتمندان",
"ثروت تخمینی میلیاردرها",
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
},
},
};

const structuredData = {
"@context": "https://schema.org",
"@type": "Dataset",
name: "Econova — Global Billionaire Net Worth Dataset",
alternateName: "داده‌های ثروت میلیاردرهای جهان اکونوا",
description:
"A public dataset of billionaire rankings and estimated net worth maintained by Econova. Values are estimates and should be interpreted alongside their sources and update timestamps.",
url: pageUrl,
keywords: [
"billionaires",
"net worth estimates",
"richest people",
"wealth rankings",
"Econova",
],
isAccessibleForFree: true,
dateModified: new Date().toISOString().slice(0, 10),
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
