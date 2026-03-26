"use client";

import { useState, useMemo } from "react";
import { useStandings, type LiveTeam } from "@/lib/useStandings";

// NBA lottery odds by worst-record rank
const ODDS: Record<number, number[]> = {
  1: [14.0, 13.4, 12.7, 12.0], 2: [14.0, 13.4, 12.7, 12.0], 3: [14.0, 13.4, 12.7, 12.0],
  4: [12.5, 12.2, 11.9, 11.5], 5: [10.5, 10.5, 10.6, 10.5],
  6: [9.0, 9.2, 9.4, 9.6], 7: [7.5, 7.8, 8.1, 8.5],
  8: [6.0, 6.3, 6.7, 7.2], 9: [4.5, 4.8, 5.2, 5.7],
  10: [3.0, 3.3, 3.6, 4.0], 11: [2.0, 2.2, 2.4, 2.8],
  12: [1.5, 1.7, 1.9, 2.1], 13: [1.0, 1.1, 1.2, 1.4], 14: [0.5, 0.6, 0.6, 0.7],
};

const TEAM_COLORS: Record<string, string> = {
  IND: "#002D62", WAS: "#002B5C", BKN: "#e87a2e", SAC: "#5A2D81", UTA: "#002B5C",
  DAL: "#00538C", MEM: "#5D76A9", NOP: "#C8102E", CHI: "#CE1141",
};

interface SimTeam {
  abbrev: string;
  team: string;
  wins: number;
  losses: number;
  gamesRemaining: number;
  conference: string;
}

function getTop4Pct(rank: number): number {
  const o = ODDS[rank];
  return o ? o[0] + o[1] + o[2] + o[3] : 0;
}

function getNo1Pct(rank: number): number {
  return ODDS[rank]?.[0] || 0;
}

// Average odds for tied teams — when N teams tie, they split the odds for those N positions
function getTiedOdds(positions: number[], metric: "no1" | "top4"): number {
  let sum = 0;
  for (const pos of positions) {
    sum += metric === "no1" ? getNo1Pct(pos) : getTop4Pct(pos);
  }
  return sum / positions.length;
}

