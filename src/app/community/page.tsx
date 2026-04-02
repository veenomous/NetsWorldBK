import type { Metadata } from "next";
import ThePress from "@/components/ThePress";

export const metadata: Metadata = {
  title: "The Press — BK Grit",
  description: "Game recaps, previews, news, and opinion from the Brooklyn Nets community.",
};

export default function PressPage() {
  return (
    <div>
      {/* Header */}
      <header className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
        <div className="border-l-8 border-black pl-6 sm:pl-8">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4 font-display">The Press</h1>
          <p className="text-base sm:text-lg text-black/40 font-medium tracking-tight max-w-xl">
            Game recaps, previews, deep-dive features, and opinion from the Brooklyn Nets community.
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 pb-16">
        <ThePress showForm={true} />
      </main>
    </div>
  );
}
