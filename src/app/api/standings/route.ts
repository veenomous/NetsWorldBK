import { NextResponse } from "next/server";

export const revalidate = 3600; // Cache 1 hour

export interface StandingsTeam {
  team: string;
  abbrev: string;
  wins: number;
  losses: number;
  conference: string;
}

export async function GET() {
  try {
    const res = await fetch(
      "https://stats.nba.com/stats/leaguestandingsv3?LeagueID=00&Season=2025-26&SeasonType=Regular+Season",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          Referer: "https://www.nba.com/",
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          Origin: "https://www.nba.com",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) throw new Error(`NBA API returned ${res.status}`);

    const data = await res.json();
    const headers = data.resultSets?.[0]?.headers || [];
    const rows = data.resultSets?.[0]?.rowSet || [];

    const ai = headers.indexOf("TeamAbbreviation");
    const wi = headers.indexOf("WINS");
    const li = headers.indexOf("LOSSES");
    const ci = headers.indexOf("Conference");
    const cti = headers.indexOf("TeamCity");
    const ni = headers.indexOf("TeamName");

    if (ai === -1 || wi === -1 || li === -1) throw new Error("Missing columns");

    const teams: StandingsTeam[] = rows.map((r: any[]) => ({
      team: `${r[cti]} ${r[ni]}`,
      abbrev: r[ai],
      wins: r[wi],
      losses: r[li],
      conference: r[ci],
    }));

    // Sort by most losses (worst record first = best lottery position)
    teams.sort((a, b) => {
      if (b.losses !== a.losses) return b.losses - a.losses;
      return a.wins - b.wins;
    });

    // Add lottery position
    const lottery = teams.slice(0, 14).map((t, idx) => ({
      ...t,
      lotteryRank: idx + 1,
      gamesRemaining: 82 - t.wins - t.losses,
    }));

    return NextResponse.json({
      lottery,
      allTeams: teams,
      lastUpdated: new Date().toISOString(),
    });
  } catch (e) {
    // Return signal to use static fallback
    return NextResponse.json({
      lottery: null,
      allTeams: null,
      error: "api_unavailable",
      lastUpdated: new Date().toISOString(),
    });
  }
}
