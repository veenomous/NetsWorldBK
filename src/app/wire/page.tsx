import type { Metadata } from "next";
import TheWire from "@/components/TheWire";

export const metadata: Metadata = {
  title: "The Wire — BK Grit",
  description: "Brooklyn Nets fan forum. Drop takes, share X posts, react and reply.",
};

export default function WirePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tighter uppercase font-display">The Wire</h1>
        <p className="text-black/30 text-sm mt-1">Drop takes. Share posts. React.</p>
      </div>
      <TheWire showForm={true} showHotTake={true} />
    </div>
  );
}
