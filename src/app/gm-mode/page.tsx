import GMMode from "@/components/GMMode";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Draft War Room — BK Grit",
  description: "Play GM of the Brooklyn Nets. Draft, trade, and strategize. Get scored against other fans.",
};

export default function GMModePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="py-4">
        <h1 className="text-2xl sm:text-3xl font-black gradient-text-brand">Draft War Room</h1>
        <p className="text-text-secondary text-sm mt-1">
          You&apos;re the GM. Draft your guy. Set the strategy. Get scored.
        </p>
      </div>

      <div className="card p-5 sm:p-6">
        <GMMode />
      </div>

      <div className="card p-5 text-xs text-text-muted">
        <h3 className="font-bold text-text-secondary text-sm mb-1.5">About the War Room</h3>
        <p>
          Make three decisions — who to draft, whether to trade the pick, and your rebuild
          strategy. Scored on player fit, consensus rankings, and strategic alignment.
          The Nets need frontcourt help — they already have guards (Demin, Traore, Powell, Saraf).
          Share your score on X and see how you stack up.
        </p>
      </div>
    </div>
  );
}
