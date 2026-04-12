"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { runLotterySimulation, type SimulationResult } from "@/lib/lottery";
import { useStandings } from "@/lib/useStandings";
import { lotteryOdds } from "@/data/standings";
import Link from "next/link";

// Historical lottery data
const HISTORY = [
  { year: 2025, team: "Dallas Mavericks", odds: "6.0%", outcome: "JUMPED +2", jumped: true },
  { year: 2024, team: "Atlanta Hawks", odds: "3.0%", outcome: "JUMPED +7", jumped: true },
  { year: 2023, team: "San Antonio Spurs", odds: "14.0%", outcome: "STAYED #1", jumped: false },
  { year: 2022, team: "Orlando Magic", odds: "14.0%", outcome: "STAYED #1", jumped: false },
];

// ─── Share Dropdown ───
function ShareButton({ pick }: { pick: number }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareText = `I just ran the BK Grit Lottery Simulator and the Nets got the #${pick} pick! 🏀`;
  const shareUrl = "https://bkgrit.com/simulator";

  function handleCopy() {
    navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="bg-black text-white px-6 py-2.5 font-black text-[11px] uppercase tracking-wider hover:bg-gray-800 transition-all flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share Result
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 left-0 z-50 w-56 bg-white border border-gray-200 shadow-xl">
            <button
              onClick={() => { handleCopy(); setOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-100"
            >
              <svg className="w-4 h-4 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-black/40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </a>
          </div>
        </>
      )}
    </div>
  );
}

