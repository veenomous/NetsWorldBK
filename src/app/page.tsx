import Image from "next/image";
import DraftWidget from "@/components/DraftWidget";
import LotteryRace from "@/components/LotteryRace";
import StockTicker from "@/components/StockTicker";
import HotTakes from "@/components/HotTakes";
import DailyPrediction from "@/components/DailyPrediction";
import LotteryOddsTable from "@/components/LotteryOddsTable";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      {/* Hero — big logo flush against header, no gap */}
      <section className="-mt-4 flex flex-col items-center text-center">
        <Image
          src="/BKGrit.png"
          alt="Brooklyn Grit"
          width={500}
          height={250}
          priority
          className="w-full max-w-[520px] h-auto"
        />
        <p className="text-text-secondary mt-2 text-sm sm:text-base max-w-md">
          The fan HQ. Track the draft. Vote on takes. Play GM. Built for Brooklyn.
        </p>
      </section>

      {/* Row 1: Draft Widget + Lottery Race + Predictions */}
      <section className="grid md:grid-cols-3 gap-4">
        <DraftWidget />
        <LotteryRace />
        <DailyPrediction />
      </section>

      {/* Lottery Odds Table */}
      <section>
        <LotteryOddsTable />
      </section>

      {/* Row 2: Stock Ticker + Hot Takes */}
      <section className="grid lg:grid-cols-2 gap-4">
        <StockTicker />
        <HotTakes />
      </section>

      {/* CTA Row */}
      <section className="grid sm:grid-cols-3 gap-4">
        <Link href="/simulator" className="card card-interactive p-5 block group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[15px] group-hover:text-brand-orange-glow transition-colors">Lottery Simulator</h3>
              <p className="text-text-muted text-xs mt-1">Run unlimited sims. See full results. Share your luck.</p>
            </div>
            <span className="text-2xl opacity-40 group-hover:opacity-80 transition-opacity">&#127920;</span>
          </div>
        </Link>

        <Link href="/gm-mode" className="card card-interactive p-5 block group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[15px] group-hover:text-accent-gold transition-colors">Draft War Room</h3>
              <p className="text-text-muted text-xs mt-1">Pick your prospect. Set the strategy. Get your GM score.</p>
            </div>
            <span className="text-2xl opacity-40 group-hover:opacity-80 transition-opacity">&#129504;</span>
          </div>
        </Link>

        <Link href="/trade-machine" className="card card-interactive p-5 block group">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[15px] group-hover:text-accent-green transition-colors">Trade Machine</h3>
              <p className="text-text-muted text-xs mt-1">Build trades. Check salaries. Vote on fan proposals.</p>
            </div>
            <span className="text-2xl opacity-40 group-hover:opacity-80 transition-opacity">&#9878;</span>
          </div>
        </Link>
      </section>
    </div>
  );
}
