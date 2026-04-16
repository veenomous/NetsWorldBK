"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import KBSearch from "@/components/KBSearch";
import KBMiniGraph from "@/components/KBMiniGraph";
import KBChangelog from "@/components/KBChangelog";
import { netsPicks, totalFirstRoundPicks, totalSwaps } from "@/data/picks";
import { kbPlayers } from "@/data/kb-players";

const PICKS = netsPicks;
const PLAYERS = kbPlayers;

const sourceColor: Record<string, string> = {
  own: "bg-brand-red text-white",
  suns: "bg-brand-red/70 text-white",
  knicks: "bg-accent-blue text-white",
  rockets: "bg-brand-red/50 text-white",
  mavs: "bg-accent-blue/70 text-white",
};

const confColor = { high: "tag-green", medium: "tag-blue", low: "tag-red" };

const categoryIcon: Record<string, string> = {
  players: "person",
  seasons: "calendar_month",
  trades: "swap_horiz",
  "front-office": "corporate_fare",
  draft: "format_list_numbered",
  rivalries: "swords",
  assets: "payments",
  strategy: "strategy",
  community: "groups",
  rumors: "local_fire_department",
};

interface KBArticleProps {
  title: string;
  category: string;
  slug: string;
  confidence: "high" | "medium" | "low";
  last_updated: string;
  tags: string[];
}

interface KBCategoryProps {
  name: string;
  label: string;
  count: number;
}

interface KBChangelogEntry {
  date: string;
  changes: { article: string; description: string }[];
}

interface KBDashboardProps {
  articles: KBArticleProps[];
  categories: KBCategoryProps[];
  changelog: KBChangelogEntry[];
}

/* ═══════════════════════════════════════════
   MAIN DASHBOARD — Narrative Layout
   ═══════════════════════════════════════════ */

