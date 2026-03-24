import { NextResponse } from "next/server";

// Fetch live NBA standings from the public NBA CDN
// Falls back to our static data if the API is down
export const revalidate = 3600; // Cache for 1 hour

interface NBATeam {
  teamId: number;
  teamCity: string;
  teamName: string;
  teamAbbreviation: string;
  conference: string;
  wins: number;
  losses: number;
}

export async function GET() {
  try {
    // NBA's public scoreboard/standings endpoint
    const res = await fetch(
      "https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json",
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      // Try alternate endpoint
      const altRes = await fetch(
        "https://stats.nba.com/stats/leaguestandingsv3?LeagueID=00&Season=2025-26&SeasonType=Regular+Season",
        {
          headers: {
            "User-Agent": "Mozilla/5.0",
            Referer: "https://www.nba.com/",
          },
          next: { revalidate: 3600 },
        }
      );

      if (!altRes.ok) throw new Error("Both NBA API endpoints failed");
      const altData = await altRes.json();
      return NextResponse.json(altData);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // Return signal to use static data
    return NextResponse.json({ error: "api_unavailable", useStatic: true }, { status: 200 });
  }
}
