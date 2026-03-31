"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/simulator", label: "Lottery Sim" },
  { href: "/gm-mode", label: "War Room" },
  { href: "/trade-machine", label: "Trade Machine" },
  { href: "/tiebreaker", label: "Tiebreaker" },
  { href: "/anti-tanking", label: "Anti-Tank" },
  { href: "/community", label: "Community" },
  { href: "/recaps", label: "Recaps" },
];

interface ScoreGame {
  homeTeam: { abbrev: string; score: number };
  awayTeam: { abbrev: string; score: number };
  period: number;
  clock: string;
  status: number;
  statusText: string;
  lotteryTeams: string[];
}

const TOP5 = new Set(["IND", "WAS", "BKN", "SAC", "UTA"]);

function periodLabel(p: number): string {
  if (p <= 4) return `Q${p}`;
  return `OT${p - 4}`;
}

// ─── User Auth Button ───
function UserButton() {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (status === "loading") {
    return <div className="w-8 h-8 rounded-full bg-white/[0.1] animate-pulse-soft" />;
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn("twitter")}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-orange hover:bg-brand-orange-glow transition-all text-white font-bold text-[12px] uppercase tracking-wider"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Sign In
      </button>
    );
  }

  const user = session.user;
  const handle = (user as { xHandle?: string }).xHandle || user.name || "User";

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/[0.06] transition-all"
      >
        {user.image ? (
          <img src={user.image} alt={handle} className="w-8 h-8 rounded-full border-2 border-white/[0.15]" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange text-sm font-bold">
            {handle[0]?.toUpperCase()}
          </div>
        )}
        <span className="text-gray-300 text-[12px] font-semibold hidden sm:inline">@{handle}</span>
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-xl bg-[#1c2128] border border-white/[0.1] shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <p className="text-sm font-bold text-white">@{handle}</p>
              <p className="text-[11px] text-gray-500">Signed in via X</p>
            </div>
            <button
              onClick={() => { setDropdownOpen(false); signOut(); }}
              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/[0.04] transition-colors"
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
  const [games, setGames] = useState<ScoreGame[]>([]);
  const [hasLive, setHasLive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch("/api/scores");
      const data = await res.json();
      const allGames: ScoreGame[] = data.games || [];
      setGames(allGames.filter(
        (g) => TOP5.has(g.homeTeam.abbrev) || TOP5.has(g.awayTeam.abbrev)
      ));
      setHasLive(data.hasLiveGames || false);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchScores();
    const interval = setInterval(fetchScores, hasLive ? 30000 : 120000);
    return () => clearInterval(interval);
  }, [fetchScores, hasLive]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f1419]">
      {/* Main header: Logo | Scores | Auth */}
      <div className="border-b border-white/[0.1]">
        <div className="flex items-center px-5 sm:px-8 h-[90px]">
          {/* Logo */}
          <Link href="/" className="shrink-0 mr-6 sm:mr-10">
            <Image
              src="/BKGrit.png"
              alt="BK Grit"
              width={220}
              height={80}
              priority
              className="h-16 sm:h-[72px] w-auto"
            />
          </Link>

          {/* Divider */}
          <div className="w-px h-14 bg-white/[0.1] shrink-0 mr-6 hidden sm:block" />

          {/* Scores */}
          <div className="flex-1 overflow-hidden">
            {games.length > 0 ? (
              <div ref={scrollRef} className="flex overflow-x-auto scrollbar-hide">
                {games.map((g, i) => {
                  const isLive = g.status === 2;
                  const isFinal = g.status === 3;
                  const awayWinning = g.awayTeam.score > g.homeTeam.score;
                  const homeWinning = g.homeTeam.score > g.awayTeam.score;
                  const isBKN = g.homeTeam.abbrev === "BKN" || g.awayTeam.abbrev === "BKN";

                  return (
                    <div
                      key={i}
                      className={`flex-shrink-0 px-5 py-2 border-r border-white/[0.06] last:border-r-0 ${
                        isBKN ? "bg-brand-orange/[0.06]" : ""
                      }`}
                    >
                      {/* Status */}
                      <div className="mb-1 h-3.5 flex items-center">
                        {isLive ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-soft" />
                            <span className="text-[10px] font-bold text-red-400">
                              {periodLabel(g.period)} {g.clock}
                            </span>
                          </div>
                        ) : isFinal ? (
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Final</span>
                        ) : (
                          <span className="text-[10px] text-gray-500">{g.statusText}</span>
                        )}
                      </div>

                      {/* Away team */}
                      <div className="flex items-center justify-between gap-6 h-5">
                        <span className={`text-[13px] font-bold tracking-wide ${
                          TOP5.has(g.awayTeam.abbrev) ? "text-brand-orange" : "text-gray-300"
                        }`}>
                          {g.awayTeam.abbrev}
                        </span>
                        <span className={`text-[15px] tabular-nums font-extrabold ${
                          (isFinal || isLive) && awayWinning ? "text-white" : "text-gray-500"
                        }`}>
                          {g.status > 1 ? g.awayTeam.score : "-"}
                        </span>
                      </div>

                      {/* Home team */}
                      <div className="flex items-center justify-between gap-6 h-5">
                        <span className={`text-[13px] font-bold tracking-wide ${
                          TOP5.has(g.homeTeam.abbrev) ? "text-brand-orange" : "text-gray-300"
                        }`}>
                          {g.homeTeam.abbrev}
                        </span>
                        <span className={`text-[15px] tabular-nums font-extrabold ${
                          (isFinal || isLive) && homeWinning ? "text-white" : "text-gray-500"
                        }`}>
                          {g.status > 1 ? g.homeTeam.score : "-"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600 text-[12px] italic">No lottery team games today</p>
            )}
          </div>

          {/* Auth */}
          <div className="shrink-0 ml-4 sm:ml-6">
            <UserButton />
          </div>
        </div>
      </div>

      {/* Nav links row */}
      <div className="bg-[#161d25] border-b border-white/[0.06]">
        <div className="px-5 sm:px-8">
          {/* Desktop */}
          <div className="hidden md:flex items-center h-10 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-1.5 rounded-md text-[12px] font-semibold text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all tracking-wide uppercase"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center h-10">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
              <span className="text-[12px] font-semibold uppercase tracking-wider">Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-[#161d25] border-b border-white/[0.06]">
          <div className="px-5 py-2 space-y-0.5">
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
