import Image from "next/image";
import DraftWidget from "@/components/DraftWidget";
import VibeCheck from "@/components/VibeCheck";
import StockTicker from "@/components/StockTicker";
import HotTakes from "@/components/HotTakes";
import DailyPrediction from "@/components/DailyPrediction";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      {/* Hero — logo + tagline */}
      <section className="py-4 sm:py-6 flex items-center gap-4">
        <Image
          src="/BKGrit.png"
          alt="Brooklyn Grit"
          width={72}
          height={72}
          className="rounded-xl hidden sm:block"
        />
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            <span className="gradient-text-brand">Brooklyn Grit</span>
          </h1>
          <p className="text-text-secondary mt-1 text-sm sm:text-base max-w-lg">
            The fan HQ. Track the draft. Vote on takes. Play GM. Built for Brooklyn.
          </p>
        </div>
      </section>

      {/* Row 1: Draft Widget + Vibe Check + Predictions */}
      <section className="grid md:grid-cols-3 gap-4">
        <DraftWidget />
        <VibeCheck />
        <DailyPrediction />
      </section>

      {/* Row 2: Stock Ticker + Hot Takes */}
      <section className="grid lg:grid-cols-2 gap-4">
        <StockTicker />
        <HotTakes />
      </section>

      {/* CTA Row */}
      <section className="grid sm:grid-cols-2 gap-4">
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
      </section>
    </div>
  );
}
