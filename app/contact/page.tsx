
import type { Metadata } from "next";
import Link from "next/link";

const site = "https://econova-nine.vercel.app";
const email = "econova.support@gmail.com";

export const metadata: Metadata = {
  title: "Contact Econova | Support & Corrections",
  description:
    "Contact Econova for general questions, data corrections, feedback and collaboration inquiries.",
  alternates: { canonical: `${site}/contact` },
  openGraph: {
    type: "website",
    url: `${site}/contact`,
    siteName: "Econova",
    title: "Contact Econova",
    description:
      "Get in touch with Econova for support, corrections and inquiries.",
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
      <h2 className="text-lg font-bold text-white sm:text-xl">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-gray-300">
        {children}
      </div>
    </section>
  );
}

export default function ContactPage() {
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
          GET IN TOUCH
        </p>

        <h1 className="mt-3 text-3xl font-black sm:text-4xl">
          Contact Econova
        </h1>

        <p className="mt-4 text-base leading-8 text-gray-300">
          We welcome questions, feedback, correction requests and
          collaboration inquiries. Contact the Econova team using
          the official email address below.
        </p>

        <div className="mt-8 rounded-2xl border border-[#b9f27c]/30 bg-[#101611] p-6">
          <p className="text-xs font-semibold tracking-widest text-[#b9f27c]">
            OFFICIAL CONTACT EMAIL
          </p>

          <a
            href={`mailto:${email}`}
            className="mt-4 block break-all text-xl font-bold text-white hover:text-[#b9f27c] sm:text-2xl"
          >
            {email}
          </a>

          <a
            href={`mailto:${email}`}
            className="mt-5 inline-flex rounded-lg bg-[#b9f27c] px-5 py-3 text-sm font-bold text-[#080b09] transition hover:opacity-90"
          >
            Send an Email
          </a>
        </div>

        <Section title="General inquiries">
          <p>
            For general questions about Econova, its services,
            website features or published information, contact
            us by email.
          </p>
        </Section>

        <Section title="Data corrections">
          <p>
            If you believe a billionaire profile, wealth estimate,
            ranking record or other published information contains
            an error, please send a correction request.
          </p>
          <p>
            To help us review your request, include the relevant
            page address, the information you believe is incorrect,
            the proposed correction and any supporting public
            evidence or source links.
          </p>
          <p>
            Submitting a correction does not guarantee that a
            record will be changed. Requests are reviewed before
            any update is made.
          </p>
        </Section>

        <Section title="Feedback and collaboration">
          <p>
            We welcome constructive feedback, suggestions for
            improving the platform and relevant collaboration
            inquiries.
          </p>
        </Section>

        <Section title="Response and limitations">
          <p>
            Econova aims to review incoming messages as reasonably
            possible. Response times may vary depending on the
            nature and volume of inquiries.
          </p>
          <p>
            Please do not send passwords, payment information
            or other sensitive personal information by email.
          </p>
        </Section>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs leading-6 text-gray-500">
          <p>© {new Date().getFullYear()} Econova. All rights reserved.</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/about" className="hover:text-[#b9f27c]">
              About
            </Link>
            <Link href="/methodology" className="hover:text-[#b9f27c]">
              Methodology
            </Link>
            <Link href="/editorial-policy" className="hover:text-[#b9f27c]">
              Editorial Policy
            </Link>
            <Link href="/data-license" className="hover:text-[#b9f27c]">
              Data License
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
