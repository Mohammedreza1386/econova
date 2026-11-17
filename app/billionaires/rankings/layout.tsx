
import type { Metadata } from "next";

const pageUrl =
  "https://econova-nine.vercel.app/billionaires/rankings";

export const metadata: Metadata = {
  title: "Global Billionaire Rankings",
  description:
    "Explore the complete Econova ranking of the world's wealthiest people, estimated net worth and individual wealth profiles.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Global Billionaire Rankings",
    description:
      "Explore global billionaire rankings and wealth profiles on Econova.",
    url: pageUrl,
    siteName: "Econova",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Global Billionaire Rankings",
    description:
      "Explore global billionaire rankings on Econova.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RankingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
