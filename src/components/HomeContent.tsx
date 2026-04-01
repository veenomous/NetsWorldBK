"use client";

import { useState, useEffect, useCallback } from "react";
import { useStandings, getNetsFromStandings } from "@/lib/useStandings";
import { supabase } from "@/lib/supabase";
import { AnimatedTabs, type Tab } from "@/components/ui/animated-tabs";
import TheWire from "@/components/TheWire";
import Image from "next/image";
import Link from "next/link";

// ─── Types ───
interface ScoreGame {
  homeTeam: { abbrev: string; score: number };
  awayTeam: { abbrev: string; score: number };
  period: number;
  clock: string;
  status: number;
  statusText: string;
}

interface NextGame {
  opponent: string;
  isHome: boolean;
  dayLabel: string;
}

interface Recap {
  id: string;
  headline: string;
  summary: string;
  opponent: string;
  nets_score: number;
  opponent_score: number;
  vibe: string;
  image_url: string | null;
  created_at: string;
  user: { x_handle: string };
}

const vibeEmoji: Record<string, string> = {
  hyped: "🔥", solid: "💪", meh: "😐", pain: "😭", tank: "🪖",
};

function periodLabel(p: number): string {
  if (p <= 4) return `Q${p}`;
  return `OT${p - 4}`;
}

