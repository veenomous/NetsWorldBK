import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const LOTTERY_ABBREVS = new Set([
  "IND", "WAS", "BKN", "SAC", "UTA", "DAL", "MEM", "NOP",
  "CHI", "MIL", "GSW", "POR", "CHA", "MIA",
]);

const CONF_MAP: Record<string, string> = {
  IND: "East", WAS: "East", BKN: "East", SAC: "West", UTA: "West",
  DAL: "West", MEM: "West", NOP: "West", CHI: "East", MIL: "East",
  GSW: "West", POR: "West", CHA: "East", MIA: "East",
};

const STATIC_FALLBACK: Record<string, { team: string; wins: number; losses: number }> = {
  IND: { team: "Indiana Pacers", wins: 16, losses: 58 },
  WAS: { team: "Washington Wizards", wins: 16, losses: 55 },
  BKN: { team: "Brooklyn Nets", wins: 17, losses: 57 },
  SAC: { team: "Sacramento Kings", wins: 19, losses: 56 },
  UTA: { team: "Utah Jazz", wins: 21, losses: 50 },
  DAL: { team: "Dallas Mavericks", wins: 23, losses: 48 },
  MEM: { team: "Memphis Grizzlies", wins: 24, losses: 46 },
  NOP: { team: "New Orleans Pelicans", wins: 25, losses: 47 },
  CHI: { team: "Chicago Bulls", wins: 28, losses: 42 },
  MIL: { team: "Milwaukee Bucks", wins: 29, losses: 41 },
  GSW: { team: "Golden State Warriors", wins: 33, losses: 38 },
  POR: { team: "Portland Trail Blazers", wins: 35, losses: 37 },
  CHA: { team: "Charlotte Hornets", wins: 37, losses: 34 },
  MIA: { team: "Miami Heat", wins: 38, losses: 33 },
};

interface StandingsTeam {
  team: string;
  abbrev: string;
  wins: number;
  losses: number;
  conference: string;
  lotteryRank: number;
  gamesRemaining: number;
}

// ESPN public standings API — returns all 30 teams with current records
async function fetchFromESPN(): Promise<Record<string, { team: string; abbrev: string; wins: number; losses: number }> | null> {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings",
      { cache: "no-store" }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const records: Record<string, { team: string; abbrev: string; wins: number; losses: number }> = {};

    for (const conf of data?.children || []) {
      for (const entry of conf?.standings?.entries || []) {
        const team = entry?.team || {};
        const abbrev = team.abbreviation;
        if (!abbrev || !LOTTERY_ABBREVS.has(abbrev)) continue;

        const stats: Record<string, number> = {};
        for (const s of entry?.stats || []) {
          if (s.name && typeof s.value === "number") {
            stats[s.name] = s.value;
          }
        }

        records[abbrev] = {
          team: team.displayName || team.name || abbrev,
          abbrev,
          wins: stats.wins || 0,
          losses: stats.losses || 0,
        };
      }
    }

    return Object.keys(records).length >= 10 ? records : null;
  } catch {
    return null;
  }
}

// Fallback: today's NBA scoreboard (only has teams playing today)
async function fetchFromScoreboard(): Promise<Record<string, { team: string; abbrev: string; wins: number; losses: number }> | null> {
  try {
    const res = await fetch(
      "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json",
      { cache: "no-store" }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const records: Record<string, { team: string; abbrev: string; wins: number; losses: number }> = {};

    for (const g of data?.scoreboard?.games || []) {
      for (const side of [g.homeTeam, g.awayTeam]) {
        if (side?.teamTricode && LOTTERY_ABBREVS.has(side.teamTricode)) {
          records[side.teamTricode] = {
            team: `${side.teamCity} ${side.teamName}`,
            abbrev: side.teamTricode,
            wins: side.wins || 0,
            losses: side.losses || 0,
          };
        }
      }
    }

    return Object.keys(records).length > 0 ? records : null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // Try ESPN first (all teams), fall back to NBA scoreboard (partial)
    const liveRecords = await fetchFromESPN() || await fetchFromScoreboard();

    const allTeams: StandingsTeam[] = Object.entries(STATIC_FALLBACK).map(([abbrev, fallback]) => {
      const live = liveRecords?.[abbrev];
      const wins = live?.wins ?? fallback.wins;
      const losses = live?.losses ?? fallback.losses;
      return {
        team: live?.team || fallback.team,
        abbrev,
        wins,
        losses,
        conference: CONF_MAP[abbrev] || "East",
        lotteryRank: 0,
        gamesRemaining: 82 - wins - losses,
      };
    });

    // Sort by worst record (most losses first, then fewest wins)
    allTeams.sort((a, b) => {
      if (b.losses !== a.losses) return b.losses - a.losses;
      return a.wins - b.wins;
    });

    // Assign lottery rank
    allTeams.forEach((t, idx) => { t.lotteryRank = idx + 1; });

    return NextResponse.json({
      lottery: allTeams,
      teamsFromLive: liveRecords ? Object.keys(liveRecords).length : 0,
      lastUpdated: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      lottery: null,
      error: "api_unavailable",
      lastUpdated: new Date().toISOString(),
    });
  }
}
