import TradeMachine from "@/components/TradeMachine";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trade Machine — BK Grit",
  description: "Build trades for the Brooklyn Nets. Check salary matching. Vote on community trades. Share on X.",
};

export default function TradeMachinePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="py-4">
        <h1 className="text-2xl sm:text-3xl font-black gradient-text-brand">Trade Machine</h1>
        <p className="text-text-secondary text-sm mt-1">
          Build a trade. Check the salaries. See what other fans think.
        </p>
      </div>

      <div className="card p-5 sm:p-6">
        <TradeMachine />
      </div>
    </div>
  );
}
