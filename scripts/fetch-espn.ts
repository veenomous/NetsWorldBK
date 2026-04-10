/**
 * ESPN Data Fetcher for BKGrit Knowledge Base
 *
 * Pulls Nets-relevant data from ESPN's public API and writes
 * structured markdown files to kb/raw/.
 *
 * Usage: npx tsx scripts/fetch-espn.ts [--team BKN] [--type all|news|roster|standings|transactions]
 *
 * Agent tier: Haiku (structured data extraction, no editorial judgment)
 */

import fs from "fs";
import path from "path";

const BASE = "http://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const TEAM = process.argv.includes("--team")
  ? process.argv[process.argv.indexOf("--team") + 1]
  : "bkn";
const TYPE = process.argv.includes("--type")
  ? process.argv[process.argv.indexOf("--type") + 1]
  : "all";

const KB_RAW = path.join(process.cwd(), "kb", "raw");
const TODAY = new Date().toISOString().split("T")[0];

async function fetchJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

function writeRaw(subdir: string, filename: string, content: string) {
  const dir = path.join(KB_RAW, subdir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, content);
  console.log(`  ✓ ${subdir}/${filename}`);
}

// ─── News ───
async function fetchNews() {
  console.log("Fetching news...");
  const data = await fetchJSON(`${BASE}/news?team=${TEAM}&limit=10`);
  const articles = data.articles || [];
  if (articles.length === 0) return console.log("  No news found");

  const lines = articles.map((a: any) => {
    const date = a.published?.slice(0, 10) || TODAY;
    const headline = a.headline || "Untitled";
    const desc = a.description || "";
    return `### ${headline}\n**Date:** ${date}\n\n${desc}`;
  });

  const md = `---
title: Nets News Digest — ${TODAY}
tags: [news, ${TEAM.toLowerCase()}, espn]
source_type: beat-report
clipped_date: ${TODAY}
---

## Key Takeaways
${articles.slice(0, 3).map((a: any) => `- ${a.headline}`).join("\n")}

## Articles

${lines.join("\n\n---\n\n")}
`;

  writeRaw("beat-reporters", `${TODAY}-espn-news.md`, md);
}

// ─── Roster ───
async function fetchRoster() {
  console.log("Fetching roster...");
  const data = await fetchJSON(`${BASE}/teams/${TEAM}/roster`);
  const athletes = data.athletes || [];

  const rows = athletes.map((p: any) => {
    const name = p.displayName || p.fullName || "Unknown";
    const pos = p.position?.abbreviation || "?";
    const age = p.age || "?";
    const jersey = p.jersey || "?";
    const height = p.displayHeight || "?";
    const weight = p.displayWeight || "?";
    const salary = p.contract?.salary
      ? `$${(p.contract.salary / 1000000).toFixed(1)}M`
      : "?";
    return `| ${name} | #${jersey} | ${pos} | ${age} | ${height} | ${weight} | ${salary} |`;
  });

  const md = `---
title: Nets Roster Snapshot — ${TODAY}
tags: [roster, ${TEAM.toLowerCase()}, current]
source_type: stats
clipped_date: ${TODAY}
---

## Key Takeaways
- ${athletes.length} players on active roster
- Data pulled from ESPN on ${TODAY}

## Roster

| Player | # | Pos | Age | Height | Weight | Salary |
|--------|---|-----|-----|--------|--------|--------|
${rows.join("\n")}
`;

  writeRaw("stats", `${TODAY}-roster-snapshot.md`, md);
}

// ─── Standings ───
async function fetchStandings() {
  console.log("Fetching standings...");
  const data = await fetchJSON(
    `${BASE}/standings?group=league&sort=wins:desc`
  );

  const entries = data.children?.[0]?.standings?.entries || [];
  if (entries.length === 0) {
    // Try alternate structure
    const alt = await fetchJSON(`http://site.api.espn.com/apis/v2/sports/basketball/nba/standings`);
    const children = alt.children || [];
    const allEntries: any[] = [];
    for (const conf of children) {
      for (const entry of conf.standings?.entries || []) {
        allEntries.push(entry);
      }
    }
    if (allEntries.length === 0) return console.log("  No standings data");
    processStandings(allEntries);
    return;
  }

  processStandings(entries);
}

