"use client";

import { lotteryTeams, lotteryOdds } from "@/data/standings";

// Full pick odds for each slot (picks 1-4 from lottery, 5+ by record)
// Source: Tankathon pick_odds page
const fullOdds: Record<number, number[]> = {
  // [pick1%, pick2%, pick3%, pick4%, pick5%...] — only showing meaningful %
  1:  [14.0, 13.4, 12.7, 12.0, 47.9],
  2:  [14.0, 13.4, 12.7, 12.0, 27.8, 20.0],
  3:  [14.0, 13.4, 12.7, 12.0, 14.8, 26.0, 7.0],
  4:  [12.5, 12.2, 11.9, 11.5, 7.2, 25.7, 16.7],
  5:  [10.5, 10.5, 10.6, 10.5, 2.2, 19.6, 26.7, 8.7],
  6:  [9.0, 9.2, 9.4, 9.6, 0, 8.6, 29.8, 20.5],
  7:  [7.5, 7.8, 8.1, 8.5, 0, 0, 19.7, 34.1, 12.9],
  8:  [6.0, 6.3, 6.7, 7.2, 0, 0, 0, 34.5, 32.1, 6.7],
};

export default function LotteryOddsTable() {
  const top8 = lotteryTeams.slice(0, 8);

  return (
    <div className="card p-5 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[15px]">Lottery Odds</h3>
          <p className="text-text-muted text-xs mt-0.5">Top 8 teams — chance at each pick</p>
        </div>
        <span className="tag tag-gold">2026 Draft</span>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="text-left py-2 pr-3 text-text-muted font-semibold">#</th>
            <th className="text-left py-2 pr-3 text-text-muted font-semibold">Team</th>
            <th className="text-left py-2 pr-2 text-text-muted font-semibold">Record</th>
            {[1,2,3,4,5,6,7,8].map(pick => (
              <th key={pick} className="text-center py-2 px-1.5 text-text-muted font-semibold min-w-[44px]">
                Pick {pick}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {top8.map((team, idx) => {
            const slot = idx + 1;
            const odds = fullOdds[slot] || [];
            const isNets = team.abbrev === "BKN";

            return (
              <tr
                key={team.abbrev}
                className={`border-b border-white/[0.03] ${
                  isNets ? "bg-brand-orange/8" : "hover:bg-white/[0.02]"
                }`}
              >
                <td className="py-2.5 pr-3 text-text-muted">{slot}</td>
                <td className={`py-2.5 pr-3 font-semibold ${isNets ? "text-brand-orange" : ""}`}>
                  {team.abbrev}
                </td>
                <td className="py-2.5 pr-2 text-text-muted">
                  {team.wins}-{team.losses}
                </td>
                {[0,1,2,3,4,5,6,7].map(pickIdx => {
                  const val = odds[pickIdx];
                  if (!val || val === 0) {
                    return <td key={pickIdx} className="text-center py-2.5 px-1.5 text-text-muted/30">—</td>;
                  }
                  // Color intensity based on value
                  const isHigh = val >= 20;
                  const isMed = val >= 10;
                  const isTop4 = pickIdx < 4;

                  return (
                    <td
                      key={pickIdx}
                      className={`text-center py-2.5 px-1.5 font-bold ${
                        isHigh && isTop4 ? "text-accent-gold" :
                        isMed && isTop4 ? "text-accent-green" :
                        isTop4 ? "text-text-secondary" :
                        isHigh ? "text-text-secondary" :
                        "text-text-muted"
                      }`}
                    >
                      {val.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Nets summary */}
      <div className="mt-3 pt-3 border-t border-white/[0.04] flex flex-wrap items-center gap-3">
        <span className="text-[11px] text-text-muted">Nets odds:</span>
        <span className="tag tag-gold">#1 — 14.0%</span>
        <span className="tag tag-green">Top 4 — 52.1%</span>
        <span className="tag tag-blue">Most likely — #5 or #6</span>
      </div>
    </div>
  );
}
