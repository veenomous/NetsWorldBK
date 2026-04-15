import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { DEFAULT_KB_CONFIG, getKBConfig } from "./kb-config";

export interface KBArticle {
  slug: string;
  category: string;
  title: string;
  tags: string[];
  sources: string[];
  confidence: "high" | "medium" | "low";
  last_updated: string;
  content: string;
}

function getWikiDir(team?: string): string {
  const config = getKBConfig(team);
  return path.join(process.cwd(), config.wikiDir);
}

function getCategorySlugs(team?: string): string[] {
  const config = getKBConfig(team);
  return config.categories.map((c) => c.slug);
}

function slugify(name: string): string {
  return name
    .replace(/\.md$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getAllArticles(team?: string): KBArticle[] {
  const wikiDir = getWikiDir(team);
  const categories = getCategorySlugs(team);
  const articles: KBArticle[] = [];

  for (const category of categories) {
    const categoryDir = path.join(wikiDir, category);
    if (!fs.existsSync(categoryDir)) continue;

    const files = fs.readdirSync(categoryDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const filePath = path.join(categoryDir, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);

      articles.push({
        slug: slugify(file),
        category,
        title: data.title || file.replace(/\.md$/, ""),
        tags: (data.tags || []).map(String),
        sources: data.sources || [],
        confidence: data.confidence || "medium",
        last_updated:
          data.last_updated instanceof Date
            ? data.last_updated.toISOString().split("T")[0]
            : String(data.last_updated || ""),
        content,
      });
    }
  }

  return articles.sort(
    (a, b) =>
      new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime()
  );
}

export function getArticle(
  category: string,
  slug: string
): KBArticle | undefined {
  const articles = getAllArticles();
  return articles.find((a) => a.category === category && a.slug === slug);
}

// Lightweight markdown→HTML (no external deps beyond gray-matter)
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Build a lookup map: slugified article title → category
export function buildArticleIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const article of getAllArticles()) {
    index.set(article.slug, article.category);
    // Also index by slugified title (in case wikilink text differs from filename)
    index.set(slugify(article.title), article.category);
  }
  return index;
}

export function renderMarkdown(
  content: string,
  articleIndex?: Map<string, string>
): string {
  // 1) Replace [[wikilinks]] with HTML anchors
  let md = content.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_, target, label) => {
      const display = label || target;
      const targetSlug = slugify(target);
      const category = articleIndex?.get(targetSlug);
      const href = category
        ? `/kb/${category}/${targetSlug}`
        : `/kb/${targetSlug}`;
      const cssClass = category ? "wikilink" : "wikilink wikilink-broken";
      return `<a href="${href}" class="${cssClass}">${display}</a>`;
    }
  );

  const lines = md.split("\n");
  const out: string[] = [];
  let inList: "ul" | "ol" | null = null;
  let inTable = false;
  let tableHeader = false;

  function inline(text: string): string {
    return (
      text
        // bold
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        // italic
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        // inline code
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        // links [text](url)
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2">$1</a>'
        )
    );
  }

  function closeList() {
    if (inList) {
      out.push(inList === "ul" ? "</ul>" : "</ol>");
      inList = null;
    }
  }

  function closeTable() {
    if (inTable) {
      out.push("</tbody></table>");
      inTable = false;
      tableHeader = false;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table rows
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      closeList();
      const cells = line
        .trim()
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());

      // Check if next line is separator (|---|---|)
      const nextLine = lines[i + 1]?.trim() || "";
      if (nextLine.match(/^\|[\s\-:|]+\|$/)) {
        // This is header row
        closeTable();
        inTable = true;
        tableHeader = true;
        out.push("<table>");
        out.push("<thead><tr>");
        cells.forEach((c) => out.push(`<th>${inline(c)}</th>`));
        out.push("</tr></thead><tbody>");
        i++; // skip separator line
        continue;
      }

      if (line.trim().match(/^\|[\s\-:|]+\|$/)) continue; // skip separator

      if (!inTable) {
        inTable = true;
        out.push("<table><tbody>");
      }
      out.push("<tr>");
      cells.forEach((c) => out.push(`<td>${inline(c)}</td>`));
      out.push("</tr>");
      continue;
    }

    closeTable();

    // Headers
    const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      closeList();
      const level = hMatch[1].length;
      out.push(`<h${level}>${inline(hMatch[2])}</h${level}>`);
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      closeList();
      out.push(`<blockquote><p>${inline(line.slice(2))}</p></blockquote>`);
      continue;
    }

    // Unordered list
    if (line.match(/^[-*]\s+/)) {
      closeTable();
      if (inList !== "ul") {
        closeList();
        inList = "ul";
        out.push("<ul>");
      }
      out.push(`<li>${inline(line.replace(/^[-*]\s+/, ""))}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      closeTable();
      if (inList !== "ol") {
        closeList();
        inList = "ol";
        out.push("<ol>");
      }
      out.push(`<li>${inline(olMatch[1])}</li>`);
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      closeList();
      continue;
    }

    // Paragraph
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }

  closeList();
  closeTable();

  return out.join("\n");
}

export function getCategories(team?: string): {
  name: string;
  label: string;
  count: number;
}[] {
  const config = getKBConfig(team);
  const articles = getAllArticles(team);

  return config.categories
    .map((cat) => ({
      name: cat.slug,
      label: cat.label,
      count: articles.filter((a) => a.category === cat.slug).length,
    }))
    .filter((c) => c.count > 0);
}

export interface KBSearchResult {
  title: string;
  category: string;
  slug: string;
  confidence: "high" | "medium" | "low";
  last_updated: string;
  snippet: string;
  relevance: number; // higher = better match
}

export function searchArticles(query: string): KBSearchResult[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const results: KBSearchResult[] = [];

  for (const a of getAllArticles()) {
    let relevance = 0;
    let snippet = "";

    // Title match (highest relevance)
    if (a.title.toLowerCase().includes(q)) {
      relevance += 100;
      snippet = a.title;
    }

    // Tag match
    if (a.tags.some((t) => t.toLowerCase().includes(q))) {
      relevance += 50;
      if (!snippet) snippet = `Tagged: ${a.tags.find((t) => t.toLowerCase().includes(q))}`;
    }

    // Content match — extract snippet around the match
    const contentLower = a.content.toLowerCase();
    const matchIdx = contentLower.indexOf(q);
    if (matchIdx !== -1) {
      relevance += 10;
      if (!snippet) {
        const start = Math.max(0, matchIdx - 60);
        const end = Math.min(a.content.length, matchIdx + q.length + 100);
        snippet =
          (start > 0 ? "..." : "") +
          a.content
            .slice(start, end)
            .replace(/^#+\s/gm, "")
            .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1")
            .replace(/[*_`#]/g, "")
            .trim() +
          (end < a.content.length ? "..." : "");
      }
    }

    if (relevance > 0) {
      results.push({
        title: a.title,
        category: a.category,
        slug: a.slug,
        confidence: a.confidence,
        last_updated: a.last_updated,
        snippet,
        relevance,
      });
    }
  }

  return results.sort((a, b) => b.relevance - a.relevance);
}

