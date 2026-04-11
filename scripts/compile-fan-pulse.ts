/**
 * Fan Pulse Compiler
 *
 * Reads Wire takes, player ratings, and poll data from Supabase
 * and compiles a "Fan Pulse" wiki article summarizing fan sentiment.
 *
 * Usage: npx tsx scripts/compile-fan-pulse.ts
 * Agent tier: Haiku (data aggregation, no editorial judgment)
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kijbuyyzetkxgcrphtjd.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpamJ1eXl6ZXRreGdjcnBodGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzg2NTksImV4cCI6MjA4OTkxNDY1OX0.8qJe14118lGBo_QsZ5_VAm00NmIbnGraeteQGRiWyeU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const TODAY = new Date().toISOString().split("T")[0];
const WIKI_DIR = path.join(process.cwd(), "kb", "wiki", "concepts");

async function main() {
  console.log("\n📊 Compiling Fan Pulse...\n");

  // ─── 1. Wire Takes — most engaged ───
  console.log("  Fetching Wire takes...");
  const { data: takes } = await supabase
    .from("hot_takes")
    .select("text, author, agrees, disagrees, tag, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const wireSummary: string[] = [];
  const tagCounts: Record<string, number> = {};
  let totalAgrees = 0;
  let totalDisagrees = 0;
  const hotTakes: { text: string; author: string; agrees: number; disagrees: number }[] = [];

  if (takes && takes.length > 0) {
    for (const take of takes) {
      totalAgrees += take.agrees || 0;
      totalDisagrees += take.disagrees || 0;
      if (take.tag) tagCounts[take.tag] = (tagCounts[take.tag] || 0) + 1;
      if ((take.agrees || 0) + (take.disagrees || 0) >= 3) {
        hotTakes.push({ text: take.text, author: take.author, agrees: take.agrees || 0, disagrees: take.disagrees || 0 });
      }
    }
    hotTakes.sort((a, b) => (b.agrees + b.disagrees) - (a.agrees + a.disagrees));

    wireSummary.push(`- ${takes.length} recent takes on The Wire`);
    wireSummary.push(`- Total engagement: ${totalAgrees} agrees, ${totalDisagrees} disagrees`);
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (topTags.length > 0) {
      wireSummary.push(`- Most discussed topics: ${topTags.map(([tag, count]) => `${tag} (${count})`).join(", ")}`);
    }
  } else {
    wireSummary.push("- No recent Wire activity");
  }

  // ─── 2. Player Ratings ───
  console.log("  Fetching player ratings...");
  const { data: ratings } = await supabase
    .from("player_ratings")
    .select("player_name, rating");

  const playerSentiment: Record<string, Record<string, number>> = {};

  if (ratings && ratings.length > 0) {
    for (const r of ratings) {
      if (!playerSentiment[r.player_name]) {
        playerSentiment[r.player_name] = { star: 0, starter: 0, role_player: 0, trade_him: 0, total: 0 };
      }
      playerSentiment[r.player_name][r.rating] = (playerSentiment[r.player_name][r.rating] || 0) + 1;
      playerSentiment[r.player_name].total++;
    }
  }

  const ratingLines: string[] = [];
  const sortedPlayers = Object.entries(playerSentiment)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);

  for (const [name, counts] of sortedPlayers) {
    if (counts.total < 2) continue;
    const top = Object.entries(counts)
      .filter(([k]) => k !== "total")
      .sort((a, b) => (b[1] as number) - (a[1] as number))[0];
    const pct = Math.round(((top[1] as number) / counts.total) * 100);
    const label = top[0].replace("_", " ");
    ratingLines.push(`| ${name} | ${counts.total} votes | ${label} (${pct}%) |`);
  }

  // ─── 3. Poll Results ───
  console.log("  Fetching poll results...");
  const { data: polls } = await supabase
    .from("prediction_picks")
    .select("prediction_id, picked_option");

  const pollResults: Record<string, { a: number; b: number }> = {};
  if (polls) {
    for (const p of polls) {
      if (!pollResults[p.prediction_id]) pollResults[p.prediction_id] = { a: 0, b: 0 };
      if (p.picked_option === "A") pollResults[p.prediction_id].a++;
      else pollResults[p.prediction_id].b++;
    }
  }

  const pollLines: string[] = [];
  for (const [id, counts] of Object.entries(pollResults)) {
    const total = counts.a + counts.b;
    if (total < 3) continue;
    const pctA = Math.round((counts.a / total) * 100);
    pollLines.push(`| ${id} | ${total} votes | Option A: ${pctA}% / Option B: ${100 - pctA}% |`);
  }

  // ─── 4. Write the article ───
  console.log("  Writing Fan Pulse article...");

  const hotTakeSection = hotTakes.slice(0, 5).map(t =>
    `> "${t.text.slice(0, 150)}${t.text.length > 150 ? '...' : ''}" — @${t.author} (${t.agrees} agrees, ${t.disagrees} disagrees)`
  ).join("\n\n");

  const md = `---
title: Fan Pulse
tags: [fan-pulse, sentiment, community, wire, ratings]
sources: []
confidence: high
last_updated: ${TODAY}
---

## Summary
A weekly snapshot of Brooklyn Nets fan sentiment compiled from Wire takes, player ratings, and community polls on BKGrit. This article is auto-generated from real fan data — no editorial spin, just what the community is saying.

## Key Insights
${wireSummary.join("\n")}
${ratingLines.length > 0 ? `- ${sortedPlayers.length} players rated by fans` : "- No player ratings yet"}
${pollLines.length > 0 ? `- ${Object.keys(pollResults).length} polls with responses` : "- No poll data yet"}

## The Wire — What Fans Are Saying

${hotTakes.length > 0 ? hotTakeSection : "No high-engagement takes yet. Post yours on [The Wire](/wire)."}

## Player Sentiment

How fans rate the current roster:

${ratingLines.length > 0 ? `| Player | Votes | Consensus |\n|--------|-------|-----------|` + "\n" + ratingLines.join("\n") : "Not enough ratings yet. Rate players on the [Roster page](/)."}

## Poll Results

${pollLines.length > 0 ? `| Poll | Votes | Split |\n|------|-------|-------|` + "\n" + pollLines.join("\n") : "No polls with enough responses yet."}

## How This Works
This article is compiled automatically from three data sources:
1. **The Wire** — fan takes with agrees/disagrees
2. **Player Ratings** — fans rate each player as Star, Starter, Role Player, or Trade Him
3. **Polls** — daily poll results from the homepage

The more you participate, the richer this snapshot becomes. [Post a take on The Wire](/wire) or [submit a source](/kb/submit) to contribute.

## Related
- [[Rebuild Timeline]]
- [[Michael Porter Jr.]]
- [[Egor Demin]]
- [[Nic Claxton]]
`;

  if (!fs.existsSync(WIKI_DIR)) fs.mkdirSync(WIKI_DIR, { recursive: true });
  fs.writeFileSync(path.join(WIKI_DIR, "Fan Pulse.md"), md);
  console.log("  ✓ wiki/concepts/Fan Pulse.md\n");

  console.log("✅ Fan Pulse compiled.\n");
}

main();
