"use client";

import { useState, useCallback } from "react";
import { runLotterySimulation, type SimulationResult } from "@/lib/lottery";
import { ShareLotteryResult } from "@/components/ShareButton";

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
    if (pick === 1) return "text-accent-gold";
    if (pick <= 3) return "text-accent-green";
    if (pick <= 6) return "text-accent-blue";
    return "text-text-muted";
  };

  const getResultEmoji = (pick: number) => {
    if (pick === 1) return "JACKPOT";
    if (pick === 2) return "SO CLOSE";
    if (pick <= 4) return "W";
    if (pick <= 6) return "Solid";
    return "Pain";
  };

  const getResultBg = (pick: number) => {
    if (pick === 1) return "from-accent-gold/15 to-accent-gold/5 border-accent-gold/25";
    if (pick <= 3) return "from-accent-green/15 to-accent-green/5 border-accent-green/25";
    if (pick <= 6) return "from-accent-blue/15 to-accent-blue/5 border-accent-blue/25";
    return "from-white/5 to-transparent border-white/10";
  };

  // shareText removed — using ShareLotteryResult component with OG images now

  return (
    <div className={compact ? "" : "card p-5 sm:p-6"}>
      {!compact && (
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-black">Lottery Simulator</h2>
            <p className="text-text-muted text-xs mt-0.5">Test your luck. How high do the Nets land?</p>
          </div>
          {simCount > 0 && (
            <div className="text-right">
              <p className="text-[11px] text-text-muted">Runs: {simCount}</p>
              {bestResult && (
                <p className="text-xs font-bold">
                  Best: <span className={getResultColor(bestResult)}>#{bestResult}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Run button */}
      <div className="text-center mb-5">
        <button
          onClick={runSim}
          disabled={isSpinning}
          className={`
            relative px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider
            transition-all duration-300 transform
            ${isSpinning
              ? "bg-bg-elevated text-text-muted scale-95 cursor-wait"
              : "gradient-bg-brand hover:opacity-90 hover:scale-105 active:scale-95 text-white shadow-lg shadow-brand-orange/20"
            }
          `}
        >
          {isSpinning ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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

      {/* Result */}
      {result && !isSpinning && (
        <div className="animate-slide-up">
          {/* Nets Result Hero */}
          <div className={`rounded-xl p-5 mb-4 bg-gradient-to-r ${getResultBg(result.netsResult.lotteryPick)} border`}>
            <div className="text-center">
              <p className="text-text-muted text-xs uppercase tracking-widest mb-1">Brooklyn Nets</p>
              <span className={`text-5xl sm:text-6xl font-black animate-count-up ${getResultColor(result.netsResult.lotteryPick)}`}>
                #{result.netsResult.lotteryPick}
              </span>
              <p className={`text-sm font-bold mt-1.5 ${getResultColor(result.netsResult.lotteryPick)}`}>
                {getResultEmoji(result.netsResult.lotteryPick)}
              </p>
              {result.netsResult.movedUp && (
                <p className="text-accent-green text-xs mt-1">Moved up from #{result.netsResult.originalSlot}!</p>
              )}
              {result.netsResult.movedDown && (
                <p className="text-accent-red text-xs mt-1">Dropped from #{result.netsResult.originalSlot}</p>
              )}

              {/* Share button — links to shareable page with dynamic OG image */}
              <div className="mt-3">
                <ShareLotteryResult pick={result.netsResult.lotteryPick} />
              </div>
            </div>
          </div>

          {/* Full Results Table */}
          {!compact && (
            <div className="space-y-0.5 mb-4">
              <p className="text-xs font-bold text-text-muted mb-2">Full Lottery Results</p>
              {result.results.map((r) => (
                <div
                  key={r.abbrev}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs ${
                    r.abbrev === "BKN"
                      ? "bg-brand-orange/10 border border-brand-orange/20 font-bold"
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 text-center font-bold ${
                      r.lotteryPick <= 4 ? "text-accent-gold" : "text-text-muted"
                    }`}>
                      #{r.lotteryPick}
                    </span>
                    <span className={r.abbrev === "BKN" ? "" : "text-text-secondary"}>{r.team}</span>
                  </div>
                  <div>
                    {r.movedUp && <span className="text-accent-green text-[11px]">&#9650;{r.originalSlot - r.lotteryPick}</span>}
                    {r.movedDown && <span className="text-accent-red text-[11px]">&#9660;{r.lotteryPick - r.originalSlot}</span>}
                    {!r.movedUp && !r.movedDown && <span className="text-text-muted text-[11px]">—</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* History chart */}
          {history.length > 1 && (
            <div className="pt-3 border-t border-white/[0.04]">
              <p className="text-[11px] text-text-muted mb-2">Your history ({history.length} runs)</p>
              <div className="flex gap-0.5 items-end h-10">
                {Array.from({ length: 14 }, (_, i) => i + 1).map((pick) => {
                  const count = history.filter((h) => h === pick).length;
                  const pct = (count / history.length) * 100;
                  return (
                    <div key={pick} className="flex-1 flex flex-col items-center gap-0.5">
                      <div
                        className={`w-full rounded-sm transition-all ${
                          pick <= 4 ? "bg-accent-gold/50" : "bg-white/10"
                        }`}
                        style={{ height: `${Math.max(pct * 1.5, 2)}px` }}
                      />
                      <span className="text-[8px] text-text-muted">{pick}</span>
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
