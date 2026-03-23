"use client";

import { useState, useCallback } from "react";
import { runLotterySimulation, type SimulationResult } from "@/lib/lottery";

interface Props {
  compact?: boolean;
}

export default function LotterySimulator({ compact = false }: Props) {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [bestResult, setBestResult] = useState<number | null>(null);
  const [simCount, setSimCount] = useState(0);
  const [history, setHistory] = useState<number[]>([]);

  const runSim = useCallback(() => {
    setIsSpinning(true);

    // Dramatic delay
    setTimeout(() => {
      const sim = runLotterySimulation();
      setResult(sim);
      setSimCount((c) => c + 1);
      setHistory((h) => [...h.slice(-49), sim.netsResult.lotteryPick]);

      if (bestResult === null || sim.netsResult.lotteryPick < bestResult) {
        setBestResult(sim.netsResult.lotteryPick);
      }

      setIsSpinning(false);
    }, 800);
  }, [bestResult]);

  const getResultColor = (pick: number) => {
    if (pick === 1) return "text-nets-gold";
    if (pick <= 3) return "text-nets-green";
    if (pick <= 6) return "text-nets-blue";
    return "text-nets-silver";
  };

  const getResultEmoji = (pick: number) => {
    if (pick === 1) return "JACKPOT";
    if (pick === 2) return "SO CLOSE";
    if (pick <= 4) return "W";
    if (pick <= 6) return "Expected";
    return "Pain";
  };

  const getResultBg = (pick: number) => {
    if (pick === 1) return "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30";
    if (pick <= 3) return "from-green-500/20 to-green-500/5 border-green-500/30";
    if (pick <= 6) return "from-blue-400/20 to-blue-400/5 border-blue-400/30";
    return "from-gray-500/20 to-gray-500/5 border-gray-500/30";
  };

  return (
    <div className={compact ? "" : "glass-card rounded-2xl p-6 sm:p-8"}>
      {!compact && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black">Lottery Simulator</h2>
            <p className="text-nets-silver text-sm">Test your luck. Run the NBA Draft Lottery.</p>
          </div>
          {simCount > 0 && (
            <div className="text-right">
              <p className="text-xs text-nets-silver">Simulations: {simCount}</p>
              {bestResult && (
                <p className="text-sm font-bold">
                  Best: <span className={getResultColor(bestResult)}>#{bestResult}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Big button */}
      <div className="text-center mb-6">
        <button
          onClick={runSim}
          disabled={isSpinning}
          className={`
            relative px-8 py-4 rounded-2xl font-black text-lg uppercase tracking-wider
            transition-all duration-300 transform
            ${isSpinning
              ? "bg-nets-gray-light text-nets-silver scale-95 cursor-wait"
              : "bg-nets-accent hover:bg-red-700 hover:scale-105 active:scale-95 text-white shadow-lg shadow-nets-accent/20"
            }
          `}
        >
          {isSpinning ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Drawing balls...
            </span>
          ) : (
            "Run Lottery"
          )}
        </button>
      </div>

      {/* Result Display */}
      {result && !isSpinning && (
        <div className="animate-slide-up">
          {/* Nets Result Hero */}
          <div className={`rounded-2xl p-6 mb-6 bg-gradient-to-r ${getResultBg(result.netsResult.lotteryPick)} border`}>
            <div className="text-center">
              <p className="text-nets-silver text-sm uppercase tracking-widest mb-1">Brooklyn Nets</p>
              <div className="flex items-center justify-center gap-3">
                <span className={`text-6xl sm:text-7xl font-black animate-count-up ${getResultColor(result.netsResult.lotteryPick)}`}>
                  #{result.netsResult.lotteryPick}
                </span>
              </div>
              <p className={`text-lg font-bold mt-2 ${getResultColor(result.netsResult.lotteryPick)}`}>
                {getResultEmoji(result.netsResult.lotteryPick)}
              </p>
              {result.netsResult.movedUp && (
                <p className="text-nets-green text-sm mt-1">
                  Moved up from #{result.netsResult.originalSlot}!
                </p>
              )}
              {result.netsResult.movedDown && (
                <p className="text-nets-accent text-sm mt-1">
                  Dropped from #{result.netsResult.originalSlot}
                </p>
              )}
            </div>
          </div>

          {/* Full Results Table */}
          {!compact && (
            <div className="space-y-1">
              <p className="text-sm font-bold text-nets-silver mb-2">Full Lottery Results</p>
              {result.results.map((r) => (
                <div
                  key={r.abbrev}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                    r.abbrev === "BKN"
                      ? "bg-nets-accent/15 border border-nets-accent/30 font-bold"
                      : "hover:bg-nets-gray-light/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 text-center font-bold ${
                      r.lotteryPick <= 4 ? "text-nets-gold" : "text-nets-silver"
                    }`}>
                      #{r.lotteryPick}
                    </span>
                    <span>{r.team}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.movedUp && <span className="text-nets-green text-xs">&#9650; {r.originalSlot - r.lotteryPick}</span>}
                    {r.movedDown && <span className="text-nets-accent text-xs">&#9660; {r.lotteryPick - r.originalSlot}</span>}
                    {!r.movedUp && !r.movedDown && <span className="text-nets-silver text-xs">&#8212;</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Distribution bar from history */}
          {history.length > 1 && (
            <div className="mt-6 pt-4 border-t border-white/5">
              <p className="text-xs text-nets-silver mb-2">Your simulation history ({history.length} runs)</p>
              <div className="flex gap-0.5 items-end h-12">
                {Array.from({ length: 14 }, (_, i) => i + 1).map((pick) => {
                  const count = history.filter((h) => h === pick).length;
                  const pct = (count / history.length) * 100;
                  return (
                    <div key={pick} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-sm transition-all ${
                          pick <= 4 ? "bg-nets-gold/60" : "bg-nets-gray-light"
                        }`}
                        style={{ height: `${Math.max(pct * 2, 2)}px` }}
                      />
                      <span className="text-[9px] text-nets-silver">{pick}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
