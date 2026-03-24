"use client";

import { useStandings, getNetsFromStandings } from "@/lib/useStandings";
import Link from "next/link";

export default function DraftWidget() {
  const { lottery, isLive } = useStandings();
  const nets = getNetsFromStandings(lottery);

  if (!nets) return null;

  return (
    <div className="card overflow-hidden">
      <div className="h-1 gradient-bg-brand" />

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[15px]">Draft Position</h3>
          <div className="flex items-center gap-2">
            {isLive && <span className="text-[9px] text-accent-green font-bold">LIVE</span>}
            <span className="tag tag-gold">2026 NBA Draft</span>
          </div>
        </div>

        {/* Big number */}
        <div className="flex items-center gap-4 mb-4">
          <div className="text-center">
            <span className="text-5xl font-black gradient-text-brand leading-none">#{nets.lotteryRank}</span>
            <p className="text-text-muted text-[11px] mt-1">current slot</p>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-2">
            <MiniOdd label="#1 Pick" value={nets.top1Odds} />
            <MiniOdd label="Top 4" value={nets.top4Odds} />
          </div>
        </div>

        {/* Record */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] mb-3">
          <span className="text-text-secondary text-xs font-medium">Season Record</span>
          <span className="font-bold text-sm">{nets.wins}-{nets.losses}</span>
        </div>

        {/* Mini standings */}
        <div className="space-y-1 mb-3">
          {lottery.slice(0, 5).map((team) => (
            <div
              key={team.abbrev}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs ${
                team.abbrev === "BKN"
                  ? "bg-brand-orange/10 border border-brand-orange/20"
                  : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-text-muted w-4 text-right">{team.lotteryRank}</span>
                <span className={team.abbrev === "BKN" ? "font-bold" : "text-text-secondary"}>
                  {team.abbrev}
                </span>
              </div>
              <span className="text-text-muted">{team.wins}-{team.losses}</span>
            </div>
          ))}
        </div>

        <Link
          href="/simulator"
          className="block w-full text-center py-2.5 rounded-xl gradient-bg-brand font-bold text-sm text-white hover:opacity-90 transition-opacity"
        >
          Run Lottery Sim
        </Link>
      </div>
    </div>
  );
}

function MiniOdd({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-2 text-center">
      <p className="text-text-muted text-[10px] uppercase tracking-wider">{label}</p>
      <p className="text-base font-black mt-0.5">{value.toFixed(1)}%</p>
    </div>
  );
}
