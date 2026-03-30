"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/simulator", label: "Lottery Sim" },
  { href: "/gm-mode", label: "War Room" },
  { href: "/trade-machine", label: "Trade Machine" },
  { href: "/tiebreaker", label: "Tiebreaker" },
  { href: "/anti-tanking", label: "Anti-Tank" },
];

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
          <img
            src={user.image}
            alt={handle}
            className="w-7 h-7 rounded-full border border-white/[0.15]"
          />
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

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f1419] border-b border-white/[0.08]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo text */}
          <Link href="/" className="group flex items-center gap-1">
            <span className="font-display text-xl tracking-wider text-white">BK</span>
            <span className="font-display text-xl tracking-wider text-brand-orange">GRIT</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all tracking-wide uppercase"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
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
