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

interface TeamRow {
  rank: number;
  abbrev: string;
  record: string;
  game: LiveGame | null;
  isHome: boolean;
  opponent: string;
  opponentScore: number;
  teamScore: number;
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

export default function LotteryRace() {
  const { lottery } = useStandings();
  const top5 = lottery.slice(0, 5);

  const [rows, setRows] = useState<TeamRow[]>([]);
  const [hasLive, setHasLive] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/scores");
      const data = await res.json();
      const games: LiveGame[] = data.games || [];

      const built: TeamRow[] = top5.map((team) => {
        const game = games.find(
          (g: LiveGame) => g.homeTeam.abbrev === team.abbrev || g.awayTeam.abbrev === team.abbrev
        ) || null;

        const isHome = game?.homeTeam.abbrev === team.abbrev;
        const opponent = game ? (isHome ? game.awayTeam.abbrev : game.homeTeam.abbrev) : "";
        const teamScore = game ? (isHome ? game.homeTeam.score : game.awayTeam.score) : 0;
        const opponentScore = game ? (isHome ? game.awayTeam.score : game.homeTeam.score) : 0;

        return {
          rank: team.lotteryRank,
          abbrev: team.abbrev,
          record: `${team.wins}-${team.losses}`,
          game,
          isHome: !!isHome,
          opponent,
          teamScore,
          opponentScore,
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
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-[15px]">Lottery Race</h3>
          <p className="text-text-muted text-[11px] mt-0.5">Top 5 picks — live scores</p>
        </div>
        {hasLive && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-red/10">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse-soft" />
            <span className="text-[10px] font-bold text-accent-red">LIVE</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {loading
          ? [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-11 rounded-lg bg-white/[0.02] animate-pulse-soft" />
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
                  className={`flex items-center px-3 py-2 rounded-lg text-[13px] ${
                    isNets
                      ? "bg-brand-orange/8 border border-brand-orange/20"
                      : "bg-white/[0.02]"
                  }`}
                >
                  {/* Rank + Team */}
                  <span className="text-text-muted text-xs w-5">{row.rank}</span>
                  <span className={`font-bold w-10 ${isNets ? "text-brand-orange" : ""}`}>
                    {row.abbrev}
                  </span>
                  <span className="text-text-muted text-[11px] w-12">{row.record}</span>

                  {/* Game info — right side */}
                  <div className="ml-auto flex items-center gap-2">
                    {noGame ? (
                      <span className="text-text-muted text-[11px]">No game today</span>
                    ) : isScheduled ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-text-muted text-[11px]">{row.game!.statusText}</span>
                        <span className="text-text-secondary text-[11px]">
                          {row.isHome ? "vs" : "@"} {row.opponent}
                        </span>
                      </div>
                    ) : (
                      <>
                        {isLive && (
                          <span className="text-accent-red text-[10px] font-bold w-14 text-right">
                            {periodLabel(row.game!.period)} {formatClock(row.game!.clock)}
                          </span>
                        )}
                        {isFinal && (
                          <span className="text-text-muted text-[10px] font-bold w-14 text-right">
                            FINAL
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 min-w-[90px] justify-end">
                          <span className={`font-bold tabular-nums ${
                            row.teamScore > row.opponentScore ? "text-white" : "text-text-muted"
                          }`}>
                            {row.teamScore}
                          </span>
                          <span className="text-text-muted text-[10px]">-</span>
                          <span className={`font-bold tabular-nums ${
                            row.opponentScore > row.teamScore ? "text-white" : "text-text-muted"
                          }`}>
                            {row.opponentScore}
                          </span>
                          <span className="text-text-muted text-[11px] w-8 text-right">
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
