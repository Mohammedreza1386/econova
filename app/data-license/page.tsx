
import type { Metadata } from "next";
import Link from "next/link";

const pageUrl = "https://econova-nine.vercel.app/data-license";

export const metadata: Metadata = {
  title: "Econova Proprietary Data License",
  description:
    "Terms governing reuse and redistribution of Econova's original dataset compilation, database structure and original content.",
  alternates: {
    canonical: pageUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DataLicensePage() {
  return (
    <main dir="ltr" className="min-h-screen bg-[#080b09] px-4 py-10 text-white sm:px-6">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-lg font-black tracking-[0.2em] text-[#b9f27c]">
          ECONOVA
        </Link>

        <p className="mt-10 text-xs font-semibold tracking-[0.2em] text-[#b9f27c]">
          DATA POLICY
        </p>

        <h1 className="mt-3 text-3xl font-black sm:text-4xl">
          Econova Proprietary Data License
        </h1>

        <p className="mt-4 text-sm leading-7 text-gray-400">
          Effective date: November 19, 2026
        </p>

        <section className="mt-8 space-y-4 text-sm leading-7 text-gray-300">
          <h2 className="text-lg font-bold text-white">1. Scope</h2>
          <p>
            This policy applies to Econova's original database compilation,
            selection and arrangement of data, database structure, original
            descriptions, graphics and other content created by Econova.
          </p>

          <h2 className="pt-3 text-lg font-bold text-white">2. Reserved rights</h2>
          <p>
            Except where applicable law permits otherwise or Econova gives
            prior written permission, copying, republishing, redistributing,
            or commercially exploiting substantial portions of Econova's
            original database compilation or content is not permitted.
          </p>

          <h2 className="pt-3 text-lg font-bold text-white">3. Public facts and third-party rights</h2>
          <p>
            This policy does not claim exclusive ownership of public facts,
            names, independently established financial figures, or material
            owned by third parties. Third-party names, trademarks, images and
            other materials remain subject to their respective rights and
            terms. Individual facts may be independently collected and used
            where permitted by applicable law.
          </p>

          <h2 className="pt-3 text-lg font-bold text-white">4. Estimates and updates</h2>
          <p>
            Net-worth figures and rankings published by Econova are estimates
            based on information available to Econova. They may be revised,
            delayed or differ from other estimates. Publication does not
            constitute a guarantee of accuracy or real-time value.
          </p>

          <h2 className="pt-3 text-lg font-bold text-white">5. Permission</h2>
          <p>
            Uses beyond the permissions provided by applicable law require
            prior written authorization from Econova. Permission should
            identify the material, intended use, distribution method and
            commercial purpose, if any.
          </p>

          <h2 className="pt-3 text-lg font-bold text-white">6. No transfer of third-party rights</h2>
          <p>
            Nothing in this policy grants permission to use third-party
            content, trademarks, photographs, APIs or datasets. Users are
            responsible for checking the applicable rights and terms for
            those materials.
          </p>
        </section>

        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="text-sm leading-7 text-gray-400">
            این شرایط مربوط به گردآوری، ساختار پایگاه داده و محتوای اختصاصی
            تولیدشده توسط اکونوا است؛ نه مالکیت انحصاری بر واقعیت‌ها و اطلاعات
            عمومی. استفاده از محتوای اشخاص ثالث تابع حقوق و شرایط همان اشخاص است.
          </p>

          <Link href="/billionaires" className="mt-6 inline-flex text-sm font-bold text-[#b9f27c] hover:underline">
            Back to Econova Billionaires
          </Link>
        </div>

        <footer className="mt-12 border-t border-white/10 pt-5 text-xs text-gray-600">
          © {new Date().getFullYear()} ECONOVA
        </footer>
      </article>
    </main>
  );
}
