import type { Metadata } from "next";
import ThePress from "@/components/ThePress";

export const metadata: Metadata = {
  title: "The Press — BK Grit",
  description: "Brooklyn Nets fan articles. Game recaps, previews, news, and opinion pieces.",
};

export default function PressPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tighter uppercase font-display">The Press</h1>
        <p className="text-black/30 text-sm mt-1">Game Recaps · Previews · News · Opinion</p>
      </div>
      <ThePress showForm={true} />
    </div>
  );
}
