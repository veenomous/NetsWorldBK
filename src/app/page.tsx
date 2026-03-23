import PickTracker from "@/components/PickTracker";
import LotterySimulator from "@/components/LotterySimulator";
import DailyPoll from "@/components/DailyPoll";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center py-6">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight gradient-text">
          Brooklyn Nets Draft HQ 2026
        </h1>
        <p className="text-nets-silver mt-2 text-lg">
          Track the pick. Simulate the lottery. Play GM.
        </p>
      </div>

      {/* Pick Tracker - Hero Section */}
      <PickTracker />

      {/* Two column: Lottery Sim + Poll */}
      <div className="grid lg:grid-cols-2 gap-6">
        <LotterySimulator compact />
        <DailyPoll />
      </div>

      {/* CTA Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/simulator" className="glass-card rounded-2xl p-6 hover:border-nets-accent/30 border border-transparent transition-all group">
          <h3 className="text-lg font-bold group-hover:text-nets-accent transition-colors">Full Lottery Simulator</h3>
          <p className="text-nets-silver text-sm mt-1">
            Run unlimited simulations. See full results. Track your history.
          </p>
          <span className="text-nets-accent text-sm font-bold mt-3 inline-block group-hover:translate-x-1 transition-transform">
            Launch Simulator &rarr;
          </span>
        </Link>

        <Link href="/gm-mode" className="glass-card rounded-2xl p-6 hover:border-nets-gold/30 border border-transparent transition-all group">
          <h3 className="text-lg font-bold group-hover:text-nets-gold transition-colors">GM Mode</h3>
          <p className="text-nets-silver text-sm mt-1">
            Draft a player. Make trades. Build your roster. Get scored.
          </p>
          <span className="text-nets-gold text-sm font-bold mt-3 inline-block group-hover:translate-x-1 transition-transform">
            Play GM &rarr;
          </span>
        </Link>
      </div>
    </div>
  );
}
