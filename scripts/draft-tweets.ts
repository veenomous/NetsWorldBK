/**
 * Tweet Draft Generator
 *
 * Reads today's CHANGELOG entries and generates tweet drafts
 * for each article update. Saves to Supabase for admin review.
 *
 * Usage: npx tsx scripts/draft-tweets.ts
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kijbuyyzetkxgcrphtjd.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpamJ1eXl6ZXRreGdjcnBodGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzg2NTksImV4cCI6MjA4OTkxNDY1OX0.8qJe14118lGBo_QsZ5_VAm00NmIbnGraeteQGRiWyeU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const TODAY = new Date().toISOString().split("T")[0];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Map article titles to their URLs
function getArticleUrl(title: string): string {
  const wikiDir = path.join(process.cwd(), "kb", "wiki");
  const categories = ["players", "seasons", "trades", "front-office", "draft", "rivalries", "assets", "strategy", "community", "rumors"];

  for (const cat of categories) {
    const catDir = path.join(wikiDir, cat);
    if (!fs.existsSync(catDir)) continue;
    for (const file of fs.readdirSync(catDir).filter(f => f.endsWith(".md"))) {
      const raw = fs.readFileSync(path.join(catDir, file), "utf-8");
      const titleMatch = raw.match(/^title:\s*(.+)$/m);
      const fileTitle = titleMatch ? titleMatch[1].trim() : file.replace(/\.md$/, "");
      if (fileTitle.toLowerCase() === title.toLowerCase() || slugify(fileTitle) === slugify(title)) {
        return `https://bkgrit.com/kb/${cat}/${slugify(file.replace(/\.md$/, ""))}`;
      }
    }
  }
  return "https://bkgrit.com";
}

// Generate a tweet from a changelog entry
function generateTweet(article: string, description: string): string {
  const url = getArticleUrl(article);
  const desc = description.replace(/^(Updated?|Created?|New):?\s*/i, "").trim();

  // Keep under 280 chars
  const base = `${desc} → ${url}`;
  if (base.length <= 280) return base;

  // Truncate description
  const maxDesc = 280 - url.length - 5;
  return `${desc.slice(0, maxDesc)}... → ${url}`;
}

async function main() {
  console.log(`\n📝 Drafting tweets for ${TODAY}...\n`);

  // Read changelog
  const changelogPath = path.join(process.cwd(), "kb", "CHANGELOG.md");
  if (!fs.existsSync(changelogPath)) {
    console.log("  No CHANGELOG.md found");
    return;
  }

  const raw = fs.readFileSync(changelogPath, "utf-8");
  const lines = raw.split("\n");
  let inToday = false;
  const todayChanges: { article: string; description: string }[] = [];

  for (const line of lines) {
    if (line.match(new RegExp(`^## ${TODAY}`))) {
      inToday = true;
      continue;
    }
    if (inToday && line.startsWith("## ")) break;
    if (inToday) {
      const match = line.match(/^- \*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
      if (match) {
        todayChanges.push({ article: match[1], description: match[2] });
      }
    }
  }

  if (todayChanges.length === 0) {
    console.log("  No changes today to tweet about");
    return;
  }

  // Create tweet_drafts table if it doesn't exist (will silently fail if no permission)
  for (const change of todayChanges) {
    const tweet = generateTweet(change.article, change.description);
    console.log(`  📝 ${tweet.slice(0, 80)}...`);

    await supabase.from("tweet_drafts").insert({
      tweet_text: tweet,
      article_title: change.article,
      article_url: getArticleUrl(change.article),
      status: "draft",
      created_at: new Date().toISOString(),
    });
  }

  console.log(`\n✅ ${todayChanges.length} tweet(s) drafted.\n`);
}

main();