// Changelog parser
export interface KBChangelogEntry {
  date: string;
  changes: { article: string; description: string }[];
}

export function getChangelog(): KBChangelogEntry[] {
  const changelogPath = path.join(process.cwd(), "kb", "CHANGELOG.md");
  if (!fs.existsSync(changelogPath)) return [];

  const raw = fs.readFileSync(changelogPath, "utf-8");
  const entries: KBChangelogEntry[] = [];
  let current: KBChangelogEntry | null = null;

  for (const line of raw.split("\n")) {
    const dateMatch = line.match(/^## (\d{4}-\d{2}-\d{2})$/);
    if (dateMatch) {
      if (current) entries.push(current);
      current = { date: dateMatch[1], changes: [] };
      continue;
    }

    const changeMatch = line.match(/^- \*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
    if (changeMatch && current) {
      current.changes.push({
        article: changeMatch[1],
        description: changeMatch[2],
      });
    }
  }

  if (current) entries.push(current);
  return entries;
}

// Resolve raw file paths to source URLs
export interface ResolvedSource {
  path: string;
  title: string;
  url: string | null;
}

export function resolveSourceURLs(sources: string[]): ResolvedSource[] {
  return sources.map((src) => {
    // Sources reference paths like "raw/beat-reporters/..." which live under "kb/"
    const filePath = path.join(process.cwd(), "kb", src);
    let title = src.split("/").pop()?.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-(?:espn-|rss-|fan-)?/, "") || src;
    let url: string | null = null;

    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const urlMatch = raw.match(/^source_url:\s*(.+)$/m);
        if (urlMatch) url = urlMatch[1].trim();
        const titleMatch = raw.match(/^title:\s*"?(.+?)"?\s*$/m);
        if (titleMatch) title = titleMatch[1].trim();
      }
    } catch {}

    return { path: src, title, url };
  });
}

// Knowledge graph generation
export interface KBGraphNode {
  id: string;
  title: string;
  category: string;
  slug: string;
  confidence: "high" | "medium" | "low";
  linkCount: number;
}

export interface KBGraphEdge {
  source: string;
  target: string;
}

export interface KBGraph {
  nodes: KBGraphNode[];
  edges: KBGraphEdge[];
}

export function buildGraph(team?: string): KBGraph {
  const articles = getAllArticles(team);
  const index = buildArticleIndex();
  const nodes: KBGraphNode[] = [];
  const edges: KBGraphEdge[] = [];
  const edgeSet = new Set<string>();

  for (const article of articles) {
    const nodeId = `${article.category}/${article.slug}`;

    // Extract wikilinks from content
    const wikilinkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    let match;
    let linkCount = 0;

    while ((match = wikilinkRegex.exec(article.content)) !== null) {
      const targetTitle = match[1];
      const targetSlug = slugify(targetTitle);
      const targetCategory = index.get(targetSlug);

      if (targetCategory) {
        const targetId = `${targetCategory}/${targetSlug}`;
        const edgeKey = [nodeId, targetId].sort().join("→");
        if (!edgeSet.has(edgeKey) && nodeId !== targetId) {
          edgeSet.add(edgeKey);
          edges.push({ source: nodeId, target: targetId });
        }
        linkCount++;
      }
    }

    nodes.push({
      id: nodeId,
      title: article.title,
      category: article.category,
      slug: article.slug,
      confidence: article.confidence,
      linkCount,
    });
  }

  return { nodes, edges };
}
