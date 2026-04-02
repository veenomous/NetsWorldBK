"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useStandings, getNetsFromStandings } from "@/lib/useStandings";

const navLinks = [
  { href: "/", label: "Dashboard", active: true },
  { href: "/community", label: "The Press" },
  { href: "/wire", label: "The Wire" },
  { href: "/simulator", label: "Lottery Simulator" },
  { href: "/gm-mode", label: "War Room" },
  { href: "/trade-machine", label: "Trade Machine" },
];

function UserButton() {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (status === "loading") return <div className="w-6 h-6 bg-white/10 animate-pulse-soft" />;

  if (!session) {
    return (
      <button onClick={() => signIn("twitter")} className="hover:bg-white/10 transition-all p-0.5">
        <span className="material-symbols-outlined text-white/70 hover:text-white text-[20px]">account_circle</span>
      </button>
    );
  }

  const user = session.user;
  const handle = (user as { xHandle?: string }).xHandle || user.name || "User";

  return (
    <div className="relative">
      <button onClick={() => setDropdownOpen(!dropdownOpen)} className="hover:bg-white/10 transition-all p-0.5">
        {user.image ? (
          <img src={user.image} alt={handle} className="w-6 h-6 border border-white/20" />
        ) : (
          <span className="material-symbols-outlined text-white text-[20px]">account_circle</span>
        )}
      </button>
      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-48 bg-black border border-white/10 shadow-2xl">
            <div className="px-3 py-2 border-b border-white/10">
              <p className="text-xs font-bold text-white">@{handle}</p>
            </div>
            <button
              onClick={() => { setDropdownOpen(false); signOut(); }}
              className="w-full text-left px-3 py-2 text-xs text-brand-red hover:bg-white/5 transition-colors uppercase tracking-wider font-bold"
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lottery, isLoading } = useStandings();
  const nets = getNetsFromStandings(lottery);

  return (
    <nav className="bg-black text-white flex justify-between items-center w-full px-4 sm:px-6 py-1 sticky top-0 z-50">
      {/* Draft badge (replaces BK GRIT text) */}
      <Link href="/" className="shrink-0 bg-brand-red px-3 py-1.5">
        <span className="font-display text-white font-black tracking-[0.1em] uppercase text-xs sm:text-sm">
          {isLoading ? "BK GRIT" : nets ? `#${nets.lotteryRank} PICK · ${nets.wins}-${nets.losses} · ${nets.gamesRemaining}G LEFT` : "BK GRIT"}
        </span>
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-5">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`font-display uppercase tracking-tighter font-bold text-sm transition-colors ${
              link.active
                ? "text-brand-red"
                : "text-white/60 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <UserButton />
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden hover:bg-white/10 transition-all p-0.5">
          <span className="material-symbols-outlined text-[20px]">
            {mobileOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-black border-t border-white/10 md:hidden z-50">
          <div className="px-4 py-2 space-y-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2 font-display uppercase tracking-tighter font-bold text-sm text-white/60 hover:text-white transition-colors"
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
