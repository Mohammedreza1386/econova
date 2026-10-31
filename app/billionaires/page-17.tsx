
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Top Billionaires in the World | Econova",
  description:
    "Explore the world's top 10 billionaires, estimated net worth and global wealth rankings on Econova.",
  alternates: {
    canonical: "https://econova-nine.vercel.app/billionaires",
  },
  openGraph: {
    title: "Top Billionaires | Econova",
    description:
      "Discover the world's wealthiest people and explore their estimated net worth.",
    url: "https://econova-nine.vercel.app/billionaires",
    siteName: "Econova",
    type: "website",
  },
};

type Billionaire = {
  rank: number;
  name: string;
  company: string | null;
  country: string | null;
  image_url?: string | null;
  net_worth_billions: number | string;
  updated_at?: string | null;
};

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ||
  "https://zusbebjskchgehdjvpsm.supabase.co";

const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function getTopBillionaires(): Promise<Billionaire[]> {
  if (!SUPABASE_KEY) return [];

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/billionaires?select=rank,name,company,country,image_url,net_worth_billions,updated_at&order=rank.asc&limit=10`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) return [];

    const data: unknown = await response.json();
    if (!Array.isArray(data)) return [];

    return data.filter(
      (person): person is Billionaire =>
        person !== null &&
        typeof person === "object" &&
        typeof person.name === "string" &&
        Number.isFinite(Number(person.rank)) &&
        Number.isFinite(Number(person.net_worth_billions))
    );
  } catch {
    return [];
  }
}

function money(value: number | string) {
  return `$${Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })}B`;
}

function photo(person: Billionaire) {
  if (person.image_url?.trim()) return person.image_url;

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    person.name
  )}&background=17251c&color=b9f27c&size=160&bold=true`;
}

export default async function TopBillionairesPage() {
  const people = await getTopBillionaires();
  const totalWealth = people.reduce(
    (sum, person) => sum + Number(person.net_worth_billions || 0),
    0
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Econova Top 10 Billionaires",
    url: "https://econova-nine.vercel.app/billionaires",
    numberOfItems: people.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: people.map((person, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: person.name,
      description: `Estimated net worth: ${money(person.net_worth_billions)}`,
    })),
  };

  return (
    <main className="min-h-screen bg-[#080b09] px-4 py-10 text-white sm:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />

      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <Link href="/" className="text-xl font-black tracking-wide">
            ECONOVA<span className="text-[#b9f27c]">.</span>
          </Link>
          <span className="rounded-full border border-[#b9f27c]/30 px-4 py-2 text-xs font-semibold text-[#b9f27c]">
            GLOBAL WEALTH INDEX
          </span>
        </header>

        <section className="py-8 text-center sm:py-14">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.28em] text-[#b9f27c]">
            The World&apos;s Wealthiest
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            Top <span className="text-[#b9f27c]">Billionaires</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
            Explore the world&apos;s richest people, their estimated fortunes
            and the companies behind their wealth.
          </p>

          <div className="mx-auto mt-9 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#101511] p-5 text-left">
              <p className="text-xs text-zinc-500">PEOPLE RANKED</p>
              <p className="mt-2 text-3xl font-bold">
                {people.length.toString().padStart(2, "0")}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Top positions</p>
            </div>
            <div className="rounded-2xl border border-[#b9f27c]/20 bg-[#101810] p-5 text-left">
              <p className="text-xs text-zinc-500">COMBINED ESTIMATED WEALTH</p>
              <p className="mt-2 text-3xl font-bold text-[#b9f27c]">
                {money(totalWealth)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Total for the people shown, in USD
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Top 10 Ranking</h2>
              <p className="mt-2 text-sm text-zinc-500">
                Estimated net worth · USD
              </p>
            </div>
            <span className="text-xs text-zinc-500">
              Data refreshes approximately every 5 minutes
            </span>
          </div>

          {people.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e120f]">
              {people.map((person, index) => (
                <article
                  key={`${person.rank}-${person.name}`}
                  className="flex flex-wrap items-center gap-4 border-b border-white/[0.07] p-4 last:border-b-0 sm:p-5"
                >
                  <div className="w-8 text-center text-lg font-bold text-zinc-500">
                    {person.rank}
                  </div>

                  <img
                    src={photo(person)}
                    alt={person.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full border border-white/10 bg-[#17251c] object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold">{person.name}</h3>
                    <p className="mt-1 truncate text-sm text-zinc-500">
                      {[person.company, person.country]
                        .filter(Boolean)
                        .join(" · ") || "Global business"}
                    </p>
                  </div>

                  <div className="ml-auto text-right">
                    <p className="text-lg font-bold text-[#b9f27c]">
                      {money(person.net_worth_billions)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Estimated net worth
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#101511] p-8 text-center">
              <h3 className="font-bold">Ranking temporarily unavailable</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                The ranking data could not be loaded. Please check again later.
              </p>
            </div>
          )}
        </section>

        <section className="my-12 rounded-3xl border border-[#b9f27c]/20 bg-gradient-to-br from-[#152019] to-[#0d110e] p-7 text-center sm:p-10">
          <p className="text-sm font-semibold text-[#b9f27c]">
            GO BEYOND THE TOP 10
          </p>
          <h2 className="mt-3 text-2xl font-black sm:text-3xl">
            Explore the Full Wealth Dashboard
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-zinc-400">
            Browse the wider billionaire list, wealth history charts and
            additional information in the full Econova dashboard.
          </p>
          <Link
            href="/billionaires/rankings"
            className="mt-7 inline-flex items-center justify-center rounded-xl bg-[#b9f27c] px-6 py-3 font-bold text-[#10150e] transition hover:bg-[#cafa96]"
          >
            Open Full Rankings <span className="ml-2">→</span>
          </Link>
        </section>

        <footer className="border-t border-white/10 py-6 text-center text-xs leading-6 text-zinc-600">
          Econova Global Wealth Index · Net worth figures are estimates and
          may change. Data availability and update frequency depend on the
          underlying source.
        </footer>
      </div>
    </main>
  );
            }
