
import type { Metadata } from "next";
import Link from "next/link";

const site = "https://econova-nine.vercel.app";

export const metadata: Metadata = {
  title: "About Econova | Global Financial Information Platform",
  description:
    "Learn about Econova's mission, coverage and approach to presenting financial market information and global wealth estimates.",
  alternates: { canonical: `${site}/about` },
  openGraph: {
    type: "website",
    url: `${site}/about`,
    siteName: "Econova",
    title: "About Econova",
    description:
      "Econova's mission, information coverage and standards for presenting financial and wealth data.",
  },
  robots: { index: true, follow: true },
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-9">
      <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-gray-300">
        {children}
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <main dir="ltr" className="min-h-screen bg-[#080b09] px-4 py-10 text-white sm:px-6">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-lg font-black tracking-[0.2em] text-[#b9f27c]">
          ECONOVA
        </Link>

        <p className="mt-10 text-xs font-semibold tracking-[0.2em] text-[#b9f27c]">
          ABOUT THE PLATFORM
        </p>

        <h1 className="mt-3 text-3xl font-black sm:text-4xl">
          About Econova
        </h1>

        <p className="mt-4 text-base leading-8 text-gray-300">
          Econova is an independent digital platform built to make financial
          information and global wealth data easier to explore. It brings
          selected market indicators, cryptocurrency information and
          billionaire wealth rankings together in one accessible experience.
        </p>

        <div className="mt-7 rounded-xl border border-[#b9f27c]/20 bg-[#101611] p-5">
          <p className="text-xs font-semibold tracking-[0.16em] text-[#b9f27c]">
            OUR MISSION
          </p>
          <p className="mt-3 text-lg font-bold leading-8 text-white">
            Make complex financial and wealth information clearer,
            more accessible and easier to understand.
          </p>
        </div>

        <Section title="What Econova covers">
          <p>
            Econova brings together several areas of financial information,
            including market indicators, cryptocurrency prices, selected
            currency and precious-metal data, and profiles of people included
            in its global billionaire rankings.
          </p>
          <p>
            Coverage and data availability can vary by section. The figures
            shown on the platform may have different update schedules and
            should always be read with their displayed context and timestamps.
          </p>
        </Section>

        <Section title="Our approach to information">
          <p>
            We aim to present information with clear labels, useful context
            and visible limitations. Market prices, database update times and
            editorial wealth estimates are different types of information and
            should not be treated as interchangeable.
          </p>
          <p>
            Billionaire net-worth figures published by Econova are estimates.
            They are not guaranteed real-time values, audited personal
            balance sheets or independently verified figures in every case.
            Rankings reflect the records maintained in the Econova database.
          </p>
        </Section>

        <Section title="Transparency matters">
          <p>
            Data can be incomplete, delayed or revised. A record's update
            timestamp does not necessarily mean that every underlying asset
            was revalued at that time. Historical charts represent saved
            records rather than a continuous measure of wealth.
          </p>
          <p>
            We explain these distinctions in our methodology and data policy
            so readers can better understand what the platform does and does
            not claim.
          </p>
        </Section>

        <Section title="Who we serve">
          <p>
            Econova is designed for readers who want to explore financial
            markets and global wealth information through a straightforward
            digital interface. The platform aims to be useful to an
            international audience while continuing to support Persian
            language access.
          </p>
        </Section>

        <Section title="Important notice">
          <p>
            Econova provides informational content only. Nothing on this
            website is financial, investment, legal or tax advice. Information
            may change, and readers should consult appropriate primary
            materials before making important decisions.
          </p>
        </Section>

        <div className="mt-10 flex flex-wrap gap-x-5 gap-y-3 border-t border-white/10 pt-6 text-sm font-bold">
          <Link href="/billionaires/rankings" className="text-[#b9f27c] hover:underline">
            Global billionaire rankings →
          </Link>
          <Link href="/methodology" className="text-[#b9f27c] hover:underline">
            Ranking methodology →
          </Link>
          <Link href="/data-license" className="text-gray-300 hover:text-white hover:underline">
            Data license →
          </Link>
        </div>

        <div dir="rtl" className="mt-9 border-t border-white/10 pt-6 text-sm leading-8 text-gray-400">
          <h2 className="text-base font-bold text-white">درباره اکونوا</h2>
          <p className="mt-2">
            اکونوا یک پلتفرم دیجیتال برای بررسی و دسترسی ساده‌تر به اطلاعات
            بازارهای مالی و داده‌های ثروت جهانی است. هدف ما ارائه اطلاعات
            ساختارمند، قابل‌فهم و همراه با توضیح محدودیت‌های داده‌هاست.
          </p>
          <p className="mt-2">
            ارقام ثروت منتشرشده در اکونوا تخمینی هستند و لزوماً ارزش لحظه‌ای،
            حسابرسی‌شده یا دارای تأیید مستقل نیستند. زمان به‌روزرسانی رکوردها
            نیز الزاماً به معنی ارزش‌گذاری مجدد تمام دارایی‌ها نیست.
          </p>
        </div>

        <footer className="mt-12 border-t border-white/10 pt-5 text-xs text-gray-600">
          © {new Date().getFullYear()} ECONOVA
        </footer>
      </article>
    </main>
  );
}
