import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllArticles, getArticle, renderMarkdown, buildArticleIndex } from "@/lib/kb";
import type { Metadata } from "next";

const confidenceColor = {
  high: "tag-green",
  medium: "tag-gold",
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
  return {
    title: `${article.title} — BK Grit KB`,
    description: article.content
      .replace(/^#+\s.*$/gm, "")
      .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1")
      .replace(/[*_`#\-]/g, "")
      .trim()
      .slice(0, 160),
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

  const articleIndex = buildArticleIndex();
  const htmlContent = renderMarkdown(article.content, articleIndex);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm font-body mb-8">
        <Link
          href="/kb"
          className="text-text-muted hover:text-brand-red transition-colors"
        >
          KB
        </Link>
        <span className="text-text-muted">/</span>
        <Link
          href={`/kb#${category}`}
          className="text-text-muted hover:text-brand-red transition-colors"
        >
          {categoryLabels[category] || category}
        </Link>
        <span className="text-text-muted">/</span>
        <span className="text-text-primary font-medium">{article.title}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="heading-lg text-text-primary mb-4">{article.title}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`tag ${confidenceColor[article.confidence]}`}>
            {article.confidence} confidence
          </span>
          {article.tags.map((tag) => (
            <span key={tag} className="tag tag-blue">
              {tag}
            </span>
          ))}
          {article.last_updated && (() => {
            const daysSince = Math.floor(
              (Date.now() - new Date(article.last_updated).getTime()) / 86400000
            );
            const isStale = daysSince > 30;
            const isVeryStale = daysSince > 90;
            return (
              <span className={`text-xs ml-auto font-body flex items-center gap-1 ${
                isVeryStale ? "text-accent-red" : isStale ? "text-accent-gold" : "text-text-muted"
              }`}>
                {(isStale || isVeryStale) && (
                  <span className="material-symbols-outlined text-sm">schedule</span>
                )}
                Updated {article.last_updated}
                {isVeryStale && " — needs refresh"}
                {isStale && !isVeryStale && " — may be outdated"}
              </span>
            );
          })()}
        </div>
      </header>

      {/* Article body */}
      <article
        className="kb-article font-body text-text-primary leading-relaxed"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* Sources */}
      {article.sources.length > 0 && (
        <div className="mt-12 pt-6 border-t border-black/10">
          <h3 className="font-display font-bold text-xs uppercase tracking-widest text-text-muted mb-3">
            Sources
          </h3>
          <ul className="space-y-1">
            {article.sources.map((src) => (
              <li key={src} className="text-text-muted text-sm font-body">
                <code className="text-xs bg-bg-input px-1.5 py-0.5">
                  {src}
                </code>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Back link */}
      <div className="mt-8">
        <Link
          href="/kb"
          className="text-sm text-brand-red hover:underline font-body"
        >
          &larr; Back to Knowledge Base
        </Link>
      </div>
    </div>
  );
}
