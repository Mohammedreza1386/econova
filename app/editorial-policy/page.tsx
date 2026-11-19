
import type { Metadata } from "next";
import Link from "next/link";

const site = "https://econova-nine.vercel.app";

export const metadata: Metadata = {
  title: "Editorial Policy | Econova",
  description:
    "Econova's editorial standards, data handling principles, estimation limitations and correction approach.",
  alternates: {
    canonical: `${site}/editorial-policy`,
  },
  openGraph: {
    type: "website",
    url: `${site}/editorial-policy`,
    siteName: "Econova",
    title: "Editorial Policy | Econova",
    description:
      "Learn how Econova handles financial information, wealth estimates, updates and corrections.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
      <h2 className="text-lg font-bold text-white sm:text-xl">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-gray-300">
        {children}
      </div>
    </section>
  );
}

export default function EditorialPolicyPage() {
  return (
    <main
      dir="ltr"
      className="min-h-screen bg-[#080b09] px-4 py-10 text-white sm:px-6"
    >
      <article className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-lg font-black tracking-[0.2em] text-[#b9f27c]"
        >
          ECONOVA
        </Link>

        <p className="mt-10 text-xs font-semibold tracking-[0.2em] text-[#b9f27c]">
          EDITORIAL STANDARDS
        </p>

        <h1 className="mt-3 text-3xl font-black sm:text-4xl">
          Editorial Policy
        </h1>

        <p className="mt-4 text-base leading-8 text-gray-300">
          This policy explains the principles Econova follows when
          presenting financial information, market indicators and
          global wealth estimates. Our goal is to make information
          understandable while clearly communicating its limitations.
        </p>

        <Section title="1. Accuracy and clarity">
          <p>
            We aim to present information in a clear and consistent
            format. Figures should be understood in the context of
            their category, unit, timestamp and available explanation.
          </p>
          <p>
            We do not describe an estimate as a confirmed fact, or
            an old record as a live market value.
          </p>
        </Section>

        <Section title="2. Data categories">
          <p>
            Econova contains different categories of information,
            including market indicators, cryptocurrency data,
            selected currency and precious-metal information,
            and billionaire wealth estimates.
          </p>
          <p>
            These categories may use different collection methods,
            update schedules and levels of verification. They should
            not be assumed to share one data source or update process.
          </p>
        </Section>

        <Section title="3. Wealth estimates">
          <p>
            Billionaire wealth figures displayed by Econova are
            estimates maintained in the Econova database. Some
            records may be entered or updated manually.
          </p>
          <p>
            Estimated net worth can differ from one publication
            or calculation method to another. Private assets,
            liabilities, ownership structures and market movements
            can make precise valuation difficult.
          </p>
          <p>
            Econova does not claim that every wealth figure is
            independently audited, continuously recalculated
            or verified in real time.
          </p>
        </Section>

        <Section title="4. Sources and verification">
          <p>
            Depending on the data category, relevant information
            may be informed by public disclosures, company
            announcements, official statistics, market data
            providers and other publicly available records.
          </p>
          <p>
            The availability of supporting information varies.
            Readers should consider the timestamp and context
            provided with each record. Inclusion on Econova
            does not imply endorsement by an external organization.
          </p>
        </Section>

        <Section title="5. Updates and historical records">
          <p>
            Different sections may update at different intervals.
            A database update timestamp indicates when a record
            was saved or changed; it does not necessarily mean
            that every underlying value was independently
            recalculated at that moment.
          </p>
          <p>
            Historical charts are based on records available
            in the database. Missing periods, revisions or
            changes in methodology may affect comparisons.
          </p>
        </Section>

        <Section title="6. Corrections and revisions">
          <p>
            Data may be corrected or revised when better
            information becomes available or an error is identified.
            Previous values may therefore differ from current records.
          </p>
          <p>
            When reviewing a possible error, useful evidence
            includes the relevant Econova page, the displayed
            figure, the date of the record and a reliable
            supporting document or public statement.
          </p>
        </Section>

        <Section title="7. Automation and human review">
          <p>
            Automated systems may be used for data retrieval,
            formatting, calculations or website operations.
            Not every dataset is fully automated, and automation
            does not guarantee that information is correct.
          </p>
          <p>
            The method used for a particular section should be
            understood from its own methodology and data notes.
          </p>
        </Section>

        <Section title="8. Independence and limitations">
          <p>
            Econova is an independent digital information
            platform. Its rankings and estimates reflect the
            records and methods maintained by Econova and
            should not be treated as universal or definitive
            measures of wealth.
          </p>
          <p>
            Content is provided for informational and educational
            purposes only. It is not financial, investment,
            legal or tax advice.
          </p>
        </Section>

        <div className="mt-10 flex flex-wrap gap-x-5 gap-y-3 border-t border-white/10 pt-6 text-sm font-bold">
          <Link
            href="/about"
            className="text-[#b9f27c] hover:underline"
          >
            About Econova →
          </Link>
          <Link
            href="/methodology"
            className="text-[#b9f27c] hover:underline"
          >
            Methodology →
          </Link>
          <Link
            href="/data-license"
            className="text-gray-300 hover:text-white hover:underline"
          >
            Data License →
          </Link>
        </div>

        <div
          dir="rtl"
          className="mt-9 border-t border-white/10 pt-6 text-sm leading-8 text-gray-400"
        >
          <h2 className="text-base font-bold text-white">
            استانداردهای تحریریه اکونوا
          </h2>
          <p className="mt-2">
            اکونوا تلاش می‌کند اطلاعات مالی و برآوردهای ثروت
            را با شفافیت، توضیح محدودیت‌ها و تفکیک داده‌های
            واقعی از تخمین‌ها منتشر کند.
          </p>
          <p className="mt-2">
            ارقام ثروت ممکن است به‌صورت دستی ثبت یا اصلاح شوند
            و لزوماً زنده، حسابرسی‌شده یا دارای تأیید مستقل نیستند.
            زمان ثبت اطلاعات نیز الزاماً به معنی محاسبه مجدد
            تمام دارایی‌ها نیست.
          </p>
        </div>

        <footer className="mt-12 border-t border-white/10 pt-5 text-xs text-gray-600">
          © {new Date().getFullYear()} ECONOVA
        </footer>
      </article>
    </main>
  );
}
