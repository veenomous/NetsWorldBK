"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getVisitorId } from "@/lib/supabase";
import { useStandings } from "@/lib/useStandings";
import { lotteryOdds } from "@/data/standings";
import type { SimulationResult } from "@/lib/lottery";

interface SpinResponse {
  id: string;
  result: SimulationResult;
  nets_pick: number;
  top_4: boolean;
  remaining: number;
  cap: number;
}

export default function LotterySimulator() {
  const { data: session } = useSession();
  const sessionUser = session?.user as { xHandle?: string; name?: string } | undefined;
  const xHandle = sessionUser?.xHandle || sessionUser?.name || null;
  const { lottery, isLoading: standingsLoading } = useStandings();

  const [spin, setSpin] = useState<SpinResponse | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [sessionBest, setSessionBest] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const visitorIdRef = useRef<string>("");

  useEffect(() => {
    visitorIdRef.current = getVisitorId();
  }, []);

  const runSim = useCallback(async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setError(null);
    try {
      const res = await fetch("/api/lottery/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitor_id: visitorIdRef.current,
          x_handle: xHandle,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setError(`Daily cap reached (${data.cap || 10} spins). Come back tomorrow.`);
          setRemaining(0);
        } else {
          setError(data.error || "Spin failed");
        }
        return;
      }
      // Animate in after a short hold so the result feels like a draw
      await new Promise((r) => setTimeout(r, 600));
      setSpin(data);
      setSessionCount((c) => c + 1);
      setSessionBest((b) => (b === null || data.nets_pick < b ? data.nets_pick : b));
      setRemaining(data.remaining);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Spin failed");
    } finally {
      setIsSpinning(false);
    }
  }, [isSpinning, xHandle]);

  function copyShareUrl() {
    if (!spin) return;
    const url = `https://bkgrit.com/spin/${spin.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const netsResult = spin?.result.netsResult;
  const shareText = spin
    ? `I just spun the Nets to pick #${spin.nets_pick} on @BkGrit's lottery sim. ${spin.top_4 ? "Top-4! 🔥" : "Roll the balls."}`
    : "";
  const intentUrl = spin
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(`https://bkgrit.com/spin/${spin.id}`)}`
    : "#";

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Hero */}
      <div className="bg-black text-white px-4 sm:px-8 pt-4 pb-6">
        <div className="max-w-3xl mx-auto">
          <nav className="flex items-center gap-2 text-xs font-body mb-4">
            <Link href="/" className="text-white/40 hover:text-white transition-colors">&larr; Wiki</Link>
          </nav>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-display font-bold uppercase tracking-[0.3em] text-brand-red mb-2">
                2026 Draft Lottery
              </p>
              <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight">
                Lottery <span className="text-brand-red">Sim</span>
              </h1>
              <p className="text-white/40 text-sm font-body mt-1">Spin the balls. See where Brooklyn lands.</p>
            </div>
            <Link
              href="/simulator/leaderboard"
              className="text-[11px] font-display font-bold uppercase tracking-wider text-white/60 hover:text-brand-red transition-colors"
            >
              Leaderboard →
            </Link>
          </div>
        </div>
      </div>
      <div className="h-1 bg-brand-red" />

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Odds table */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-display font-black text-xs uppercase tracking-[0.15em] text-text-muted">
              Lottery <span className="text-brand-red">Odds</span>
            </h2>
            <span className="text-[10px] font-display font-bold uppercase tracking-wider text-text-muted">
              {standingsLoading ? "Loading" : "Current standings"}
            </span>
          </div>
          <div className="border border-black/10 bg-white overflow-x-auto">
            <table className="w-full text-xs font-body tabular-nums">
              <thead>
                <tr className="border-b border-black/10 bg-bg-surface/50">
                  <th className="text-left px-3 py-2 font-display font-bold text-[10px] uppercase tracking-wider text-text-muted">#</th>
                  <th className="text-left px-2 py-2 font-display font-bold text-[10px] uppercase tracking-wider text-text-muted">Team</th>
                  <th className="text-right px-2 py-2 font-display font-bold text-[10px] uppercase tracking-wider text-text-muted">Rec</th>
                  <th className="text-right px-2 py-2 font-display font-bold text-[10px] uppercase tracking-wider text-brand-red">#1</th>
                  <th className="text-right px-2 py-2 font-display font-bold text-[10px] uppercase tracking-wider text-text-muted hidden sm:table-cell">#2</th>
                  <th className="text-right px-2 py-2 font-display font-bold text-[10px] uppercase tracking-wider text-text-muted hidden sm:table-cell">#3</th>
                  <th className="text-right px-2 py-2 font-display font-bold text-[10px] uppercase tracking-wider text-text-muted hidden sm:table-cell">#4</th>
                  <th className="text-right px-3 py-2 font-display font-bold text-[10px] uppercase tracking-wider text-text-muted">Top-4</th>
                </tr>
              </thead>
              <tbody>
                {lottery.map((team) => {
                  const odds = lotteryOdds[team.lotteryRank] || [];
                  const o1 = odds[0] ?? 0;
                  const o2 = odds[1] ?? 0;
                  const o3 = odds[2] ?? 0;
                  const o4 = odds[3] ?? 0;
                  const top4 = o1 + o2 + o3 + o4;
                  const isBKN = team.abbrev === "BKN";
                  return (
                    <tr
                      key={team.abbrev}
                      className={`border-b border-black/5 last:border-b-0 ${isBKN ? "bg-brand-red/5" : ""}`}
                    >
                      <td className={`px-3 py-1.5 font-display font-black ${isBKN ? "text-brand-red" : "text-black/30"}`}>
                        {team.lotteryRank}
                      </td>
                      <td className={`px-2 py-1.5 font-display font-bold ${isBKN ? "text-brand-red" : "text-text-primary"}`}>
                        <span className="sm:hidden">{team.abbrev}</span>
                        <span className="hidden sm:inline">{team.team}</span>
                      </td>
                      <td className="px-2 py-1.5 text-right text-text-muted">
                        {team.wins}-{team.losses}
                      </td>
                      <td className={`px-2 py-1.5 text-right font-bold ${isBKN ? "text-brand-red" : "text-text-primary"}`}>
                        {o1.toFixed(1)}
                      </td>
                      <td className="px-2 py-1.5 text-right text-text-muted hidden sm:table-cell">{o2.toFixed(1)}</td>
                      <td className="px-2 py-1.5 text-right text-text-muted hidden sm:table-cell">{o3.toFixed(1)}</td>
                      <td className="px-2 py-1.5 text-right text-text-muted hidden sm:table-cell">{o4.toFixed(1)}</td>
                      <td className={`px-3 py-1.5 text-right font-bold ${isBKN ? "text-brand-red" : "text-text-primary"}`}>
                        {top4.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Spin button + session strip */}
        <section className="border border-black/10 bg-white p-6 sm:p-8">
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={runSim}
              disabled={isSpinning || remaining === 0}
              className={`font-display font-black text-2xl sm:text-3xl uppercase tracking-tight px-12 py-6 transition-colors w-full sm:w-auto ${
                isSpinning
                  ? "bg-black/10 text-black/30 cursor-wait"
                  : remaining === 0
                  ? "bg-black/10 text-black/30 cursor-not-allowed"
                  : "bg-brand-red text-white hover:bg-black"
              }`}
            >
              {isSpinning ? "Drawing..." : remaining === 0 ? "Cap reached" : "Spin Lottery"}
            </button>
            {error && (
              <p className="text-brand-red text-xs font-body">{error}</p>
            )}
            <div className="flex items-center gap-6 text-[10px] font-display font-bold uppercase tracking-[0.15em] text-text-muted">
              <span>
                Session: <span className="text-text-primary tabular-nums">{sessionCount}</span>
              </span>
              {sessionBest !== null && (
                <span>
                  Best: <span className="text-brand-red tabular-nums">#{sessionBest}</span>
                </span>
              )}
              {remaining !== null && (
                <span>
                  Left today: <span className="text-text-primary tabular-nums">{remaining}</span>/{spin?.cap ?? 10}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Result */}
        {spin && netsResult && (
          <section className="border border-black/10 bg-white">
            <div className={`p-6 sm:p-8 text-center ${spin.top_4 ? "bg-black text-white" : ""}`}>
              <p className={`text-[10px] font-display font-bold uppercase tracking-[0.3em] ${spin.top_4 ? "text-white/50" : "text-text-muted"}`}>
                Brooklyn Nets
              </p>
              <p className="font-display font-black text-6xl sm:text-7xl tabular-nums mt-2 text-brand-red">
                #{spin.nets_pick}
              </p>
              <p className={`text-sm font-body mt-2 ${spin.top_4 ? "text-white/60" : "text-text-muted"}`}>
                {spin.top_4 && <span className="font-bold text-brand-red">Top 4! </span>}
                {netsResult.originalSlot - netsResult.lotteryPick > 0
                  ? `Jumped ${netsResult.originalSlot - netsResult.lotteryPick} spots`
                  : netsResult.originalSlot - netsResult.lotteryPick < 0
                  ? `Dropped ${Math.abs(netsResult.originalSlot - netsResult.lotteryPick)} spots`
                  : "Stayed in place"}
              </p>

              {/* Share actions */}
              <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
                <a
                  href={intentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-brand-red text-white font-display font-bold text-[10px] uppercase tracking-wider px-3 py-2 hover:bg-white hover:text-black transition-colors inline-flex items-center gap-1"
                >
                  Post on X ↗
                </a>
                <button
                  onClick={copyShareUrl}
                  className={`font-display font-bold text-[10px] uppercase tracking-wider px-3 py-2 transition-colors ${
                    copied
                      ? "bg-accent-green text-white"
                      : spin.top_4
                      ? "bg-white/10 text-white hover:bg-white hover:text-black"
                      : "bg-black text-white hover:bg-brand-red"
                  }`}
                >
                  {copied ? "Copied!" : "Copy Share Link"}
                </button>
              </div>
            </div>

            {/* Full draft order */}
            <div className="border-t border-black/10 p-4 sm:p-6">
              <p className="text-[10px] font-display font-bold uppercase tracking-[0.2em] text-text-muted mb-3">
                Full Draft Order
              </p>
              <div className="space-y-0">
                {spin.result.results.map((r) => {
                  const isBKN = r.abbrev === "BKN";
                  const spotDiff = r.originalSlot - r.lotteryPick;
                  return (
                    <div
                      key={r.abbrev}
                      className={`flex items-center justify-between py-2 px-2 text-sm border-b border-black/5 last:border-b-0 ${
                        isBKN ? "bg-brand-red/5 font-bold" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-6 text-right font-black font-display tabular-nums ${r.lotteryPick <= 4 ? "text-brand-red" : "text-black/30"}`}>
                          {r.lotteryPick}
                        </span>
                        <span className={`truncate ${isBKN ? "text-brand-red" : "text-text-primary"}`}>
                          {r.team}
                        </span>
                      </div>
                      <span className={`text-[11px] font-bold tabular-nums shrink-0 ${
                        spotDiff > 0 ? "text-accent-green" : spotDiff < 0 ? "text-brand-red" : "text-black/20"
                      }`}>
                        {spotDiff > 0 ? `▲${spotDiff}` : spotDiff < 0 ? `▼${Math.abs(spotDiff)}` : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {!spin && !isSpinning && !error && (
          <p className="text-text-muted text-sm font-body text-center py-4">
            Hit Spin to draw. Each spin is recorded — best pick ever lands on the leaderboard.
          </p>
        )}
      </div>
    </div>
  );
}
