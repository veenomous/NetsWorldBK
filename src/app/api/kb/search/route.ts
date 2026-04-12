import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

interface SearchResult {
  title: string;
  category: string;
  slug: string;
  confidence: string;
  snippet: string;
  relevance: number;
}

function slugify(name: string): string {
  return name
    .replace(/\.md$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").toLowerCase();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const wikiDir = path.join(process.cwd(), "kb", "wiki");
  const categories = [
    "players", "seasons", "trades", "front-office", "draft", "rivalries", "concepts",
  ];
  const results: SearchResult[] = [];

  for (const category of categories) {
    const catDir = path.join(wikiDir, category);
    if (!fs.existsSync(catDir)) continue;

    for (const file of fs.readdirSync(catDir).filter((f) => f.endsWith(".md"))) {
      const raw = fs.readFileSync(path.join(catDir, file), "utf-8");

      // Quick frontmatter extraction without gray-matter
      let title = file.replace(/\.md$/, "");
      let confidence = "medium";
      const titleMatch = raw.match(/^title:\s*(.+)$/m);
      if (titleMatch) title = titleMatch[1].trim();
      const confMatch = raw.match(/^confidence:\s*(.+)$/m);
      if (confMatch) confidence = confMatch[1].trim();

      // Strip frontmatter for content search
      const content = raw.replace(/^---[\s\S]*?---/, "").trim();
      const contentLower = content.toLowerCase();
      const titleLower = title.toLowerCase();

      let relevance = 0;
      let snippet = "";

      if (titleLower.includes(q)) {
        relevance += 100;
        snippet = title;
      }

      const matchIdx = contentLower.indexOf(q);
      if (matchIdx !== -1) {
        relevance += 10;
        if (!snippet) {
          const start = Math.max(0, matchIdx - 60);
          const end = Math.min(content.length, matchIdx + q.length + 100);
          snippet =
            (start > 0 ? "..." : "") +
            content.slice(start, end).replace(/[#*_`\[\]]/g, "").trim() +
            (end < content.length ? "..." : "");
        }
      }

      if (relevance > 0) {
        results.push({
          title,
          category,
          slug: slugify(file),
          confidence,
          snippet,
          relevance,
        });
      }
    }
  }

  results.sort((a, b) => b.relevance - a.relevance);
  return NextResponse.json({ results });
}
