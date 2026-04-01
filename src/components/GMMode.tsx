"use client";

import { useState } from "react";
import { topProspects } from "@/data/standings";
import { getNetsTeam, formatSalary } from "@/data/rosters";

const netsTeam = getNetsTeam();
const netsPicks = netsTeam.picks || [];
const netsPlayers = netsTeam.players;

function getTier(fit: number): { label: string; color: string } {
  if (fit >= 90) return { label: "ELITE", color: "bg-accent-blue text-white" };
  if (fit >= 75) return { label: "HIGH", color: "bg-black text-white" };
  if (fit >= 60) return { label: "MID", color: "bg-gray-400 text-white" };
  return { label: "LOW", color: "bg-gray-200 text-black/40" };
}

interface PickSelection {
  pick: number;
  prospectIndex: number;
}

export default function GMMode() {
  const [selections, setSelections] = useState<PickSelection[]>([]);
  const [simRunning, setSimRunning] = useState(false);
  const [simComplete, setSimComplete] = useState(false);

  function selectProspect(prospectIndex: number) {
    const nextPick = selections.length + 1;
    if (nextPick > 4) return;
    if (selections.some((s) => s.prospectIndex === prospectIndex)) return;
    setSelections((prev) => [...prev, { pick: nextPick, prospectIndex }]);
  }

  function resetSelections() {
    setSelections([]);
    setSimComplete(false);
  }

  function runMonteCarlo() {
    setSimRunning(true);
    setTimeout(() => {
      setSimRunning(false);
      setSimComplete(true);
    }, 1500);
  }

  const currentPick = selections.length + 1;
  const corePlayers = netsPlayers.filter((p) => p.salary >= 10000000);
  const youngCore = netsPlayers.filter((p) => p.age <= 22);

  return (
    <div>
      {/* ═══ HERO ═══ */}
      <header className="bg-white text-black px-6 sm:px-8 py-12 sm:py-16 border-b-[6px] border-black">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 max-w-7xl mx-auto">
          <div>
            <div className="inline-block bg-brand-red text-white text-[10px] font-bold px-3 py-1 mb-4 tracking-[0.2em] uppercase">
              Live Command Center
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85] font-display">
              War Room:<br />Draft Night Command
            </h1>
          </div>
          <div className="flex flex-col items-end text-right">
            <div className="text-black/30 text-[9px] tracking-[0.2em] uppercase mb-1">Current Pick On Clock</div>
            <div className="text-5xl font-black font-display">
              {String(currentPick > 4 ? 4 : currentPick).padStart(2, "0")} <span className="text-accent-blue">/ {topProspects.length}</span>
            </div>
            <div className="bg-black text-white px-4 py-2 mt-3 text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-2">
              <span className="w-2 h-2 bg-brand-red animate-pulse-soft" />
              System Status: {simComplete ? "Complete" : "Active"}
            </div>
          </div>
        </div>
      </header>

      {/* ═══ MAIN WORKSPACE ═══ */}
      <div className="flex flex-col lg:flex-row w-full">
        {/* Left: Prospect Big Board */}
        <section className="flex-grow bg-white p-6 sm:p-8 lg:border-r border-gray-200 overflow-x-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight uppercase font-display border-l-4 border-brand-red pl-4">
              Prospect Big Board
            </h2>
            {selections.length > 0 && (
              <button onClick={resetSelections} className="bg-gray-100 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-brand-red hover:text-white transition-colors">
                Reset
              </button>
            )}
          </div>

          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-black text-white text-[9px] tracking-[0.15em] uppercase font-bold">
                <th className="px-3 py-3 w-10 text-center">RK</th>
                <th className="px-3 py-3">Prospect</th>
                <th className="px-3 py-3">Pos</th>
                <th className="px-3 py-3">School</th>
                <th className="px-3 py-3">Age</th>
                <th className="px-3 py-3">Stats</th>
                <th className="px-3 py-3 text-center">Fit</th>
                <th className="px-3 py-3 text-center">Tier</th>
                <th className="px-3 py-3 text-center w-20">Draft</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {topProspects.map((prospect, i) => {
                const selected = selections.find((s) => s.prospectIndex === i);
                const tier = getTier(prospect.netsFit);
                const isAvailable = !selected && selections.length < 4;

                return (
                  <tr
                    key={prospect.name}
                    className={`border-b border-gray-100 transition-colors ${
                      selected ? "bg-accent-blue/5 opacity-40" : isAvailable ? "hover:bg-accent-blue/5 cursor-pointer" : ""
                    }`}
                    onClick={() => isAvailable && selectProspect(i)}
                  >
                    <td className="px-3 py-4 text-center font-display font-black text-base">{String(prospect.rank).padStart(2, "0")}</td>
                    <td className="px-3 py-4">
                      <div className="font-black uppercase tracking-tight text-sm">{prospect.name}</div>
                      <div className="text-[9px] text-black/30 uppercase tracking-wider">{prospect.comparison}</div>
                    </td>
                    <td className="px-3 py-4 text-xs font-bold uppercase">{prospect.position}</td>
                    <td className="px-3 py-4 text-xs">{prospect.school}</td>
                    <td className="px-3 py-4 text-xs">{prospect.age}</td>
                    <td className="px-3 py-4 text-xs">{prospect.stats}</td>
                    <td className="px-3 py-4 text-center">
                      <span className={`font-display font-black ${prospect.netsFit >= 90 ? "text-accent-blue" : prospect.netsFit >= 75 ? "text-black" : "text-black/30"}`}>
                        {prospect.netsFit}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span className={`${tier.color} px-2 py-0.5 text-[8px] font-black tracking-[0.15em] uppercase`}>{tier.label}</span>
                    </td>
                    <td className="px-3 py-4 text-center">
                      {selected ? (
                        <span className="text-accent-blue text-[10px] font-black">PICK {selected.pick}</span>
                      ) : isAvailable ? (
                        <span className="text-[10px] text-black/15 font-bold">SELECT</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {/* Right: Mock Simulator */}
        <aside className="w-full lg:w-[400px] shrink-0 bg-gray-100 p-6 sm:p-8 flex flex-col">
          <div className="mb-6">
            <h2 className="text-2xl font-black tracking-tight uppercase font-display">Mock Simulator</h2>
            <p className="text-[9px] text-black/30 font-bold uppercase tracking-[0.15em] mt-1">Click prospects to draft them</p>
          </div>

          <div className="flex-grow space-y-3 overflow-y-auto pr-1">
            {selections.map((sel) => {
              const prospect = topProspects[sel.prospectIndex];
              const isFirst = sel.pick === 1;
              return (
                <div key={sel.pick} className={`bg-white p-5 border-l-[6px] ${isFirst ? "border-accent-blue" : "border-black"}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`text-[9px] font-black tracking-[0.2em] uppercase ${isFirst ? "text-accent-blue" : "text-black/30"}`}>
                        Pick {String(sel.pick).padStart(2, "0")} — Brooklyn
                      </span>
                      <div className="text-lg font-black uppercase tracking-tight font-display mt-1">{prospect.name}</div>
                    </div>
                    {isFirst && <span className="bg-gray-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider">Locked</span>}
                  </div>
                  <div className="flex gap-3 mt-3">
                    <div className="flex-1 bg-gray-50 p-2 text-center border-t-2 border-accent-blue/20">
                      <div className="text-[8px] font-bold uppercase text-black/30">Nets Fit</div>
                      <div className="text-base font-black font-display text-accent-blue">{prospect.netsFit}</div>
                    </div>
                    <div className="flex-1 bg-gray-50 p-2 text-center border-t-2 border-brand-red/20">
                      <div className="text-[8px] font-bold uppercase text-black/30">Ceiling</div>
                      <div className="text-[10px] font-black font-display">{prospect.ceiling}</div>
                    </div>
                  </div>
                </div>
              );
            })}

            {Array.from({ length: Math.max(0, 4 - selections.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="border-2 border-dashed border-accent-blue/20 p-6 text-center bg-white/50">
                <span className="material-symbols-outlined text-2xl text-accent-blue/30">person_add</span>
                <div className="text-[9px] font-black uppercase tracking-[0.15em] text-accent-blue/40 mt-2">
                  Pick {selections.length + i + 1} — Click prospect
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-300">
            <button
              onClick={runMonteCarlo}
              disabled={selections.length === 0 || simRunning}
              className="w-full bg-accent-blue text-white py-4 font-black uppercase tracking-[0.15em] text-xs hover:bg-black transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {simRunning ? "Processing..." : simComplete ? "Run Again" : `Run Monte Carlo (${selections.length}/4 picks)`}
            </button>
          </div>
        </aside>
      </div>

      {/* ═══ ASSET REPOSITORY ═══ */}
      <section className="bg-black text-white p-8 sm:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase font-display">Asset Repository</h2>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1">Brooklyn Nets // Future Capital &amp; Liquid Assets</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-white/30 font-bold uppercase tracking-[0.2em] block mb-1">Total Roster Value</span>
              <span className="text-2xl font-black font-display text-accent-blue">
                {formatSalary(netsPlayers.reduce((sum, p) => sum + p.salary, 0))}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Future Capital */}
            <div className="bg-white/5 p-6 border border-white/10 hover:border-accent-blue transition-colors">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                <span className="w-2 h-2 bg-accent-blue" /> Future Capital
              </h3>
              <div className="space-y-5">
                {netsPicks.filter((p) => p.round === 1).map((pick) => (
                  <div key={pick.label}>
                    <div className="font-black font-display text-base">{pick.year} {pick.originalTeam} 1ST</div>
                    <div className="text-[8px] text-white/30 uppercase tracking-[0.15em] mt-0.5">{pick.protection || "Unprotected"}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Player Assets */}
            <div className="bg-white/5 p-6 border border-white/10 hover:border-brand-red transition-colors">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                <span className="w-2 h-2 bg-white" /> Player Assets
              </h3>
              <div className="space-y-5">
                {corePlayers.map((player) => (
                  <div key={player.name} className="flex justify-between items-center">
                    <div>
                      <div className="font-black font-display text-base">{player.name.toUpperCase()}</div>
                      <div className="text-[8px] text-white/30 uppercase tracking-[0.15em] mt-0.5">{player.position} / {formatSalary(player.salary)}</div>
                    </div>
                    <span className="bg-accent-blue text-white px-2 py-0.5 text-[8px] font-black uppercase">Core</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Development Pipeline */}
            <div className="bg-white/5 p-6 border border-white/10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                <span className="w-2 h-2 bg-brand-red" /> Development Pipeline
              </h3>
              <div className="space-y-5">
                {youngCore.map((player) => (
                  <div key={player.name} className="flex justify-between items-center">
                    <div>
                      <div className="font-black font-display text-base">{player.name.toUpperCase()}</div>
                      <div className="text-[8px] text-white/30 uppercase tracking-[0.15em] mt-0.5">Age {player.age} / {player.stats}</div>
                    </div>
                    <span className="bg-brand-red text-white px-2 py-0.5 text-[8px] font-black uppercase">Dev</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
