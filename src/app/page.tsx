import DraftWidget from "@/components/DraftWidget";
import HotTakes from "@/components/HotTakes";
import DailyPoll from "@/components/DailyPoll";
import LotteryOddsTable from "@/components/LotteryOddsTable";
import CommentSection from "@/components/CommentSection";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative w-full min-h-[70vh] flex flex-col justify-end overflow-hidden border-b-[8px] border-brand-red bg-black">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-br from-black via-gray-900 to-black" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 px-6 sm:px-8 pb-12 max-w-7xl mx-auto w-full">
          <div className="inline-block bg-brand-red px-4 py-1 mb-6">
            <span className="font-display text-white font-black tracking-[0.3em] uppercase text-[10px]">FAN HQ: ACTIVE</span>
          </div>
          <h1 className="font-display text-white text-[12vw] sm:text-[10vw] leading-[0.8] font-black italic tracking-tighter uppercase mb-8">
            BK<br />GRIT
          </h1>
          <div className="mt-6 flex flex-col md:flex-row md:items-end justify-between border-l-8 border-brand-red pl-6 sm:pl-8">
            <div>
              <p className="font-display text-white/50 text-lg sm:text-2xl uppercase tracking-[0.2em] font-light">Brooklyn Nets</p>
              <h2 className="font-display text-white text-2xl sm:text-4xl font-black uppercase tracking-tight">THE_FAN_COMMAND_CENTER</h2>
            </div>
            <div className="mt-6 md:mt-0 flex gap-8 sm:gap-12 text-right">
              <div>
                <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Season</p>
                <p className="font-bold text-lg sm:text-xl text-white">2025-26</p>
              </div>
              <div>
                <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Draft</p>
                <p className="font-bold text-lg sm:text-xl text-white">2026</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid */}
      <section className="w-full px-4 py-8 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-1">
          {/* Community / Hot Takes — large left */}
          <div className="md:col-span-8 bg-white border border-gray-200 p-6 sm:p-8 min-h-[400px]">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase font-display">Community</h2>
              <Link href="/community" className="text-brand-red font-bold text-sm tracking-tighter uppercase hover:underline">
                View All
              </Link>
            </div>
            <HotTakes />
          </div>

          {/* Draft Position — dark right column */}
          <div className="md:col-span-4 bg-black text-white p-6 sm:p-8">
            <DraftWidget />
          </div>

          {/* Wire Feed — left column */}
          <div className="md:col-span-4 bg-gray-100 p-6 sm:p-8 min-h-[400px]">
            <h2 className="text-xl font-black tracking-tighter uppercase font-display mb-6">Wire Feed</h2>
            <DailyPoll />
          </div>

          {/* Live Recaps — large right */}
          <div className="md:col-span-8 bg-white border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-black text-white p-5 flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase font-display">Live Recaps: Fan Analysis</h2>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse-soft" />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand-red">Live</span>
              </span>
            </div>
            <div className="p-6 sm:p-8 flex-grow">
              <CommentSection page="home" compact />
              <div className="mt-6">
                <Link
                  href="/recaps"
                  className="inline-flex items-center gap-2 bg-brand-red text-white px-6 py-3 font-black text-xs tracking-[0.15em] uppercase hover:bg-red-700 transition-all"
                >
                  Open Recap Studio
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Odds Table */}
      <section className="w-full px-4 md:px-8 pb-8">
        <LotteryOddsTable />
      </section>

      {/* Secondary Grid — Tool Links */}
      <section className="w-full px-4 py-8 md:px-8 border-t-[6px] border-brand-red">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-3">
            <h3 className="text-[11px] font-black tracking-[0.2em] uppercase text-black/40">War Room</h3>
            <Link href="/gm-mode" className="block bg-white border-t-4 border-brand-red p-6 shadow-sm hover:shadow-md transition-shadow group">
              <p className="text-2xl font-black uppercase font-display">Play GM</p>
              <p className="text-xs font-bold text-brand-red uppercase mt-1">Draft + Trade + Strategy</p>
              <p className="text-xs text-text-muted mt-3">Get scored against other fans.</p>
            </Link>
          </div>
          <div className="space-y-3">
            <h3 className="text-[11px] font-black tracking-[0.2em] uppercase text-black/40">Trade Machine</h3>
            <Link href="/trade-machine" className="block bg-white border-t-4 border-accent-blue p-6 shadow-sm hover:shadow-md transition-shadow group">
              <p className="text-2xl font-black uppercase font-display text-accent-blue">Build Trades</p>
              <p className="text-xs font-bold text-black/40 uppercase mt-1">Salary Matching</p>
              <p className="text-xs text-text-muted mt-3">Check salaries. See what fans think.</p>
            </Link>
          </div>
          <div className="space-y-3">
            <h3 className="text-[11px] font-black tracking-[0.2em] uppercase text-black/40">Tiebreaker</h3>
            <Link href="/tiebreaker" className="block bg-white border-t-4 border-brand-orange p-6 shadow-sm hover:shadow-md transition-shadow group">
              <p className="text-2xl font-black uppercase font-display text-brand-orange">Scenarios</p>
              <p className="text-xs font-bold text-black/40 uppercase mt-1">Draft Position Odds</p>
              <p className="text-xs text-text-muted mt-3">What-if simulator for draft position.</p>
            </Link>
          </div>
          <div className="space-y-3">
            <h3 className="text-[11px] font-black tracking-[0.2em] uppercase text-black/40">Lottery Sim</h3>
            <Link href="/simulator" className="block bg-accent-blue p-6 shadow-sm hover:shadow-md transition-shadow group">
              <p className="text-white text-lg font-bold leading-tight uppercase italic font-display">&quot;Run the lottery. See where Brooklyn lands.&quot;</p>
              <p className="text-white/60 text-[10px] font-bold tracking-[0.2em] uppercase mt-4">Unlimited Simulations</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
