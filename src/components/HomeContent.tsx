"use client";

import { useState, useEffect } from "react";
import { useStandings, getNetsFromStandings } from "@/lib/useStandings";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Take {
  id: string;
  text: string;
  author: string;
  agrees: number;
  disagrees: number;
  tag: string;
  created_at: string;
}

interface Recap {
  id: string;
  headline: string;
  opponent: string;
  nets_score: number;
  opponent_score: number;
  vibe: string;
  created_at: string;
  user: { x_handle: string };
}

const vibeEmoji: Record<string, string> = {
  hyped: "🔥", solid: "💪", meh: "😐", pain: "😭", tank: "🪖",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function HomeContent() {
  const { lottery, isLoading } = useStandings();
  const nets = getNetsFromStandings(lottery);
  const top5 = lottery.slice(0, 5);

  const [takes, setTakes] = useState<Take[]>([]);
  const [recaps, setRecaps] = useState<Recap[]>([]);
  const [takesLoading, setTakesLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [takesRes, recapsRes] = await Promise.all([
        supabase.from("hot_takes").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("game_recaps").select("id, headline, opponent, nets_score, opponent_score, vibe, created_at, user:users(x_handle)").order("created_at", { ascending: false }).limit(3),
      ]);
      if (takesRes.data) setTakes(takesRes.data);
      if (recapsRes.data) setRecaps(recapsRes.data as unknown as Recap[]);
      setTakesLoading(false);
    }
    load();
  }, []);

  // Community stats
  const totalTakes = takes.length;
  const totalAgrees = takes.reduce((n, t) => n + t.agrees, 0);
  const totalDisagrees = takes.reduce((n, t) => n + t.disagrees, 0);
  const totalVotes = totalAgrees + totalDisagrees;
  const agreeRate = totalVotes > 0 ? Math.round((totalAgrees / totalVotes) * 100) : 50;

  return (
    <div>
      {/* ═══ HERO — compact, data-rich ═══ */}
      <section className="relative w-full flex flex-col justify-end overflow-hidden border-b-[6px] border-brand-red bg-black" style={{ minHeight: "40vh" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/80 to-black" />
        <div className="relative z-10 px-6 sm:px-8 pb-8 pt-16 max-w-7xl mx-auto w-full">
          <div className="inline-block bg-brand-red px-3 py-1 mb-4">
            <span className="font-display text-white font-black tracking-[0.3em] uppercase text-[9px]">
              {isLoading ? "LOADING" : nets ? `#${nets.lotteryRank} PICK · ${nets.wins}-${nets.losses}` : "FAN HQ"}
            </span>
          </div>
          <h1 className="font-display text-white text-[11vw] sm:text-[8vw] leading-[0.85] font-black italic tracking-tighter uppercase">
            Brooklyn<br />Nets HQ
          </h1>
          <div className="mt-6 flex flex-col sm:flex-row sm:items-end justify-between border-l-[6px] border-brand-red pl-6">
            <p className="font-display text-white/50 text-sm sm:text-lg uppercase tracking-[0.15em]">
              Draft tracker · Lottery sim · Community · Trades
            </p>
            <div className="mt-4 sm:mt-0 flex gap-8 text-right">
              {nets && (
                <>
                  <div>
                    <p className="text-[9px] tracking-[0.2em] text-white/30 uppercase">No.1 Pick</p>
                    <p className="font-black text-xl text-white">{nets.top1Odds.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] tracking-[0.2em] text-white/30 uppercase">Top 4</p>
                    <p className="font-black text-xl text-brand-red">{nets.top4Odds.toFixed(1)}%</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BENTO GRID ═══ */}
      <section className="w-full px-3 py-6 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-[2px]">

          {/* ─── Community Pulse (8 col, white) ─── */}
          <div className="md:col-span-8 bg-white border border-gray-200 p-6 sm:p-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase font-display">Community Pulse</h2>
              <Link href="/community" className="text-[10px] font-black tracking-[0.15em] uppercase border-b-2 border-brand-red pb-0.5 hover:text-brand-red transition-colors">
                View All
              </Link>
            </div>

            {/* 4 metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
              <div>
                <p className="text-[9px] tracking-[0.2em] font-bold text-black/40 uppercase">Total Takes</p>
                <p className="text-2xl sm:text-3xl font-black">{takesLoading ? "—" : totalTakes}</p>
                <div className="h-[2px] bg-gray-200 w-full mt-2"><div className="h-[2px] bg-black" style={{ width: `${Math.min(totalTakes * 10, 100)}%` }} /></div>
              </div>
              <div>
                <p className="text-[9px] tracking-[0.2em] font-bold text-black/40 uppercase">Agree Rate</p>
                <p className="text-2xl sm:text-3xl font-black">{agreeRate}%</p>
                <div className="h-[2px] bg-gray-200 w-full mt-2"><div className="h-[2px] bg-accent-blue" style={{ width: `${agreeRate}%` }} /></div>
              </div>
              <div>
                <p className="text-[9px] tracking-[0.2em] font-bold text-black/40 uppercase">Total Votes</p>
                <p className="text-2xl sm:text-3xl font-black">{totalVotes}</p>
                <div className="h-[2px] bg-gray-200 w-full mt-2"><div className="h-[2px] bg-brand-red" style={{ width: `${Math.min(totalVotes, 100)}%` }} /></div>
              </div>
              <div>
                <p className="text-[9px] tracking-[0.2em] font-bold text-black/40 uppercase">Hottest Tag</p>
                <p className="text-2xl sm:text-3xl font-black">{takes[0]?.tag || "—"}</p>
                <div className="h-[2px] bg-gray-200 w-full mt-2"><div className="h-[2px] bg-brand-orange w-[70%]" /></div>
              </div>
            </div>

            {/* Recent takes in editorial style */}
            <div className="space-y-0">
              {takes.slice(0, 4).map((take, i) => {
                const total = take.agrees + take.disagrees;
                const pct = total > 0 ? Math.round((take.agrees / total) * 100) : 50;
                return (
                  <div key={take.id} className={`py-3 flex items-start gap-4 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                    <span className="text-[10px] font-bold text-black/20 mt-1 shrink-0 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">{take.text}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-black/30">@{take.author}</span>
                        <span className="text-[9px] text-black/20">{timeAgo(take.created_at)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-lg font-black ${pct >= 60 ? "text-accent-green" : pct <= 40 ? "text-brand-red" : "text-black/40"}`}>{pct}%</span>
                      <p className="text-[8px] tracking-[0.15em] uppercase text-black/30">agree</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Draft Position (4 col, black) ─── */}
          <div className="md:col-span-4 bg-black text-white p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase font-display mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-red" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
              Draft Position
            </h2>

            {isLoading ? (
              <div className="space-y-4">
                {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-white/5 animate-pulse-soft" />)}
              </div>
            ) : (
              <div className="space-y-0">
                {top5.map((team, i) => {
                  const isBKN = team.abbrev === "BKN";
                  return (
                    <div key={team.abbrev} className={`flex items-center justify-between py-4 ${i > 0 ? "border-t border-white/10" : ""}`}>
                      <div>
                        <p className={`text-base font-bold ${isBKN ? "text-brand-red" : "text-white"}`}>
                          {i + 1}. {team.team.split(" ").pop()?.toUpperCase()}
                        </p>
                        <p className="text-[9px] tracking-[0.2em] text-white/30 uppercase">{team.wins}-{team.losses} · {team.gamesRemaining}g left</p>
                      </div>
                      <span className={`text-xl font-black ${isBKN ? "text-brand-red" : "text-white/80"}`}>
                        {(nets && isBKN) ? `${nets.top1Odds.toFixed(1)}%` : "14.0%"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <Link
              href="/simulator"
              className="block w-full bg-brand-red text-white py-4 font-bold tracking-[0.15em] text-xs uppercase text-center hover:bg-red-700 transition-all mt-6"
            >
              Run Simulation
            </Link>
          </div>

          {/* ─── Wire Feed (4 col, gray) ─── */}
          <div className="md:col-span-4 bg-[#e8e8e8] p-6 sm:p-8">
            <h2 className="text-lg font-black tracking-tighter uppercase font-display mb-6">Wire_Feed</h2>
            <div className="space-y-6">
              <div className="relative pl-5 before:absolute before:left-0 before:top-0 before:w-[3px] before:h-full before:bg-brand-red">
                <p className="text-[9px] font-bold tracking-[0.2em] text-brand-red uppercase mb-1">Latest // Draft</p>
                <p className="text-sm font-medium leading-snug">Nets sitting at #{nets?.lotteryRank || "?"} with {nets?.gamesRemaining || "?"} games left. Every loss matters for lottery positioning.</p>
              </div>
              <div className="relative pl-5 before:absolute before:left-0 before:top-0 before:w-[3px] before:h-full before:bg-accent-blue">
                <p className="text-[9px] font-bold tracking-[0.2em] text-accent-blue uppercase mb-1">Intel // Community</p>
                <p className="text-sm font-medium leading-snug">{takes[0]?.text?.slice(0, 80) || "Fan discussion loading..."}...</p>
              </div>
              <div className="relative pl-5 before:absolute before:left-0 before:top-0 before:w-[3px] before:h-full before:bg-black">
                <p className="text-[9px] font-bold tracking-[0.2em] text-black/30 uppercase mb-1">Dispatch // Recaps</p>
                <p className="text-sm font-medium leading-snug">{recaps[0]?.headline || "No recaps yet. Be the first to write one after tonight's game."}</p>
              </div>
            </div>
            <Link href="/community" className="inline-block mt-6 text-[10px] font-black tracking-[0.15em] uppercase border-b-2 border-brand-red pb-0.5 hover:text-brand-red transition-colors">
              View All Dispatches
            </Link>
          </div>

          {/* ─── Live Recaps (8 col, white + black header) ─── */}
          <div className="md:col-span-8 bg-white border border-gray-200 overflow-hidden">
            <div className="bg-black text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-black tracking-tighter uppercase font-display">Live Recaps</h2>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse-soft" />
                <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-brand-red">Live</span>
              </span>
            </div>
            <div className="flex flex-col md:flex-row">
              {/* Featured recap or CTA */}
              <div className="md:w-1/2 p-6 border-r border-gray-200">
                {recaps[0] ? (
                  <Link href={`/recaps/${recaps[0].id}`} className="group">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{vibeEmoji[recaps[0].vibe] || "🏀"}</span>
                      <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-black/30">
                        BKN {recaps[0].nets_score} - {recaps[0].opponent} {recaps[0].opponent_score}
                      </span>
                    </div>
                    <h3 className="text-lg font-black tracking-tighter uppercase leading-tight group-hover:text-brand-red transition-colors">
                      {recaps[0].headline}
                    </h3>
                    <p className="text-xs text-black/40 mt-2">by @{recaps[0].user?.x_handle || "anonymous"}</p>
                  </Link>
                ) : (
                  <div>
                    <h3 className="text-lg font-black tracking-tighter uppercase mb-2">No Recaps Yet</h3>
                    <p className="text-sm text-black/40">Write the first post-game breakdown.</p>
                  </div>
                )}
              </div>

              {/* Recent recaps list + CTA */}
              <div className="md:w-1/2 flex flex-col">
                {recaps.slice(1, 3).map((r) => (
                  <Link key={r.id} href={`/recaps/${r.id}`} className="p-5 border-b border-gray-200 hover:bg-gray-50 transition-colors group">
                    <p className="text-[9px] font-bold tracking-[0.2em] text-brand-red uppercase mb-1">
                      BKN {r.nets_score} - {r.opponent} {r.opponent_score}
                    </p>
                    <h4 className="font-bold text-sm leading-tight uppercase group-hover:text-brand-red transition-colors">{r.headline}</h4>
                  </Link>
                ))}
                <Link
                  href="/recaps"
                  className="p-5 bg-brand-red text-white flex-grow flex items-center justify-center group"
                >
                  <span className="font-black text-sm tracking-tighter uppercase group-hover:underline">Open Recap Studio</span>
                  <span className="material-symbols-outlined ml-2 text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ═══ SECONDARY GRID — Tool Cards ═══ */}
      <section className="w-full px-3 py-8 sm:px-6 border-t-[4px] border-brand-red">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-3">
            <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-black/30">War Room</h3>
            <Link href="/gm-mode" className="block bg-white border-t-4 border-brand-red p-5 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xl font-black uppercase font-display">Play GM</p>
              <p className="text-[10px] font-bold text-brand-red uppercase mt-1 tracking-wider">Draft · Trade · Strategy</p>
              <div className="mt-4 flex justify-between items-center text-[9px] font-bold uppercase text-black/30">
                <span>Fan Score</span>
                <span className="text-brand-red">Get Graded →</span>
              </div>
            </Link>
          </div>
          <div className="space-y-3">
            <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-black/30">Trade Machine</h3>
            <Link href="/trade-machine" className="block bg-white border-t-4 border-accent-blue p-5 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xl font-black uppercase font-display text-accent-blue">Build Trades</p>
              <p className="text-[10px] font-bold text-black/30 uppercase mt-1 tracking-wider">Salary Match · Fan Vote</p>
              <div className="mt-4 flex justify-between items-center text-[9px] font-bold uppercase text-black/30">
                <span>Cap Space</span>
                <span className="text-accent-blue">Explore →</span>
              </div>
            </Link>
          </div>
          <div className="space-y-3">
            <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-black/30">Tiebreaker</h3>
            <Link href="/tiebreaker" className="block bg-white border-t-4 border-brand-orange p-5 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xl font-black uppercase font-display text-brand-orange">Scenarios</p>
              <p className="text-[10px] font-bold text-black/30 uppercase mt-1 tracking-wider">Position · Odds · What-If</p>
              <div className="mt-4 flex justify-between items-center text-[9px] font-bold uppercase text-black/30">
                <span>Current Pick</span>
                <span className="text-brand-orange">#{nets?.lotteryRank || "?"} →</span>
              </div>
            </Link>
          </div>
          <div className="space-y-3">
            <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-black/30">Lottery Sim</h3>
            <Link href="/simulator" className="block bg-accent-blue p-5 h-full flex flex-col justify-between">
              <p className="text-white text-base font-bold leading-tight uppercase italic font-display">
                &quot;Run the lottery. See where Brooklyn lands.&quot;
              </p>
              <p className="text-white/50 text-[9px] font-bold tracking-[0.2em] uppercase mt-4">Unlimited Sims →</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
