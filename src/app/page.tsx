import DraftWidget from "@/components/DraftWidget";
import StockTicker from "@/components/StockTicker";
import HotTakes from "@/components/HotTakes";
import DailyPoll from "@/components/DailyPoll";
import LotteryOddsTable from "@/components/LotteryOddsTable";
import CommentSection from "@/components/CommentSection";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">

      {/* Row 1: Draft left, Polls right */}
      <section className="grid md:grid-cols-[1fr_1fr] gap-5 items-start stagger-children">
        <DraftWidget />
        <DailyPoll />
      </section>

      {/* Odds Table */}
      <section>
        <LotteryOddsTable />
      </section>

      <div className="section-divider" />

      <div className="flex items-center gap-3">
        <h2 className="heading-md text-text-secondary">Community</h2>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Stock Ticker + Hot Takes */}
      <section className="grid lg:grid-cols-2 gap-5 items-start stagger-children">
        <StockTicker />
        <HotTakes />
      </section>

      <div className="section-divider" />

      {/* Discussion */}
      <CommentSection page="home" />

      <div className="section-divider" />

      {/* CTA Row */}
      <section className="grid sm:grid-cols-3 gap-4 stagger-children">
        <Link href="/simulator" className="card card-interactive p-6 block group">
          <span className="heading-md gradient-text-brand group-hover:glow-text-orange transition-all block mb-2">Lottery Sim</span>
          <p className="text-text-muted text-xs font-body">Run unlimited sims. Share your luck on X.</p>
        </Link>
        <Link href="/gm-mode" className="card card-interactive p-6 block group">
          <span className="heading-md text-accent-gold group-hover:glow-text-orange transition-all block mb-2">War Room</span>
          <p className="text-text-muted text-xs font-body">Draft your guy. Get scored against other fans.</p>
        </Link>
        <Link href="/trade-machine" className="card card-interactive p-6 block group">
          <span className="heading-md text-accent-green group-hover:glow-text-orange transition-all block mb-2">Trade Machine</span>
          <p className="text-text-muted text-xs font-body">Build trades. Check salaries. See what fans think.</p>
        </Link>
      </section>
    </div>
  );
}
