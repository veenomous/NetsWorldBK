import { NextResponse } from "next/server";

export const revalidate = 3600; // Cache 1 hour

// NBA team IDs
const TEAM_IDS: Record<string, number> = {
  IND: 1610612754, WAS: 1610612764, BKN: 1610612751,
  SAC: 1610612758, UTA: 1610612762, DAL: 1610612742,
  MEM: 1610612763, NOP: 1610612740, CHI: 1610612741,
  MIL: 1610612749, GSW: 1610612744, POR: 1610612757,
  CHA: 1610612766, MIA: 1610612748,
};

const TEAM_ABBREVS: Record<number, string> = {};
for (const [abbrev, id] of Object.entries(TEAM_IDS)) {
  TEAM_ABBREVS[id] = abbrev;
}

interface NextGame {
  opponent: string;
  isHome: boolean;
  date: string;
  dayLabel: string;
}

function getDayLabel(dateStr: string): string {
  // dateStr is "YYYY-MM-DD"
  const d = new Date(dateStr + "T12:00:00Z");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tmrw";
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export async function GET() {
  try {
    const res = await fetch(
      "https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json",
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) throw new Error("Schedule unavailable");

    const data = await res.json();
    const gameDates = data?.leagueSchedule?.gameDates || [];
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const nextGames: Record<string, NextGame> = {};
    const teamIds = new Set(Object.values(TEAM_IDS));

    function parseNBADate(raw: string): string {
      // Format: "MM/DD/YYYY HH:MM:SS" → "YYYY-MM-DD"
      const parts = raw.split(" ")[0].split("/");
      if (parts.length === 3) {
        return `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
      }
      // Fallback: try ISO
      return raw.split("T")[0];
    }

    for (const gd of gameDates) {
      const gdDate = parseNBADate(gd.gameDate || "");
      if (gdDate < todayStr) continue;

      for (const game of gd.games || []) {
        const homeId = game.homeTeam?.teamId;
        const awayId = game.awayTeam?.teamId;

        // Check if either team is a lottery team we haven't found yet
        for (const [checkId, opponentId, isHome] of [
          [homeId, awayId, true],
          [awayId, homeId, false],
        ] as [number, number, boolean][]) {
          if (teamIds.has(checkId)) {
            const abbrev = TEAM_ABBREVS[checkId];
            if (!nextGames[abbrev]) {
              const opponentTeam = isHome ? game.awayTeam : game.homeTeam;
              const opponentAbbrev = TEAM_ABBREVS[opponentId] ||
                opponentTeam?.teamTricode ||
                "???";
              nextGames[abbrev] = {
                opponent: opponentAbbrev,
                isHome: isHome as boolean,
                date: gdDate,
                dayLabel: getDayLabel(gdDate),
              };
            }
          }
        }
      }

      // Stop once we have all teams
      if (Object.keys(nextGames).length >= Object.keys(TEAM_IDS).length) break;
    }

    return NextResponse.json({ nextGames, lastUpdated: new Date().toISOString() });
  } catch {
    return NextResponse.json({ nextGames: {}, error: "unavailable" });
  }
}
