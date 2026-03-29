#!/usr/bin/env node

/**
 * Standings Verification Script
 * Compares our API output against ESPN's live data to catch ordering/data mismatches.
 *
 * Usage:
 *   node scripts/verify-standings.mjs                  # compare against ESPN
 *   node scripts/verify-standings.mjs --url https://bkgrit.com  # check production
 */

const SITE_URL = process.argv.includes("--url")
  ? process.argv[process.argv.indexOf("--url") + 1]
  : "http://localhost:3000";

const ESPN_URL = "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings";

const LOTTERY_ABBREVS = new Set([
  "IND", "WAS", "BKN", "SAC", "UTA", "DAL", "MEM", "NOP",
  "CHI", "MIL", "GSW", "POR", "CHA", "MIA",
]);

// ESPN uses different abbreviations — normalize to our standard
const ESPN_ABBREV_MAP = {
  WSH: "WAS", UTAH: "UTA", NO: "NOP", GS: "GSW",
  NY: "NYK", SA: "SAS", PHX: "PHO",
};

async function fetchESPN() {
  const res = await fetch(ESPN_URL);
  const data = await res.json();
  const teams = [];

  for (const conf of data?.children || []) {
    for (const entry of conf?.standings?.entries || []) {
      const team = entry?.team || {};
      const rawAbbrev = team.abbreviation;
      if (!rawAbbrev) continue;
      const abbrev = ESPN_ABBREV_MAP[rawAbbrev] || rawAbbrev;
      if (!LOTTERY_ABBREVS.has(abbrev)) continue;

      const stats = {};
      for (const s of entry?.stats || []) {
        if (s.name && typeof s.value === "number") stats[s.name] = s.value;
      }

      teams.push({
        abbrev,
        wins: stats.wins || 0,
        losses: stats.losses || 0,
        winPct: stats.winPercent || 0,
      });
    }
  }

  // Sort by win% ascending (worst first)
  teams.sort((a, b) => a.winPct - b.winPct);
  return teams;
}

async function fetchOurAPI() {
  try {
    const res = await fetch(`${SITE_URL}/api/standings`);
    const data = await res.json();
    return data.lottery || [];
  } catch (e) {
    console.error(`\x1b[31mFailed to fetch from ${SITE_URL}/api/standings\x1b[0m`);
    console.error(`  Make sure the dev server is running or use --url https://bkgrit.com`);
    return null;
  }
}

function colorize(text, color) {
  const codes = { red: 31, green: 32, yellow: 33, cyan: 36, dim: 90 };
  return `\x1b[${codes[color] || 0}m${text}\x1b[0m`;
}

async function verify() {
  console.log(colorize("Standings Verification", "cyan"));
  console.log(colorize(`ESPN: ${ESPN_URL}`, "dim"));
  console.log(colorize(`Ours: ${SITE_URL}/api/standings`, "dim"));
  console.log();

  const [espn, ours] = await Promise.all([fetchESPN(), fetchOurAPI()]);

  if (!ours) return;

  let errors = 0;
  let warnings = 0;

  console.log("  #   ESPN                Our API             Status");
  console.log("  ─── ─────────────────── ─────────────────── ──────");

  for (let i = 0; i < espn.length; i++) {
    const e = espn[i];
    const o = ours[i];

    if (!o) {
      console.log(`  ${i + 1}   ${e.abbrev} ${e.wins}-${e.losses}`.padEnd(24) + colorize("MISSING", "red"));
      errors++;
      continue;
    }

    const issues = [];

    // Check ordering
    if (e.abbrev !== o.abbrev) {
      issues.push(colorize(`ORDER: expected ${e.abbrev} got ${o.abbrev}`, "red"));
      errors++;
    }

    // Check record
    if (e.wins !== o.wins || e.losses !== o.losses) {
      issues.push(colorize(`RECORD: ESPN ${e.wins}-${e.losses} vs ${o.wins}-${o.losses}`, "yellow"));
      warnings++;
    }

    const espnStr = `${e.abbrev} ${e.wins}-${e.losses} (.${(e.winPct * 1000).toFixed(0).padStart(3, "0")})`;
    const ourStr = `${o.abbrev} ${o.wins}-${o.losses}`;
    const status = issues.length === 0 ? colorize("OK", "green") : issues.join(", ");

    console.log(`  ${String(i + 1).padStart(2)}  ${espnStr.padEnd(20)} ${ourStr.padEnd(20)} ${status}`);
  }

  console.log();

  if (errors === 0 && warnings === 0) {
    console.log(colorize("All checks passed! Standings match ESPN.", "green"));
  } else {
    if (errors > 0) console.log(colorize(`${errors} error(s) — ordering or missing teams`, "red"));
    if (warnings > 0) console.log(colorize(`${warnings} warning(s) — record mismatches (may be timing)`, "yellow"));
  }

  // Return exit code
  process.exit(errors > 0 ? 1 : 0);
}

verify().catch((e) => {
  console.error(colorize("Verification failed:", "red"), e.message);
  process.exit(1);
});