function TradeTree() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const N = (props: { href: string; id: string; x: number; y: number; w: number; children: React.ReactNode }) => (
    <Link href={props.href} className="absolute" style={{ left: props.x - props.w / 2, top: props.y }}
      onMouseEnter={() => setHoveredNode(props.id)} onMouseLeave={() => setHoveredNode(null)}>
      <div className={`bg-black border-2 transition-all px-4 py-3 text-center ${hoveredNode === props.id ? "border-brand-red shadow-[0_0_20px_rgba(228,60,62,0.3)]" : "border-white/10"}`} style={{ width: props.w }}>
        {props.children}
      </div>
    </Link>
  );
  return (
    <div className="relative" style={{ width: 800, height: 600 }}>
      <svg className="absolute inset-0" width="800" height="600" fill="none">
        <path d="M 400 55 L 400 110" stroke="#E43C3E" strokeWidth="2" strokeDasharray="6 3" opacity="0.5" />
        <path d="M 400 145 L 150 210" stroke="#fff" strokeWidth="1" opacity="0.1" />
        <path d="M 400 145 L 400 210" stroke="#fff" strokeWidth="1" opacity="0.1" />
        <path d="M 400 145 L 650 210" stroke="#fff" strokeWidth="1" opacity="0.1" />
        <path d="M 150 270 L 150 320" stroke="#E43C3E" strokeWidth="2" strokeDasharray="6 3" opacity="0.5" />
        <path d="M 150 355 L 80 400" stroke="#0047AB" strokeWidth="1" opacity="0.2" />
        <path d="M 150 355 L 220 400" stroke="#0047AB" strokeWidth="1" opacity="0.2" />
        <path d="M 400 270 L 400 320" stroke="#E43C3E" strokeWidth="2" strokeDasharray="6 3" opacity="0.5" />
        <path d="M 400 355 L 340 400" stroke="#fff" strokeWidth="1" opacity="0.1" />
        <path d="M 400 355 L 470 400" stroke="#fff" strokeWidth="1" opacity="0.1" />
        <circle r="3" fill="#E43C3E" opacity="0.8"><animateMotion dur="2s" repeatCount="indefinite" path="M 400 55 L 400 145" /></circle>
        <circle r="3" fill="#E43C3E" opacity="0.8"><animateMotion dur="2s" repeatCount="indefinite" path="M 150 270 L 150 355" /></circle>
        <circle r="3" fill="#E43C3E" opacity="0.8"><animateMotion dur="2s" repeatCount="indefinite" path="M 400 270 L 400 355" /></circle>
      </svg>
      <N href="/kb/trades/kevin-durant-trade-tree" id="kd" x={400} y={10} w={180}>
        <p className="font-display font-black text-white text-base uppercase">Kevin Durant</p>
        <p className="text-[10px] text-white/40 uppercase mt-0.5">FEB 2023 → PHX</p>
      </N>
      <div className="absolute text-center" style={{ left: 345, top: 110 }}>
        <div className="bg-brand-red/10 border border-brand-red/30 px-4 py-1.5 w-[110px]">
          <p className="font-display font-bold text-brand-red text-[10px] tracking-[0.15em] uppercase">Suns Return</p>
        </div>
      </div>
      <N href="/kb/trades/kevin-durant-trade-tree" id="bridges" x={150} y={210} w={160}>
        <p className="font-display font-black text-white text-sm uppercase">Mikal Bridges</p>
        <p className="text-[10px] text-brand-red font-bold mt-1">→ TRADED TO NYK</p>
      </N>
      <N href="/kb/players/cameron-johnson" id="cam" x={400} y={210} w={160}>
        <p className="font-display font-black text-white text-sm uppercase">Cam Johnson</p>
        <p className="text-[10px] text-brand-red font-bold mt-1">→ TRADED TO DEN</p>
      </N>
      <div className="absolute" style={{ left: 570, top: 210 }}>
        <div className="bg-black border-2 border-brand-red/30 px-4 py-3 w-[160px] text-center">
          <p className="font-display font-black text-white text-sm uppercase">4 Suns FRPs</p>
          <p className="text-[10px] text-brand-red font-bold mt-1">&apos;25 &apos;27 &apos;29 + SWAP</p>
        </div>
      </div>
      <div className="absolute text-center" style={{ left: 90, top: 320 }}>
        <div className="bg-accent-blue/10 border border-accent-blue/30 px-3 py-1.5 w-[120px]">
          <p className="font-display font-bold text-accent-blue text-[9px] tracking-[0.15em] uppercase">Knicks Return</p>
        </div>
      </div>
      <div className="absolute text-center" style={{ left: 340, top: 320 }}>
        <div className="bg-white/5 border border-white/10 px-3 py-1.5 w-[120px]">
          <p className="font-display font-bold text-white/60 text-[9px] tracking-[0.15em] uppercase">Denver Return</p>
        </div>
      </div>
      <div className="absolute" style={{ left: 15, top: 400 }}>
        <div className="bg-black border-2 border-accent-blue/40 px-3 py-3 w-[130px] text-center">
          <p className="font-display font-bold text-white text-xs uppercase">4 Knicks FRPs</p>
          <p className="text-[10px] text-accent-blue font-bold mt-0.5">&apos;25 &apos;27 &apos;29 &apos;31</p>
        </div>
      </div>
      <div className="absolute" style={{ left: 160, top: 400 }}>
        <div className="bg-black border-2 border-accent-blue/20 px-3 py-3 w-[100px] text-center">
          <p className="font-display font-bold text-white text-xs uppercase">&apos;28 Swap</p>
        </div>
      </div>
      <N href="/kb/players/michael-porter-jr" id="mpj" x={340} y={400} w={130}>
        <p className="font-display font-black text-white text-xs uppercase">MPJ</p>
        <p className="text-[10px] text-accent-green font-bold mt-0.5">24.2 PPG</p>
      </N>
      <div className="absolute" style={{ left: 410, top: 400 }}>
        <div className="bg-black border-2 border-white/10 px-3 py-3 w-[110px] text-center">
          <p className="font-display font-bold text-white text-xs uppercase">&apos;32 DEN 1st</p>
        </div>
      </div>
      <div className="absolute" style={{ right: 0, bottom: 0 }}>
        <div className="border-2 border-brand-red px-5 py-3 text-center">
          <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase font-bold">From One Trade</p>
          <p className="font-display font-black text-brand-red text-2xl leading-none mt-1">6 FRPs + MPJ</p>
        </div>
      </div>
    </div>
  );
}