// ─── Draft Position Card ───
function DraftPositionCard() {
  const { lottery, isLoading } = useStandings();
  const top5 = lottery.slice(0, 5);

  const [games, setGames] = useState<ScoreGame[]>([]);
  const [nextGames, setNextGames] = useState<Record<string, NextGame>>({});

  const fetchScores = useCallback(async () => {
    try {
      const [scoresRes, nextRes] = await Promise.all([
        fetch("/api/scores"),
        fetch("/api/next-games"),
      ]);
      const scoresData = await scoresRes.json();
      const nextData = await nextRes.json();
      setGames(scoresData.games || []);
      setNextGames(nextData.nextGames || {});
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchScores();
    const interval = setInterval(fetchScores, 60000);
    return () => clearInterval(interval);
  }, [fetchScores]);

  function getGameLine(abbrev: string): { text: string; isLive: boolean } {
    const game = games.find(
      (g) => g.homeTeam.abbrev === abbrev || g.awayTeam.abbrev === abbrev
    );

    if (game) {
      const isHome = game.homeTeam.abbrev === abbrev;
      const teamScore = isHome ? game.homeTeam.score : game.awayTeam.score;
      const oppAbbrev = isHome ? game.awayTeam.abbrev : game.homeTeam.abbrev;
      const oppScore = isHome ? game.awayTeam.score : game.homeTeam.score;
      const prefix = isHome ? "vs" : "@";

      if (game.status === 3) {
        return { text: `${prefix} ${oppAbbrev}  ${teamScore} - ${oppScore}  FINAL`, isLive: false };
      }
      if (game.status === 2) {
        return { text: `${prefix} ${oppAbbrev}  ${teamScore} - ${oppScore}  ${periodLabel(game.period)}`, isLive: true };
      }
      return { text: `${prefix} ${oppAbbrev}  ${game.statusText}`, isLive: false };
    }

    const next = nextGames[abbrev];
    if (next) {
      return { text: `Next: ${next.isHome ? "vs" : "@"} ${next.opponent} — ${next.dayLabel}`, isLive: false };
    }

    return { text: "No game today", isLive: false };
  }

  return (
    <div className="bg-black text-white p-6 sm:p-8 h-full">
      <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase font-display mb-5 flex items-center gap-2">
        <span className="material-symbols-outlined text-brand-red" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
        Draft Position
      </h2>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse-soft" />)}
        </div>
      ) : (
        <div className="space-y-0">
          {top5.map((team, i) => {
            const isBKN = team.abbrev === "BKN";
            const gameLine = getGameLine(team.abbrev);
            const teamName = team.team.split(" ").pop()?.toUpperCase();

            return (
              <div key={team.abbrev} className={`py-3 ${i > 0 ? "border-t border-white/10" : ""}`}>
                {/* Team name + record */}
                <p className={`text-lg font-black ${isBKN ? "text-brand-red" : "text-white"}`}>
                  {i + 1}. {teamName} <span className="text-white/50 font-bold">({team.wins}-{team.losses})</span>
                </p>
                {/* Live score / next game — big and bold */}
                <p className={`text-base font-bold mt-0.5 tabular-nums ${
                  gameLine.isLive ? "text-brand-red" : "text-white/70"
                }`}>
                  {gameLine.text}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <Link
        href="/simulator"
        className="block w-full bg-brand-red text-white py-3.5 font-bold tracking-[0.15em] text-xs uppercase text-center hover:bg-red-700 transition-all mt-5"
      >
        Run Simulation
      </Link>
    </div>
  );
}

// ─── Hero Tabs (Game Recap, Game Preview, Top News) ───
function HeroTabs() {
  const [recaps, setRecaps] = useState<Recap[]>([]);
  const [articles, setArticles] = useState<{ id: string; title: string; body: string; tag: string; image_url: string | null; user: { x_handle: string } }[]>([]);
  const { lottery } = useStandings();
  const nets = getNetsFromStandings(lottery);

  useEffect(() => {
    async function load() {
      const [recapsRes, articlesRes] = await Promise.all([
        supabase.from("game_recaps").select("id, headline, summary, opponent, nets_score, opponent_score, vibe, image_url, created_at, user:users(x_handle)").order("created_at", { ascending: false }).limit(1),
        supabase.from("articles").select("id, title, body, tag, image_url, user:users(x_handle)").order("created_at", { ascending: false }).limit(1),
      ]);
      if (recapsRes.data) setRecaps(recapsRes.data as unknown as Recap[]);
      if (articlesRes.data) setArticles(articlesRes.data as unknown as typeof articles);
    }
    load();
  }, []);

  const recap = recaps[0];
  const article = articles[0];

  // Find next opponent from standings data
  const nextOpp = nets ? `Next game coming up` : "Season in progress";

  const tabs: Tab[] = [
    {
      id: "recap",
      label: "Game Recap",
      content: recap ? (
        <Link href="/community" className="grid grid-cols-2 gap-5 w-full h-full group">
          {recap.image_url ? (
            <img src={recap.image_url} alt="" className="rounded-lg w-full h-52 object-cover shadow-[0_0_20px_rgba(0,0,0,0.1)]" />
          ) : (
            <div className="rounded-lg w-full h-52 bg-gray-100 flex items-center justify-center">
              <span className="text-5xl">{vibeEmoji[recap.vibe] || "🏀"}</span>
            </div>
          )}
          <div className="flex flex-col gap-y-2 justify-center">
            <div className="flex items-center gap-2">
              <span className="text-lg">{vibeEmoji[recap.vibe] || "🏀"}</span>
              <span className={`text-sm font-black ${recap.nets_score > recap.opponent_score ? "text-accent-green" : "text-brand-red"}`}>
                BKN {recap.nets_score} - {recap.opponent} {recap.opponent_score}
              </span>
            </div>
            <h2 className="text-xl font-black mb-0 text-text-primary group-hover:text-brand-red transition-colors uppercase leading-tight">
              {recap.headline}
            </h2>
            <p className="text-sm text-text-secondary line-clamp-3">{recap.summary}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">by @{recap.user?.x_handle}</p>
          </div>
        </Link>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-xl font-black uppercase mb-1">No Recaps Yet</p>
          <p className="text-sm text-text-muted">Write the first post-game breakdown.</p>
          <Link href="/community" className="mt-3 bg-brand-red text-white px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-red-700 transition-all">
            Write Recap
          </Link>
        </div>
      ),
    },
    {
      id: "preview",
      label: "Game Preview",
      content: (
        <div className="grid grid-cols-2 gap-5 w-full h-full">
          <div className="rounded-lg w-full h-52 bg-black flex items-center justify-center">
            <span className="text-6xl font-black text-white/10 font-display">BKN</span>
          </div>
          <div className="flex flex-col gap-y-2 justify-center">
            <h2 className="text-xl font-black text-text-primary uppercase leading-tight">
              {nextOpp}
            </h2>
            <p className="text-sm text-text-secondary">
              {nets ? `The Nets sit at ${nets.wins}-${nets.losses} with ${nets.gamesRemaining} games remaining. Every result matters for draft positioning.` : "Check back for the next game preview."}
            </p>
            <Link href="/tiebreaker" className="text-[11px] font-bold text-brand-red uppercase tracking-wider mt-2 hover:underline">
              View Draft Scenarios →
            </Link>
          </div>
        </div>
      ),
    },
    {
      id: "news",
      label: "Top News",
      content: article ? (
        <Link href={`/community/${article.id}`} className="grid grid-cols-2 gap-5 w-full h-full group">
          {article.image_url ? (
            <img src={article.image_url} alt="" className="rounded-lg w-full h-52 object-cover shadow-[0_0_20px_rgba(0,0,0,0.1)]" />
          ) : (
            <div className="rounded-lg w-full h-52 bg-gray-100 flex items-center justify-center">
              <span className="text-4xl">📰</span>
            </div>
          )}
          <div className="flex flex-col gap-y-2 justify-center">
            <span className="text-[9px] font-black tracking-[0.2em] uppercase text-accent-blue">{article.tag}</span>
            <h2 className="text-xl font-black text-text-primary group-hover:text-brand-red transition-colors uppercase leading-tight">
              {article.title}
            </h2>
            <p className="text-sm text-text-secondary line-clamp-3">{article.body}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">by @{article.user?.x_handle}</p>
          </div>
        </Link>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-xl font-black uppercase mb-1">No Articles Yet</p>
          <p className="text-sm text-text-muted">Be the first to write one.</p>
          <Link href="/community" className="mt-3 bg-accent-blue text-white px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-blue-800 transition-all">
            Write Article
          </Link>
        </div>
      ),
    },
  ];

  return <AnimatedTabs tabs={tabs} defaultTab="recap" className="w-full" />;
}

// ─── Main Homepage ───
export default function HomeContent() {

  return (
    <div>
      {/* ═══ HERO — white bg, logo left + full recap tabs right ═══ */}
      <section className="bg-white border-b-[4px] border-brand-red">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-stretch">
            {/* Left: Logo */}
            <div className="flex items-center justify-center md:justify-start">
              <Image
                src="/logo2.png"
                alt="BK Grit"
                width={280}
                height={140}
                priority
                className="w-full max-w-[240px] h-auto"
              />
            </div>

            {/* Right: Animated recap tabs — takes up all remaining space */}
            <div className="flex-1">
              <HeroTabs />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BENTO GRID ═══ */}
      <section className="w-full px-3 py-6 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-[2px]">
          {/* The Wire (8 col) */}
          <div className="md:col-span-8 bg-white border border-gray-200 p-6 sm:p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase font-display">The Wire</h2>
              <Link href="/community" className="text-[10px] font-black tracking-[0.15em] uppercase border-b-2 border-brand-red pb-0.5 hover:text-brand-red transition-colors">
                Full Feed
              </Link>
            </div>
            <TheWire limit={8} showForm={false} showHotTake={true} />
          </div>

          {/* Draft Position (4 col) */}
          <div className="md:col-span-4">
            <DraftPositionCard />
          </div>
        </div>
      </section>

      {/* ═══ TOOL CARDS ═══ */}
      <section className="w-full px-3 py-6 sm:px-6 border-t-[4px] border-brand-red">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          <Link href="/gm-mode" className="bg-white border-t-4 border-brand-red p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[9px] font-black tracking-[0.2em] uppercase text-black/30 mb-2">War Room</p>
            <p className="text-xl font-black uppercase font-display">Play GM</p>
            <p className="text-[10px] font-bold text-brand-red uppercase mt-1 tracking-wider">Draft · Trade · Strategy</p>
          </Link>
          <Link href="/trade-machine" className="bg-white border-t-4 border-accent-blue p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[9px] font-black tracking-[0.2em] uppercase text-black/30 mb-2">Trade Machine</p>
            <p className="text-xl font-black uppercase font-display text-accent-blue">Build Trades</p>
            <p className="text-[10px] font-bold text-black/30 uppercase mt-1 tracking-wider">Salary Match · Fan Vote</p>
          </Link>
          <Link href="/tiebreaker" className="bg-white border-t-4 border-brand-orange p-5 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[9px] font-black tracking-[0.2em] uppercase text-black/30 mb-2">Tiebreaker</p>
            <p className="text-xl font-black uppercase font-display text-brand-orange">Scenarios</p>
            <p className="text-[10px] font-bold text-black/30 uppercase mt-1 tracking-wider">Position · Odds · What-If</p>
          </Link>
          <Link href="/simulator" className="bg-accent-blue p-5 flex flex-col justify-between">
            <p className="text-[9px] font-black tracking-[0.2em] uppercase text-white/40 mb-2">Lottery Sim</p>
            <p className="text-white text-base font-bold leading-tight uppercase italic font-display">&quot;Run the lottery. See where Brooklyn lands.&quot;</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
