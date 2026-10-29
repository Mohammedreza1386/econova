
import type { Metadata } from "next";

const pageUrl = "https://econova-nine.vercel.app/billionaires";

export const metadata: Metadata = {
  title: "Top Billionaires in the World | Econova",
  description:
    "Explore the world's top billionaires, estimated net worth and global wealth rankings on Econova.",
  keywords: [
    "Econova",
    "Top Billionaires",
    "world's richest people",
    "billionaire net worth",
    "wealth rankings",
    "ثروتمندترین افراد جهان",
  ],
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Top Billionaires | Econova",
    description:
      "Explore the world's wealthiest people and their estimated fortunes.",
    url: pageUrl,
    siteName: "Econova",
    type: "website",
    locale: "en_US",
    alternateLocale: ["fa_IR"],
  },
  twitter: {
    card: "summary",
    title: "Top Billionaires | Econova",
    description:
      "Explore global billionaire rankings and estimated net worth.",
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

export default function BillionairesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Econova Global Billionaire Net Worth Dataset",
    alternateName: "داده‌های ثروت میلیاردرهای جهان اکونوا",
    description:
      "Estimated net worth and rankings of the world's wealthiest people. Figures are estimates and may change as the dataset is updated.",
    url: pageUrl,
    keywords: [
      "billionaires",
      "net worth estimates",
      "richest people",
      "wealth rankings",
      "ثروتمندان جهان",
    ],
    inLanguage: ["en", "fa"],
    isAccessibleForFree: true,
    creator: {
      "@type": "Organization",
      name: "Econova",
      url: "https://econova-nine.vercel.app/",
    },
    distribution: {
      "@type": "DataDownload",
      contentUrl:
        "https://zusbebjskchgehdjvpsm.supabase.co/functions/v1/econova-public-billionaires",
      encodingFormat: "application/json",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(datasetSchema).replace(/</g, "\\u003c"),
        }}
      />
      {children}
    </>
  );
}
