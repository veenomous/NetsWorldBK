import KBGraphExplorer from "@/components/KBGraphExplorer";
import { buildGraph } from "@/lib/kb";
import Link from "next/link";

export const metadata = {
  title: "Knowledge Graph — BK Grit",
  description: "Explore how every player, trade, pick, and concept in the Nets rebuild connects.",
};

export default function KBGraphPage() {
  const graph = buildGraph();

  return (
    <div className="min-h-screen bg-black">
      <div className="px-4 sm:px-8 pt-6 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/" className="text-white/40 hover:text-white text-sm font-body transition-colors">
              &larr; KB
            </Link>
            <span className="tag tag-red">Graph Explorer</span>
          </div>
          <h1 className="font-display font-black text-white text-2xl sm:text-3xl uppercase tracking-tight">
            Knowledge <span className="text-brand-red">Graph</span>
          </h1>
          <p className="text-white/30 text-xs font-body mt-1">
            {graph.nodes.length} articles, {graph.edges.length} connections. Tap a node to read. Drag to rearrange.
          </p>
        </div>
      </div>
      <KBGraphExplorer graph={graph} />
    </div>
  );
}
