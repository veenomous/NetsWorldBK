"use client";

import { useStandings, getNetsFromStandings } from "@/lib/useStandings";
import Link from "next/link";

export default function DraftWidget() {
  const { lottery, isLive } = useStandings();
  const nets = getNetsFromStandings(lottery);

  if (!nets) return null;

  return (
    <div className="card overflow-hidden">
      <div className="h-[2px] gradient-bg-brand" />

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="heading-md">Draft Position</h3>
          <div className="flex items-center gap-2">
            {isLive && <span className="text-[10px] text-accent-green font-bold">LIVE</span>}
            <span className="tag tag-gold">2026</span>
          </div>
        </div>

        {/* Pick + odds row — horizontal on mobile */}
        <div className="flex items-center gap-4 mb-3">
          <span className="font-display text-5xl sm:text-6xl gradient-text-brand leading-none tracking-wider">#{nets.lotteryRank}</span>
          <div className="flex-1 flex gap-2">
            <div className="flex-1 bg-white/[0.04] rounded-lg p-2 text-center">
              <p className="text-text-muted text-[10px] uppercase">#1 Pick</p>
              <p className="text-base sm:text-lg font-black">{nets.top1Odds.toFixed(1)}%</p>
            </div>
            <div className="flex-1 bg-white/[0.04] rounded-lg p-2 text-center">
              <p className="text-text-muted text-[10px] uppercase">Top 4</p>
              <p className="text-base sm:text-lg font-black">{nets.top4Odds.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Record */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.04] mb-2">
          <span className="text-text-secondary text-sm">Record</span>
          <span className="font-bold text-base">{nets.wins}-{nets.losses}</span>
        </div>

        {/* Mini standings — compact */}
        <div className="space-y-0.5 mb-3">
          {lottery.slice(0, 5).map((team) => (
            <div
              key={team.abbrev}
              className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-sm ${
                team.abbrev === "BKN"
                  ? "bg-brand-orange/10 border border-brand-orange/20"
                  : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-text-muted w-4 text-right text-xs">{team.lotteryRank}</span>
                <span className={team.abbrev === "BKN" ? "font-bold" : "text-text-secondary"}>
                  {team.abbrev}
                </span>
              </div>
              <span className="text-text-data text-sm font-medium">{team.wins}-{team.losses}</span>
            </div>
          ))}
        </div>

        <Link
          href="/simulator"
          className="block w-full text-center py-3 rounded-xl gradient-bg-brand font-bold text-sm text-white hover:opacity-90 transition-opacity"
        >
          Run Lottery Sim
        </Link>
      </div>
    </div>
  );
}
