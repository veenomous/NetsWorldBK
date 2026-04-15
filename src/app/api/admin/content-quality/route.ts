import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

interface QualityIssue {
  type: "stale" | "no-sources" | "low-confidence" | "broken-link" | "no-source-url";
  article: string;
  category: string;
  slug: string;
  detail: string;
}

function slugify(name: string): string {
  return name.replace(/\.md$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET() {
  const wikiDir = path.join(process.cwd(), "kb", "wiki");
  const categories = ["players", "seasons", "trades", "front-office", "draft", "rivalries", "assets", "strategy", "community", "rumors"];
  const issues: QualityIssue[] = [];
  const allSlugs = new Set<string>();
  const allArticles: { title: string; category: string; slug: string; content: string; sources: string[]; confidence: string; lastUpdated: string }[] = [];

  // Collect all articles
  for (const cat of categories) {
    const catDir = path.join(wikiDir, cat);
    if (!fs.existsSync(catDir)) continue;
    for (const file of fs.readdirSync(catDir).filter(f => f.endsWith(".md"))) {
      const raw = fs.readFileSync(path.join(catDir, file), "utf-8");
      const titleMatch = raw.match(/^title:\s*(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : file.replace(/\.md$/, "");
      const slug = slugify(file);
      allSlugs.add(slug);

      const confMatch = raw.match(/^confidence:\s*(.+)$/m);
      const confidence = confMatch ? confMatch[1].trim() : "medium";

      const dateMatch = raw.match(/^last_updated:\s*(.+)$/m);
      const lastUpdated = dateMatch ? dateMatch[1].trim() : "";

      const sourcesMatch = raw.match(/^sources:\s*\[(.+)\]$/m);
      const sources = sourcesMatch ? sourcesMatch[1].split(",").map(s => s.trim()) : [];

      const content = raw.replace(/^---[\s\S]*?---/, "").trim();

      allArticles.push({ title, category: cat, slug, content, sources, confidence, lastUpdated });
    }
  }

  for (const article of allArticles) {
    // Stale check (>14 days)
    if (article.lastUpdated) {
      const days = Math.floor((Date.now() - new Date(article.lastUpdated).getTime()) / 86400000);
      if (days > 14) {
        issues.push({
          type: "stale",
          article: article.title,
          category: article.category,
          slug: article.slug,
          detail: `Last updated ${days} days ago (${article.lastUpdated})`,
        });
      }
    }

    // No sources
    if (article.sources.length === 0) {
      issues.push({
        type: "no-sources",
        article: article.title,
        category: article.category,
        slug: article.slug,
        detail: "No sources listed in frontmatter",
      });
    }

    // Sources without URLs
    for (const src of article.sources) {
      const rawPath = path.join(process.cwd(), "kb", src.replace(/['"]/g, "").trim());
      if (fs.existsSync(rawPath)) {
        const rawContent = fs.readFileSync(rawPath, "utf-8");
        if (!rawContent.includes("source_url:")) {
          issues.push({
            type: "no-source-url",
            article: article.title,
            category: article.category,
            slug: article.slug,
            detail: `Raw file ${src} has no source_url`,
          });
        }
      }
    }

    // Low confidence
    if (article.confidence === "low") {
      issues.push({
        type: "low-confidence",
        article: article.title,
        category: article.category,
        slug: article.slug,
        detail: "Confidence: low — needs better sourcing",
      });
    }

    // Broken wikilinks
    const wikilinkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    let match;
    while ((match = wikilinkRegex.exec(article.content)) !== null) {
      const target = match[1];
      const targetSlug = slugify(target);
      if (!allSlugs.has(targetSlug)) {
        issues.push({
          type: "broken-link",
          article: article.title,
          category: article.category,
          slug: article.slug,
          detail: `Broken wikilink: [[${target}]]`,
        });
      }
    }
  }

  // Sort: broken links first, then stale, then low confidence, then no sources
  const priority: Record<string, number> = { "broken-link": 0, stale: 1, "low-confidence": 2, "no-source-url": 3, "no-sources": 4 };
  issues.sort((a, b) => (priority[a.type] ?? 5) - (priority[b.type] ?? 5));

  return NextResponse.json({
    total: issues.length,
    byType: {
      broken: issues.filter(i => i.type === "broken-link").length,
      stale: issues.filter(i => i.type === "stale").length,
      lowConfidence: issues.filter(i => i.type === "low-confidence").length,
      noSources: issues.filter(i => i.type === "no-sources").length,
      noSourceUrl: issues.filter(i => i.type === "no-source-url").length,
    },
    issues,
  });
}
