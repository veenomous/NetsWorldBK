"use client";

import { useState, useEffect, useCallback } from "react";
import { useStandings, getNetsFromStandings } from "@/lib/useStandings";
import TheWire from "@/components/TheWire";
import Link from "next/link";

// ─── Types ───
interface ScoreGame {
  homeTeam: { abbrev: string; score: number };
  awayTeam: { abbrev: string; score: number };
  period: number;
  clock: string;
  status: number;
  statusText: string;
}

interface NextGame {
  opponent: string;
  isHome: boolean;
  dayLabel: string;
}

const TOP5 = new Set(["IND", "WAS", "BKN", "SAC", "UTA"]);

function periodLabel(p: number): string {
  if (p <= 4) return `Q${p}`;
  return `OT${p - 4}`;
}

// ─── Draft Position Card (black, with live scores) ───
function DraftPositionCard() {
  const { lottery, isLoading } = useStandings();
  const nets = getNetsFromStandings(lottery);
  const top5 = lottery.slice(0, 5);

  const [games, setGames] = useState<ScoreGame[]>([]);
  const [nextGames, setNextGames] = useState<Record<string, NextGame>>({});

  const fetchScores = useCallback(async () => {
    try {
      const [scoresRes, nextRes] = await Promise.all([
        fetch("/api/scores"),
        fetch("/api/next-games"),
      ]);
      const scoresData = await scoresRes.json();
      const nextData = await nextRes.json();
      setGames(scoresData.games || []);
      setNextGames(nextData.nextGames || {});
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchScores();
    const interval = setInterval(fetchScores, 60000);
    return () => clearInterval(interval);
  }, [fetchScores]);

  function getGameInfo(abbrev: string): string {
    const game = games.find(
      (g) => g.homeTeam.abbrev === abbrev || g.awayTeam.abbrev === abbrev
    );

    if (game) {
      const isHome = game.homeTeam.abbrev === abbrev;
      const teamScore = isHome ? game.homeTeam.score : game.awayTeam.score;
      const oppAbbrev = isHome ? game.awayTeam.abbrev : game.homeTeam.abbrev;
      const oppScore = isHome ? game.awayTeam.score : game.homeTeam.score;
      const prefix = isHome ? "vs" : "@";

      if (game.status === 3) {
        return `${prefix} ${oppAbbrev} ${teamScore}-${oppScore} FINAL`;
      }
      if (game.status === 2) {
        return `${prefix} ${oppAbbrev} ${teamScore}-${oppScore} ${periodLabel(game.period)}`;
      }
      return `${prefix} ${oppAbbrev} ${game.statusText}`;
    }

    const next = nextGames[abbrev];
    if (next) {
      return `${next.isHome ? "vs" : "@"} ${next.opponent} — ${next.dayLabel}`;
    }

    return "No game today";
  }

  return (
    <div className="bg-black text-white p-6 sm:p-8 h-full">
      <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase font-display mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-brand-red" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
        Draft Position
      </h2>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-white/5 animate-pulse-soft" />)}
        </div>
      ) : (
        <div className="space-y-0">
          {top5.map((team, i) => {
            const isBKN = team.abbrev === "BKN";
            const gameInfo = getGameInfo(team.abbrev);

            return (
              <div key={team.abbrev} className={`py-3.5 ${i > 0 ? "border-t border-white/10" : ""}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-bold ${isBKN ? "text-brand-red" : "text-white"}`}>
                    {i + 1}. {team.team.split(" ").pop()?.toUpperCase()}
                  </p>
                  <span className="text-xs font-bold text-white/60 tabular-nums">{team.wins}-{team.losses}</span>
                </div>
                <p className="text-[10px] tracking-wider text-white/30 mt-0.5">{gameInfo}</p>
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/simulator"
        className="block w-full bg-brand-red text-white py-3.5 font-bold tracking-[0.15em] text-xs uppercase text-center hover:bg-red-700 transition-all mt-5"
      >
        Run Simulation
      </Link>
    </div>
  );
}

// ─── Main Homepage ───
export default function HomeContent() {
  const { lottery, isLoading } = useStandings();
  const nets = getNetsFromStandings(lottery);

  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section className="relative w-full flex flex-col justify-end overflow-hidden border-b-[6px] border-brand-red bg-black" style={{ minHeight: "38vh" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/80 to-black" />
        <div className="relative z-10 px-6 sm:px-8 pb-8 pt-14 max-w-7xl mx-auto w-full">
          <div className="inline-block bg-brand-red px-3 py-1 mb-3">
            <span className="font-display text-white font-black tracking-[0.3em] uppercase text-[9px]">
              {isLoading ? "LOADING" : nets ? `#${nets.lotteryRank} PICK · ${nets.wins}-${nets.losses}` : "FAN HQ"}
            </span>
          </div>
          <h1 className="font-display text-white text-[10vw] sm:text-[7vw] leading-[0.85] font-black italic tracking-tighter uppercase">
            Brooklyn<br />Nets HQ
          </h1>
          <div className="mt-4 border-l-[6px] border-brand-red pl-6">
            <p className="font-display text-white/40 text-sm uppercase tracking-[0.15em]">
              The Wire · Draft Tracker · Lottery Sim · Trade Machine
            </p>
          </div>
        </div>
      </section>

      {/* ═══ BENTO GRID ═══ */}
      <section className="w-full px-3 py-6 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-[2px]">

          {/* The Wire (8 col) */}
          <div className="md:col-span-8 bg-white border border-gray-200 p-6 sm:p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase font-display">The Wire</h2>
              <Link href="/community" className="text-[10px] font-black tracking-[0.15em] uppercase border-b-2 border-brand-red pb-0.5 hover:text-brand-red transition-colors">
                Full Feed
              </Link>
            </div>
            <TheWire limit={8} showForm={false} showHotTake={true} />
          </div>

          {/* Draft Position (4 col) */}
          <div className="md:col-span-4">
            <DraftPositionCard />
          </div>

        </div>
      </section>

      {/* ═══ TOOL CARDS ═══ */}
      <section className="w-full px-3 py-6 sm:px-6 border-t-[4px] border-brand-red">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          <Link href="/gm-mode" className="bg-white border-t-4 border-brand-red p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[9px] font-black tracking-[0.2em] uppercase text-black/30 mb-2">War Room</p>
            <p className="text-xl font-black uppercase font-display">Play GM</p>
            <p className="text-[10px] font-bold text-brand-red uppercase mt-1 tracking-wider">Draft · Trade · Strategy</p>
          </Link>
          <Link href="/trade-machine" className="bg-white border-t-4 border-accent-blue p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[9px] font-black tracking-[0.2em] uppercase text-black/30 mb-2">Trade Machine</p>
            <p className="text-xl font-black uppercase font-display text-accent-blue">Build Trades</p>
            <p className="text-[10px] font-bold text-black/30 uppercase mt-1 tracking-wider">Salary Match · Fan Vote</p>
          </Link>
          <Link href="/tiebreaker" className="bg-white border-t-4 border-brand-orange p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[9px] font-black tracking-[0.2em] uppercase text-black/30 mb-2">Tiebreaker</p>
            <p className="text-xl font-black uppercase font-display text-brand-orange">Scenarios</p>
            <p className="text-[10px] font-bold text-black/30 uppercase mt-1 tracking-wider">Position · Odds · What-If</p>
          </Link>
          <Link href="/simulator" className="bg-accent-blue p-5 flex flex-col justify-between">
            <p className="text-[9px] font-black tracking-[0.2em] uppercase text-white/40 mb-2">Lottery Sim</p>
            <p className="text-white text-base font-bold leading-tight uppercase italic font-display">&quot;Run the lottery. See where Brooklyn lands.&quot;</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
