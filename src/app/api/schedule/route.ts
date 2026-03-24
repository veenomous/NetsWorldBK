import { NextResponse } from "next/server";

export const revalidate = 1800; // Cache for 30 min

// Nets team ID in the NBA API
const NETS_TEAM_ID = 1610612751;

interface GameData {
  gameId: string;
  date: string;
  time: string;
  homeTeam: { name: string; abbrev: string; wins: number; losses: number };
  awayTeam: { name: string; abbrev: string; wins: number; losses: number };
  isHome: boolean;
  opponent: string;
  opponentAbbrev: string;
  status: string;
}

export async function GET() {
  try {
    // Use NBA's public schedule endpoint
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];

    // Fetch today's scoreboard
    const scoreRes = await fetch(
      `https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json`,
      { next: { revalidate: 300 } } // 5 min cache for live scores
    );

    let todayGame: GameData | null = null;
    let upcomingGames: GameData[] = [];

    if (scoreRes.ok) {
      const scoreData = await scoreRes.json();
      const games = scoreData?.scoreboard?.games || [];

      for (const game of games) {
        const homeId = game.homeTeam?.teamId;
        const awayId = game.awayTeam?.teamId;

        if (homeId === NETS_TEAM_ID || awayId === NETS_TEAM_ID) {
          const isHome = homeId === NETS_TEAM_ID;
          todayGame = {
            gameId: game.gameId,
            date: dateStr,
            time: game.gameTimeUTC || "",
            homeTeam: {
              name: game.homeTeam?.teamName || "",
              abbrev: game.homeTeam?.teamTricode || "",
              wins: game.homeTeam?.wins || 0,
              losses: game.homeTeam?.losses || 0,
            },
            awayTeam: {
              name: game.awayTeam?.teamName || "",
              abbrev: game.awayTeam?.teamTricode || "",
              wins: game.awayTeam?.wins || 0,
              losses: game.awayTeam?.losses || 0,
            },
            isHome,
            opponent: isHome ? game.awayTeam?.teamName : game.homeTeam?.teamName,
            opponentAbbrev: isHome ? game.awayTeam?.teamTricode : game.homeTeam?.teamTricode,
            status: game.gameStatusText || "Scheduled",
          };
        }
      }
    }

    // Also try to get upcoming Nets games from the schedule
    const schedRes = await fetch(
      `https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json`,
      { next: { revalidate: 3600 } }
    );

    if (schedRes.ok) {
      const schedData = await schedRes.json();
      const gameDates = schedData?.leagueSchedule?.gameDates || [];

      for (const gd of gameDates) {
        const gdDate = gd.gameDate?.split("T")[0] || "";
        if (gdDate < dateStr) continue;
        if (upcomingGames.length >= 5) break;

        for (const game of gd.games || []) {
          const homeId = game.homeTeam?.teamId;
          const awayId = game.awayTeam?.teamId;

          if (homeId === NETS_TEAM_ID || awayId === NETS_TEAM_ID) {
            const isHome = homeId === NETS_TEAM_ID;
            upcomingGames.push({
              gameId: game.gameId || "",
              date: gdDate,
              time: game.gameDateTimeUTC || "",
              homeTeam: {
                name: game.homeTeam?.teamName || "",
                abbrev: game.homeTeam?.teamSlug?.toUpperCase().slice(0, 3) || "",
                wins: 0,
                losses: 0,
              },
              awayTeam: {
                name: game.awayTeam?.teamName || "",
                abbrev: game.awayTeam?.teamSlug?.toUpperCase().slice(0, 3) || "",
                wins: 0,
                losses: 0,
              },
              isHome,
              opponent: isHome ? game.awayTeam?.teamName : game.homeTeam?.teamName,
              opponentAbbrev: isHome
                ? game.awayTeam?.teamSlug?.toUpperCase().slice(0, 3) || ""
                : game.homeTeam?.teamSlug?.toUpperCase().slice(0, 3) || "",
              status: "Scheduled",
            });
          }
        }
      }
    }

    return NextResponse.json({
      todayGame,
      upcomingGames,
      lastUpdated: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      todayGame: null,
      upcomingGames: [],
      error: "api_unavailable",
      lastUpdated: new Date().toISOString(),
    });
  }
}
