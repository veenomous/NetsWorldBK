"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const navLinks = [
  { href: "/", label: "Dashboard", active: true },
  { href: "/simulator", label: "Lottery Sim" },
  { href: "/gm-mode", label: "War Room" },
  { href: "/trade-machine", label: "Trade Machine" },
  { href: "/recaps", label: "Recap Studio" },
  { href: "/community", label: "Community" },
];

function UserButton() {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (status === "loading") return <div className="w-8 h-8 bg-white/10 animate-pulse-soft" />;

  if (!session) {
    return (
      <button onClick={() => signIn("twitter")} className="hover:bg-white/10 transition-all p-1">
        <span className="material-symbols-outlined text-white/70 hover:text-white">account_circle</span>
      </button>
    );
  }

  const user = session.user;
  const handle = (user as { xHandle?: string }).xHandle || user.name || "User";

  return (
    <div className="relative">
      <button onClick={() => setDropdownOpen(!dropdownOpen)} className="hover:bg-white/10 transition-all p-1">
        {user.image ? (
          <img src={user.image} alt={handle} className="w-8 h-8 border border-white/20" />
        ) : (
          <span className="material-symbols-outlined text-white">account_circle</span>
        )}
      </button>
      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-52 bg-black border border-white/10 shadow-2xl">
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm font-bold text-white">@{handle}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Signed in via X</p>
            </div>
            <button
              onClick={() => { setDropdownOpen(false); signOut(); }}
              className="w-full text-left px-4 py-3 text-sm text-brand-red hover:bg-white/5 transition-colors uppercase tracking-wider font-bold text-xs"
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
    <nav className="bg-black text-white flex justify-between items-center w-full px-6 py-4 sticky top-0 z-50">
      <Link href="/" className="text-2xl font-black tracking-tighter text-white uppercase font-display">
        BK GRIT
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`font-display uppercase tracking-tighter font-bold text-sm transition-colors ${
              link.active
                ? "text-brand-red border-b-4 border-brand-red pb-1"
                : "text-white/70 hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <UserButton />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden hover:bg-white/10 transition-all p-1"
        >
          <span className="material-symbols-outlined">
            {mobileOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 bg-black border-t border-white/10 md:hidden z-50">
          <div className="px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-3 font-display uppercase tracking-tighter font-bold text-white/70 hover:text-white transition-colors border-b border-white/5"
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
