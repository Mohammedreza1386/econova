
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Article = {
  id: string;
  billionaire_id: string;
  title: string;
  summary: string | null;
  source_name: string;
  source_url: string;
  image_url: string | null;
  published_at: string | null;
  created_at: string;
};

type Person = {
  name: string;
  company: string | null;
};

type RelatedArticle = {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  published_at: string | null;
  created_at: string;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

const SITE_URL = "https://econova-nine.vercel.app";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://zusbebjskchgehdjvpsm.supabase.co";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

async function getArticle(id: string): Promise<Article | null> {
  if (!SUPABASE_KEY) return null;

  const query = new URLSearchParams({
    select:
      "id,billionaire_id,title,summary,source_name,source_url,image_url,published_at,created_at",
    id: `eq.${id}`,
    limit: "1",
  });

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/billionaire_related_news?${query}`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) return null;

  const data = (await response.json()) as Article[];
  return data[0] || null;
}

async function getRelatedNews(
  billionaireId: string,
  currentArticleId: string
): Promise<RelatedArticle[]> {
  if (!SUPABASE_KEY) return [];

  const query = new URLSearchParams({
    select: "id,title,summary,image_url,published_at,created_at",
    billionaire_id: `eq.${billionaireId}`,
    id: `neq.${currentArticleId}`,
    order: "published_at.desc.nullslast,created_at.desc",
    limit: "3",
  });

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/billionaire_related_news?${query}`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) return [];

  return (await response.json()) as RelatedArticle[];
}

