"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-nets-accent flex items-center justify-center font-bold text-lg tracking-tight group-hover:scale-105 transition-transform">
              NW
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold tracking-tight">NetsWorld</span>
              <span className="text-nets-silver text-xs block -mt-1">Draft HQ 2025</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/">Pick Tracker</NavLink>
            <NavLink href="/simulator">Lottery Sim</NavLink>
            <NavLink href="/gm-mode">GM Mode</NavLink>
          </div>

          {/* Live indicator */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-nets-green animate-pulse" />
            <span className="text-xs text-nets-silver">Live Odds</span>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-nets-gray-light transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-nets-dark">
          <div className="px-4 py-3 space-y-1">
            <MobileNavLink href="/" onClick={() => setMobileOpen(false)}>Pick Tracker</MobileNavLink>
            <MobileNavLink href="/simulator" onClick={() => setMobileOpen(false)}>Lottery Sim</MobileNavLink>
            <MobileNavLink href="/gm-mode" onClick={() => setMobileOpen(false)}>GM Mode</MobileNavLink>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 rounded-lg text-sm font-medium text-nets-silver hover:text-white hover:bg-nets-gray-light transition-all"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-3 rounded-lg text-sm font-medium text-nets-silver hover:text-white hover:bg-nets-gray-light transition-all"
    >
      {children}
    </Link>
  );
}
