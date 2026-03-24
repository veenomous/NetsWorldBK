import { NextResponse } from "next/server";

// Lottery team abbreviations (top 14 by worst record)
const LOTTERY_TEAMS = ["IND", "WAS", "BKN", "SAC", "UTA", "DAL", "MEM", "NOP", "CHI", "MIL", "GSW", "POR", "CHA", "MIA"];
const TOP_5_TEAMS = LOTTERY_TEAMS.slice(0, 5);

export const dynamic = "force-dynamic"; // Never cache — always fresh scores

export interface LiveGame {
  gameId: string;
  homeTeam: { abbrev: string; name: string; score: number; wins: number; losses: number };
  awayTeam: { abbrev: string; name: string; score: number; wins: number; losses: number };
  period: number;
  clock: string;
  status: number; // 1=scheduled, 2=in progress, 3=final
  statusText: string;
  isLotteryGame: boolean;
  lotteryTeams: string[];
}

export interface ScoreboardResponse {
  games: LiveGame[];
  lotteryGames: LiveGame[];
  hasLiveGames: boolean;
  lastUpdated: string;
}

function formatClock(raw: string): string {
  // Convert "PT03M38.00S" to "3:38"
  if (!raw) return "";
  const match = raw.match(/PT(\d+)M([\d.]+)S/);
  if (!match) return raw;
  const min = parseInt(match[1]);
  const sec = Math.floor(parseFloat(match[2]));
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export async function GET() {
  try {
    const res = await fetch(
      "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json",
      { cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json({ games: [], lotteryGames: [], hasLiveGames: false, lastUpdated: new Date().toISOString(), error: "nba_api_down" });
    }

    const data = await res.json();
    const rawGames = data?.scoreboard?.games || [];

    const games: LiveGame[] = rawGames.map((g: any) => {
      const homeAbbrev = g.homeTeam?.teamTricode || "";
      const awayAbbrev = g.awayTeam?.teamTricode || "";
      const involvedLotteryTeams = [
        ...(LOTTERY_TEAMS.includes(homeAbbrev) ? [homeAbbrev] : []),
        ...(LOTTERY_TEAMS.includes(awayAbbrev) ? [awayAbbrev] : []),
      ];

      return {
        gameId: g.gameId || "",
        homeTeam: {
          abbrev: homeAbbrev,
          name: g.homeTeam?.teamName || "",
          score: g.homeTeam?.score || 0,
          wins: g.homeTeam?.wins || 0,
          losses: g.homeTeam?.losses || 0,
        },
        awayTeam: {
          abbrev: awayAbbrev,
          name: g.awayTeam?.teamName || "",
          score: g.awayTeam?.score || 0,
          wins: g.awayTeam?.wins || 0,
          losses: g.awayTeam?.losses || 0,
        },
        period: g.period || 0,
        clock: formatClock(g.gameClock || ""),
        status: g.gameStatus || 1,
        statusText: g.gameStatusText || "",
        isLotteryGame: involvedLotteryTeams.length > 0,
        lotteryTeams: involvedLotteryTeams,
      };
    });

    const lotteryGames = games.filter(g => g.isLotteryGame);
    const hasLiveGames = games.some(g => g.status === 2);

    return NextResponse.json({
      games,
      lotteryGames,
      hasLiveGames,
      lastUpdated: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      games: [],
      lotteryGames: [],
      hasLiveGames: false,
      lastUpdated: new Date().toISOString(),
      error: "fetch_failed",
    });
  }
}
