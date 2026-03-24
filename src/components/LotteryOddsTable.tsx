"use client";

import { useStandings, getNetsFromStandings } from "@/lib/useStandings";

const fullOdds: Record<number, number[]> = {
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
  const { lottery, isLive } = useStandings();
  const top8 = lottery.slice(0, 8);
  const nets = getNetsFromStandings(lottery);

  return (
    <div className="card p-5 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[15px]">Lottery Odds</h3>
          <p className="text-text-muted text-xs mt-0.5">
            Top 8 teams — chance at each pick
            {isLive && <span className="text-accent-green ml-1">· Live standings</span>}
          </p>
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
          {top8.map((team) => {
            const slot = team.lotteryRank;
            const odds = fullOdds[slot] || [];
            const isNets = team.abbrev === "BKN";

            return (
              <tr
                key={team.abbrev}
                className={`border-b border-white/[0.03] ${
                  isNets ? "bg-brand-orange/8" : "hover:bg-white/[0.02]"
                }`}
              >
                <td className="py-2.5 pr-3 text-text-secondary">{slot}</td>
                <td className={`py-2.5 pr-3 font-bold ${isNets ? "text-brand-orange" : "text-text-primary"}`}>
                  {team.abbrev}
                </td>
                <td className="py-2.5 pr-2 text-text-data font-medium">
                  {team.wins}-{team.losses}
                </td>
                {[0,1,2,3,4,5,6,7].map(pickIdx => {
                  const val = odds[pickIdx];
                  if (!val || val === 0) {
                    return <td key={pickIdx} className="text-center py-2.5 px-1.5 text-text-muted/30">—</td>;
                  }
                  const isHigh = val >= 20;
                  const isMed = val >= 10;
                  const isTop4 = pickIdx < 4;

                  return (
                    <td
                      key={pickIdx}
                      className={`text-center py-2.5 px-1.5 font-bold ${
                        isHigh && isTop4 ? "text-accent-gold" :
                        isMed && isTop4 ? "text-accent-green" :
                        isTop4 ? "text-text-data" :
                        isHigh ? "text-text-data" :
                        "text-text-secondary"
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

      {nets && (
        <div className="mt-3 pt-3 border-t border-white/[0.04] flex flex-wrap items-center gap-3">
          <span className="text-[11px] text-text-muted">Nets odds:</span>
          <span className="tag tag-gold">#1 — {nets.top1Odds.toFixed(1)}%</span>
          <span className="tag tag-green">Top 4 — {nets.top4Odds.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
