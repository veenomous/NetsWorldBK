import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// NBA team IDs for the 14 lottery teams (sorted by expected worst record)
// We pull their current records from the live scoreboard which always works
const LOTTERY_TEAM_IDS = new Set([
  1610612754, // IND
  1610612764, // WAS
  1610612751, // BKN
  1610612758, // SAC
  1610612762, // UTA
  1610612742, // DAL
  1610612763, // MEM
  1610612740, // NOP
  1610612741, // CHI
  1610612749, // MIL
  1610612744, // GSW
  1610612757, // POR
  1610612766, // CHA
  1610612748, // MIA
]);

interface StandingsTeam {
  team: string;
  abbrev: string;
  wins: number;
  losses: number;
  conference: string;
  lotteryRank: number;
  gamesRemaining: number;
}

export async function GET() {
  try {
    // Use NBA's public scoreboard — it includes team records and ALWAYS works
    const res = await fetch(
      "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json",
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error("Scoreboard unavailable");

    const data = await res.json();
    const games = data?.scoreboard?.games || [];

    // Collect team records from today's games
    const teamRecords: Record<string, { team: string; abbrev: string; wins: number; losses: number }> = {};

    for (const g of games) {
      const home = g.homeTeam;
      const away = g.awayTeam;

      if (home?.teamTricode) {
        teamRecords[home.teamTricode] = {
          team: `${home.teamCity} ${home.teamName}`,
          abbrev: home.teamTricode,
          wins: home.wins || 0,
          losses: home.losses || 0,
        };
      }
      if (away?.teamTricode) {
        teamRecords[away.teamTricode] = {
          team: `${away.teamCity} ${away.teamName}`,
          abbrev: away.teamTricode,
          wins: away.wins || 0,
          losses: away.losses || 0,
        };
      }
    }

    // If we got team records from today's scoreboard, merge with our known lottery teams
    // For teams NOT playing today, we'll use static fallback values
    const STATIC_FALLBACK: Record<string, { team: string; wins: number; losses: number; conf: string }> = {
      IND: { team: "Indiana Pacers", wins: 15, losses: 56, conf: "East" },
      WAS: { team: "Washington Wizards", wins: 16, losses: 55, conf: "East" },
      BKN: { team: "Brooklyn Nets", wins: 17, losses: 54, conf: "East" },
      SAC: { team: "Sacramento Kings", wins: 19, losses: 53, conf: "West" },
      UTA: { team: "Utah Jazz", wins: 21, losses: 50, conf: "West" },
      DAL: { team: "Dallas Mavericks", wins: 23, losses: 48, conf: "West" },
      MEM: { team: "Memphis Grizzlies", wins: 24, losses: 46, conf: "West" },
      NOP: { team: "New Orleans Pelicans", wins: 25, losses: 47, conf: "West" },
      CHI: { team: "Chicago Bulls", wins: 28, losses: 42, conf: "East" },
      MIL: { team: "Milwaukee Bucks", wins: 29, losses: 41, conf: "East" },
      GSW: { team: "Golden State Warriors", wins: 33, losses: 38, conf: "West" },
      POR: { team: "Portland Trail Blazers", wins: 35, losses: 37, conf: "West" },
      CHA: { team: "Charlotte Hornets", wins: 37, losses: 34, conf: "East" },
      MIA: { team: "Miami Heat", wins: 38, losses: 33, conf: "East" },
    };

    const allTeams: StandingsTeam[] = Object.entries(STATIC_FALLBACK).map(([abbrev, fallback]) => {
      const live = teamRecords[abbrev];
      return {
        team: live?.team || fallback.team,
        abbrev,
        wins: live?.wins ?? fallback.wins,
        losses: live?.losses ?? fallback.losses,
        conference: fallback.conf,
        lotteryRank: 0,
        gamesRemaining: 82 - (live?.wins ?? fallback.wins) - (live?.losses ?? fallback.losses),
      };
    });

    // Sort by worst record
    allTeams.sort((a, b) => {
      if (b.losses !== a.losses) return b.losses - a.losses;
      return a.wins - b.wins;
    });

    // Assign lottery rank
    allTeams.forEach((t, idx) => { t.lotteryRank = idx + 1; });

    return NextResponse.json({
      lottery: allTeams,
      teamsFromLive: Object.keys(teamRecords).length,
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