export default function TiebreakerScenarios() {
  const { lottery, isLive } = useStandings();
  const top5 = lottery.slice(0, 5);

  // What-If sliders: how many more wins each team gets
  const [netsExtraWins, setNetsExtraWins] = useState(0);
  const nets = top5.find((t) => t.abbrev === "BKN");
  const netsRemaining = nets?.gamesRemaining || 11;

  // Build simulated standings
  const simulated = useMemo(() => {
    const teams: SimTeam[] = top5.map((t) => ({
      abbrev: t.abbrev,
      team: t.team,
      wins: t.wins + (t.abbrev === "BKN" ? netsExtraWins : 0),
      losses: t.losses + (t.abbrev === "BKN" ? (t.gamesRemaining - netsExtraWins) : t.gamesRemaining),
      gamesRemaining: t.abbrev === "BKN" ? 0 : t.gamesRemaining,
      conference: t.conference,
    }));

    // Sort by worst record
    teams.sort((a, b) => {
      const aLosses = a.losses;
      const bLosses = b.losses;
      if (bLosses !== aLosses) return bLosses - aLosses;
      return a.wins - b.wins;
    });

    return teams;
  }, [top5, netsExtraWins, netsRemaining]);

  // Find tiebreaker groups
  const tieGroups = useMemo(() => {
    const groups: SimTeam[][] = [];
    let current: SimTeam[] = [simulated[0]];

    for (let i = 1; i < simulated.length; i++) {
      if (simulated[i].wins === current[0].wins && simulated[i].losses === current[0].losses) {
        current.push(simulated[i]);
      } else {
        groups.push(current);
        current = [simulated[i]];
      }
    }
    groups.push(current);
    return groups;
  }, [simulated]);

  // Calculate effective positions with ties
  const teamPositions = useMemo(() => {
    const positions: Record<string, { rank: number; tiedWith: string[]; no1: number; top4: number; isTied: boolean }> = {};
    let pos = 1;

    for (const group of tieGroups) {
      const groupPositions = Array.from({ length: group.length }, (_, i) => pos + i);
      const isTied = group.length > 1;
      const no1 = isTied ? getTiedOdds(groupPositions, "no1") : getNo1Pct(pos);
      const top4 = isTied ? getTiedOdds(groupPositions, "top4") : getTop4Pct(pos);

      for (const team of group) {
        positions[team.abbrev] = {
          rank: pos,
          tiedWith: isTied ? group.filter((t) => t.abbrev !== team.abbrev).map((t) => t.abbrev) : [],
          no1,
          top4,
          isTied,
        };
      }
      pos += group.length;
    }
    return positions;
  }, [tieGroups]);

  const netsPos = teamPositions["BKN"];
  const netsSimWins = (nets?.wins || 17) + netsExtraWins;
  const netsSimLosses = (nets?.losses || 54) + (netsRemaining - netsExtraWins);

  // Pre-calculate Nets scenarios
  const scenarios = useMemo(() => {
    const results: { wins: number; description: string; rank: number; no1: number; top4: number; tied: string[] }[] = [];

    for (let w = 0; w <= netsRemaining; w++) {
      const nW = (nets?.wins || 17) + w;
      const nL = (nets?.losses || 54) + (netsRemaining - w);

      // Simple ranking against current standings (other teams at current record)
      const allTeams = top5.map((t) => ({
        abbrev: t.abbrev,
        wins: t.abbrev === "BKN" ? nW : t.wins + Math.round(t.gamesRemaining * (t.wins / (t.wins + t.losses))),
        losses: t.abbrev === "BKN" ? nL : t.losses + Math.round(t.gamesRemaining * (t.losses / (t.wins + t.losses))),
      }));

      allTeams.sort((a, b) => b.losses !== a.losses ? b.losses - a.losses : a.wins - b.wins);
      const netsRank = allTeams.findIndex((t) => t.abbrev === "BKN") + 1;
      const tiedWith = allTeams.filter((t) => t.abbrev !== "BKN" && t.wins === nW && t.losses === nL).map((t) => t.abbrev);

      let desc = "";
      if (w === 0) desc = `Lose out (${nW}-${nL})`;
      else if (w === netsRemaining) desc = `Win out (${nW}-${nL})`;
      else desc = `Win ${w} more (${nW}-${nL})`;

      const positions = tiedWith.length > 0
        ? Array.from({ length: tiedWith.length + 1 }, (_, i) => netsRank + i)
        : [netsRank];

      results.push({
        wins: w,
        description: desc,
        rank: netsRank,
        no1: tiedWith.length > 0 ? getTiedOdds(positions, "no1") : getNo1Pct(netsRank),
        top4: tiedWith.length > 0 ? getTiedOdds(positions, "top4") : getTop4Pct(netsRank),
        tied: tiedWith,
      });
    }
    return results;
  }, [top5, nets, netsRemaining]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="tag tag-orange">2026 NBA Draft</span>
          {isLive && <span className="tag tag-green">Live Standings</span>}
        </div>
        <h1 className="heading-xl gradient-text-brand mb-3">Tiebreaker<br />Scenarios</h1>
        <p className="text-text-secondary text-sm max-w-lg mx-auto font-body">
          When teams finish with the same record, the NBA does a random coin flip to determine
          who gets the higher lottery odds. Here&apos;s where the Nets stand and what could change.
        </p>
      </section>

      <div className="section-divider" />

      {/* Current Standings — Visual Bracket */}
      <section>
        <h2 className="heading-lg text-text-secondary mb-5">Current Standings</h2>
        <div className="space-y-2">
          {simulated.map((team, idx) => {
            const pos = teamPositions[team.abbrev];
            const isNets = team.abbrev === "BKN";
            const barWidth = pos ? Math.max(pos.top4 / 52.1 * 100, 8) : 20;

            return (
              <div
                key={team.abbrev}
                className={`relative rounded-xl p-4 transition-all ${
                  isNets
                    ? "card-featured"
                    : "card"
                }`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                {/* Rank badge */}
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-display text-xl ${
                    isNets ? "bg-brand-orange/20 text-brand-orange" : "bg-white/[0.04] text-text-muted"
                  }`}>
                    {pos?.rank || idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`font-bold text-base ${isNets ? "text-brand-orange" : "text-text-primary"}`}>
                        {team.abbrev}
                      </span>
                      <span className="text-text-data text-sm font-semibold tabular-nums">
                        {team.wins}-{team.losses}
                      </span>
                      {pos?.isTied && (
                        <span className="tag tag-gold text-[9px]">
                          TIED w/ {pos.tiedWith.join(", ")}
                        </span>
                      )}
                      {team.gamesRemaining > 0 && (
                        <span className="text-text-muted text-xs">{team.gamesRemaining}g left</span>
                      )}
                    </div>

                    {/* Odds bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
                        <div
                          className="h-full rounded-full odds-bar"
                          style={{
                            width: `${barWidth}%`,
                            background: isNets
                              ? "linear-gradient(90deg, #e87a2e, #ff9f43)"
                              : `linear-gradient(90deg, ${TEAM_COLORS[team.abbrev] || "#444"}88, ${TEAM_COLORS[team.abbrev] || "#444"})`,
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-text-muted text-[10px] uppercase block">No.1</span>
                          <span className={`text-sm font-bold tabular-nums ${isNets ? "text-brand-orange" : "text-text-data"}`}>
                            {pos?.no1.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-text-muted text-[10px] uppercase block">Top 4</span>
                          <span className={`text-sm font-bold tabular-nums ${isNets ? "text-brand-orange-glow" : "text-text-data"}`}>
                            {pos?.top4.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="section-divider" />

      {/* Interactive What-If */}
      <section>
        <h2 className="heading-lg text-text-secondary mb-2">What If?</h2>
        <p className="text-text-muted text-sm mb-5 font-body">
          Drag the slider to see how Nets wins affect their position and odds.
        </p>

        <div className="card-featured p-5 sm:p-6">
          {/* Slider */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold">Nets win {netsExtraWins} of {netsRemaining} remaining</span>
              <span className="text-text-data text-sm font-semibold tabular-nums">
                Final: {netsSimWins}-{netsSimLosses}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={netsRemaining}
              value={netsExtraWins}
              onChange={(e) => setNetsExtraWins(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #e87a2e ${(netsExtraWins / netsRemaining) * 100}%, rgba(255,255,255,0.06) ${(netsExtraWins / netsRemaining) * 100}%)`,
              }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-text-muted">Lose out</span>
              <span className="text-[10px] text-text-muted">Win out</span>
            </div>
          </div>

          {/* Result */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl bg-white/[0.03] p-4">
              <span className="text-text-muted text-[10px] uppercase block mb-1">Position</span>
              <span className="font-display text-3xl text-brand-orange">#{netsPos?.rank || "?"}</span>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-4">
              <span className="text-text-muted text-[10px] uppercase block mb-1">No. 1 Pick</span>
              <span className="font-display text-3xl text-accent-gold">{netsPos?.no1.toFixed(1)}%</span>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-4">
              <span className="text-text-muted text-[10px] uppercase block mb-1">Top 4</span>
              <span className="font-display text-3xl text-accent-green">{netsPos?.top4.toFixed(1)}%</span>
            </div>
          </div>

          {netsPos?.isTied && (
            <div className="mt-4 rounded-xl bg-accent-gold/[0.06] border border-accent-gold/15 p-3 text-center">
              <span className="text-accent-gold text-sm font-semibold">
                Tiebreaker with {netsPos.tiedWith.join(" & ")} — odds split evenly via random draw
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="section-divider" />

      {/* All Scenarios Table */}
      <section>
        <h2 className="heading-lg text-text-secondary mb-2">Every Scenario</h2>
        <p className="text-text-muted text-sm mb-5 font-body">
          All possible outcomes based on how many of their {netsRemaining} remaining games the Nets win.
        </p>

        <div className="card overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_60px_60px_60px_1fr] gap-0 px-4 py-2.5 border-b border-white/[0.04] bg-white/[0.02]">
            <span className="text-text-muted text-[10px] uppercase font-bold">Scenario</span>
            <span className="text-text-muted text-[10px] uppercase font-bold text-center">Rank</span>
            <span className="text-text-muted text-[10px] uppercase font-bold text-center">No.1 %</span>
            <span className="text-text-muted text-[10px] uppercase font-bold text-center">Top 4 %</span>
            <span className="text-text-muted text-[10px] uppercase font-bold text-right">Tiebreaker</span>
          </div>

          {scenarios.map((s, idx) => {
            const isHighlight = s.wins === netsExtraWins;
            const isBest = s.rank <= 2;
            const isWorst = s.rank >= 5;

            return (
              <div
                key={idx}
                className={`grid grid-cols-[1fr_60px_60px_60px_1fr] gap-0 px-4 py-2.5 border-b border-white/[0.02] transition-all ${
                  isHighlight
                    ? "bg-brand-orange/[0.06] border-l-2 border-l-brand-orange"
                    : idx % 2 === 0 ? "" : "bg-white/[0.01]"
                }`}
              >
                <span className={`text-sm font-medium ${isHighlight ? "text-brand-orange font-semibold" : "text-text-secondary"}`}>
                  {s.description}
                </span>
                <span className={`text-sm font-bold text-center tabular-nums ${
                  isBest ? "text-accent-green" : isWorst ? "text-accent-red" : "text-text-data"
                }`}>
                  #{s.rank}
                </span>
                <span className={`text-sm text-center tabular-nums ${
                  s.no1 >= 14 ? "text-accent-gold font-bold" : "text-text-data"
                }`}>
                  {s.no1.toFixed(1)}
                </span>
                <span className={`text-sm text-center tabular-nums ${
                  s.top4 >= 50 ? "text-accent-green font-bold" : "text-text-data"
                }`}>
                  {s.top4.toFixed(1)}
                </span>
                <span className="text-xs text-right text-text-muted">
                  {s.tied.length > 0 ? `Split w/ ${s.tied.join(", ")}` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="section-divider" />

      {/* How Tiebreakers Work */}
      <section>
        <h2 className="heading-lg text-text-secondary mb-5">How It Works</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              step: "1",
              title: "Same Record",
              desc: "When two or more teams finish with identical W-L records, they enter a tiebreaker.",
              color: "text-brand-orange",
            },
            {
              step: "2",
              title: "Random Draw",
              desc: "The NBA holds a random drawing (coin flip for 2 teams) to determine who gets the higher position. Head-to-head record does NOT matter.",
              color: "text-accent-gold",
            },
            {
              step: "3",
              title: "Split Odds",
              desc: "The tied teams' lottery odds are averaged. If teams 2 and 3 tie, both get (14.0% + 14.0%) / 2 = 14.0% at the #1 pick.",
              color: "text-accent-green",
            },
          ].map((item) => (
            <div key={item.step} className="card p-5">
              <div className={`font-display text-4xl ${item.color} mb-2`}>{item.step}</div>
              <h3 className="font-bold text-sm text-text-primary mb-1.5">{item.title}</h3>
              <p className="text-text-secondary text-xs leading-relaxed font-body">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Key Insight */}
      <section className="card-featured p-5 sm:p-6 text-center">
        <h2 className="heading-md gradient-text-brand mb-3">The Key Insight</h2>
        <p className="text-text-secondary text-sm max-w-xl mx-auto font-body leading-relaxed">
          The top 3 worst records all share <strong className="text-accent-gold">identical 14.0%</strong> odds
          at the #1 pick and <strong className="text-accent-green">52.1%</strong> at a top 4 pick. So whether the Nets
          finish 1st, 2nd, or 3rd worst doesn&apos;t change their odds at all — the tiebreaker only determines
          where they&apos;d pick if they <em>don&apos;t</em> win the lottery (5th through 14th).
        </p>
        <p className="text-text-muted text-xs mt-3 font-body">
          TL;DR — Finishing with the same record as IND or WAS doesn&apos;t hurt Nets lottery odds one bit.
        </p>
      </section>
    </div>
  );
}