export default function KBDashboard({ articles, categories, changelog }: KBDashboardProps) {
  const [showTradeTree, setShowTradeTree] = useState(true);
  const rumors = articles.filter(a => a.category === "rumors");
  const tradeArticles = articles.filter(a => a.category === "trades");
  const playerArticles = articles.filter(a => a.category === "players");
  const conceptArticles = articles.filter(a => a.category === "concepts");
  const draftArticles = articles.filter(a => a.category === "draft");
  const seasonArticles = articles.filter(a => a.category === "seasons");

  return (
    <div className="min-h-screen bg-bg-primary">

      {/* ═══ 1. HERO ═══ */}
      <section className="bg-bg-primary px-4 sm:px-8 pt-6 pb-8 border-b border-black/10 overflow-hidden">
        <div className="max-w-4xl mx-auto overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-start">
            <div className="flex-1">
              <Image src="/logo2.png" alt="BK Grit" width={160} height={80} priority className="w-[120px] sm:w-[140px] h-auto mb-4" />
              <h1 className="font-display font-black text-text-primary uppercase tracking-[-0.03em] leading-[0.85] text-2xl sm:text-4xl mb-3">
                The Brooklyn Nets<br /><span className="text-brand-red">Wiki.</span>
              </h1>
              <p className="text-text-muted font-body text-sm max-w-md leading-relaxed mb-5">
                Every trade, every pick, every prospect — traced, connected, and updated.
              </p>
              <KBSearch />
              {/* Mini graph — below search on mobile */}
              <div className="sm:hidden mt-4">
                <KBMiniGraph />
              </div>
            </div>
            {/* Mini graph — beside content on desktop */}
            <div className="hidden sm:block shrink-0">
              <KBMiniGraph />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 2. THE STORY SO FAR ═══ */}
      <section className="bg-bg-primary px-4 sm:px-8 py-10 border-b-4 border-brand-red">
        <div className="max-w-4xl mx-auto">
          <p className="font-body text-text-secondary text-base sm:text-lg leading-relaxed">
            In February 2023, the Brooklyn Nets traded <Link href="/kb/trades/kevin-durant-trade-tree" className="text-brand-red font-semibold hover:underline">Kevin Durant</Link> and <Link href="/kb/trades/kyrie-irving-trade" className="text-brand-red font-semibold hover:underline">Kyrie Irving</Link>, ending the most ambitious and catastrophic superstar experiment in franchise history. What they got back — <span className="font-semibold text-text-primary">multiple first-round picks, swaps, and Michael Porter Jr.</span> — fueled the most aggressive rebuild in the NBA. Now in Year 2 with <Link href="/kb/players/egor-demin" className="text-brand-red font-semibold hover:underline">five rookie first-rounders</Link>, a <Link href="/kb/strategy/rebuild-timeline" className="text-brand-red font-semibold hover:underline">target window of 2027-28</Link>, and <Link href="/kb/assets/nets-pick-inventory" className="text-brand-red font-semibold hover:underline">picks owed through 2032</Link> — Brooklyn has the assets. The question is whether they can build a winner.
          </p>
        </div>
      </section>

      {/* ═══ 3. WHAT'S HAPPENING NOW ═══ */}
      {rumors.length > 0 && (
        <section className="bg-bg-primary px-4 sm:px-8 py-10 border-b border-black/5">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-text-primary">
                <span className="text-brand-red">What&apos;s</span> Happening Now
              </h2>
              <Link href="/kb/category/rumors" className="text-[10px] text-brand-red font-bold uppercase tracking-wider hover:underline">All Rumors</Link>
            </div>
            <div className="space-y-3">
              {rumors.map(rumor => (
                <Link key={rumor.slug} href={`/kb/${rumor.category}/${rumor.slug}`} className="block border-l-4 border-l-brand-red border border-black/5 p-4 hover:bg-bg-surface transition-colors group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-display font-black text-base uppercase tracking-tight text-text-primary group-hover:text-brand-red transition-colors">{rumor.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`tag ${confColor[rumor.confidence]}`} style={{ fontSize: "9px" }}>{rumor.confidence} confidence</span>
                        {rumor.tags.filter(t => t !== "rumor").slice(0, 2).map(tag => (
                          <span key={tag} className="tag tag-blue" style={{ fontSize: "8px", padding: "1px 6px" }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-text-muted/30 group-hover:text-brand-red text-lg transition-colors mt-1">arrow_forward</span>
                  </div>
                </Link>
              ))}
              {/* Fan Pulse link */}
              <Link href="/kb/community/fan-pulse" className="block border-l-4 border-l-accent-blue border border-black/5 p-4 hover:bg-bg-surface transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-display font-black text-base uppercase tracking-tight text-text-primary group-hover:text-accent-blue transition-colors">Fan Pulse</p>
                    <p className="text-text-muted text-xs font-body mt-1">Live fan sentiment from Wire takes, player ratings, and polls</p>
                  </div>
                  <span className="material-symbols-outlined text-text-muted/30 group-hover:text-accent-blue text-lg transition-colors mt-1">arrow_forward</span>
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══ CONTRIBUTE CTA ═══ */}
      <section className="bg-bg-primary px-4 sm:px-8 py-8 border-b border-black/5">
        <div className="max-w-4xl mx-auto">
          <Link href="/kb/submit" className="block bg-black p-6 hover:bg-black/90 transition-colors group">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-brand-red text-3xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                <div>
                  <p className="font-display font-black text-white text-base sm:text-lg uppercase tracking-tight group-hover:text-brand-red transition-colors">Help Build the Wiki</p>
                  <p className="text-white/40 text-xs font-body mt-1 max-w-md">Found a Nets article, tweet, scouting report, or trade rumor? Submit it. The best sources get compiled into the wiki by our AI agents.</p>
                </div>
              </div>
              <span className="bg-brand-red text-white font-display font-bold text-xs uppercase tracking-wider px-5 py-2.5 shrink-0 group-hover:bg-white group-hover:text-black transition-colors">
                Submit a Source
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ═══ 4. HOW WE GOT HERE — Trades ═══ */}
      <section className="bg-bg-primary px-4 sm:px-8 py-10 border-b border-black/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-text-primary mb-2">
            How We <span className="text-brand-red">Got Here</span>
          </h2>
          <p className="text-text-muted font-body text-sm mb-6">Three trades dismantled the superstar era. Each one funded the rebuild.</p>

          {/* Trade Tree Toggle — above the trade cards */}
          <button
            onClick={() => setShowTradeTree(!showTradeTree)}
            className="mb-4 w-full border border-black/10 p-3 text-center hover:border-brand-red/30 transition-colors group cursor-pointer"
          >
            <span className="font-display font-bold text-xs uppercase tracking-wider text-text-muted group-hover:text-brand-red transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">{showTradeTree ? "expand_less" : "account_tree"}</span>
              {showTradeTree ? "Hide Trade Tree" : "View the KD Trade Tree"}
            </span>
          </button>
          {showTradeTree && (
            <div className="mb-6 animate-slide-up">
              {/* Desktop: SVG trade tree */}
              <div style={{ display: "none" }} className="trade-tree-desktop overflow-x-auto scrollbar-hide">
                <TradeTree />
              </div>
              {/* Mobile: vertical card layout */}
              <div className="trade-tree-mobile space-y-2">
                <Link href="/kb/trades/kevin-durant-trade-tree" className="block bg-black text-white p-4">
                  <p className="font-display font-black text-sm uppercase">Kevin Durant</p>
                  <p className="text-[10px] text-white/40 uppercase mt-0.5">FEB 2023 → PHX</p>
                </Link>
                <div className="flex items-center gap-2 pl-4 py-1">
                  <div className="w-3 h-3 bg-brand-red rounded-full animate-pulse-soft" />
                  <span className="text-[10px] text-brand-red font-bold tracking-[0.15em] uppercase">Suns Return</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pl-4">
                  <Link href="/kb/trades/kevin-durant-trade-tree" className="bg-black text-white p-3">
                    <p className="font-display font-bold text-xs uppercase">Mikal Bridges</p>
                    <p className="text-[10px] text-brand-red font-bold mt-1">→ NYK</p>
                  </Link>
                  <Link href="/kb/players/cameron-johnson" className="bg-black text-white p-3">
                    <p className="font-display font-bold text-xs uppercase">Cam Johnson</p>
                    <p className="text-[10px] text-brand-red font-bold mt-1">→ DEN</p>
                  </Link>
                </div>
                <div className="pl-4 bg-black text-white p-3">
                  <p className="font-display font-bold text-xs uppercase">4 Suns FRPs</p>
                  <p className="text-[10px] text-brand-red font-bold mt-1">&apos;25, &apos;27, &apos;29 + &apos;28 SWAP</p>
                </div>
                <div className="flex items-center gap-2 pl-8 py-1">
                  <div className="w-3 h-3 bg-accent-blue rounded-full animate-pulse-soft" style={{ animationDelay: "0.5s" }} />
                  <span className="text-[10px] text-accent-blue font-bold tracking-[0.15em] uppercase">Bridges → Knicks</span>
                </div>
                <div className="pl-8 bg-black text-white p-3">
                  <p className="font-display font-bold text-xs uppercase">4 Knicks FRPs</p>
                  <p className="text-[10px] text-accent-blue font-bold mt-1">&apos;25, &apos;27, &apos;29, &apos;31 + &apos;28 SWAP</p>
                </div>
                <div className="flex items-center gap-2 pl-8 py-1">
                  <div className="w-3 h-3 bg-accent-green rounded-full animate-pulse-soft" style={{ animationDelay: "1s" }} />
                  <span className="text-[10px] text-text-secondary font-bold tracking-[0.15em] uppercase">Cam J → Denver</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pl-8">
                  <Link href="/kb/players/michael-porter-jr" className="bg-black text-white p-3 border border-accent-green/30">
                    <p className="font-display font-bold text-xs uppercase">MPJ</p>
                    <p className="text-[10px] text-accent-green font-bold mt-1">24.2 PPG</p>
                  </Link>
                  <div className="bg-black text-white p-3">
                    <p className="font-display font-bold text-xs uppercase">&apos;32 DEN 1st</p>
                  </div>
                </div>
                <div className="bg-black border-2 border-brand-red p-3 text-center mt-2" style={{ animation: "glow-pulse 3s ease-in-out infinite" }}>
                  <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase font-bold">Total from KD</p>
                  <p className="font-display font-black text-brand-red text-xl leading-none mt-1">6 FRPs + MPJ</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {/* KD Trade */}
            <Link href="/kb/trades/kevin-durant-trade-tree" className="block bg-black text-white p-5 hover:bg-black/90 transition-colors group">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white/40 text-[10px] tracking-[0.15em] uppercase font-bold mb-1">FEB 2023</p>
                  <p className="font-display font-black text-lg uppercase tracking-tight group-hover:text-brand-red transition-colors">Kevin Durant → Phoenix</p>
                  <p className="text-white/40 font-body text-sm mt-1">Multiple firsts, swaps, and Michael Porter Jr. The foundational trade.</p>
                </div>
                <span className="material-symbols-outlined text-brand-red text-2xl">account_tree</span>
              </div>
            </Link>
            {/* Kyrie Trade */}
            <Link href="/kb/trades/kyrie-irving-trade" className="block bg-black text-white p-5 hover:bg-black/90 transition-colors group">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white/40 text-[10px] tracking-[0.15em] uppercase font-bold mb-1">FEB 2023</p>
                  <p className="font-display font-black text-lg uppercase tracking-tight group-hover:text-brand-red transition-colors">Kyrie Irving → Dallas</p>
                  <p className="text-white/40 font-body text-sm mt-1">2029 unprotected first. The end of the chaos era.</p>
                </div>
                <span className="font-display font-black text-brand-red text-2xl">1</span>
              </div>
            </Link>
            {/* Harden Trade */}
            <Link href="/kb/trades/james-harden-trade" className="block bg-black text-white p-5 hover:bg-black/90 transition-colors group">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white/40 text-[10px] tracking-[0.15em] uppercase font-bold mb-1">FEB 2022</p>
                  <p className="font-display font-black text-lg uppercase tracking-tight group-hover:text-brand-red transition-colors">James Harden → Philadelphia</p>
                  <p className="text-white/40 font-body text-sm mt-1">The Rockets pick that became Danny Wolf. The first domino.</p>
                </div>
                <span className="font-display font-black text-brand-red text-2xl">1</span>
              </div>
            </Link>
          </div>
          <div className="mt-6 pt-4 border-t border-black/10 flex items-center justify-between">
            <p className="text-text-muted text-xs font-body">Total first-round picks controlled through 2032</p>
            <p className="font-display font-black text-brand-red text-3xl">{totalFirstRoundPicks + totalSwaps}</p>
          </div>
        </div>
      </section>

      {/* ═══ 5. THE ARSENAL — Picks + Players ═══ */}
      <section className="bg-bg-primary px-4 sm:px-8 py-10 border-b border-black/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-text-primary mb-2">
            The <span className="text-brand-red">Arsenal</span>
          </h2>
          <p className="text-text-muted font-body text-sm mb-6">The picks and players that define the rebuild.</p>

          {/* Picks */}
          <h3 className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-brand-red" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
            Pick Inventory Through 2032
          </h3>
          <div className="space-y-2 mb-8">
            {PICKS.map((yearGroup) => (
              <div key={yearGroup.year} className="flex items-center gap-3">
                <span className="font-display font-black text-lg text-text-primary w-12 shrink-0">{yearGroup.year}</span>
                <div className="flex flex-wrap gap-1.5">
                  {yearGroup.picks.map((pick, pi) => (
                    <Link key={pi} href={pick.href}>
                      <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${(pick as { isSwap?: boolean }).isSwap ? "border border-dashed border-black/20 text-text-muted" : sourceColor[pick.source]}`}>
                        {pick.label} {(pick as { isSwap?: boolean }).isSwap ? "(swap)" : ""}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Players */}
          <h3 className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-brand-red" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            The Core
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PLAYERS.map(player => (
              <Link key={player.name} href={player.href} className="border border-black/10 p-4 hover:border-brand-red/30 transition-colors group">
                <p className="font-display font-black text-sm tracking-tight uppercase group-hover:text-brand-red transition-colors">{player.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-text-muted text-xs font-body">{player.pos}</span>
                  <span className="text-text-primary text-xs font-bold font-body">{player.stat}</span>
                </div>
                <span className={`tag ${player.statusColor} mt-2`}>{player.status}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 6. THE PEOPLE ═══ */}
      <section className="bg-bg-primary px-4 sm:px-8 py-10 border-b border-black/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-text-primary mb-6">
            Who&apos;s <span className="text-brand-red">Steering</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/kb/front-office/sean-marks-era" className="border border-black/10 p-5 hover:border-brand-red/30 transition-colors group">
              <p className="font-display font-black text-base uppercase tracking-tight group-hover:text-brand-red transition-colors">Sean Marks</p>
              <p className="text-text-muted text-[10px] uppercase tracking-wider font-bold mt-0.5">General Manager</p>
              <p className="text-text-secondary text-xs font-body mt-2 leading-relaxed">Best trade-maker in the NBA. Master trade-maker behind the rebuild&apos;s asset haul. Now faces the test he&apos;s never passed: developing draft picks into stars.</p>
            </Link>
            <Link href="/kb/front-office/jordi-fernandez" className="border border-black/10 p-5 hover:border-brand-red/30 transition-colors group">
              <p className="font-display font-black text-base uppercase tracking-tight group-hover:text-brand-red transition-colors">Jordi Fernandez</p>
              <p className="text-text-muted text-[10px] uppercase tracking-wider font-bold mt-0.5">Head Coach</p>
              <p className="text-text-secondary text-xs font-body mt-2 leading-relaxed">First Spanish NBA head coach. PhD-track sports psychologist. Worked with LeBron, Jokic. Building the culture from scratch.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ 7. DEEP DIVES — Browse the Wiki ═══ */}
      <section className="bg-bg-primary px-4 sm:px-8 py-10 border-b border-black/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-text-primary mb-6">
            Deep <span className="text-brand-red">Dives</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map(cat => (
              <Link key={cat.name} href={`/kb/category/${cat.name}`} className="border border-black/10 p-4 hover:border-brand-red/30 transition-colors group text-center">
                <span className="material-symbols-outlined text-text-muted group-hover:text-brand-red transition-colors text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {categoryIcon[cat.name] || "article"}
                </span>
                <p className="font-display font-bold text-sm uppercase tracking-tight text-text-primary group-hover:text-brand-red transition-colors mt-2">{cat.label}</p>
                <p className="text-text-muted text-xs font-body mt-0.5">{cat.count} {cat.count === 1 ? "article" : "articles"}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 8. WHAT CHANGED ═══ */}
      {changelog.length > 0 && (
        <section className="bg-bg-primary px-4 sm:px-8 py-10 border-b border-black/5">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display font-black text-sm uppercase tracking-[0.1em] text-text-secondary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-red text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>update</span>
              What Changed
            </h2>
            <KBChangelog entries={changelog} />
          </div>
        </section>
      )}

      {/* ═══ 9. EXPLORE ═══ */}
      <section className="bg-bg-primary px-4 sm:px-8 py-10 border-b border-black/5">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/kb/graph" className="bg-black text-white p-5 hover:bg-black/90 transition-colors group text-center">
              <span className="material-symbols-outlined text-brand-red text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
              <p className="font-display font-black text-sm uppercase tracking-tight mt-2 group-hover:text-brand-red transition-colors">Knowledge Graph</p>
              <p className="text-white/30 text-xs font-body mt-1">See how everything connects</p>
            </Link>
            <Link href="/kb/submit" className="bg-black text-white p-5 hover:bg-black/90 transition-colors group text-center">
              <span className="material-symbols-outlined text-brand-red text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              <p className="font-display font-black text-sm uppercase tracking-tight mt-2 group-hover:text-brand-red transition-colors">Submit a Source</p>
              <p className="text-white/30 text-xs font-body mt-1">Help build the wiki</p>
            </Link>
            <Link href="/wire" className="bg-black text-white p-5 hover:bg-black/90 transition-colors group text-center">
              <span className="material-symbols-outlined text-brand-red text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
              <p className="font-display font-black text-sm uppercase tracking-tight mt-2 group-hover:text-brand-red transition-colors">The Wire</p>
              <p className="text-white/30 text-xs font-body mt-1">Fan takes and discussion</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <section className="bg-bg-primary px-4 sm:px-8 py-5 border-t border-black/10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-text-muted/40 text-[10px] tracking-[0.3em] uppercase font-bold">
            AI-compiled · Human-curated · {articles.length} articles · Updated daily
          </p>
        </div>
      </section>
    </div>
  );
}
