"use client";

import { useState, useEffect, useCallback } from "react";
import { useStandings, type LiveTeam } from "@/lib/useStandings";

interface TeamScore {
  abbrev: string;
  name: string;
  score: number;
  wins: number;
  losses: number;
}

interface LiveGame {
  homeTeam: TeamScore;
  awayTeam: TeamScore;
  period: number;
  clock: string;
  status: number;
  statusText: string;
}

interface ScheduleGame {
  opponent: string;
  opponentAbbrev: string;
  date: string;
  isHome: boolean;
}

interface TeamRow {
  rank: number;
  abbrev: string;
  record: string;
  game: LiveGame | null;
  isHome: boolean;
  opponent: string;
  opponentScore: number;
  teamScore: number;
  nextGame: string; // e.g. "vs CHI — Tue"
}

function periodLabel(p: number): string {
  if (p <= 4) return `Q${p}`;
  return `OT${p - 4}`;
}

function formatClock(raw: string): string {
  if (!raw) return "";
  const m = raw.match(/PT(\d+)M([\d.]+)S/);
  if (!m) return raw;
  return `${parseInt(m[1])}:${Math.floor(parseFloat(m[2])).toString().padStart(2, "0")}`;
}

function shortDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tmrw";
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export default function LotteryRace() {
  const { lottery, isLoading: standingsLoading } = useStandings();
  const top5 = lottery.slice(0, 5);

  const [rows, setRows] = useState<TeamRow[]>([]);
  const [hasLive, setHasLive] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [scoresRes, nextRes] = await Promise.all([
        fetch("/api/scores"),
        fetch("/api/next-games"),
      ]);
      const scoresData = await scoresRes.json();
      const nextData = await nextRes.json();
      const games: LiveGame[] = scoresData.games || [];
      const nextGames: Record<string, { opponent: string; isHome: boolean; dayLabel: string }> = nextData.nextGames || {};

      const built: TeamRow[] = top5.map((team) => {
        const game = games.find(
          (g: LiveGame) => g.homeTeam.abbrev === team.abbrev || g.awayTeam.abbrev === team.abbrev
        ) || null;

        const isHome = game?.homeTeam.abbrev === team.abbrev;
        const opponent = game ? (isHome ? game.awayTeam.abbrev : game.homeTeam.abbrev) : "";
        const teamScore = game ? (isHome ? game.homeTeam.score : game.awayTeam.score) : 0;
        const opponentScore = game ? (isHome ? game.awayTeam.score : game.homeTeam.score) : 0;

        let nextGame = "";
        if (!game) {
          const ng = nextGames[team.abbrev];
          if (ng) {
            nextGame = `${ng.isHome ? "vs" : "@"} ${ng.opponent} — ${ng.dayLabel}`;
          }
        }

        return {
          rank: team.lotteryRank,
          abbrev: team.abbrev,
          record: `${team.wins}-${team.losses}`,
          game,
          isHome: !!isHome,
          opponent,
          teamScore,
          opponentScore,
          nextGame,
        };
      });

      setRows(built);
      setHasLive(games.some((g: LiveGame) => g.status === 2));
    } catch {
      // Keep stale data
    } finally {
      setLoading(false);
    }
  }, [top5]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, hasLive ? 30000 : 300000);
    return () => clearInterval(interval);
  }, [fetchData, hasLive]);

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="heading-md">Lottery Race</h3>
        {hasLive && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-red/10">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse-soft" />
            <span className="text-[10px] font-bold text-accent-red">LIVE</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {(loading || standingsLoading)
          ? [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-white/[0.02] animate-pulse-soft" />
            ))
          : rows.map((row) => {
              const isNets = row.abbrev === "BKN";
              const isLive = row.game?.status === 2;
              const isFinal = row.game?.status === 3;
              const isScheduled = row.game?.status === 1;
              const noGame = !row.game;

              return (
                <div
                  key={row.abbrev}
                  className={`flex items-center px-2.5 py-2 rounded-lg text-sm ${
                    isNets
                      ? "bg-brand-orange/8 border border-brand-orange/20"
                      : "bg-white/[0.02]"
                  }`}
                >
                  <span className="text-text-muted text-xs w-5">{row.rank}</span>
                  <span className={`font-bold w-10 ${isNets ? "text-brand-orange" : ""}`}>
                    {row.abbrev}
                  </span>
                  <span className="text-text-data text-xs w-12">{row.record}</span>

                  <div className="ml-auto flex items-center gap-2">
                    {noGame ? (
                      <span className="text-text-muted text-xs">
                        {row.nextGame ? `Next: ${row.nextGame}` : "Off today"}
                      </span>
                    ) : isScheduled ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-text-muted text-xs">{row.game!.statusText}</span>
                        <span className="text-text-secondary text-xs">
                          {row.isHome ? "vs" : "@"} {row.opponent}
                        </span>
                      </div>
                    ) : (
                      <>
                        {isLive && (
                          <span className="text-accent-red text-[11px] font-bold">
                            {periodLabel(row.game!.period)} {formatClock(row.game!.clock)}
                          </span>
                        )}
                        {isFinal && (
                          <span className="text-text-muted text-[11px] font-bold">FINAL</span>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold tabular-nums ${
                            row.teamScore > row.opponentScore ? "text-white" : "text-text-muted"
                          }`}>
                            {row.teamScore}
                          </span>
                          <span className="text-text-muted text-xs">-</span>
                          <span className={`font-bold tabular-nums ${
                            row.opponentScore > row.teamScore ? "text-white" : "text-text-muted"
                          }`}>
                            {row.opponentScore}
                          </span>
                          <span className="text-text-muted text-xs">
                            {row.isHome ? "vs" : "@"} {row.opponent}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
