"use client";

import { useState, useEffect, useCallback } from "react";

interface TeamScore {
  abbrev: string;
  name: string;
  score: number;
  wins: number;
  losses: number;
}

interface LiveGame {
  gameId: string;
  homeTeam: TeamScore;
  awayTeam: TeamScore;
  period: number;
  clock: string;
  status: number;
  statusText: string;
  isLotteryGame: boolean;
  lotteryTeams: string[];
}

const LOTTERY_TOP5 = ["IND", "WAS", "BKN", "SAC", "UTA"];

function isTop5(abbrev: string) {
  return LOTTERY_TOP5.includes(abbrev);
}

function periodLabel(period: number): string {
  if (period <= 4) return `Q${period}`;
  return `OT${period - 4}`;
}

export default function LiveScoreboard() {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [lotteryGames, setLotteryGames] = useState<LiveGame[]>([]);
  const [hasLive, setHasLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch("/api/scores");
      const data = await res.json();
      setGames(data.games || []);
      setLotteryGames(data.lotteryGames || []);
      setHasLive(data.hasLiveGames || false);
      setLastUpdated(data.lastUpdated || "");
    } catch {
      // Silently fail — keep last data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScores();

    // Poll every 30 seconds if games are live, otherwise every 5 minutes
    const interval = setInterval(() => {
      fetchScores();
    }, hasLive ? 30000 : 300000);

    return () => clearInterval(interval);
  }, [fetchScores, hasLive]);

  const timeAgo = lastUpdated
    ? `${Math.round((Date.now() - new Date(lastUpdated).getTime()) / 1000)}s ago`
    : "";

  // Separate into: Nets game, other lottery games, all other games
  const netsGame = lotteryGames.find(
    (g) => g.homeTeam.abbrev === "BKN" || g.awayTeam.abbrev === "BKN"
  );
  const otherLotteryGames = lotteryGames.filter(
    (g) => g.homeTeam.abbrev !== "BKN" && g.awayTeam.abbrev !== "BKN"
  );
  const nonLotteryGames = games.filter((g) => !g.isLotteryGame);

  if (loading) {
    return (
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[15px]">Live Scoreboard</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-white/[0.02] animate-pulse-soft" />
          ))}
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[15px]">Live Scoreboard</h3>
          <span className="tag tag-blue">No games today</span>
        </div>
        <p className="text-text-muted text-xs">Check back on game day for live scores and lottery impact tracking.</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[15px]">Live Scoreboard</h3>
          <p className="text-text-muted text-[11px] mt-0.5">
            {lotteryGames.length} lottery team{lotteryGames.length !== 1 ? "s" : ""} playing
            {hasLive && <span className="text-accent-green ml-1">· Updating live</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasLive && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-red/10">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-red animate-pulse-soft" />
              <span className="text-[10px] font-bold text-accent-red">LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Nets game — highlighted */}
      {netsGame && (
        <div className="mb-3">
          <p className="text-[10px] text-brand-orange font-bold uppercase tracking-wider mb-1.5">Nets Game</p>
          <GameCard game={netsGame} isNets />
        </div>
      )}

      {/* Other lottery team games */}
      {otherLotteryGames.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-accent-gold font-bold uppercase tracking-wider mb-1.5">
            Lottery Impact Games
          </p>
          <div className="space-y-1.5">
            {otherLotteryGames.map((g) => (
              <GameCard key={g.gameId} game={g} />
            ))}
          </div>
        </div>
      )}

      {/* Other games (collapsed) */}
      {nonLotteryGames.length > 0 && (
        <details className="mt-3">
          <summary className="text-[11px] text-text-muted cursor-pointer hover:text-text-secondary transition-colors">
            {nonLotteryGames.length} other games
          </summary>
          <div className="space-y-1.5 mt-2">
            {nonLotteryGames.map((g) => (
              <GameCard key={g.gameId} game={g} compact />
            ))}
          </div>
        </details>
      )}

      {/* Last updated */}
      {lastUpdated && (
        <p className="text-[10px] text-text-muted mt-3 text-right">
          Updated {timeAgo}
        </p>
      )}
    </div>
  );
}

