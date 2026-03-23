import GMMode from "@/components/GMMode";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GM Mode — NetsWorld",
  description: "Play General Manager of the Brooklyn Nets. Draft, trade, and build your roster. Get scored against other fans.",
};

export default function GMModePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center py-4">
        <h1 className="text-3xl sm:text-4xl font-black gradient-text">GM Mode</h1>
        <p className="text-nets-silver mt-2">
          You&apos;re the GM of the Brooklyn Nets. Make your moves.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <GMMode />
      </div>

      <div className="glass-card rounded-2xl p-6 text-sm text-nets-silver">
        <h3 className="font-bold text-white text-base mb-2">About GM Mode</h3>
        <p>
          Make three key decisions — who to draft, whether to trade the pick, and your overall
          rebuild strategy. Your choices are scored based on player fit, consensus rankings,
          and strategic alignment. Compare your GM IQ against other Nets fans.
        </p>
      </div>
    </div>
  );
}
