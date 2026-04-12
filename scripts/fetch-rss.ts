/**
 * RSS Feed Monitor for BKGrit Knowledge Base
 *
 * Pulls full articles from Nets-relevant RSS feeds and writes
 * structured markdown to kb/raw/beat-reporters/.
 *
 * Usage: npx tsx scripts/fetch-rss.ts
 *
 * Agent tier: Haiku (data extraction, no editorial judgment)
 */

import fs from "fs";
import path from "path";

const KB_RAW = path.join(process.cwd(), "kb", "raw");
const TODAY = new Date().toISOString().split("T")[0];

// RSS feeds to monitor — add more as we find them
const FEEDS = [
  {
    name: "NY Post Nets",
    url: "https://nypost.com/tag/brooklyn-nets/feed/",
    dir: "beat-reporters",
    netsOnly: true, // Already Nets-filtered, skip keyword check
  },
  {
    name: "NY Daily News Nets",
    url: "https://www.nydailynews.com/tag/brooklyn-nets/feed/",
    dir: "beat-reporters",
    netsOnly: true,
  },
  {
    name: "ESPN NBA",
    url: "https://www.espn.com/espn/rss/nba/news",
    dir: "beat-reporters",
    netsOnly: false,
  },
];

// Nets-related keywords to filter articles
const NETS_KEYWORDS = [
  "nets", "brooklyn", "bkn",
  "egor demin", "demin",
  "michael porter", "mpj",
  "nic claxton", "claxton",
  "noah clowney", "clowney",
  "nolan traore", "traore",
  "danny wolf",
  "ben saraf", "saraf",
  "drake powell",
  "sean marks",
  "jordi fernandez",
  "barclays center",
  "giannis", "antetokounmpo", // trade rumor target
  "cam thomas",
  "cameron johnson",
];

interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60).replace(/-$/, "");
}

function isNetsRelated(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return NETS_KEYWORDS.some(kw => text.includes(kw));
}

// Simple XML RSS parser (no dependencies)
function parseRSS(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const getTag = (tag: string): string => {
      const tagMatch = itemXml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, "s"));
      return tagMatch ? tagMatch[1].trim().replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/<[^>]+>/g, "") : "";
    };

    items.push({
      title: getTag("title"),
      description: getTag("description"),
      link: getTag("link"),
      pubDate: getTag("pubDate"),
    });
  }

  return items;
}

async function fetchFeed(feed: typeof FEEDS[0]): Promise<number> {
  console.log(`  Fetching ${feed.name}...`);

  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "BKGrit-KB-Bot/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.log(`    ⚠ ${res.status} — skipping`);
      return 0;
    }

    const xml = await res.text();
    const items = parseRSS(xml);
    const netsItems = (feed as any).netsOnly
      ? items
      : items.filter(item => isNetsRelated(item.title, item.description));

    if (netsItems.length === 0) {
      console.log(`    No Nets-related articles found (${items.length} total)`);
      return 0;
    }

    const dir = path.join(KB_RAW, feed.dir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let written = 0;
    for (const item of netsItems.slice(0, 5)) {
      const slug = slugify(item.title);
      const filename = `${TODAY}-rss-${slug}.md`;
      const filePath = path.join(dir, filename);

      // Skip if already fetched today
      if (fs.existsSync(filePath)) continue;

      const pubDate = item.pubDate ? new Date(item.pubDate).toISOString().split("T")[0] : TODAY;

      const md = `---
title: "${item.title.replace(/"/g, '\\"')}"
tags: [${feed.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}, news, rss]
source_url: ${item.link}
source_type: beat-report
clipped_date: ${pubDate}
---

## Key Takeaways
- ${item.title}

## Content
${item.description || "Full content available at source URL."}

## Source
- Feed: ${feed.name}
- URL: ${item.link}
- Published: ${item.pubDate || "Unknown"}
`;

      fs.writeFileSync(filePath, md);
      console.log(`    ✓ ${filename}`);
      written++;
    }

    return written;
  } catch (err: any) {
    console.log(`    ⚠ Error: ${err.message || err}`);
    return 0;
  }
}

async function main() {
  console.log(`\n📰 BKGrit RSS Monitor — ${TODAY}\n`);

  let totalWritten = 0;

  for (const feed of FEEDS) {
    totalWritten += await fetchFeed(feed);
  }

  // Also fetch ESPN Nets-specific news (JSON API)
  console.log("  Fetching ESPN Nets news (API)...");
  try {
    const res = await fetch("http://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?team=bkn&limit=10", {
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = await res.json();
      const articles = data.articles || [];
      const dir = path.join(KB_RAW, "beat-reporters");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      for (const article of articles.slice(0, 5)) {
        const slug = slugify(article.headline || "untitled");
        const filename = `${TODAY}-espn-${slug}.md`;
        const filePath = path.join(dir, filename);
        if (fs.existsSync(filePath)) continue;

        const pubDate = article.published?.slice(0, 10) || TODAY;
        const md = `---
title: "${(article.headline || "").replace(/"/g, '\\"')}"
tags: [espn, nets, news]
source_url: ${article.links?.web?.href || "https://espn.com"}
source_type: beat-report
clipped_date: ${pubDate}
---

## Key Takeaways
- ${article.headline || ""}

## Content
${article.description || ""}

## Source
- ESPN Nets News API
- Published: ${pubDate}
`;
        fs.writeFileSync(filePath, md);
        console.log(`    ✓ ${filename}`);
        totalWritten++;
      }
    }
  } catch (err: any) {
    console.log(`    ⚠ Error: ${err.message || err}`);
  }

  console.log(`\n✅ RSS fetch complete. ${totalWritten} new article(s) saved.\n`);
}

main();
