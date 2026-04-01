import type { Metadata } from "next";
import TheWire from "@/components/TheWire";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The Wire — BK Grit",
  description: "Brooklyn's raw perspective, roster rumors, and the unfiltered voice of the borough.",
};

export default function WirePage() {
  return (
    <div>
      {/* Hero */}
      <header className="bg-white py-12 sm:py-16 px-6 sm:px-8 md:px-12 border-b-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-3">
            <div className="inline-block bg-brand-red text-white px-3 py-1 font-display font-bold text-sm italic uppercase">
              Brooklyn Forum
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none font-display">The Wire</h1>
            <p className="text-base sm:text-lg text-black/40 max-w-xl font-medium uppercase tracking-wider">
              Brooklyn&apos;s raw perspective, roster rumors, and the unfiltered voice of the borough.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-3">
            <Link href="/wire" className="bg-black text-white px-6 sm:px-8 py-4 sm:py-5 text-lg sm:text-xl font-display font-black uppercase tracking-tight hover:bg-brand-red transition-all flex items-center gap-3 group">
              Start a Thread
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">add_circle</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto w-full px-6 sm:px-8 md:px-12 py-8 sm:py-12">
        <TheWire showForm={true} showHotTake={false} showSidebar={true} />
      </main>
    </div>
  );
}
