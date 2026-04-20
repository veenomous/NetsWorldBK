"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Tab = "best" | "luckiest" | "most";

interface Entry {
  visitor_id: string;
  display: string;
  is_logged_in: boolean;
  best_pick: number;
  total_spins: number;
  top_4_count: number;
  top_4_rate: number;
}

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "best", label: "Best Pick", hint: "Lowest Nets pick ever spun" },
  { id: "luckiest", label: "Luckiest", hint: "Highest top-4 rate (min 3 spins)" },
  { id: "most", label: "Most Spins", hint: "Pure engagement" },
];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("best");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalVisitors, setTotalVisitors] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/lottery/leaderboard?tab=${tab}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries || []);
        setTotalVisitors(data.total_visitors || 0);
      })
      .finally(() => setLoading(false));
  }, [tab]);

  const activeHint = TABS.find((t) => t.id === tab)?.hint;

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="bg-black text-white px-4 sm:px-8 pt-4 pb-6">
        <div className="max-w-3xl mx-auto">
          <nav className="flex items-center gap-2 text-xs font-body mb-4">
            <Link href="/simulator" className="text-white/40 hover:text-white transition-colors">&larr; Sim</Link>
          </nav>
          <h1 className="font-display font-black text-2xl uppercase tracking-tight">
            Lottery <span className="text-brand-red">Leaderboard</span>
          </h1>
          <p className="text-white/40 text-sm font-body mt-1">
            {totalVisitors} {totalVisitors === 1 ? "fan has" : "fans have"} spun the balls
          </p>
        </div>
      </div>
      <div className="h-1 bg-brand-red" />

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-3 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 font-display font-bold text-xs uppercase tracking-wider transition-colors ${
                tab === t.id ? "bg-black text-white" : "bg-bg-surface text-text-muted hover:text-text-primary"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {activeHint && (
          <p className="text-text-muted text-[11px] font-body italic mb-6">{activeHint}</p>
        )}

        {loading ? (
          <p className="text-text-muted text-sm font-body text-center py-12">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="text-text-muted text-sm font-body text-center py-12">
            No spins yet.{" "}
            <Link href="/simulator" className="text-brand-red hover:underline">
              Be the first.
            </Link>
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((e, i) => {
              const rank = i + 1;
              const podium = rank <= 3;
              return (
                <div
                  key={e.visitor_id}
                  className={`flex items-center gap-4 border p-4 ${
                    podium ? "border-brand-red/30 bg-brand-red/5" : "border-black/10 bg-white"
                  }`}
                >
                  <span
                    className={`font-display font-black text-2xl tabular-nums w-10 text-center ${
                      podium ? "text-brand-red" : "text-black/20"
                    }`}
                  >
                    {rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-black text-sm uppercase tracking-tight text-text-primary truncate">
                      {e.display}
                    </p>
                    <p className="text-[10px] font-body text-text-muted mt-0.5">
                      {e.total_spins} {e.total_spins === 1 ? "spin" : "spins"} · top-4 {e.top_4_count}× ({Math.round(e.top_4_rate * 100)}%)
                    </p>
                  </div>
                  <div className="text-right">
                    {tab === "best" && (
                      <>
                        <span className="font-display font-black text-2xl tabular-nums text-brand-red">
                          #{e.best_pick}
                        </span>
                        <p className="text-[9px] font-display font-bold uppercase tracking-wider text-text-muted">Best</p>
                      </>
                    )}
                    {tab === "luckiest" && (
                      <>
                        <span className="font-display font-black text-2xl tabular-nums text-accent-green">
                          {Math.round(e.top_4_rate * 100)}%
                        </span>
                        <p className="text-[9px] font-display font-bold uppercase tracking-wider text-text-muted">Top-4</p>
                      </>
                    )}
                    {tab === "most" && (
                      <>
                        <span className="font-display font-black text-2xl tabular-nums text-text-primary">
                          {e.total_spins}
                        </span>
                        <p className="text-[9px] font-display font-bold uppercase tracking-wider text-text-muted">Spins</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
