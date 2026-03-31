import type { Metadata } from "next";
import TheWire from "@/components/TheWire";

export const metadata: Metadata = {
  title: "The Wire — BK Grit",
  description: "The unified Brooklyn Nets fan feed. Takes, recaps, articles, and discussion — all in one place.",
};

export default function CommunityPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase font-display">The Wire</h1>
        <p className="text-black/40 text-sm mt-1 uppercase tracking-wider">Takes · Recaps · Articles — All in one feed</p>
      </div>
      <TheWire showForm={true} showHotTake={true} />
    </div>
  );
}