export default function LotterySimulator() {
  const searchParams = useSearchParams();
  const { lottery, isLoading } = useStandings();
  const top6 = lottery.slice(0, 6);
  const autoRanRef = useRef(false);

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [simCount, setSimCount] = useState(0);
  const [bestResult, setBestResult] = useState<number | null>(null);

  const runSim = useCallback(() => {
    setIsSpinning(true);
    setTimeout(() => {
      const sim = runLotterySimulation();
      setResult(sim);
      setSimCount((c) => c + 1);
      if (bestResult === null || sim.netsResult.lotteryPick < bestResult) {
        setBestResult(sim.netsResult.lotteryPick);
      }
      setIsSpinning(false);
    }, 800);
  }, [bestResult]);

  // Auto-run if ?autorun=1
  useEffect(() => {
    if (searchParams.get("autorun") === "1" && !autoRanRef.current) {
      autoRanRef.current = true;
      runSim();
    }
  }, [searchParams, runSim]);

  const top4 = result ? result.results.slice(0, 4) : null;

  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section className="relative w-full px-6 py-12 md:py-20 bg-black text-white overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-gradient-to-br from-black via-gray-900 to-black" />
        <div className="relative z-10 max-w-7xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.3em] mb-4 text-brand-red uppercase">2026 Draft Cycle</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic tracking-tighter leading-[0.85] mb-6 font-display">
            Lottery Simulator:<br />Change the Future
          </h1>
          <p className="max-w-2xl text-base md:text-lg font-light opacity-60 leading-relaxed">
            The weight of the franchise in a single ping-pong ball. Simulate the outcomes of the 2026 NBA Lottery based on real-time standings and verified probability matrices.
          </p>
        </div>
      </section>

      {/* ═══ MAIN GRID ═══ */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row">
        {/* Sidebar: Live Odds */}
        <div className="w-full lg:w-[340px] shrink-0 bg-gray-50 p-6 sm:p-8 border-r border-gray-200">
          <div className="lg:sticky lg:top-16">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-xl font-black italic font-display uppercase">Live Odds</h2>
              <span className="text-[9px] font-bold tracking-[0.2em] text-black/30 uppercase">
                {isLoading ? "Loading..." : "Live"}
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-12 bg-gray-200 animate-pulse-soft" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {top6.map((team, i) => {
                  const odds = lotteryOdds[team.lotteryRank];
                  const no1 = odds ? odds[0] : 0;
                  const isBKN = team.abbrev === "BKN";
                  return (
                    <div key={team.abbrev} className={isBKN ? "opacity-100" : i >= 4 ? "opacity-40" : "opacity-100"}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-bold font-display text-sm uppercase">
                          {i + 1}. {team.team}
                        </span>
                        <span className="font-black text-accent-blue">{no1.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200">
                        <div
                          className={`h-full ${isBKN ? "bg-brand-red" : "bg-accent-blue"}`}
                          style={{ width: `${no1}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Commissioner's Note */}
            <div className="mt-10 p-5 bg-black text-white">
              <h3 className="text-sm font-bold uppercase font-display mb-2">Commissioner&apos;s Note</h3>
              <p className="text-[11px] leading-relaxed opacity-60">
                Odds are calculated based on the 2024 NBA Draft Lottery format. Tiebreakers are resolved via random selection algorithm mirroring the official league draw.
              </p>
            </div>

            {/* Stats */}
            {simCount > 0 && (
              <div className="mt-6 flex justify-between text-xs">
                <span className="text-black/30">Simulations: <span className="font-bold text-black">{simCount}</span></span>
                {bestResult && (
                  <span className="text-black/30">Best: <span className="font-bold text-brand-red">#{bestResult}</span></span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main: Simulator */}
        <div className="flex-1 bg-white min-w-0">
          {/* Controls */}
          <div className="p-6 sm:p-10 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="text-center sm:text-left">
              <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter font-display uppercase mb-1">Simulate Draw</h2>
              <p className="text-[10px] uppercase tracking-[0.2em] text-black/30">Iterative probability processing</p>
            </div>
            <button
              onClick={runSim}
              disabled={isSpinning}
              className={`w-full sm:w-auto px-10 py-5 text-xl font-black font-display italic uppercase transition-all ${
                isSpinning
                  ? "bg-gray-200 text-black/30 cursor-wait"
                  : "bg-brand-red text-white hover:bg-red-700 active:scale-95"
              }`}
            >
              {isSpinning ? "Processing..." : "Run Simulation"}
            </button>
          </div>

          {/* Results */}
          <div className="p-6 sm:p-10">
            {!result && !isSpinning && (
              <div className="text-center py-20">
                <p className="text-black/15 text-lg font-display font-bold italic uppercase">Hit &quot;Run Simulation&quot; to start</p>
              </div>
            )}

            {isSpinning && (
              <div className="text-center py-20">
                <div className="inline-block w-12 h-12 border-4 border-gray-200 border-t-brand-red rounded-full animate-spin" />
                <p className="text-black/30 text-sm mt-4 font-display uppercase">Drawing ping-pong balls...</p>
              </div>
            )}

            {result && !isSpinning && top4 && (
              <div className="animate-slide-up">
                {/* Nets result highlight */}
                {(() => {
                  const netsResult = result.results.find(r => r.abbrev === "BKN");
                  if (!netsResult) return null;
                  return (
                    <div className={`p-5 mb-6 text-center ${netsResult.lotteryPick <= 3 ? "bg-black text-white" : "bg-brand-red/5 border-2 border-brand-red"}`}>
                      <p className={`text-[10px] font-bold tracking-[0.3em] uppercase ${netsResult.lotteryPick <= 3 ? "text-white/50" : "text-text-muted"}`}>Brooklyn Nets</p>
                      <p className={`font-display font-black text-5xl tracking-tight mt-1 ${netsResult.lotteryPick <= 3 ? "text-brand-red" : "text-brand-red"}`}>#{netsResult.lotteryPick}</p>
                      <p className={`text-sm font-body mt-1 ${netsResult.lotteryPick <= 3 ? "text-white/40" : "text-text-muted"}`}>
                        {netsResult.lotteryPick <= 3 ? "Top 3! " : ""}
                        {netsResult.originalSlot - netsResult.lotteryPick > 0
                          ? `Jumped ${netsResult.originalSlot - netsResult.lotteryPick} spots`
                          : netsResult.originalSlot - netsResult.lotteryPick < 0
                            ? `Dropped ${Math.abs(netsResult.originalSlot - netsResult.lotteryPick)} spots`
                            : "Stayed in place"
                        }
                      </p>
                    </div>
                  );
                })()}

                {/* Full Results */}
                <div className="mt-8 space-y-0">
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-black/30 mb-3">Full Draft Order</p>
                  {result.results.map((r) => {
                    const isBKN = r.abbrev === "BKN";
                    const spotDiff = r.originalSlot - r.lotteryPick;
                    return (
                      <div key={r.abbrev} className={`flex items-center justify-between py-2 px-3 text-sm border-b border-gray-100 ${isBKN ? "bg-brand-red/5 font-bold" : ""}`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-6 text-right font-black ${r.lotteryPick <= 4 ? "text-brand-red" : "text-black/30"}`}>
                            {r.lotteryPick}
                          </span>
                          <span className={isBKN ? "text-brand-red" : ""}>{r.team}</span>
                        </div>
                        <span className={`text-[11px] font-bold ${spotDiff > 0 ? "text-accent-green" : spotDiff < 0 ? "text-brand-red" : "text-black/20"}`}>
                          {spotDiff > 0 ? `▲${spotDiff}` : spotDiff < 0 ? `▼${Math.abs(spotDiff)}` : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Share */}
                <div className="mt-6 text-center">
                  <ShareButton pick={result.netsResult.lotteryPick} />
                </div>
              </div>
            )}

            {/* Historical Context */}
            <div className="mt-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-[2px] flex-grow bg-black" />
                <h2 className="text-lg font-black italic font-display uppercase">Historical Context</h2>
                <div className="h-[2px] flex-grow bg-black" />
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 text-[9px] font-black tracking-[0.2em] uppercase text-black/30">Year</th>
                    <th className="p-3 text-[9px] font-black tracking-[0.2em] uppercase text-black/30">Top Pick</th>
                    <th className="p-3 text-[9px] font-black tracking-[0.2em] uppercase text-black/30">Pre-Lottery Odds</th>
                    <th className="p-3 text-[9px] font-black tracking-[0.2em] uppercase text-black/30">Outcome</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {HISTORY.map((h) => (
                    <tr key={h.year} className="border-b border-gray-100">
                      <td className="p-3 font-bold">{h.year}</td>
                      <td className="p-3">{h.team}</td>
                      <td className="p-3">{h.odds}</td>
                      <td className={`p-3 font-bold ${h.jumped ? "text-brand-red" : "text-accent-blue"}`}>{h.outcome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FOOTER CARDS ═══ */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 border-t-[6px] border-black">
            <h4 className="text-xl font-black italic font-display uppercase mb-3">The Strategy</h4>
            <p className="text-sm text-black/40 leading-relaxed">
              Understanding the &quot;smoothing&quot; of lottery odds introduced in 2019 and how it impacts Brooklyn&apos;s asset accumulation strategy for the current rebuild.
            </p>
          </div>
          <Link href="/press" className="bg-white p-8 border-t-[6px] border-accent-blue group">
            <h4 className="text-xl font-black italic font-display uppercase mb-3 group-hover:text-accent-blue transition-colors">Prospect Watch</h4>
            <p className="text-sm text-black/40 leading-relaxed">
              Early looks at the top of the board: from French wings to defensive anchors. Who fits the Brooklyn grit identity?
            </p>
            <span className="inline-block mt-3 text-accent-blue font-bold font-display text-[10px] tracking-[0.15em] uppercase border-b-2 border-accent-blue pb-0.5">
              Go to The Press
            </span>
          </Link>
          <div className="bg-white p-8 border-t-[6px] border-brand-red">
            <h4 className="text-xl font-black italic font-display uppercase mb-3">Mock Draft</h4>
            <p className="text-sm text-black/40 leading-relaxed">
              Latest 2-round mock draft based on simulated results and team needs across the league landscape.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