function processStandings(entries: any[]) {
  // Sort by losses desc (worst teams first) for lottery relevance
  const sorted = entries
    .map((e: any) => {
      const team = e.team?.displayName || "Unknown";
      const abbrev = e.team?.abbreviation || "?";
      const stats = e.stats || [];
      const wins = stats.find((s: any) => s.name === "wins")?.value || 0;
      const losses = stats.find((s: any) => s.name === "losses")?.value || 0;
      return { team, abbrev, wins, losses };
    })
    .sort((a, b) => a.wins - b.wins);

  const netsEntry = sorted.find(
    (e) => e.abbrev === "BKN" || e.abbrev === "BRK"
  );
  const lotteryTeams = sorted.slice(0, 14);

  const rows = lotteryTeams.map(
    (t, i) =>
      `| ${i + 1} | ${t.team} | ${t.wins}-${t.losses} |${t.abbrev === "BKN" || t.abbrev === "BRK" ? " **NETS** |" : " |"}`
  );

  const md = `---
title: NBA Standings — ${TODAY}
tags: [standings, lottery, ${TODAY}]
source_type: stats
clipped_date: ${TODAY}
---

## Key Takeaways
- Nets record: ${netsEntry ? `${netsEntry.wins}-${netsEntry.losses}` : "Unknown"}
- Lottery position: ${netsEntry ? lotteryTeams.findIndex((t) => t.abbrev === netsEntry.abbrev) + 1 : "?"}

## Lottery Standings (Bottom 14)

| Rank | Team | Record | Notes |
|------|------|--------|-------|
${rows.join("\n")}
`;

  writeRaw("stats", `${TODAY}-standings.md`, md);
}

// ─── Transactions ───
async function fetchTransactions() {
  console.log("Fetching transactions...");
  // ESPN transactions API — team-specific
  const data = await fetchJSON(
    `${BASE}/teams/${TEAM}/transactions?limit=20`
  );

  const items = data.items || data.transactions || [];
  if (items.length === 0) return console.log("  No transactions found");

  const entries = items.map((t: any) => {
    const date = t.date?.slice(0, 10) || TODAY;
    const desc = t.text || t.description || "Transaction details unavailable";
    return `- **${date}**: ${desc}`;
  });

  const md = `---
title: Nets Transactions — ${TODAY}
tags: [transactions, ${TEAM.toLowerCase()}, roster-moves]
source_type: transaction
clipped_date: ${TODAY}
---

## Key Takeaways
- ${items.length} recent transactions found
- Data pulled from ESPN on ${TODAY}

## Transactions

${entries.join("\n")}
`;

  writeRaw("transactions", `${TODAY}-espn-transactions.md`, md);
}

// ─── Scoreboard (recent games) ───
async function fetchScores() {
  console.log("Fetching recent scores...");
  const data = await fetchJSON(`${BASE}/teams/${TEAM}/schedule`);

  const events = data.events || [];
  // Get last 5 completed games
  const completed = events
    .filter((e: any) => e.competitions?.[0]?.status?.type?.completed)
    .slice(-5);

  if (completed.length === 0) return console.log("  No recent games found");

  const gameLines = completed.map((e: any) => {
    const comp = e.competitions[0];
    const home = comp.competitors.find((c: any) => c.homeAway === "home");
    const away = comp.competitors.find((c: any) => c.homeAway === "away");
    const date = e.date?.slice(0, 10) || "?";
    const homeScore = typeof home?.score === "object" ? home?.score?.displayValue || home?.score?.value || "?" : home?.score || "?";
    const awayScore = typeof away?.score === "object" ? away?.score?.displayValue || away?.score?.value || "?" : away?.score || "?";
    const homeName = home?.team?.abbreviation || "?";
    const awayName = away?.team?.abbreviation || "?";
    const isNetsHome = homeName === "BKN";
    const netsScore = isNetsHome ? homeScore : awayScore;
    const oppScore = isNetsHome ? awayScore : homeScore;
    const oppName = isNetsHome ? awayName : homeName;
    const prefix = isNetsHome ? "vs" : "@";
    const result = Number(netsScore) > Number(oppScore) ? "W" : "L";
    return `- **${date}**: ${result} ${prefix} ${oppName} (${netsScore}-${oppScore})`;
  });

  const md = `---
title: Nets Recent Games — ${TODAY}
tags: [scores, games, ${TEAM.toLowerCase()}]
source_type: stats
clipped_date: ${TODAY}
---

## Key Takeaways
- Last 5 games results for the Brooklyn Nets

## Recent Games

${gameLines.join("\n")}
`;

  writeRaw("stats", `${TODAY}-recent-games.md`, md);
}

// ─── Main ───
async function main() {
  console.log(`\n🏀 BKGrit KB Fetcher — ${TEAM.toUpperCase()} — ${TODAY}\n`);

  try {
    if (TYPE === "all" || TYPE === "news") await fetchNews();
    if (TYPE === "all" || TYPE === "roster") await fetchRoster();
    if (TYPE === "all" || TYPE === "standings") await fetchStandings();
    if (TYPE === "all" || TYPE === "transactions") await fetchTransactions();
    if (TYPE === "all" || TYPE === "scores") await fetchScores();
    console.log("\n✅ Fetch complete.\n");
  } catch (err) {
    console.error("\n❌ Fetch error:", err);
    process.exit(1);
  }
}

main();
