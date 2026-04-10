import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name") || "";
  if (!name) return NextResponse.json({ result: null });

  const wikiDir = path.join(process.cwd(), "kb", "wiki");
  const categories = ["players", "seasons", "trades", "front-office", "draft", "rivalries", "concepts"];
  const q = name.toLowerCase();

  let bestMatch: { title: string; category: string; slug: string; confidence: string; summary: string; tags: string[] } | null = null;
  let bestScore = 0;

  for (const category of categories) {
    const catDir = path.join(wikiDir, category);
    if (!fs.existsSync(catDir)) continue;

    for (const file of fs.readdirSync(catDir).filter((f) => f.endsWith(".md"))) {
      const raw = fs.readFileSync(path.join(catDir, file), "utf-8");

      let title = file.replace(/\.md$/, "");
      const titleMatch = raw.match(/^title:\s*(.+)$/m);
      if (titleMatch) title = titleMatch[1].trim();

      let confidence = "medium";
      const confMatch = raw.match(/^confidence:\s*(.+)$/m);
      if (confMatch) confidence = confMatch[1].trim();

      let tags: string[] = [];
      const tagsMatch = raw.match(/^tags:\s*\[(.+)\]$/m);
      if (tagsMatch) tags = tagsMatch[1].split(",").map((t) => t.trim().replace(/['"]/g, ""));

      // Score match
      let score = 0;
      const titleLower = title.toLowerCase();
      if (titleLower === q) score = 200;
      else if (titleLower.includes(q)) score = 100;
      else if (tags.some((t) => t.toLowerCase().includes(q))) score = 50;

      // Content match
      const content = raw.replace(/^---[\s\S]*?---/, "").trim();
      if (content.toLowerCase().includes(q)) score = Math.max(score, 10);

      if (score > bestScore) {
        bestScore = score;

        // Extract summary (first paragraph after ## Summary)
        const summaryMatch = content.match(/## Summary\n+([\s\S]+?)(?:\n\n|\n##)/);
        const summary = summaryMatch
          ? summaryMatch[1].replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1").replace(/[*_`]/g, "").trim().slice(0, 200)
          : content.replace(/^#+\s.*$/gm, "").replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1").replace(/[*_`#\-]/g, "").trim().slice(0, 200);

        bestMatch = {
          title,
          category,
          slug: slugify(file.replace(/\.md$/, "")),
          confidence,
          summary: summary + (summary.length >= 200 ? "..." : ""),
          tags,
        };
      }
    }
  }

  return NextResponse.json({ result: bestMatch });
}
