"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/simulator", label: "Lottery Sim" },
  { href: "/gm-mode", label: "War Room" },
  { href: "/trade-machine", label: "Trade Machine" },
  { href: "/tiebreaker", label: "Tiebreaker" },
  { href: "/anti-tanking", label: "Anti-Tank" },
];

interface ScoreGame {
  homeTeam: { abbrev: string; score: number };
  awayTeam: { abbrev: string; score: number };
  period: number;
  clock: string;
  status: number;
  statusText: string;
}

const LOTTERY_TOP = new Set(["IND", "WAS", "BKN", "SAC", "UTA", "DAL", "MEM", "NOP"]);

function periodLabel(p: number): string {
  if (p <= 4) return `Q${p}`;
  return `OT${p - 4}`;
}

// ─── Scores Ticker (ESPN-style) ───
function ScoresTicker() {
  const [games, setGames] = useState<ScoreGame[]>([]);
  const [hasLive, setHasLive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch("/api/scores");
      const data = await res.json();
      // Show all games, not just lottery
      setGames(data.games || []);
      setHasLive(data.hasLiveGames || false);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchScores();
    const interval = setInterval(fetchScores, hasLive ? 30000 : 120000);
    return () => clearInterval(interval);
  }, [fetchScores, hasLive]);

  if (games.length === 0) return null;

  return (
    <div className="border-b border-white/[0.06] overflow-hidden">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {games.map((g, i) => {
          const isLive = g.status === 2;
          const isFinal = g.status === 3;
          const awayIsLottery = LOTTERY_TOP.has(g.awayTeam.abbrev);
          const homeIsLottery = LOTTERY_TOP.has(g.homeTeam.abbrev);
          const awayWinning = g.awayTeam.score > g.homeTeam.score;
          const homeWinning = g.homeTeam.score > g.awayTeam.score;
          const isBKN = g.homeTeam.abbrev === "BKN" || g.awayTeam.abbrev === "BKN";

          return (
            <div
              key={i}
              className={`flex-shrink-0 px-4 py-2 border-r border-white/[0.06] min-w-[140px] ${
                isBKN ? "bg-brand-orange/[0.08]" : ""
              }`}
            >
              {/* Status line */}
              <div className="mb-1">
                {isLive ? (
                  <span className="text-[10px] font-bold text-red-400">
                    {periodLabel(g.period)} {g.clock}
                  </span>
                ) : isFinal ? (
                  <span className="text-[10px] font-bold text-gray-500">Final</span>
                ) : (
                  <span className="text-[10px] text-gray-500">{g.statusText}</span>
                )}
              </div>

              {/* Away team */}
              <div className="flex items-center justify-between gap-3 mb-0.5">
                <span className={`text-[12px] font-bold ${
                  awayIsLottery ? "text-brand-orange" : "text-gray-300"
                }`}>
                  {g.awayTeam.abbrev}
                </span>
                <span className={`text-[13px] tabular-nums font-bold ${
                  (isFinal || isLive) && awayWinning ? "text-white" : "text-gray-400"
                }`}>
                  {g.status > 1 ? g.awayTeam.score : ""}
                </span>
              </div>

              {/* Home team */}
              <div className="flex items-center justify-between gap-3">
                <span className={`text-[12px] font-bold ${
                  homeIsLottery ? "text-brand-orange" : "text-gray-300"
                }`}>
                  {g.homeTeam.abbrev}
                </span>
                <span className={`text-[13px] tabular-nums font-bold ${
                  (isFinal || isLive) && homeWinning ? "text-white" : "text-gray-400"
                }`}>
                  {g.status > 1 ? g.homeTeam.score : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── User Auth Button ───
function UserButton() {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (status === "loading") {
    return <div className="w-7 h-7 rounded-full bg-white/[0.1] animate-pulse-soft" />;
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn("twitter")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.1] hover:bg-brand-orange/20 hover:border-brand-orange/30 hover:text-brand-orange transition-all text-gray-400"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span className="text-[11px] font-bold uppercase tracking-wider">Sign In</span>
      </button>
    );
  }

  const user = session.user;
  const handle = (user as { xHandle?: string }).xHandle || user.name || "User";

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-white/[0.06] transition-all"
      >
        {user.image ? (
          <img src={user.image} alt={handle} className="w-7 h-7 rounded-full border border-white/[0.15]" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange text-xs font-bold">
            {handle[0]?.toUpperCase()}
          </div>
        )}
        <span className="text-gray-300 text-xs font-semibold hidden sm:inline">@{handle}</span>
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl bg-[#1c2128] border border-white/[0.1] shadow-xl overflow-hidden">
            <div className="px-3 py-2.5 border-b border-white/[0.06]">
              <p className="text-sm font-bold text-white">@{handle}</p>
              <p className="text-[10px] text-gray-500">Signed in via X</p>
            </div>
            <button
              onClick={() => { setDropdownOpen(false); signOut(); }}
              className="w-full text-left px-3 py-2.5 text-sm text-red-400 hover:bg-white/[0.04] transition-colors"
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Navbar ───
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f1419]">
      {/* Row 1: Scores ticker */}
      <ScoresTicker />

      {/* Row 2: Logo + Nav + Auth */}
      <div className="border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-11">
            {/* Logo */}
            <Link href="/" className="group flex items-center gap-1 shrink-0">
              <span className="font-display text-xl tracking-wider text-white">BK</span>
              <span className="font-display text-xl tracking-wider text-brand-orange">GRIT</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-0.5 ml-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all tracking-wide uppercase"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3 ml-auto">
              <UserButton />
            </div>

            {/* Mobile toggle */}
            <div className="flex md:hidden items-center gap-2">
              <UserButton />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-gray-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-[#0f1419]">
          <div className="px-4 py-3 space-y-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
