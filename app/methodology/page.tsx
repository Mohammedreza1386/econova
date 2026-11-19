
import type { Metadata } from "next";
import Link from "next/link";

const site = "https://econova-nine.vercel.app";

export const metadata: Metadata = {
  title: "Methodology | Econova Global Wealth Rankings",
  description:
    "How Econova presents billionaire net-worth estimates, ranking records, update timestamps and historical wealth data.",
  alternates: { canonical: `${site}/methodology` },
  robots: { index: true, follow: true },
};

function Section({ title, children }: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-gray-300">
        {children}
      </div>
    </section>
  );
}

export default function MethodologyPage() {
  return (
    <main dir="ltr" className="min-h-screen bg-[#080b09] px-4 py-10 text-white sm:px-6">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-lg font-black tracking-[0.2em] text-[#b9f27c]">
          ECONOVA
        </Link>

        <p className="mt-10 text-xs font-semibold tracking-[0.2em] text-[#b9f27c]">
          DATA & RANKING STANDARDS
        </p>

        <h1 className="mt-3 text-3xl font-black sm:text-4xl">
          Methodology
        </h1>

        <p className="mt-4 text-sm leading-7 text-gray-400">
          How Econova presents billionaire wealth estimates, ranking records
          and historical data — and what readers should understand about
          their limitations.
        </p>

        <div className="mt-7 rounded-xl border border-[#b9f27c]/20 bg-[#101611] p-4">
          <p className="font-bold text-[#b9f27c]">Important data notice</p>
          <p className="mt-2 text-sm leading-7 text-gray-300">
            Econova publishes estimated net-worth figures. They are not
            guaranteed real-time market values, audited personal balance
            sheets or independently verified figures in every case.
          </p>
        </div>

        <Section title="1. What the ranking represents">
          <p>
            Econova's billionaire ranking presents people and their estimated
            net worth as recorded in Econova's database. Wealth values are
            expressed in billions of US dollars (USD).
          </p>
          <p>
            The displayed position follows the ranking value stored for each
            person in the database. The public ranking page orders records by
            that stored rank. Econova does not claim that every position is
            independently recalculated from a live portfolio valuation.
          </p>
        </Section>

        <Section title="2. Net-worth estimates">
          <p>
            Net worth is an estimate, not a directly observable live balance.
            Private-company valuations, ownership stakes, debt, market prices,
            currency movements and incomplete public information can all
            affect an estimate.
          </p>
          <p>
            Econova maintains and publishes editorial estimates in its
            database. Estimates may be revised when records are updated or
            new information is considered. Different publishers may reach
            different figures because their assumptions and available
            information can differ.
          </p>
        </Section>

        <Section title="3. Sources and verification">
          <p>
            A source reference may be stored with an individual record when
            available. Readers should check the source reference on that
            record and consider its publication date and context.
          </p>
          <p>
            Source references are not available for every record, and their
            presence does not mean every component of an estimate has been
            independently audited. Some records may not have recent
            independent verification.
          </p>
        </Section>

        <Section title="4. Updates and timestamps">
          <p>
            A record's update timestamp describes when that database record
            was last updated; it should not be interpreted as proof that every
            underlying asset value was revalued at that exact moment.
          </p>
          <p>
            The public website may cache responses briefly for performance.
            A page refresh or response-generation timestamp is not the same
            as a new valuation or database update.
          </p>
        </Section>

        <Section title="5. Historical wealth information">
          <p>
            Historical charts use wealth-history records saved in Econova's
            database. Each point represents a recorded estimate at its
            recorded time. The chart illustrates published records and should
            not be treated as a continuous market-price series.
          </p>
          <p>
            The number and timing of historical points can vary by person.
            Missing intervals do not imply that wealth remained unchanged.
          </p>
        </Section>

        <Section title="6. Corrections and limitations">
          <p>
            Records may contain gaps, delayed updates or estimates that later
            require revision. Econova may correct or update its database as
            information changes.
          </p>
          <p>
            Econova's rankings and estimates are informational content only.
            They are not financial, investment, legal or tax advice and should
            not be used as the sole basis for a financial decision.
          </p>
        </Section>

        <Section title="7. Data access and reuse">
          <p>
            Access to public facts does not transfer ownership of third-party
            materials or grant rights to reuse Econova's original database
            compilation, structure or content.
          </p>
          <p>
            Read the{" "}
            <Link href="/data-license" className="font-semibold text-[#b9f27c] hover:underline">
              Econova Data License
            </Link>{" "}
            for the applicable reuse terms.
          </p>
        </Section>

        <div className="mt-10 flex flex-wrap gap-4 border-t border-white/10 pt-6 text-sm font-bold">
          <Link href="/billionaires/rankings" className="text-[#b9f27c] hover:underline">
            Explore billionaire rankings →
          </Link>
          <Link href="/billionaires-data" className="text-gray-300 hover:text-white hover:underline">
            Public data endpoint →
          </Link>
        </div>

        <div dir="rtl" className="mt-8 border-t border-white/10 pt-5 text-sm leading-7 text-gray-400">
          <h2 className="text-base font-bold text-white">روش‌شناسی اکونوا</h2>
          <p className="mt-2">
            رتبه‌بندی اکونوا بر اساس رتبهٔ ثبت‌شده برای هر فرد در پایگاه داده
            نمایش داده می‌شود. ارزش خالص دارایی‌ها تخمینی و بر حسب میلیارد دلار
            آمریکا است؛ این ارقام لزوماً لحظه‌ای، حسابرسی‌شده یا دارای تأیید
            مستقل اخیر نیستند.
          </p>
          <p className="mt-2">
            زمان آخرین به‌روزرسانی هر رکورد، زمان تغییر آن رکورد در پایگاه داده
            را نشان می‌دهد و الزاماً به معنی ارزش‌گذاری مجدد تمام دارایی‌ها در
            همان لحظه نیست. نمودارهای تاریخی نیز از سوابق ثبت‌شده در پایگاه
            داده ساخته می‌شوند.
          </p>
        </div>

        <footer className="mt-12 border-t border-white/10 pt-5 text-xs text-gray-600">
          © {new Date().getFullYear()} ECONOVA
        </footer>
      </article>
    </main>
  );
}