async function getPerson(
  id: string
): Promise<Person | null> {
  const query = new URLSearchParams({
    select: "name,company",
    id: `eq.${id}`,
    limit: "1",
  });

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/billionaires?${query}`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) return null;

  const data = (await response.json()) as Person[];
  return data[0] || null;
}

function formatDate(value: string | null) {
  if (!value) return "تاریخ نامشخص";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "تاریخ نامشخص";
  }

  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    return {
      title: "News Not Found | Econova",
      robots: { index: false, follow: true },
    };
  }

  const canonical =
    `${SITE_URL}/billionaires/news/${encodeURIComponent(id)}`;

  return {
    title: `${article.title} | Econova`,
    description:
      article.summary?.slice(0, 155) ||
      `${article.title} - Econova News`,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary || article.title,
      url: canonical,
      siteName: "Econova",
      images: article.image_url
        ? [{ url: article.image_url, alt: article.title }]
        : [],
    },
    twitter: {
      card: article.image_url
        ? "summary_large_image"
        : "summary",
      title: article.title,
      description: article.summary || article.title,
      images: article.image_url
        ? [article.image_url]
        : [],
    },
  };
}

export default async function BillionaireNewsDetailPage({
  params,
}: PageProps) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) notFound();

  const person = await getPerson(article.billionaire_id);
  const relatedNews = await getRelatedNews(article.billionaire_id, article.id);
  const date = article.published_at || article.created_at;

  const canonical =
    `${SITE_URL}/billionaires/news/${encodeURIComponent(id)}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    image: article.image_url ? [article.image_url] : undefined,
    datePublished: article.published_at || article.created_at,
    description: article.summary || article.title,
    mainEntityOfPage: canonical,
    publisher: {
      "@type": "Organization",
      name: "Econova",
    },
  };

  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#080d0a",
        color: "#f3f6f1",
        padding: "25px 16px 60px",
        fontFamily: "Arial,sans-serif",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />

      <article
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
            borderBottom: "1px solid #293b2e",
            paddingBottom: 20,
            marginBottom: 30,
          }}
        >
          <a
            href="/"
            style={{
              color: "#b9f27c",
              fontSize: 23,
              fontWeight: 900,
              letterSpacing: 2,
              textDecoration: "none",
            }}
          >
            ECONOVA.
          </a>

          <a
            href="/billionaires"
            style={{
              color: "#b9f27c",
              textDecoration: "none",
              fontSize: 13,
            }}
          >
            بازگشت به اکونوا ←
          </a>
        </header>

        <div
          style={{
            color: "#b9f27c",
            fontSize: 12,
            marginBottom: 15,
          }}
        >
          ECONOVA NEWS · اخبار ثروتمندان
        </div>

        <h1
          style={{
            fontSize: "clamp(25px,5vw,43px)",
            lineHeight: 1.7,
            margin: "0 0 20px",
            fontWeight: 900,
          }}
        >
          {article.title}
        </h1>

        {person && (
          <div
            style={{
              color: "#b9f27c",
              fontSize: 14,
              marginBottom: 18,
            }}
          >
            مرتبط با {person.name}
            {person.company ? ` · ${person.company}` : ""}
          </div>
        )}

        <div
          style={{
            color: "#91a095",
            fontSize: 12,
            marginBottom: 22,
          }}
        >
          {formatDate(date)}
          {" · "}
          {article.source_name}
        </div>

        {article.image_url && (
          <img
            src={article.image_url}
            alt={article.title}
            style={{
              width: "100%",
              maxHeight: 490,
              objectFit: "cover",
              borderRadius: 20,
              border: "1px solid #293b2e",
              marginBottom: 28,
              background: "#14271d",
            }}
          />
        )}

        <section
          style={{
            padding: "25px",
            border: "1px solid #293b2e",
            borderRadius: 18,
            background: "#101812",
          }}
        >
          <div
            style={{
              color: "#b9f27c",
              fontSize: 12,
              fontWeight: 800,
              marginBottom: 16,
            }}
          >
            خلاصه خبر
          </div>

          <div
            style={{
              color: "#d5ded6",
              fontSize: 17,
              lineHeight: 2.3,
              whiteSpace: "pre-wrap",
            }}
          >
            {article.summary || "برای این خبر توضیحی ثبت نشده است."}
          </div>

          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: 25,
              padding: "12px 19px",
              borderRadius: 10,
              background: "#b9f27c",
              color: "#101610",
              fontSize: 13,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            مشاهده صفحه منبع خبر ↗
          </a>
        </section>

        {relatedNews.length > 0 && (
          <section
            style={{
              marginTop: 38,
              paddingTop: 28,
              borderTop: "1px solid #293b2e",
            }}
          >
            <div
              style={{
                color: "#b9f27c",
                fontSize: 12,
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              ECONOVA · RELATED NEWS
            </div>

            <h2
              style={{
                fontSize: 23,
                fontWeight: 900,
                margin: "0 0 20px",
              }}
            >
              خبرهای مرتبط
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
                gap: 15,
              }}
            >
              {relatedNews.map((item) => (
                <a
                  key={item.id}
                  href={`/billionaires/news/${item.id}`}
                  style={{
                    display: "block",
                    overflow: "hidden",
                    border: "1px solid #293b2e",
                    borderRadius: 15,
                    background: "#101812",
                    color: "#f3f6f1",
                    textDecoration: "none",
                  }}
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: 145,
                        objectFit: "cover",
                        display: "block",
                        background: "#14271d",
                      }}
                    />
                  )}

                  <div style={{ padding: 16 }}>
                    <div
                      style={{
                        color: "#91a095",
                        fontSize: 11,
                        marginBottom: 9,
                      }}
                    >
                      {formatDate(
                        item.published_at || item.created_at
                      )}
                    </div>

                    <h3
                      style={{
                        fontSize: 15,
                        lineHeight: 1.9,
                        fontWeight: 800,
                        margin: 0,
                      }}
                    >
                      {item.title}
                    </h3>

                    {item.summary && (
                      <p
                        style={{
                          color: "#aab7ad",
                          fontSize: 12,
                          lineHeight: 2,
                          margin: "9px 0 0",
                        }}
                      >
                        {item.summary.length > 115
                          ? `${item.summary.slice(0, 115)}…`
                          : item.summary}
                      </p>
                    )}

                    <div
                      style={{
                        color: "#b9f27c",
                        fontSize: 12,
                        fontWeight: 800,
                        marginTop: 14,
                      }}
                    >
                      مطالعه خبر ←
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
        
        <footer
          style={{
            marginTop: 30,
            paddingTop: 20,
            borderTop: "1px solid #293b2e",
            color: "#829087",
            fontSize: 11,
            lineHeight: 2,
            textAlign: "center",
          }}
        >
          © {new Date().getFullYear()} ECONOVA · Global Wealth Intelligence
        </footer>
      </article>
    </main>
  );
}
