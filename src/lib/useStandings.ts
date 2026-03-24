"use client";

import { useState, useEffect } from "react";
import { lotteryTeams, lotteryOdds, type TeamStanding } from "@/data/standings";

export interface LiveTeam {
  team: string;
  abbrev: string;
  wins: number;
  losses: number;
  conference: string;
  lotteryRank: number;
  gamesRemaining: number;
}

export interface StandingsData {
  lottery: LiveTeam[];
  isLive: boolean;
}

// Merge static data with live lottery rank
function staticFallback(): LiveTeam[] {
  return lotteryTeams.map((t, idx) => ({
    team: t.team,
    abbrev: t.abbrev,
    wins: t.wins,
    losses: t.losses,
    conference: t.conference,
    lotteryRank: idx + 1,
    gamesRemaining: t.gamesRemaining,
  }));
}

export function useStandings(): StandingsData {
  const [data, setData] = useState<StandingsData>({
    lottery: staticFallback(),
    isLive: false,
  });

  useEffect(() => {
    async function fetchStandings() {
      try {
        const res = await fetch("/api/standings");
        const json = await res.json();
        if (json.lottery && json.lottery.length > 0) {
          setData({ lottery: json.lottery, isLive: true });
        }
      } catch {
        // Keep static fallback
      }
    }
    fetchStandings();
  }, []);

  return data;
}

// Get Nets data from live standings
export function getNetsFromStandings(lottery: LiveTeam[]) {
  const nets = lottery.find((t) => t.abbrev === "BKN");
  if (!nets) return null;
  const odds = lotteryOdds[nets.lotteryRank] || lotteryOdds[3];
  return {
    ...nets,
    top1Odds: odds[0],
    top2Odds: odds[0] + odds[1],
    top3Odds: odds[0] + odds[1] + odds[2],
    top4Odds: odds[0] + odds[1] + odds[2] + odds[3],
  };
}
