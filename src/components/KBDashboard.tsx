"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import KBSearch from "@/components/KBSearch";
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

const TIMELINE = [
  { date: "FEB 2023", event: "KD traded to Suns", detail: "Bridges + Cam + 4 FRPs + swap", type: "trade" as const },
  { date: "FEB 2023", event: "Kyrie traded to Mavs", detail: "2 FRPs returned", type: "trade" as const },
  { date: "JUN 2024", event: "Bridges traded to Knicks", detail: "4 FRPs + swap returned", type: "trade" as const },
  { date: "JUL 2025", event: "Cam Johnson to Denver", detail: "MPJ + 2032 DEN 1st returned", type: "trade" as const },
  { date: "JUN 2025", event: "5 first-rounders drafted", detail: "Demin, Traore, Powell, Saraf, Wolf", type: "draft" as const },
  { date: "2025-26", event: "Year 2: Development", detail: "20-60, rookies getting reps", type: "season" as const },
];

const confColor = { high: "tag-green", medium: "tag-gold", low: "tag-red" };

const categoryIcon: Record<string, string> = {
  players: "person",
  seasons: "calendar_month",
  trades: "swap_horiz",
  "front-office": "corporate_fare",
  draft: "format_list_numbered",
  rivalries: "swords",
  concepts: "school",
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
   TRADE TREE — SVG (desktop only)
   ═══════════════════════════════════════════ */

function TradeTree() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <div className="relative w-full">
      <div className="relative" style={{ width: 800, height: 680 }}>
        <svg className="absolute inset-0" width="800" height="680" fill="none">
          <path d="M 400 65 L 400 125" stroke="#E43C3E" strokeWidth="2" strokeDasharray="6 3" opacity="0.6" />
          <path d="M 400 155 L 140 240" stroke="#1a1c1c" strokeWidth="2" opacity="0.2" />
          <path d="M 400 155 L 400 240" stroke="#1a1c1c" strokeWidth="2" opacity="0.2" />
          <path d="M 400 155 L 660 240" stroke="#1a1c1c" strokeWidth="2" opacity="0.2" />
          <path d="M 140 295 L 140 365" stroke="#E43C3E" strokeWidth="2" strokeDasharray="6 3" opacity="0.6" />
          <path d="M 140 395 L 80 450" stroke="#0047AB" strokeWidth="2" opacity="0.3" />
          <path d="M 140 395 L 200 450" stroke="#0047AB" strokeWidth="2" opacity="0.3" />
          <path d="M 400 295 L 400 365" stroke="#E43C3E" strokeWidth="2" strokeDasharray="6 3" opacity="0.6" />
          <path d="M 400 395 L 340 450" stroke="#1a1c1c" strokeWidth="2" opacity="0.2" />
          <path d="M 400 395 L 470 450" stroke="#1a1c1c" strokeWidth="2" opacity="0.2" />
          <circle r="3" fill="#E43C3E" opacity="0.8">
            <animateMotion dur="2.5s" repeatCount="indefinite" path="M 400 65 L 400 155" />
          </circle>
          <circle r="3" fill="#E43C3E" opacity="0.8">
            <animateMotion dur="2.5s" repeatCount="indefinite" path="M 140 295 L 140 395" />
          </circle>
          <circle r="3" fill="#E43C3E" opacity="0.8">
            <animateMotion dur="2.5s" repeatCount="indefinite" path="M 400 295 L 400 395" />
          </circle>
        </svg>

        {/* KD */}
        <Link href="/kb/trades/kevin-durant-trade-tree" className="absolute" style={{ left: 310, top: 10 }}
          onMouseEnter={() => setHoveredNode("kd")} onMouseLeave={() => setHoveredNode(null)}>
          <div className={`bg-black border-2 transition-all px-6 py-3 w-[180px] text-center ${hoveredNode === "kd" ? "border-brand-red shadow-[0_0_24px_rgba(228,60,62,0.3)]" : "border-black"}`}>
            <p className="font-display font-black text-white text-base tracking-tight uppercase">Kevin Durant</p>
            <p className="text-[10px] text-white/40 tracking-widest uppercase mt-0.5">FEB 2023 → PHX</p>
          </div>
        </Link>

        {/* Suns Return */}
        <div className="absolute" style={{ left: 340, top: 120 }}>
          <div className="bg-brand-red/10 border border-brand-red/30 px-5 py-2 w-[120px] text-center">
            <p className="font-display font-bold text-brand-red text-[10px] tracking-[0.2em] uppercase">Suns Return</p>
          </div>
        </div>

        {/* Bridges */}
        <Link href="/kb/trades/kevin-durant-trade-tree" className="absolute" style={{ left: 60, top: 235 }}
          onMouseEnter={() => setHoveredNode("bridges")} onMouseLeave={() => setHoveredNode(null)}>
          <div className={`bg-white border-2 transition-all px-4 py-3 w-[160px] text-center ${hoveredNode === "bridges" ? "border-brand-red shadow-[0_0_20px_rgba(228,60,62,0.2)]" : "border-black/10"}`}>
            <p className="font-display font-black text-text-primary text-sm tracking-tight uppercase">Mikal Bridges</p>
            <p className="text-[10px] text-brand-red font-bold mt-1">→ TRADED TO NYK</p>
          </div>
        </Link>

        {/* Cam Johnson */}
        <Link href="/kb/players/cameron-johnson" className="absolute" style={{ left: 320, top: 235 }}
          onMouseEnter={() => setHoveredNode("cam")} onMouseLeave={() => setHoveredNode(null)}>
          <div className={`bg-white border-2 transition-all px-4 py-3 w-[160px] text-center ${hoveredNode === "cam" ? "border-brand-red shadow-[0_0_20px_rgba(228,60,62,0.2)]" : "border-black/10"}`}>
            <p className="font-display font-black text-text-primary text-sm tracking-tight uppercase">Cam Johnson</p>
            <p className="text-[10px] text-brand-red font-bold mt-1">→ TRADED TO DEN</p>
          </div>
        </Link>

        {/* 4 Suns Picks */}
        <div className="absolute" style={{ left: 575, top: 235 }}>
          <div className="bg-white border-2 border-brand-red/30 px-4 py-3 w-[170px] text-center">
            <p className="font-display font-black text-text-primary text-sm tracking-tight uppercase">4 Suns FRPs</p>
            <p className="text-[10px] text-brand-red font-bold mt-1">&apos;25, &apos;27, &apos;29 + &apos;28 SWAP</p>
            <p className="text-[9px] text-text-muted mt-0.5">ALL UNPROTECTED</p>
          </div>
        </div>

        {/* Knicks Return */}
        <div className="absolute" style={{ left: 80, top: 360 }}>
          <div className="bg-accent-blue/10 border border-accent-blue/30 px-4 py-2 w-[120px] text-center">
            <p className="font-display font-bold text-accent-blue text-[10px] tracking-[0.2em] uppercase">Knicks Return</p>
          </div>
        </div>

        {/* Denver Return */}
        <div className="absolute" style={{ left: 335, top: 360 }}>
          <div className="bg-black/5 border border-black/10 px-4 py-2 w-[130px] text-center">
            <p className="font-display font-bold text-text-secondary text-[10px] tracking-[0.2em] uppercase">Denver Return</p>
          </div>
        </div>

        {/* 4 Knicks FRPs */}
        <div className="absolute" style={{ left: 10, top: 445 }}>
          <div className="bg-white border-2 border-accent-blue/40 px-3 py-3 w-[140px] text-center">
            <p className="font-display font-black text-text-primary text-xs tracking-tight uppercase">4 Knicks FRPs</p>
            <p className="text-[10px] text-accent-blue font-bold mt-1">&apos;25, &apos;27, &apos;29, &apos;31</p>
            <p className="text-[9px] text-text-muted mt-0.5">ALL UNPROTECTED</p>
          </div>
        </div>

        {/* Knicks Swap */}
        <div className="absolute" style={{ left: 160, top: 445 }}>
          <div className="bg-white border-2 border-accent-blue/20 px-3 py-3 w-[100px] text-center">
            <p className="font-display font-bold text-text-primary text-xs tracking-tight uppercase">&apos;28 Swap</p>
            <p className="text-[10px] text-accent-blue/60 font-bold mt-1">NYK</p>
          </div>
        </div>

        {/* MPJ */}
        <Link href="/kb/players/michael-porter-jr" className="absolute" style={{ left: 275, top: 445 }}
          onMouseEnter={() => setHoveredNode("mpj")} onMouseLeave={() => setHoveredNode(null)}>
          <div className={`bg-white border-2 transition-all px-3 py-3 w-[130px] text-center ${hoveredNode === "mpj" ? "border-brand-red shadow-[0_0_20px_rgba(228,60,62,0.2)]" : "border-accent-green/50"}`}>
            <p className="font-display font-black text-text-primary text-xs tracking-tight uppercase">Michael Porter Jr</p>
            <p className="text-[10px] text-accent-green font-bold mt-1">ON ROSTER · 24.2 PPG</p>
          </div>
        </Link>

        {/* 2032 Denver Pick */}
        <div className="absolute" style={{ left: 415, top: 445 }}>
          <div className="bg-white border-2 border-black/10 px-3 py-3 w-[120px] text-center">
            <p className="font-display font-black text-text-primary text-xs tracking-tight uppercase">&apos;32 DEN 1st</p>
            <p className="text-[9px] text-text-muted font-bold mt-1">FROM CAM TRADE</p>
          </div>
        </div>

        {/* Total badge */}
        <div className="absolute" style={{ right: 0, bottom: 0 }}>
          <div className="bg-black border-2 border-brand-red px-6 py-4 text-center">
            <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase font-bold">Total from KD</p>
            <p className="font-display font-black text-brand-red text-3xl tracking-tight leading-none mt-1">9 FRPs</p>
            <p className="text-[10px] text-white/30 mt-1">+ 2 SWAPS + MPJ</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════ */

export default function KBDashboard({ articles, categories, changelog }: KBDashboardProps) {
  return (
    <div className="min-h-screen bg-bg-primary">

      {/* ── HERO (black) ── */}
      <section className="bg-black text-white px-4 sm:px-8 pt-6 pb-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-10 mb-6">
            {/* Logo */}
            <Image
              src="/logo2.png"
              alt="BK Grit"
              width={180}
              height={90}
              priority
              className="w-[140px] sm:w-[180px] h-auto"
            />
            {/* Title + meta */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="tag tag-red">Nets Wiki</span>
                <span className="text-white/30 text-[10px] tracking-[0.2em] uppercase font-bold">{articles.length} Articles</span>
              </div>
              <p className="text-white/40 font-body text-sm sm:text-base max-w-lg leading-relaxed">
                Every thread of the Brooklyn Nets rebuild — trades, picks, prospects, front office moves — all connected and updating.
              </p>
            </div>
          </div>
          <KBSearch />
        </div>
      </section>

      {/* ── REBUILD OVERVIEW (white canvas) ── */}
      <section className="bg-bg-primary px-4 sm:px-8 py-10 border-b border-black/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-brand-red text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>monitoring</span>
            <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary">State of the Rebuild</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <div className="border border-black/10 p-4 text-center">
              <p className="font-display font-black text-2xl text-text-primary">20-61</p>
              <p className="text-[10px] text-text-muted tracking-[0.15em] uppercase font-bold mt-1">2025-26 Record</p>
            </div>
            <div className="border border-black/10 p-4 text-center">
              <p className="font-display font-black text-2xl text-brand-red">#3</p>
              <p className="text-[10px] text-text-muted tracking-[0.15em] uppercase font-bold mt-1">Lottery Position</p>
            </div>
            <div className="border border-black/10 p-4 text-center">
              <p className="font-display font-black text-2xl text-accent-blue">{totalFirstRoundPicks + totalSwaps}</p>
              <p className="text-[10px] text-text-muted tracking-[0.15em] uppercase font-bold mt-1">Picks Through 2032</p>
            </div>
            <div className="border border-black/10 p-4 text-center">
              <p className="font-display font-black text-2xl text-text-primary">21.2</p>
              <p className="text-[10px] text-text-muted tracking-[0.15em] uppercase font-bold mt-1">Avg Core Age</p>
            </div>
            <Link href="/kb/concepts/rebuild-timeline" className="border border-black/10 p-4 text-center hover:border-brand-red/30 transition-colors group col-span-2 sm:col-span-1">
              <p className="font-display font-black text-2xl text-accent-green group-hover:text-brand-red transition-colors">2027-28</p>
              <p className="text-[10px] text-text-muted tracking-[0.15em] uppercase font-bold mt-1">Target Window</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ── TRADE TREE ── */}
      <section className="bg-bg-primary px-4 sm:px-8 py-10 border-b border-black/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-brand-red text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>account_tree</span>
            <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary">The KD Trade Tree</h2>
          </div>
          {/* Desktop SVG */}
          <div style={{ display: "none" }} className="trade-tree-desktop">
            <TradeTree />
          </div>
          {/* Mobile cards */}
          <div className="trade-tree-mobile space-y-0 stagger-children">
            <Link href="/kb/trades/kevin-durant-trade-tree" className="block border border-black/10 p-4 hover:border-brand-red/30 transition-colors animate-slide-up opacity-0">
              <p className="font-display font-black text-text-primary text-sm uppercase">Kevin Durant</p>
              <p className="text-[10px] text-text-muted tracking-widest uppercase mt-0.5">FEB 2023 → PHX</p>
            </Link>
            <div className="flex items-center gap-2 pl-4 py-2 animate-slide-up opacity-0">
              <div className="relative w-px h-6">
                <div className="absolute inset-0 bg-brand-red/20" />
                <div className="absolute w-3 h-3 bg-brand-red rounded-full -left-[5px] animate-pulse-soft" style={{ top: 0 }} />
              </div>
              <span className="text-[10px] text-brand-red font-bold tracking-[0.15em] uppercase">Suns Return</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pl-4 animate-slide-up opacity-0">
              <Link href="/kb/trades/kevin-durant-trade-tree" className="border border-black/10 p-3 hover:border-brand-red/30 transition-colors">
                <p className="font-display font-bold text-text-primary text-xs uppercase">Mikal Bridges</p>
                <p className="text-[10px] text-brand-red font-bold mt-1">→ NYK</p>
              </Link>
              <Link href="/kb/players/cameron-johnson" className="border border-black/10 p-3 hover:border-brand-red/30 transition-colors">
                <p className="font-display font-bold text-text-primary text-xs uppercase">Cam Johnson</p>
                <p className="text-[10px] text-brand-red font-bold mt-1">→ DEN</p>
              </Link>
            </div>
            <div className="pl-4 border border-brand-red/20 p-3 mt-2 animate-slide-up opacity-0">
              <p className="font-display font-bold text-text-primary text-xs uppercase">4 Suns FRPs</p>
              <p className="text-[10px] text-brand-red font-bold mt-1">&apos;25, &apos;27, &apos;29 + &apos;28 SWAP — ALL UNPROTECTED</p>
            </div>
            <div className="flex items-center gap-2 pl-8 py-2 animate-slide-up opacity-0">
              <div className="relative w-px h-6">
                <div className="absolute inset-0 bg-accent-blue/20" />
                <div className="absolute w-3 h-3 bg-accent-blue rounded-full -left-[5px] animate-pulse-soft" style={{ top: 0, animationDelay: "0.5s" }} />
              </div>
              <span className="text-[10px] text-accent-blue font-bold tracking-[0.15em] uppercase">From Bridges → Knicks</span>
            </div>
            <div className="pl-8 border border-accent-blue/20 p-3 animate-slide-up opacity-0">
              <p className="font-display font-bold text-text-primary text-xs uppercase">4 Knicks FRPs</p>
              <p className="text-[10px] text-accent-blue font-bold mt-1">&apos;25, &apos;27, &apos;29, &apos;31 + &apos;28 SWAP — ALL UNPROTECTED</p>
            </div>
            <div className="flex items-center gap-2 pl-8 py-2 animate-slide-up opacity-0">
              <div className="relative w-px h-6">
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute w-3 h-3 bg-text-secondary rounded-full -left-[5px] animate-pulse-soft" style={{ top: 0, animationDelay: "1s" }} />
              </div>
              <span className="text-[10px] text-text-secondary font-bold tracking-[0.15em] uppercase">From Cam J → Denver</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pl-8 animate-slide-up opacity-0">
              <Link href="/kb/players/michael-porter-jr" className="border border-accent-green/30 p-3 hover:border-brand-red/30 transition-colors">
                <p className="font-display font-bold text-text-primary text-xs uppercase">Michael Porter Jr</p>
                <p className="text-[10px] text-accent-green font-bold mt-1">ON ROSTER · 24.2 PPG</p>
              </Link>
              <div className="border border-black/10 p-3">
                <p className="font-display font-bold text-text-primary text-xs uppercase">&apos;32 DEN 1st</p>
                <p className="text-[10px] text-text-muted font-bold mt-1">FROM CAM TRADE</p>
              </div>
            </div>
            <div className="mt-4 animate-slide-up opacity-0">
              <div className="bg-black border-2 border-brand-red p-4 text-center" style={{ animation: "glow-pulse 3s ease-in-out infinite" }}>
                <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase font-bold">Total from KD</p>
                <p className="font-display font-black text-brand-red text-2xl tracking-tight leading-none mt-1">9 FRPs + 2 SWAPS + MPJ</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PICK INVENTORY ── */}
      <section className="bg-bg-primary px-4 sm:px-8 py-10 border-b border-black/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-brand-red text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
            <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary">Pick Inventory</h2>
          </div>
          <p className="text-text-muted text-xs font-body mb-6">First-round picks the Nets control through 2032</p>

          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { label: "OWN", color: "bg-brand-red" },
              { label: "SUNS", color: "bg-brand-red/70" },
              { label: "KNICKS", color: "bg-accent-blue" },
              { label: "ROCKETS", color: "bg-brand-red/50" },
              { label: "MAVS", color: "bg-accent-blue/70" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 ${l.color}`} />
                <span className="text-[10px] text-text-muted tracking-[0.15em] uppercase font-bold">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Mobile: vertical */}
          <div className="space-y-4 sm:hidden">
            {PICKS.map((yearGroup) => (
              <div key={yearGroup.year} className="border border-black/10 p-4">
                <p className="font-display font-black text-xl tracking-tight text-text-primary mb-3">{yearGroup.year}</p>
                <div className="flex flex-wrap gap-2">
                  {yearGroup.picks.map((pick, pi) => (
                    <Link key={pi} href={pick.href}>
                      <div className={`${sourceColor[pick.source]} px-3 py-2 text-center ${(pick as { isSwap?: boolean }).isSwap ? "opacity-60 border border-dashed border-black/20 bg-transparent !text-text-muted" : ""}`}
                        style={(pick as { isSwap?: boolean }).isSwap ? { background: "transparent" } : {}}>
                        <p className="font-display font-bold text-[11px] tracking-wider uppercase">{pick.label}</p>
                        <p className={`text-[9px] mt-0.5 ${(pick as { isSwap?: boolean }).isSwap ? "text-text-muted" : "text-white/70"}`}>{pick.note}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Desktop: horizontal */}
          <div className="hidden sm:block overflow-x-auto scrollbar-hide">
            <div className="flex gap-0 min-w-[700px]">
              {PICKS.map((yearGroup, yi) => (
                <div key={yearGroup.year} className="flex-1 relative">
                  <div className="text-center mb-4">
                    <p className="font-display font-black text-2xl tracking-tight text-text-primary">{yearGroup.year}</p>
                    <div className="w-px h-4 bg-black/10 mx-auto mt-1" />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    {yearGroup.picks.map((pick, pi) => (
                      <Link key={pi} href={pick.href} className="group">
                        <div className={`${sourceColor[pick.source]} px-3 py-1.5 text-center transition-all group-hover:shadow-lg group-hover:scale-105 ${(pick as { isSwap?: boolean }).isSwap ? "opacity-60 border border-dashed border-black/20 bg-transparent !text-text-muted" : ""}`}
                          style={(pick as { isSwap?: boolean }).isSwap ? { background: "transparent" } : {}}>
                          <p className="font-display font-bold text-[11px] tracking-wider uppercase">{pick.label}</p>
                          <p className={`text-[9px] mt-0.5 ${(pick as { isSwap?: boolean }).isSwap ? "text-text-muted" : "text-white/70"}`}>{pick.note}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {yi < PICKS.length - 1 && (
                    <div className="absolute top-[22px] right-0 w-full h-px bg-black/10 translate-x-1/2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 pt-4 border-t border-black/5">
            <span className="font-display font-black text-brand-red text-lg">{totalFirstRoundPicks + totalSwaps}</span>
            <span className="text-text-muted text-[10px] tracking-[0.15em] uppercase font-bold">First-round picks + swaps through 2032</span>
          </div>
        </div>
      </section>

      {/* ── THE ROSTER ── */}
      <section className="bg-bg-primary px-4 sm:px-8 py-10 border-b border-black/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-brand-red text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary">The Roster</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {PLAYERS.map(player => (
              <Link key={player.name} href={player.href} className="card card-interactive p-4 group">
                <div className="w-12 h-12 bg-black mb-3 flex items-center justify-center">
                  <span className="font-display font-black text-white text-lg">{player.name.split(" ").map(n => n[0]).join("")}</span>
                </div>
                <p className="font-display font-black text-sm tracking-tight uppercase group-hover:text-brand-red transition-colors">{player.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-text-muted text-xs font-body">{player.pos}</span>
                  <span className="text-text-muted text-[10px]">|</span>
                  <span className="text-text-primary text-xs font-bold font-body">{player.stat}</span>
                </div>
                <div className="mt-2">
                  <span className={`tag ${player.statusColor}`}>{player.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FRONT OFFICE ── */}
      <section className="bg-bg-primary px-4 sm:px-8 py-10 border-b border-black/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-brand-red text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>corporate_fare</span>
            <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary">Front Office</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/kb/front-office/sean-marks-era" className="card card-interactive p-5 group flex gap-4 items-start">
              <div className="w-12 h-12 bg-black shrink-0 flex items-center justify-center">
                <span className="font-display font-black text-white text-lg">SM</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-black text-sm uppercase tracking-tight group-hover:text-brand-red transition-colors">Sean Marks</p>
                <p className="text-text-muted text-[10px] uppercase tracking-wider font-bold mt-0.5">General Manager</p>
                <p className="text-text-secondary text-xs font-body mt-1.5 line-clamp-2">Architect of the rebuild. 9 FRPs from the KD trade tree. Can he develop what he acquired?</p>
              </div>
            </Link>
            <Link href="/kb/front-office/jordi-fernandez" className="card card-interactive p-5 group flex gap-4 items-start">
              <div className="w-12 h-12 bg-black shrink-0 flex items-center justify-center">
                <span className="font-display font-black text-white text-lg">JF</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-black text-sm uppercase tracking-tight group-hover:text-brand-red transition-colors">Jordi Fernandez</p>
                <p className="text-text-muted text-[10px] uppercase tracking-wider font-bold mt-0.5">Head Coach</p>
                <p className="text-text-secondary text-xs font-body mt-1.5 line-clamp-2">First Spanish NBA head coach. Sports psychology PhD. Building the young core.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── REBUILD TIMELINE ── */}
      <section className="bg-bg-primary px-4 sm:px-8 py-10 border-b border-black/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-brand-red text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>timeline</span>
            <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary">Rebuild Timeline</h2>
          </div>
          <div className="relative">
            <div className="absolute left-[60px] sm:left-[80px] top-0 bottom-0 w-px bg-black/10" />
            <div className="space-y-0">
              {TIMELINE.map((evt, i) => (
                <div key={i} className="flex items-start gap-4 sm:gap-6 py-4 group">
                  <div className="w-[52px] sm:w-[68px] text-right shrink-0">
                    <p className="font-display font-black text-[11px] sm:text-xs tracking-tight uppercase text-text-muted">{evt.date}</p>
                  </div>
                  <div className="relative shrink-0">
                    <div className={`w-3 h-3 border-2 ${
                      evt.type === "trade" ? "border-brand-red bg-brand-red/20" :
                      evt.type === "draft" ? "border-accent-blue bg-accent-blue/20" :
                      "border-text-muted bg-text-muted/20"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0 -mt-0.5">
                    <p className="font-display font-bold text-sm uppercase tracking-tight text-text-primary">{evt.event}</p>
                    <p className="text-text-muted text-xs font-body mt-0.5">{evt.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BROWSE + ARTICLES (side by side) ── */}
      <section className="bg-bg-primary px-4 sm:px-8 py-10 border-b border-black/5">
        <div className="max-w-6xl mx-auto grid md:grid-cols-5 gap-8">
          {/* Categories */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-brand-red text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>category</span>
              <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary">Browse</h2>
            </div>
            <div className="space-y-1">
              {categories.map(cat => {
                return (
                  <Link key={cat.name} href={`/kb/category/${cat.name}`} className="flex items-center gap-3 py-3 px-3 group hover:bg-bg-surface transition-colors border-b border-black/5 last:border-0">
                    <span className="material-symbols-outlined text-text-muted group-hover:text-brand-red transition-colors text-lg">{categoryIcon[cat.name] || "article"}</span>
                    <span className="font-display font-bold text-sm uppercase tracking-tight text-text-primary group-hover:text-brand-red transition-colors flex-1">{cat.label}</span>
                    <span className="text-text-muted text-xs font-body">{cat.count}</span>
                    <span className="material-symbols-outlined text-text-muted/30 group-hover:text-brand-red transition-colors text-sm">chevron_right</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Latest Articles */}
          <div className="md:col-span-3">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-brand-red text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>article</span>
              <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary">Latest Articles</h2>
            </div>
            <div className="space-y-3">
              {articles.slice(0, 6).map(article => {
                const catLabel = categories.find(c => c.name === article.category)?.label || article.category;
                return (
                  <Link key={article.slug} href={`/kb/${article.category}/${article.slug}`} className="card card-interactive p-4 flex items-center gap-4 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-text-muted text-[10px] tracking-[0.15em] uppercase font-bold">{catLabel}</span>
                      </div>
                      <p className="font-display font-bold text-sm uppercase tracking-tight text-text-primary group-hover:text-brand-red transition-colors">{article.title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`tag ${confColor[article.confidence]}`}>{article.confidence}</span>
                      <span className="text-text-muted text-[10px]">{article.last_updated}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT CHANGED ── */}
      {changelog.length > 0 && (
        <section className="bg-bg-primary px-4 sm:px-8 py-10 border-b border-black/5">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-brand-red text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>update</span>
              <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary">What Changed</h2>
            </div>
            <KBChangelog entries={changelog} />
          </div>
        </section>
      )}

      {/* ── SUBMIT CTA ── */}
      <section className="bg-bg-primary px-4 sm:px-8 py-10 border-b border-black/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-2 border-brand-red/20 p-6">
          <div>
            <p className="font-display font-black text-sm uppercase tracking-tight text-text-primary">Found something Nets-related?</p>
            <p className="text-text-muted text-xs font-body mt-1">Drop a link — articles, tweets, scouting reports, trade rumors. The best ones get compiled into the wiki.</p>
          </div>
          <Link href="/kb/submit" className="bg-brand-red text-white font-display font-bold text-xs uppercase tracking-wider px-6 py-2.5 hover:bg-brand-red/80 transition-colors shrink-0">
            Submit a Source
          </Link>
        </div>
      </section>

      {/* ── GRAPH CTA ── */}
      <section className="bg-black text-white px-4 sm:px-8 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-brand-red text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
              <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-white/60">Knowledge Graph</h2>
            </div>
            <p className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight">
              See how everything<br /><span className="text-brand-red">connects.</span>
            </p>
            <p className="text-white/30 text-xs font-body mt-2 max-w-md">
              Every player, trade, pick, and concept — visualized as an interactive network.
            </p>
          </div>
          <Link href="/kb/graph" className="bg-brand-red text-white font-display font-bold text-sm uppercase tracking-wider px-8 py-3 hover:bg-brand-red/80 transition-colors shrink-0">
            Explore the Graph
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <section className="bg-black text-white px-4 sm:px-8 py-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-white/30 text-[10px] tracking-[0.3em] uppercase font-bold mb-2">AI-compiled · Human-curated</p>
          <p className="font-display font-black text-lg sm:text-xl uppercase tracking-tight">
            The war room every Nets fan deserves.
          </p>
        </div>
      </section>
    </div>
  );
}
