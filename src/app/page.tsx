import Image from "next/image";
import DraftWidget from "@/components/DraftWidget";
import LotteryRace from "@/components/LotteryRace";
import StockTicker from "@/components/StockTicker";
import HotTakes from "@/components/HotTakes";
import DailyPoll from "@/components/DailyPoll";
import LotteryOddsTable from "@/components/LotteryOddsTable";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="-mt-4 flex flex-col items-center text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-orange/[0.04] rounded-full blur-[100px] pointer-events-none" />
        <Image
          src="/BKGrit.png"
          alt="Brooklyn Grit"
          width={500}
          height={250}
          priority
          className="w-full max-w-[480px] h-auto relative z-10 animate-float"
        />
        <p className="text-text-secondary mt-3 text-sm max-w-md relative z-10 font-body">
          The fan HQ. Track the draft. Vote on takes. Play GM. Built for Brooklyn.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-5 relative z-10">
          {[
            { href: "/simulator", label: "Lottery Sim" },
            { href: "/gm-mode", label: "War Room" },
            { href: "/trade-machine", label: "Trade Machine" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-1.5 rounded-full text-[12px] font-semibold bg-white/[0.04] text-text-secondary hover:bg-brand-orange/15 hover:text-brand-orange-glow border border-white/[0.04] hover:border-brand-orange/20 transition-all"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Main row: Draft + Race stacked left, Poll right */}
      <section className="grid md:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="space-y-5 stagger-children">
          <DraftWidget />
          <LotteryRace />
        </div>
        <DailyPoll />
      </section>

      {/* Odds Table */}
      <section>
        <LotteryOddsTable />
      </section>

      <div className="section-divider" />

      <div className="flex items-center gap-3">
        <h2 className="heading-md text-text-secondary">Community</h2>
        <div className="flex-1 h-px bg-white/[0.04]" />
      </div>

      {/* Stock Ticker + Hot Takes */}
      <section className="grid lg:grid-cols-2 gap-5 items-start stagger-children">
        <StockTicker />
        <HotTakes />
      </section>

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
