import LotterySimulator from "@/components/LotterySimulator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lottery Simulator — BK Grit",
  description: "Run the 2026 NBA Draft Lottery. See where the Brooklyn Nets land. Share your result on X.",
};

export default function SimulatorPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="py-4">
        <h1 className="text-2xl sm:text-3xl font-black gradient-text-brand">Lottery Simulator</h1>
        <p className="text-text-secondary text-sm mt-1">
          Run the 2026 NBA Draft Lottery. How lucky are you?
        </p>
      </div>

      <LotterySimulator />

      <div className="card p-5 text-xs text-text-muted space-y-2">
        <h3 className="font-bold text-text-secondary text-sm">How it works</h3>
        <p>
          The NBA uses a weighted lottery system with 14 ping-pong balls creating 1,001 possible
          4-number combinations. The top 4 picks are drawn by lottery — remaining picks go by
          inverse record. The 3 worst teams each get 14% odds at #1.
        </p>
        <p>
          The Nets currently sit at #3 in lottery standings (17-54) with the same 14% chance at
          the #1 pick as Indiana and Washington. Lottery night: May 10, 2026.
        </p>
      </div>
    </div>
  );
}
