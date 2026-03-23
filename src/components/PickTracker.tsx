"use client";

import { getNetsData, lotteryTeams, netsScenarios } from "@/data/standings";

export default function PickTracker() {
  const nets = getNetsData();

  return (
    <section className="space-y-6">
      {/* Hero Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 animate-pulse-glow">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <p className="text-nets-silver text-sm uppercase tracking-widest mb-1">If the season ended today</p>
            <div className="flex items-baseline gap-2">
              <span className="text-7xl sm:text-8xl font-black gradient-text-accent">#{nets.currentPick}</span>
              <span className="text-2xl text-nets-silver font-light">overall pick</span>
            </div>
            <p className="text-nets-silver mt-2">
              {nets.wins}-{nets.losses} ({nets.gamesRemaining} games left)
            </p>
          </div>

          {/* Odds Summary */}
          <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
            <OddsCard label="#1 Pick" value={nets.top1Odds} />
            <OddsCard label="Top 2" value={nets.top2Odds} />
            <OddsCard label="Top 3" value={nets.top3Odds} />
            <OddsCard label="Top 4" value={nets.top4Odds} />
          </div>
        </div>
      </div>

      {/* Standings + Scenarios */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Bottom standings */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-nets-accent" />
            Lottery Standings
          </h3>
          <div className="space-y-2">
            {lotteryTeams.slice(0, 10).map((team, idx) => (
              <div
                key={team.abbrev}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  team.abbrev === "BKN"
                    ? "bg-nets-accent/15 border border-nets-accent/30"
                    : "hover:bg-nets-gray-light/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-nets-silver w-5 text-right text-xs">{idx + 1}</span>
                  <span className={team.abbrev === "BKN" ? "font-bold text-white" : "text-nets-silver"}>
                    {team.team}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-nets-silver text-xs">
                    {team.wins}-{team.losses}
                  </span>
                  <OddsBar percentage={getLotteryOddsForPick(idx + 1)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scenarios */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-nets-blue" />
            What If Scenarios
          </h3>
          <div className="space-y-3">
            {netsScenarios.map((scenario, idx) => (
              <div key={idx} className="bg-nets-gray/50 rounded-xl p-4 hover:bg-nets-gray-light/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{scenario.description}</span>
                  <span className={`text-2xl font-black ${
                    scenario.resultPick <= 2 ? "text-nets-gold" :
                    scenario.resultPick <= 4 ? "text-nets-green" :
                    "text-nets-silver"
                  }`}>
                    #{scenario.resultPick}
                  </span>
                </div>
                <p className="text-nets-silver text-xs">{scenario.probability}</p>
              </div>
            ))}
          </div>

          {/* Pain Meter */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-nets-accent/10 to-transparent border border-nets-accent/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold">Fan Confidence Meter</span>
              <span className="text-nets-gold font-bold">37%</span>
            </div>
            <div className="w-full h-3 bg-nets-gray rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-nets-accent to-nets-gold odds-bar"
                style={{ width: "37%" }}
              />
            </div>
            <p className="text-nets-silver text-xs mt-2">Tank Status: Elite Commander Mode</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function OddsCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-nets-gray/60 rounded-xl p-3 text-center min-w-[100px]">
      <p className="text-nets-silver text-xs uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black mt-1">{value.toFixed(1)}%</p>
    </div>
  );
}

function OddsBar({ percentage }: { percentage: number }) {
  return (
    <div className="w-16 h-2 bg-nets-gray rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-nets-accent odds-bar"
        style={{ width: `${Math.min(percentage * 5, 100)}%` }}
      />
    </div>
  );
}

function getLotteryOddsForPick(slot: number): number {
  const oddsMap: Record<number, number> = {
    1: 14.0, 2: 14.0, 3: 14.0, 4: 12.5, 5: 10.5,
    6: 9.0, 7: 7.5, 8: 6.0, 9: 4.5, 10: 3.0,
  };
  return oddsMap[slot] || 0;
}