function GameCard({ game, isNets = false, compact = false }: { game: LiveGame; isNets?: boolean; compact?: boolean }) {
  const isLive = game.status === 2;
  const isFinal = game.status === 3;
  const homeWinning = game.homeTeam.score > game.awayTeam.score;
  const awayWinning = game.awayTeam.score > game.homeTeam.score;

  return (
    <div
      className={`rounded-xl p-3 transition-colors ${
        isNets
          ? "bg-brand-orange/8 border border-brand-orange/20"
          : "bg-white/[0.02] hover:bg-white/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Away team */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-[13px] font-bold ${
              isTop5(game.awayTeam.abbrev) ? "text-accent-gold" :
              game.awayTeam.abbrev === "BKN" ? "text-brand-orange" : ""
            }`}>
              {game.awayTeam.abbrev}
            </span>
            {isTop5(game.awayTeam.abbrev) && <span className="text-[9px] text-accent-gold">LOTTERY</span>}
            {!compact && (
              <span className="text-[10px] text-text-muted">
                {game.awayTeam.wins}-{game.awayTeam.losses}
              </span>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-3 mx-4">
          <span className={`text-lg font-black tabular-nums ${
            awayWinning && (isLive || isFinal) ? "text-white" : "text-text-secondary"
          }`}>
            {game.status === 1 ? "-" : game.awayTeam.score}
          </span>

          <div className="flex flex-col items-center min-w-[48px]">
            {isLive ? (
              <>
                <span className="text-[10px] font-bold text-accent-red">
                  {periodLabel(game.period)} {game.clock}
                </span>
              </>
            ) : isFinal ? (
              <span className="text-[10px] font-bold text-text-muted">FINAL</span>
            ) : (
              <span className="text-[10px] text-text-muted">{game.statusText}</span>
            )}
          </div>

          <span className={`text-lg font-black tabular-nums ${
            homeWinning && (isLive || isFinal) ? "text-white" : "text-text-secondary"
          }`}>
            {game.status === 1 ? "-" : game.homeTeam.score}
          </span>
        </div>

        {/* Home team */}
        <div className="flex-1 text-right">
          <div className="flex items-center justify-end gap-2">
            {!compact && (
              <span className="text-[10px] text-text-muted">
                {game.homeTeam.wins}-{game.homeTeam.losses}
              </span>
            )}
            {isTop5(game.homeTeam.abbrev) && <span className="text-[9px] text-accent-gold">LOTTERY</span>}
            <span className={`text-[13px] font-bold ${
              isTop5(game.homeTeam.abbrev) ? "text-accent-gold" :
              game.homeTeam.abbrev === "BKN" ? "text-brand-orange" : ""
            }`}>
              {game.homeTeam.abbrev}
            </span>
          </div>
        </div>
      </div>

      {/* Tank impact note for lottery games */}
      {!compact && game.isLotteryGame && (isLive || isFinal) && (
        <TankImpact game={game} />
      )}
    </div>
  );
}

function TankImpact({ game }: { game: LiveGame }) {
  const lotteryTeam = game.lotteryTeams[0];
  const isHome = game.homeTeam.abbrev === lotteryTeam;
  const lotteryScore = isHome ? game.homeTeam.score : game.awayTeam.score;
  const opponentScore = isHome ? game.awayTeam.score : game.homeTeam.score;
  const isWinning = lotteryScore > opponentScore;
  const isBKN = lotteryTeam === "BKN";

  // For tank purposes: lottery team losing = good for their pick
  const isFinal = game.status === 3;
  const verb = isFinal ? (isWinning ? "won" : "lost") : (isWinning ? "winning" : "losing");

  let impact = "";
  if (isBKN) {
    impact = isWinning ? "Bad for the tank" : "Good for the tank";
  } else {
    // Other lottery team losing helps them stay ahead of Nets (or behind)
    const isAboveNets = LOTTERY_TOP5.indexOf(lotteryTeam) < LOTTERY_TOP5.indexOf("BKN");
    if (isAboveNets) {
      impact = isWinning ? "Could help Nets move up" : "Keeps them ahead of BKN";
    } else {
      impact = isWinning ? "Could catch BKN" : "Falling further behind";
    }
  }

  return (
    <div className={`mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] ${
      (isBKN && !isWinning) || (!isBKN && isWinning) ? "text-accent-green" : "text-accent-red"
    }`}>
      <span>{lotteryTeam} {verb}</span>
      <span className="font-bold">{impact}</span>
    </div>
  );
}

const LOTTERY_TOP5_SET = new Set(LOTTERY_TOP5);
