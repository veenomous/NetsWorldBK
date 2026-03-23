import LotterySimulator from "@/components/LotterySimulator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lottery Simulator — NetsWorld",
  description: "Run the NBA Draft Lottery. See where the Brooklyn Nets land. Save your best result.",
};

export default function SimulatorPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center py-4">
        <h1 className="text-3xl sm:text-4xl font-black gradient-text">Lottery Simulator</h1>
        <p className="text-nets-silver mt-2">
          Run the NBA Draft Lottery as many times as you want. How lucky are you?
        </p>
      </div>

      <LotterySimulator />

      {/* Info */}
      <div className="glass-card rounded-2xl p-6 text-sm text-nets-silver space-y-2">
        <h3 className="font-bold text-white text-base">How it works</h3>
        <p>
          The NBA uses a weighted lottery system with 14 ping-pong balls creating 1,001 possible
          4-number combinations. The top 4 picks are drawn by lottery, with the remaining picks
          assigned by inverse record.
        </p>
        <p>
          Teams with the worst records have the best odds (14% for each of the bottom 3 teams),
          but any lottery team can jump into the top 4.
        </p>
        <p>
          This simulator uses the exact same probability weights as the real NBA lottery.
        </p>
      </div>
    </div>
  );
}
