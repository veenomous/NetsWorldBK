"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getVisitorId } from "@/lib/supabase";
import { useStandings, type LiveTeam } from "@/lib/useStandings";
import { lotteryOdds } from "@/data/standings";
import type { SimulationResult, LotteryResult } from "@/lib/lottery";

interface SpinResponse {
  id: string;
  result: SimulationResult;
  nets_pick: number;
  top_4: boolean;
  remaining: number;
  cap: number;
}

interface LeaderEntry {
  visitor_id: string;
  display: string;
  best_pick: number;
  total_spins: number;
}

interface Row {
  rank: number;
  team: LiveTeam;
  originalSlot: number;
  delta: number;
  result?: LotteryResult;
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
  const [topLeaders, setTopLeaders] = useState<LeaderEntry[]>([]);
  const visitorIdRef = useRef<string>("");

  useEffect(() => {
    visitorIdRef.current = getVisitorId();
  }, []);

  useEffect(() => {
    fetch("/api/lottery/leaderboard?tab=best")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.entries)) setTopLeaders(data.entries.slice(0, 4));
      })
      .catch(() => {});
  }, [spin?.id]);

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
      await new Promise((r) => setTimeout(r, 500));
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

  function reset() {
    setSpin(null);
    setError(null);
  }

  function copyShareUrl() {
    if (!spin) return;
    const url = `https://bkgrit.com/spin/${spin.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const shareText = spin
    ? `I just spun the Nets to pick #${spin.nets_pick} on @BkGrit's lottery sim. ${spin.top_4 ? "Top-4! 🔥" : "Roll the balls."}`
    : "";
  const intentUrl = spin
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(`https://bkgrit.com/spin/${spin.id}`)}`
    : "#";

  // Build the unified rows list: pre-spin = by standings; post-spin = by lottery pick.
  let rows: Row[];
  if (spin) {
    const mapped: Row[] = [];
    for (const r of spin.result.results) {
      const team = lottery.find((t) => t.abbrev === r.abbrev);
      if (!team) continue;
      mapped.push({
        rank: r.lotteryPick,
        team,
        originalSlot: r.originalSlot,
        delta: r.originalSlot - r.lotteryPick,
        result: r,
      });
    }
    rows = mapped;
  } else {
    rows = lottery.map((team) => ({
      rank: team.lotteryRank,
      team,
      originalSlot: team.lotteryRank,
      delta: 0,
    }));
  }

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
            <div className="flex items-center gap-3 flex-wrap">
              {remaining !== null && (
                <span className="text-[10px] font-display font-bold uppercase tracking-[0.15em] text-white/40">
                  {remaining}/{spin?.cap ?? 10} left today
                </span>
              )}
              <Link
                href="/simulator/leaderboard"
                className="text-[11px] font-display font-bold uppercase tracking-wider text-white/60 hover:text-brand-red transition-colors"
              >
                Leaderboard →
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="h-1 bg-brand-red" />

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Top leaders strip */}
        {topLeaders.length > 0 && (
          <section className="border border-black/10 bg-white p-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="font-display font-black text-xs uppercase tracking-[0.15em] text-text-muted">
                <span className="text-brand-red">Best</span> Nets Spins
              </h2>
              <Link
                href="/simulator/leaderboard"
                className="text-[10px] font-display font-bold uppercase tracking-wider text-brand-red hover:underline"
              >
                Full leaderboard →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {topLeaders.map((e, i) => (
                <div key={e.visitor_id} className="border border-black/10 p-2 text-center">
                  <p className="text-[9px] font-display font-bold uppercase tracking-wider text-text-muted">
                    #{i + 1}
                  </p>
                  <p className="font-display font-black text-lg tabular-nums text-brand-red">
                    #{e.best_pick}
                  </p>
                  <p className="text-[10px] font-body text-text-primary truncate">{e.display}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Table (doubles as result view) */}
        <section>
          <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-display font-black text-xs uppercase tracking-[0.15em] text-text-muted">
              {spin ? (
                <>
                  Draft <span className="text-brand-red">Order</span>
                </>
              ) : (
                <>
                  Lottery <span className="text-brand-red">Odds</span>
                </>
              )}
            </h2>
            <span className="text-[10px] font-display font-bold uppercase tracking-wider text-text-muted">
              {spin ? "Post-lottery" : standingsLoading ? "Loading" : "Current standings"}
            </span>
          </div>
          <div className="border border-black/10 bg-white overflow-x-auto">
            <table className="w-full text-xs font-body tabular-nums">
              <thead>
                <tr className="border-b border-black/10 bg-bg-surface/50">
                  <th className="text-left px-3 py-2 font-display font-bold text-[10px] uppercase tracking-wider text-text-muted">
                    {spin ? "Pick" : "#"}
                  </th>
                  <th className="text-left px-2 py-2 font-display font-bold text-[10px] uppercase tracking-wider text-text-muted">Team</th>
                  <th className="text-right px-2 py-2 font-display font-bold text-[10px] uppercase tracking-wider text-text-muted">Rec</th>
                  {spin ? (
                    <th className="text-right px-3 py-2 font-display font-bold text-[10px] uppercase tracking-wider text-text-muted">Δ</th>
                  ) : (
                    <>
                      <th className="text-right px-2 py-2 font-display font-bold text-[10px] uppercase tracking-wider text-brand-red">#1</th>
                      <th className="text-right px-2 py-2 font-display font-bold text-[10px] uppercase tracking-wider text-text-muted hidden sm:table-cell">#2</th>
                      <th className="text-right px-2 py-2 font-display font-bold text-[10px] uppercase tracking-wider text-text-muted hidden sm:table-cell">#3</th>
                      <th className="text-right px-2 py-2 font-display font-bold text-[10px] uppercase tracking-wider text-text-muted hidden sm:table-cell">#4</th>
                      <th className="text-right px-3 py-2 font-display font-bold text-[10px] uppercase tracking-wider text-text-muted">Top-4</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isBKN = row.team.abbrev === "BKN";
                  const odds = lotteryOdds[row.originalSlot] || [];
                  const o1 = odds[0] ?? 0;
                  const o2 = odds[1] ?? 0;
                  const o3 = odds[2] ?? 0;
                  const o4 = odds[3] ?? 0;
                  const top4 = o1 + o2 + o3 + o4;
                  return (
                    <tr
                      key={row.team.abbrev}
                      className={`border-b border-black/5 last:border-b-0 ${isBKN ? "bg-brand-red/5" : ""}`}
                    >
                      <td className={`px-3 py-1.5 font-display font-black ${isBKN ? "text-brand-red" : row.rank <= 4 && spin ? "text-brand-red" : "text-black/30"}`}>
                        {row.rank}
                      </td>
                      <td className={`px-2 py-1.5 font-display font-bold ${isBKN ? "text-brand-red" : "text-text-primary"}`}>
                        <span className="sm:hidden">{row.team.abbrev}</span>
                        <span className="hidden sm:inline">{row.team.team}</span>
                      </td>
                      <td className="px-2 py-1.5 text-right text-text-muted">
                        {row.team.wins}-{row.team.losses}
                      </td>
                      {spin ? (
                        <td className="px-3 py-1.5 text-right font-bold">
                          {row.delta > 0 ? (
                            <span className="text-accent-green">▲{row.delta}</span>
                          ) : row.delta < 0 ? (
                            <span className="text-brand-red">▼{Math.abs(row.delta)}</span>
                          ) : (
                            <span className="text-black/20">—</span>
                          )}
                        </td>
                      ) : (
                        <>
                          <td className={`px-2 py-1.5 text-right font-bold ${isBKN ? "text-brand-red" : "text-text-primary"}`}>
                            {o1.toFixed(1)}
                          </td>
                          <td className="px-2 py-1.5 text-right text-text-muted hidden sm:table-cell">{o2.toFixed(1)}</td>
                          <td className="px-2 py-1.5 text-right text-text-muted hidden sm:table-cell">{o3.toFixed(1)}</td>
                          <td className="px-2 py-1.5 text-right text-text-muted hidden sm:table-cell">{o4.toFixed(1)}</td>
                          <td className={`px-3 py-1.5 text-right font-bold ${isBKN ? "text-brand-red" : "text-text-primary"}`}>
                            {top4.toFixed(1)}%
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Spin button + session strip + share */}
        <section className="border border-black/10 bg-white p-6 sm:p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <button
                onClick={runSim}
                disabled={isSpinning || remaining === 0}
                className={`font-display font-black text-2xl sm:text-3xl uppercase tracking-tight px-12 py-6 transition-colors ${
                  isSpinning
                    ? "bg-black/10 text-black/30 cursor-wait"
                    : remaining === 0
                    ? "bg-black/10 text-black/30 cursor-not-allowed"
                    : "bg-brand-red text-white hover:bg-black"
                }`}
              >
                {isSpinning ? "Drawing..." : spin ? "Spin Again" : "Spin Lottery"}
              </button>
              {spin && (
                <button
                  onClick={reset}
                  className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight px-12 py-6 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            {error && <p className="text-brand-red text-xs font-body">{error}</p>}

            <div className="flex items-center gap-6 text-[10px] font-display font-bold uppercase tracking-[0.15em] text-text-muted">
              <span>
                Session: <span className="text-text-primary tabular-nums">{sessionCount}</span>
              </span>
              {sessionBest !== null && (
                <span>
                  Best: <span className="text-brand-red tabular-nums">#{sessionBest}</span>
                </span>
              )}
            </div>

            {/* Share actions, only after a spin */}
            {spin && (
              <div className="flex items-center gap-2 flex-wrap justify-center pt-2 border-t border-black/5 w-full">
                <span className="text-[10px] font-display font-bold uppercase tracking-[0.15em] text-text-muted">
                  Nets landed
                </span>
                <span className="font-display font-black text-lg tabular-nums text-brand-red">
                  #{spin.nets_pick}
                </span>
                <span className="text-text-muted text-[10px] font-body">
                  {spin.top_4 ? "· Top 4!" : ""}
                </span>
                <a
                  href={intentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto bg-brand-red text-white font-display font-bold text-[10px] uppercase tracking-wider px-3 py-2 hover:bg-black transition-colors inline-flex items-center gap-1"
                >
                  Post on X ↗
                </a>
                <button
                  onClick={copyShareUrl}
                  className={`font-display font-bold text-[10px] uppercase tracking-wider px-3 py-2 transition-colors ${
                    copied ? "bg-accent-green text-white" : "bg-black text-white hover:bg-brand-red"
                  }`}
                >
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
