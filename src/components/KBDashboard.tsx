"use client";

import Link from "next/link";
import { useState } from "react";
import KBSearch from "@/components/KBSearch";
import KBChangelog from "@/components/KBChangelog";
import { netsPicks, totalFirstRoundPicks, totalSwaps } from "@/data/picks";
import { kbPlayers } from "@/data/kb-players";

/* ═══════════════════════════════════════════
   HARDCODED DATA — prototype only
   ═══════════════════════════════════════════ */

const PICKS = netsPicks;

const sourceColor: Record<string, string> = {
  own: "bg-brand-red text-white",
  suns: "bg-brand-orange text-white",
  knicks: "bg-accent-blue text-white",
  rockets: "bg-accent-red text-white",
  mavs: "bg-accent-cyan text-white",
};

const sourceDot: Record<string, string> = {
  own: "bg-brand-red",
  suns: "bg-brand-orange",
  knicks: "bg-accent-blue",
  rockets: "bg-accent-red",
  mavs: "bg-accent-cyan",
};

const PLAYERS = kbPlayers;

const TIMELINE = [
  { date: "FEB 2023", event: "KD traded to Suns", detail: "Bridges + Cam + 4 FRPs + swap", type: "trade" as const },
  { date: "FEB 2023", event: "Kyrie traded to Mavs", detail: "2 FRPs returned", type: "trade" as const },
  { date: "JUN 2024", event: "Bridges traded to Knicks", detail: "4 FRPs + swap returned", type: "trade" as const },
  { date: "DEC 2024", event: "Schroder to Warriors", detail: "3 SRPs returned", type: "trade" as const },
  { date: "2024-25", event: "Tank season", detail: "Development year, bottom 5 record", type: "season" as const },
  { date: "JUN 2025", event: "NBA Draft", detail: "The inflection point", type: "draft" as const },
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

/* Props from server component */
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
   TRADE TREE — SVG + positioned nodes
   ═══════════════════════════════════════════ */

function TradeTree() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <div className="relative w-full">
      {/* Scroll hint gradient — right edge */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none sm:hidden" />
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="relative" style={{ width: 800, height: 680 }}>
        {/* SVG connection lines — coordinates match node centers exactly */}
        <svg className="absolute inset-0" width="800" height="680" fill="none">
          {/* KD (400,40) → Suns Return (400,130) */}
          <path d="M 400 65 L 400 125" stroke="#E43C3E" strokeWidth="2" strokeDasharray="6 3" opacity="0.6" />
          {/* Suns Return (400,150) → Bridges (140,260), CamJ (400,260), Picks (660,260) */}
          <path d="M 400 155 L 140 240" stroke="#e87a2e" strokeWidth="2" opacity="0.4" />
          <path d="M 400 155 L 400 240" stroke="#e87a2e" strokeWidth="2" opacity="0.4" />
          <path d="M 400 155 L 660 240" stroke="#e87a2e" strokeWidth="2" opacity="0.4" />
          {/* Bridges (140,290) → Knicks Return (140,370) */}
          <path d="M 140 295 L 140 365" stroke="#E43C3E" strokeWidth="2" strokeDasharray="6 3" opacity="0.6" />
          {/* Knicks Return (140,390) → NYK Picks (80,460), NYK Swap (200,460) */}
          <path d="M 140 395 L 80 450" stroke="#0047AB" strokeWidth="2" opacity="0.4" />
          <path d="M 140 395 L 200 450" stroke="#0047AB" strokeWidth="2" opacity="0.4" />
          {/* CamJ (400,290) → Denver Return (400,370) */}
          <path d="M 400 295 L 400 365" stroke="#E43C3E" strokeWidth="2" strokeDasharray="6 3" opacity="0.6" />
          {/* Denver Return (400,390) → MPJ (340,460), DEN Pick (470,460) */}
          <path d="M 400 395 L 340 450" stroke="#7c3aed" strokeWidth="2" opacity="0.4" />
          <path d="M 400 395 L 470 450" stroke="#7c3aed" strokeWidth="2" opacity="0.4" />
          {/* Animated pulses */}
          <circle r="3" fill="#E43C3E" opacity="0.8">
            <animateMotion dur="2.5s" repeatCount="indefinite" path="M 400 65 L 400 155" />
          </circle>
          <circle r="3" fill="#E43C3E" opacity="0.8">
            <animateMotion dur="2.5s" repeatCount="indefinite" path="M 140 295 L 140 395" />
          </circle>
          <circle r="3" fill="#E43C3E" opacity="0.8">
            <animateMotion dur="2.5s" repeatCount="indefinite" path="M 400 295 L 400 395" />
          </circle>
          <circle r="3" fill="#e87a2e" opacity="0.6">
            <animateMotion dur="3s" repeatCount="indefinite" path="M 400 155 L 140 240" />
          </circle>
          <circle r="3" fill="#e87a2e" opacity="0.6">
            <animateMotion dur="3s" repeatCount="indefinite" path="M 400 155 L 660 240" />
          </circle>
        </svg>

        {/* ── NODES (absolute, pixel-positioned to match SVG) ── */}

        {/* KD — center 400, top 15 */}
        <Link href="/kb/trades/kevin-durant-trade-tree"
          className="absolute" style={{ left: 310, top: 10 }}
          onMouseEnter={() => setHoveredNode("kd")} onMouseLeave={() => setHoveredNode(null)}>
          <div className={`bg-black border-2 transition-all px-6 py-3 w-[180px] text-center ${hoveredNode === "kd" ? "border-brand-red shadow-[0_0_24px_rgba(228,60,62,0.3)]" : "border-white/20"}`}>
            <p className="font-display font-black text-white text-base tracking-tight uppercase">Kevin Durant</p>
            <p className="text-[10px] text-white/40 tracking-widest uppercase mt-0.5">FEB 2023 → PHX</p>
          </div>
        </Link>

        {/* Suns Return — center 400, top 120 */}
        <div className="absolute" style={{ left: 340, top: 120 }}>
          <div className="bg-brand-orange/10 border border-brand-orange/30 px-5 py-2 w-[120px] text-center">
            <p className="font-display font-bold text-brand-orange text-[10px] tracking-[0.2em] uppercase">Suns Return</p>
          </div>
        </div>

        {/* Bridges — center 140, top 235 */}
        <Link href="/kb/trades/kevin-durant-trade-tree"
          className="absolute" style={{ left: 60, top: 235 }}
          onMouseEnter={() => setHoveredNode("bridges")} onMouseLeave={() => setHoveredNode(null)}>
          <div className={`bg-black border-2 transition-all px-4 py-3 w-[160px] text-center ${hoveredNode === "bridges" ? "border-brand-red shadow-[0_0_20px_rgba(228,60,62,0.3)]" : "border-white/20"}`}>
            <p className="font-display font-black text-white text-sm tracking-tight uppercase">Mikal Bridges</p>
            <p className="text-[10px] text-brand-red font-bold mt-1">→ TRADED TO NYK</p>
          </div>
        </Link>

        {/* Cam Johnson — center 400, top 235 */}
        <Link href="/kb/players/cameron-johnson"
          className="absolute" style={{ left: 320, top: 235 }}
          onMouseEnter={() => setHoveredNode("cam")} onMouseLeave={() => setHoveredNode(null)}>
          <div className={`bg-black border-2 transition-all px-4 py-3 w-[160px] text-center ${hoveredNode === "cam" ? "border-brand-red shadow-[0_0_20px_rgba(228,60,62,0.3)]" : "border-white/20"}`}>
            <p className="font-display font-black text-white text-sm tracking-tight uppercase">Cam Johnson</p>
            <p className="text-[10px] text-brand-red font-bold mt-1">→ TRADED TO DEN</p>
          </div>
        </Link>

        {/* 4 Suns Picks — center 660, top 235 */}
        <div className="absolute" style={{ left: 575, top: 235 }}>
          <div className="bg-black border-2 border-brand-orange/50 px-4 py-3 w-[170px] text-center">
            <p className="font-display font-black text-white text-sm tracking-tight uppercase">4 Suns FRPs</p>
            <p className="text-[10px] text-brand-orange font-bold mt-1">&apos;25, &apos;27, &apos;29 + &apos;28 SWAP</p>
            <p className="text-[9px] text-white/30 mt-0.5">ALL UNPROTECTED</p>
          </div>
        </div>

        {/* Knicks Return — center 140, top 360 */}
        <div className="absolute" style={{ left: 80, top: 360 }}>
          <div className="bg-accent-blue/10 border border-accent-blue/30 px-4 py-2 w-[120px] text-center">
            <p className="font-display font-bold text-accent-blue text-[10px] tracking-[0.2em] uppercase">Knicks Return</p>
          </div>
        </div>

        {/* Denver Return — center 400, top 360 */}
        <div className="absolute" style={{ left: 335, top: 360 }}>
          <div className="bg-accent-purple/10 border border-accent-purple/30 px-4 py-2 w-[130px] text-center">
            <p className="font-display font-bold text-accent-purple text-[10px] tracking-[0.2em] uppercase">Denver Return</p>
          </div>
        </div>

        {/* 4 Knicks FRPs — center 80, top 445 */}
        <div className="absolute" style={{ left: 10, top: 445 }}>
          <div className="bg-black border-2 border-accent-blue/50 px-3 py-3 w-[140px] text-center">
            <p className="font-display font-black text-white text-xs tracking-tight uppercase">4 Knicks FRPs</p>
            <p className="text-[10px] text-accent-blue font-bold mt-1">&apos;25, &apos;27, &apos;29, &apos;31</p>
            <p className="text-[9px] text-white/30 mt-0.5">ALL UNPROTECTED</p>
          </div>
        </div>

        {/* Knicks Swap — center 200, top 445 */}
        <div className="absolute" style={{ left: 160, top: 445 }}>
          <div className="bg-black border-2 border-accent-blue/30 px-3 py-3 w-[100px] text-center">
            <p className="font-display font-bold text-white text-xs tracking-tight uppercase">&apos;28 Swap</p>
            <p className="text-[10px] text-accent-blue/60 font-bold mt-1">NYK</p>
          </div>
        </div>

        {/* MPJ — center 340, top 445 */}
        <Link href="/kb/players/michael-porter-jr"
          className="absolute" style={{ left: 275, top: 445 }}
          onMouseEnter={() => setHoveredNode("mpj")} onMouseLeave={() => setHoveredNode(null)}>
          <div className={`bg-black border-2 transition-all px-3 py-3 w-[130px] text-center ${hoveredNode === "mpj" ? "border-brand-red shadow-[0_0_20px_rgba(228,60,62,0.3)]" : "border-accent-green/50"}`}>
            <p className="font-display font-black text-white text-xs tracking-tight uppercase">Michael Porter Jr</p>
            <p className="text-[10px] text-accent-green font-bold mt-1">ON ROSTER · 24.2 PPG</p>
          </div>
        </Link>

        {/* 2032 Denver Pick — center 470, top 445 */}
        <div className="absolute" style={{ left: 415, top: 445 }}>
          <div className="bg-black border-2 border-accent-purple/50 px-3 py-3 w-[120px] text-center">
            <p className="font-display font-black text-white text-xs tracking-tight uppercase">&apos;32 DEN 1st</p>
            <p className="text-[9px] text-accent-purple/60 font-bold mt-1">FROM CAM TRADE</p>
          </div>
        </div>

        {/* Total badge — bottom right */}
        <div className="absolute" style={{ right: 0, bottom: 0 }}>
          <div className="bg-black border-2 border-brand-red px-6 py-4 text-center">
            <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase font-bold">Total from KD</p>
            <p className="font-display font-black text-brand-red text-3xl tracking-tight leading-none mt-1">9 FRPs</p>
            <p className="text-[10px] text-white/30 mt-1">+ 2 SWAPS + MPJ</p>
          </div>
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
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <section className="bg-black text-white px-4 sm:px-8 pt-10 pb-12 relative overflow-hidden">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />
        <div className="max-w-6xl mx-auto relative">
          <div className="flex items-center gap-3 mb-4">
            <span className="tag tag-red">Knowledge Base</span>
            <span className="text-white/30 text-[10px] tracking-[0.2em] uppercase font-bold">{articles.length} Articles</span>
            <span className="text-white/10 text-[10px]">|</span>
            <span className="text-white/30 text-[10px] tracking-[0.2em] uppercase font-bold">5 Sources</span>
          </div>
          <h1 className="font-display font-black text-white uppercase tracking-[-0.04em] leading-[0.85]" style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}>
            NETS<br />
            <span className="text-brand-red">WIKI</span>
          </h1>
          <p className="text-white/40 font-body text-sm sm:text-base mt-4 max-w-lg leading-relaxed">
            Every thread of the Brooklyn Nets rebuild — trades, picks, prospects, front office moves — all connected and updating.
          </p>
          <div className="mt-6">
            <KBSearch />
          </div>
        </div>
      </section>

      {/* ── TRADE TREE ── */}
      <section className="bg-black text-white px-4 sm:px-8 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-brand-red text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>account_tree</span>
            <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-white/60">The KD Trade Tree</h2>
          </div>
          {/* Desktop: SVG visualization */}
          <div className="hidden xl:block">
            <TradeTree />
          </div>
          {/* Mobile: vertical card layout */}
          <div className="xl:hidden space-y-3">
            <Link href="/kb/trades/kevin-durant-trade-tree" className="block border border-white/10 p-4 hover:border-brand-red/50 transition-colors">
              <p className="font-display font-black text-white text-sm uppercase">Kevin Durant</p>
              <p className="text-[10px] text-white/40 tracking-widest uppercase mt-0.5">FEB 2023 → PHX</p>
            </Link>
            <div className="flex items-center gap-2 pl-4">
              <div className="w-px h-4 bg-brand-red/40" />
              <span className="text-[10px] text-brand-orange font-bold tracking-[0.15em] uppercase">Suns Return</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pl-4">
              <Link href="/kb/trades/kevin-durant-trade-tree" className="border border-white/10 p-3 hover:border-brand-red/50 transition-colors">
                <p className="font-display font-bold text-white text-xs uppercase">Mikal Bridges</p>
                <p className="text-[10px] text-brand-red font-bold mt-1">→ NYK</p>
              </Link>
              <Link href="/kb/players/cameron-johnson" className="border border-white/10 p-3 hover:border-brand-red/50 transition-colors">
                <p className="font-display font-bold text-white text-xs uppercase">Cam Johnson</p>
                <p className="text-[10px] text-brand-red font-bold mt-1">→ DEN</p>
              </Link>
            </div>
            <div className="pl-4 border border-brand-orange/30 p-3">
              <p className="font-display font-bold text-white text-xs uppercase">4 Suns FRPs</p>
              <p className="text-[10px] text-brand-orange font-bold mt-1">&apos;25, &apos;27, &apos;29 + &apos;28 SWAP — ALL UNPROTECTED</p>
            </div>

            <div className="flex items-center gap-2 pl-8">
              <div className="w-px h-4 bg-accent-blue/40" />
              <span className="text-[10px] text-accent-blue font-bold tracking-[0.15em] uppercase">From Bridges → Knicks</span>
            </div>
            <div className="pl-8 border border-accent-blue/30 p-3">
              <p className="font-display font-bold text-white text-xs uppercase">4 Knicks FRPs</p>
              <p className="text-[10px] text-accent-blue font-bold mt-1">&apos;25, &apos;27, &apos;29, &apos;31 + &apos;28 SWAP — ALL UNPROTECTED</p>
            </div>

            <div className="flex items-center gap-2 pl-8">
              <div className="w-px h-4 bg-accent-purple/40" />
              <span className="text-[10px] text-accent-purple font-bold tracking-[0.15em] uppercase">From Cam J → Denver</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pl-8">
              <Link href="/kb/players/michael-porter-jr" className="border border-accent-green/40 p-3 hover:border-brand-red/50 transition-colors">
                <p className="font-display font-bold text-white text-xs uppercase">Michael Porter Jr</p>
                <p className="text-[10px] text-accent-green font-bold mt-1">ON ROSTER · 24.2 PPG</p>
              </Link>
              <div className="border border-accent-purple/30 p-3">
                <p className="font-display font-bold text-white text-xs uppercase">&apos;32 DEN 1st</p>
                <p className="text-[10px] text-accent-purple/60 font-bold mt-1">FROM CAM TRADE</p>
              </div>
            </div>

            <div className="border-2 border-brand-red p-4 text-center mt-4">
              <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase font-bold">Total from KD</p>
              <p className="font-display font-black text-brand-red text-2xl tracking-tight leading-none mt-1">9 FRPs + 2 SWAPS + MPJ</p>
            </div>
          </div>
        </div>
      </section>

      {/* Transition line */}
      <div className="h-px bg-gradient-to-r from-transparent via-brand-red/30 to-transparent" />

      {/* ── PICK TIMELINE ── */}
      <section className="bg-bg-primary px-4 sm:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-brand-red text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
            <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary">Pick Inventory</h2>
          </div>
          <p className="text-text-muted text-xs font-body mb-6">First-round picks the Nets own through 2031</p>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { label: "OWN", color: "bg-brand-red" },
              { label: "SUNS", color: "bg-brand-orange" },
              { label: "KNICKS", color: "bg-accent-blue" },
              { label: "ROCKETS", color: "bg-accent-red" },
              { label: "MAVS", color: "bg-accent-cyan" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 ${l.color}`} />
                <span className="text-[10px] text-text-muted tracking-[0.15em] uppercase font-bold">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-0 min-w-[700px]">
              {PICKS.map((yearGroup, yi) => (
                <div key={yearGroup.year} className="flex-1 relative">
                  {/* Year header */}
                  <div className="text-center mb-4">
                    <p className="font-display font-black text-2xl tracking-tight text-text-primary">{yearGroup.year}</p>
                    {/* Vertical line */}
                    <div className="w-px h-4 bg-black/10 mx-auto mt-1" />
                  </div>
                  {/* Picks */}
                  <div className="flex flex-col items-center gap-2">
                    {yearGroup.picks.map((pick, pi) => (
                      <Link key={pi} href={pick.href} className="group">
                        <div className={`${sourceColor[pick.source]} px-3 py-1.5 text-center transition-all group-hover:shadow-lg group-hover:scale-105 ${(pick as { isSwap?: boolean }).isSwap ? "opacity-60 border border-dashed border-white/30 bg-transparent !text-text-muted" : ""}`}
                          style={(pick as { isSwap?: boolean }).isSwap ? { background: "transparent" } : {}}
                        >
                          <p className="font-display font-bold text-[11px] tracking-wider uppercase">{pick.label}</p>
                          <p className={`text-[9px] mt-0.5 ${(pick as { isSwap?: boolean }).isSwap ? "text-text-muted" : "text-white/70"}`}>{pick.note}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {/* Connector to next year */}
                  {yi < PICKS.length - 1 && (
                    <div className="absolute top-[22px] right-0 w-full h-px bg-black/10 translate-x-1/2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Total badge */}
          <div className="mt-6 flex items-center gap-3 pt-4 border-t border-black/5">
            <span className="font-display font-black text-brand-red text-lg">{totalFirstRoundPicks + totalSwaps}</span>
            <span className="text-text-muted text-[10px] tracking-[0.15em] uppercase font-bold">First-round picks + swaps through 2031</span>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── PLAYERS ── */}
      <section className="bg-bg-primary px-4 sm:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-brand-red text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary">The Roster</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {PLAYERS.map(player => (
              <Link key={player.name} href={player.href} className="card card-interactive p-4 group">
                {/* Player avatar placeholder */}
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

      <div className="section-divider" />

      {/* ── REBUILD TIMELINE ── */}
      <section className="bg-bg-primary px-4 sm:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-brand-red text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>timeline</span>
            <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary">Rebuild Timeline</h2>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[60px] sm:left-[80px] top-0 bottom-0 w-px bg-black/10" />
            <div className="space-y-0">
              {TIMELINE.map((evt, i) => (
                <div key={i} className="flex items-start gap-4 sm:gap-6 py-4 group">
                  {/* Date */}
                  <div className="w-[52px] sm:w-[68px] text-right shrink-0">
                    <p className="font-display font-black text-[11px] sm:text-xs tracking-tight uppercase text-text-muted">{evt.date}</p>
                  </div>
                  {/* Dot */}
                  <div className="relative shrink-0">
                    <div className={`w-3 h-3 border-2 ${
                      evt.type === "trade" ? "border-brand-red bg-brand-red/20" :
                      evt.type === "draft" ? "border-brand-orange bg-brand-orange/20" :
                      "border-text-muted bg-text-muted/20"
                    }`} />
                  </div>
                  {/* Content */}
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

      <div className="section-divider" />

      {/* ── CATEGORIES + ARTICLES (side by side) ── */}
      <section className="bg-bg-primary px-4 sm:px-8 py-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-5 gap-8">
          {/* Categories */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-brand-red text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>category</span>
              <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary">Browse</h2>
            </div>
            <div className="space-y-1">
              {categories.map(cat => {
                const firstArticle = articles.find(a => a.category === cat.name);
                const href = firstArticle ? `/kb/${firstArticle.category}/${firstArticle.slug}` : `/kb`;
                return (
                  <Link key={cat.name} href={href} className="flex items-center gap-3 py-3 px-3 group hover:bg-bg-surface transition-colors border-b border-black/5 last:border-0">
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
        <>
          <div className="section-divider" />
          <section className="bg-bg-primary px-4 sm:px-8 py-12">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-brand-red text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>update</span>
                <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary">What Changed</h2>
              </div>
              <KBChangelog entries={changelog} />
            </div>
          </section>
        </>
      )}

      {/* ── GRAPH CTA ── */}
      <section className="bg-black text-white px-4 sm:px-8 py-12">
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
              Every player, trade, pick, and concept — visualized as an interactive network. Click any node to dive deeper.
            </p>
          </div>
          <Link href="/kb/graph" className="bg-brand-red text-white font-display font-bold text-sm uppercase tracking-wider px-8 py-3 hover:bg-brand-red/80 transition-colors shrink-0">
            Explore the Graph
          </Link>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="bg-black text-white px-4 sm:px-8 py-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-white/30 text-[10px] tracking-[0.3em] uppercase font-bold mb-2">Updated daily by AI agents</p>
          <p className="font-display font-black text-lg sm:text-xl uppercase tracking-tight">
            The war room every Nets fan deserves.
          </p>
        </div>
      </section>
    </div>
  );
}
