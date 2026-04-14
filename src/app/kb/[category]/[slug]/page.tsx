import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllArticles,
  getArticle,
  renderMarkdown,
  buildArticleIndex,
  resolveSourceURLs,
} from "@/lib/kb";
import type { Metadata } from "next";
import KBArticleWire from "@/components/KBArticleWire";

const confidenceColor = {
  high: "tag-green",
  medium: "tag-blue",
  low: "tag-red",
};

const categoryLabels: Record<string, string> = {
  players: "Players",
  seasons: "Seasons",
  trades: "Trades",
  "front-office": "Front Office",
  draft: "Draft",
  rivalries: "Rivalries",
  concepts: "Concepts",
};

const categoryIcon: Record<string, string> = {
  players: "person",
  seasons: "calendar_month",
  trades: "swap_horiz",
  "front-office": "corporate_fare",
  draft: "format_list_numbered",
  rivalries: "swords",
  concepts: "school",
};

export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((a) => ({
    category: a.category,
    slug: a.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const article = getArticle(category, slug);
  if (!article) return { title: "Not Found — BK Grit" };
  const desc = article.content
    .replace(/^#+\s.*$/gm, "")
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1")
    .replace(/[*_`#\-]/g, "")
    .trim()
    .slice(0, 160);
  const ogUrl = `https://bkgrit.com/api/og?type=wiki&title=${encodeURIComponent(article.title)}&category=${encodeURIComponent(category)}&confidence=${encodeURIComponent(article.confidence)}&v=${Date.now()}`;

  return {
    title: `${article.title} — BK Grit`,
    description: desc,
    openGraph: {
      title: `${article.title} — BK Grit`,
      description: desc,
      images: [ogUrl],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.title} — BK Grit`,
      description: desc,
      images: [ogUrl],
    },
  };
}

export default async function KBArticlePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const article = getArticle(category, slug);
  if (!article) notFound();

  const allArticles = getAllArticles();
  const articleIndex = buildArticleIndex();
  const htmlContent = renderMarkdown(article.content, articleIndex);

  // Find related articles in the same category (exclude current)
  const relatedInCategory = allArticles
    .filter((a) => a.category === category && a.slug !== slug)
    .slice(0, 3);

  // Find articles that link TO this article (backlinks)
  const backlinks = allArticles.filter(
    (a) =>
      a.slug !== slug &&
      a.content.toLowerCase().includes(`[[${article.title.toLowerCase()}]]`)
  );

  const daysSince = Math.floor(
    (Date.now() - new Date(article.last_updated).getTime()) / 86400000
  );
  const isStale = daysSince > 30;
  const isVeryStale = daysSince > 90;

  return (
    <div>
      {/* Dark header */}
      <div className="bg-black text-white px-4 sm:px-8 pt-4 sm:pt-6 pb-6 sm:pb-8">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs font-body mb-4 sm:mb-6">
            <Link
              href="/"
              className="text-white/40 hover:text-white transition-colors"
            >
              KB
            </Link>
            <span className="text-white/20">/</span>
            <Link
              href="/"
              className="text-white/40 hover:text-white transition-colors flex items-center gap-1"
            >
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {categoryIcon[category] || "article"}
              </span>
              {categoryLabels[category] || category}
            </Link>
          </nav>

          {/* Title */}
          <h1 className="font-display font-black text-xl sm:text-4xl uppercase tracking-tight leading-[0.9] mb-3 sm:mb-4">
            {article.title}
          </h1>

          {/* Meta row */}
          <div className="flex items-center gap-1.5 flex-wrap overflow-hidden">
            <span className={`tag ${confidenceColor[article.confidence]}`}>
              {article.confidence}
            </span>
            {article.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="tag tag-blue">
                {tag}
              </span>
            ))}
            {article.last_updated && (
              <span
                className={`text-xs ml-auto font-body flex items-center gap-1 ${
                  isVeryStale
                    ? "text-accent-red"
                    : isStale
                      ? "text-accent-gold"
                      : "text-white/40"
                }`}
              >
                {(isStale || isVeryStale) && (
                  <span className="material-symbols-outlined text-sm">
                    schedule
                  </span>
                )}
                {article.last_updated}
                {isVeryStale && " — needs refresh"}
                {isStale && !isVeryStale && " — may be outdated"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Red accent line */}
      <div className="h-1 bg-brand-red" />

      {/* Article body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10">
        <article
          className="kb-article font-body text-text-primary leading-relaxed"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* Sources */}
        {article.sources.length > 0 && (() => {
          const resolved = resolveSourceURLs(article.sources);
          return (
            <div className="mt-12 pt-6 border-t border-black/10">
              <h3 className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>source</span>
                Sources
              </h3>
              <div className="space-y-2">
                {resolved.map((src) => (
                  <div key={src.path} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-text-muted/30 text-sm mt-0.5 shrink-0">article</span>
                    {src.url ? (
                      <a href={src.url} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-body text-accent-blue hover:underline break-all">
                        {src.title}
                      </a>
                    ) : (
                      <span className="text-sm font-body text-text-muted">{src.title}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Backlinks — articles that reference this one */}
        {backlinks.length > 0 && (
          <div className="mt-8 pt-6 border-t border-black/10">
            <h3 className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted mb-3 flex items-center gap-1.5">
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                link
              </span>
              Referenced By
            </h3>
            <div className="flex flex-wrap gap-2">
              {backlinks.map((bl) => (
                <Link
                  key={bl.slug}
                  href={`/kb/${bl.category}/${bl.slug}`}
                  className="text-xs font-body text-brand-red hover:underline"
                >
                  {bl.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* More in this category */}
        {relatedInCategory.length > 0 && (
          <div className="mt-8 pt-6 border-t border-black/10">
            <h3 className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted mb-3 flex items-center gap-1.5">
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {categoryIcon[category] || "article"}
              </span>
              More in {categoryLabels[category] || category}
            </h3>
            <div className="space-y-2">
              {relatedInCategory.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/kb/${rel.category}/${rel.slug}`}
                  className="card card-interactive p-3 flex items-center gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-sm uppercase tracking-tight text-text-primary group-hover:text-brand-red transition-colors">
                      {rel.title}
                    </p>
                  </div>
                  <span
                    className={`tag ${confidenceColor[rel.confidence]}`}
                    style={{ fontSize: "9px" }}
                  >
                    {rel.confidence}
                  </span>
                  <span className="material-symbols-outlined text-text-muted/30 group-hover:text-brand-red text-sm transition-colors">
                    arrow_forward
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Discussion — unified Wire integration */}
        <KBArticleWire articleSlug={slug} articleTitle={article.title} category={category} />

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-brand-red hover:underline font-body flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">
              arrow_back
            </span>
            Knowledge Base
          </Link>
          <Link
            href="/kb/graph"
            className="text-sm text-text-muted hover:text-brand-red font-body flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">hub</span>
            View Graph
          </Link>
        </div>
      </div>
    </div>
  );
}
