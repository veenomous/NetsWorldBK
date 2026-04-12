import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllArticles, getCategories } from "@/lib/kb";
import { DEFAULT_KB_CONFIG } from "@/lib/kb-config";
import type { Metadata } from "next";

const confColor = { high: "tag-green", medium: "tag-blue", low: "tag-red" };

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
  return DEFAULT_KB_CONFIG.categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = DEFAULT_KB_CONFIG.categories.find((c) => c.slug === slug);
  return {
    title: `${cat?.label || slug} — BK Grit KB`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = DEFAULT_KB_CONFIG.categories.find((c) => c.slug === slug);
  if (!cat) notFound();

  const articles = getAllArticles().filter((a) => a.category === slug);

  return (
    <div>
      <div className="bg-black text-white px-4 sm:px-8 pt-4 sm:pt-6 pb-6 sm:pb-8">
        <div className="max-w-3xl mx-auto">
          <nav className="flex items-center gap-2 text-xs font-body mb-4">
            <Link href="/" className="text-white/40 hover:text-white transition-colors">
              &larr; KB
            </Link>
          </nav>
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-brand-red text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {categoryIcon[slug] || "article"}
            </span>
            <h1 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tight">
              {cat.label}
            </h1>
          </div>
          <p className="text-white/40 text-sm font-body">{articles.length} {articles.length === 1 ? "article" : "articles"}</p>
        </div>
      </div>
      <div className="h-1 bg-brand-red" />

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
        <div className="space-y-3">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/kb/${article.category}/${article.slug}`}
              className="card card-interactive p-4 flex items-start gap-4 group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm uppercase tracking-tight text-text-primary group-hover:text-brand-red transition-colors">
                  {article.title}
                </p>
                <p className="text-text-muted text-xs font-body mt-1 line-clamp-2">
                  {article.content
                    .replace(/^#+\s.*$/gm, "")
                    .replace(/^-\s.*$/gm, "")
                    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1")
                    .replace(/[*_`#]/g, "")
                    .trim()
                    .slice(0, 160)}...
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`tag ${confColor[article.confidence]}`}>
                    {article.confidence}
                  </span>
                  <span className="text-text-muted text-[10px]">{article.last_updated}</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-text-muted group-hover:text-brand-red transition-colors mt-1">
                arrow_forward
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/" className="text-sm text-brand-red hover:underline font-body flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Knowledge Base
          </Link>
        </div>
      </div>
    </div>
  );
}
