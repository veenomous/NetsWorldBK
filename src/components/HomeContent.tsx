"use client";

import { useState, useEffect, useCallback } from "react";
import { useStandings, getNetsFromStandings } from "@/lib/useStandings";
import { supabase } from "@/lib/supabase";
import { AnimatedTabs, type Tab } from "@/components/ui/animated-tabs";
import TheWire from "@/components/TheWire";
import DailyPoll from "@/components/DailyPoll";
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

// ─── Placeholder image for tabs without content ───
function PlaceholderImage({ text }: { text: string }) {
  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center">
      <span className="text-5xl font-black text-white/10 font-display">{text}</span>
    </div>
  );
}

// ─── Hero Tabs ───
interface HeroArticle { id: string; title: string; body: string; tag: string; image_url: string | null; created_at: string; user: { x_handle: string } }

function HeroTabs() {
  const [recaps, setRecaps] = useState<Recap[]>([]);
  const [newsArticles, setNewsArticles] = useState<HeroArticle[]>([]);
  const [opinionArticles, setOpinionArticles] = useState<HeroArticle[]>([]);
  const [nextGame, setNextGame] = useState<{ opponent: string; isHome: boolean; dayLabel: string } | null>(null);
  const { lottery } = useStandings();
  const nets = getNetsFromStandings(lottery);

  useEffect(() => {
    async function load() {
      const [recapsRes, newsRes, opinionRes, nextRes] = await Promise.all([
        supabase.from("game_recaps").select("id, headline, summary, opponent, nets_score, opponent_score, vibe, image_url, created_at, user:users(x_handle)").order("created_at", { ascending: false }).limit(1),
        supabase.from("articles").select("id, title, body, tag, image_url, created_at, user:users(x_handle)").eq("tag", "News").order("created_at", { ascending: false }).limit(1),
        supabase.from("articles").select("id, title, body, tag, image_url, created_at, user:users(x_handle)").eq("tag", "Opinion").order("created_at", { ascending: false }).limit(1),
        fetch("/api/next-games").then(r => r.json()).catch(() => ({ nextGames: {} })),
      ]);
      if (recapsRes.data) setRecaps(recapsRes.data as unknown as Recap[]);
      if (newsRes.data) setNewsArticles(newsRes.data as unknown as HeroArticle[]);
      if (opinionRes.data) setOpinionArticles(opinionRes.data as unknown as HeroArticle[]);
      if (nextRes.nextGames?.BKN) setNextGame(nextRes.nextGames.BKN);
    }
    load();
  }, []);

  const recap = recaps[0];
  const news = newsArticles[0];
  const opinion = opinionArticles[0];
  const recapOpponent = recap?.opponent || "TBD";
  const nextOpp = nextGame ? `${nextGame.isHome ? "vs" : "@"} ${nextGame.opponent} — ${nextGame.dayLabel}` : "TBD";

  // Helper to render a tab content card
  function tabCard(item: { href: string; imageUrl: string | null; placeholderText: string; tag?: string; tagColor?: string; title: string; body: string; author?: string; meta?: React.ReactNode }) {
    return (
      <Link href={item.href} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-5 w-full group">
        <div className="relative w-full h-0 pb-[60%] overflow-hidden rounded-lg bg-gray-100">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-top" />
          ) : (
            <PlaceholderImage text={item.placeholderText} />
          )}
        </div>
        <div className="flex flex-col gap-y-2 justify-center">
          {item.meta}
          {item.tag && <span className={`text-[9px] font-black tracking-[0.2em] uppercase ${item.tagColor || "text-accent-blue"}`}>{item.tag}</span>}
          <h2 className="text-lg font-black text-text-primary group-hover:text-brand-red transition-colors uppercase leading-tight">{item.title}</h2>
          <p className="text-sm text-text-secondary line-clamp-3">{item.body}</p>
          {item.author && <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">by @{item.author}</p>}
        </div>
      </Link>
    );
  }

  function emptyCard(title: string, cta: string, href: string, color: string) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-5 w-full">
        <div className="relative w-full h-0 pb-[60%] overflow-hidden rounded-lg"><PlaceholderImage text="BKN" /></div>
        <div className="flex flex-col gap-y-2 justify-center items-start">
          <p className="text-lg font-black uppercase">{title}</p>
          <p className="text-sm text-text-muted">Be the first to write one.</p>
          <Link href={href} className={`mt-2 ${color} text-white px-5 py-2 text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-all`}>{cta}</Link>
        </div>
      </div>
    );
  }

  const tabs: Tab[] = [
    {
      id: "news",
      label: "Top News",
      content: news
        ? tabCard({ href: `/community/article-${news.id}`, imageUrl: news.image_url, placeholderText: "NEWS", tag: "News", tagColor: "text-accent-blue", title: news.title, body: news.body, author: news.user?.x_handle })
        : emptyCard("No News Yet", "Write Article", "/community", "bg-accent-blue"),
    },
    {
      id: "preview",
      label: "Game Preview",
      content: tabCard({
        href: "/tiebreaker",
        imageUrl: null,
        placeholderText: `BKN`,
        tag: `Next: ${nextOpp}`,
        tagColor: "text-accent-green",
        title: nets ? `Nets (${nets.wins}-${nets.losses}) — ${nets.gamesRemaining} Games Left` : "Season in Progress",
        body: nets ? `Currently sitting at #${nets.lotteryRank} in the draft. ${nets.top1Odds.toFixed(1)}% chance at the #1 pick. Every result matters for positioning.` : "Check back soon.",
      }),
    },
    {
      id: "recap",
      label: `Game Recap${recap ? ` (Nets vs ${recapOpponent})` : ""}`,
      content: recap
        ? tabCard({
            href: `/community/recap-${recap.id}`,
            imageUrl: recap.image_url,
            placeholderText: "RECAP",
            meta: (
              <div className="flex items-center gap-2">
                <span className="text-lg">{vibeEmoji[recap.vibe] || "🏀"}</span>
                <span className={`text-sm font-black ${recap.nets_score > recap.opponent_score ? "text-accent-green" : "text-brand-red"}`}>
                  BKN {recap.nets_score} - {recap.opponent} {recap.opponent_score}
                </span>
              </div>
            ),
            title: recap.headline,
            body: recap.summary,
            author: recap.user?.x_handle,
          })
        : emptyCard("No Recaps Yet", "Write Recap", "/community", "bg-brand-red"),
    },
    {
      id: "opinion",
      label: "Opinion",
      content: opinion
        ? tabCard({ href: `/community/article-${opinion.id}`, imageUrl: opinion.image_url, placeholderText: "OPINION", tag: "Opinion", tagColor: "text-accent-purple", title: opinion.title, body: opinion.body, author: opinion.user?.x_handle })
        : emptyCard("No Opinions Yet", "Share Your Take", "/community", "bg-accent-purple"),
    },
  ];

  // Default to the most recent article across all types
  const allDates = [
    news ? { id: "news", date: new Date(news.created_at).getTime() } : null,
    recap ? { id: "recap", date: new Date(recap.created_at).getTime() } : null,
    opinion ? { id: "opinion", date: new Date(opinion.created_at).getTime() } : null,
  ].filter(Boolean) as { id: string; date: number }[];
  const mostRecent = allDates.sort((a, b) => b.date - a.date)[0]?.id || "news";

  return <AnimatedTabs tabs={tabs} defaultTab={mostRecent} className="w-full" />;
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
          {/* Draft Position + Polls (4 col) — first on mobile */}
          <div className="md:col-span-4 md:order-2 flex flex-col gap-[2px]">
            <DraftPositionCard />
            <div className="bg-white border border-gray-200 p-5">
              <DailyPoll />
            </div>
          </div>

          {/* The Wire (8 col) — second on mobile, first on desktop */}
          <div className="md:col-span-8 md:order-1 bg-white border border-gray-200 p-6 sm:p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase font-display">The Wire</h2>
              <Link href="/wire" className="text-[10px] font-black tracking-[0.15em] uppercase border-b-2 border-brand-red pb-0.5 hover:text-brand-red transition-colors">
                Full Feed
              </Link>
            </div>
            <TheWire limit={8} showForm={false} showHotTake={true} />
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
