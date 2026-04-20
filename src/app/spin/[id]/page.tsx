import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kijbuyyzetkxgcrphtjd.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

interface SpinRow {
  id: string;
  nets_pick: number;
  top_4: boolean;
  original_slot: number | null;
  spot_change: number | null;
  display_name: string | null;
  x_handle: string | null;
  spun_at: string;
}

async function getSpin(id: string): Promise<SpinRow | null> {
  if (!id) return null;
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data } = await supabase
    .from("lottery_spins")
    .select("id, nets_pick, top_4, original_slot, spot_change, display_name, x_handle, spun_at")
    .eq("id", id)
    .maybeSingle();
  return (data as SpinRow | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const spin = await getSpin(id);
  if (!spin) return { title: "Spin — BK Grit" };
  const title = spin.top_4
    ? `Nets land #${spin.nets_pick} — Top 4!`
    : `Nets land #${spin.nets_pick} in the 2026 Lottery`;
  const description = "Spin your own on BK Grit's 2026 Lottery Simulator.";
  const ogImage = `/api/lottery/spins/${spin.id}/og`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function SpinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const spin = await getSpin(id);
  if (!spin) notFound();

  const display = spin.x_handle
    ? `@${spin.x_handle.replace(/^@/, "")}`
    : spin.display_name || "A fan";

  const change = spin.spot_change ?? 0;
  const changeText =
    change > 0
      ? `Jumped ${change} spots`
      : change < 0
      ? `Dropped ${Math.abs(change)} spots`
      : "Stayed in place";

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="bg-black text-white px-4 sm:px-8 pt-4 pb-6">
        <div className="max-w-3xl mx-auto">
          <nav className="flex items-center gap-2 text-xs font-body mb-4">
            <Link href="/simulator" className="text-white/40 hover:text-white transition-colors">&larr; Sim</Link>
          </nav>
          <p className="text-[10px] font-display font-bold uppercase tracking-[0.3em] text-brand-red mb-2">
            2026 Lottery Spin
          </p>
          <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight">
            {display}&apos;s <span className="text-brand-red">spin</span>
          </h1>
        </div>
      </div>
      <div className="h-1 bg-brand-red" />

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <section className={`border p-8 text-center ${spin.top_4 ? "bg-black text-white border-black" : "bg-white border-black/10"}`}>
          <p className={`text-[10px] font-display font-bold uppercase tracking-[0.3em] ${spin.top_4 ? "text-white/50" : "text-text-muted"}`}>
            Brooklyn Nets
          </p>
          <p className="font-display font-black text-7xl sm:text-8xl tabular-nums mt-3 text-brand-red">
            #{spin.nets_pick}
          </p>
          <p className={`text-sm font-body mt-3 ${spin.top_4 ? "text-white/60" : "text-text-muted"}`}>
            {spin.top_4 && <span className="font-bold text-brand-red">Top 4! </span>}
            {changeText}
          </p>
        </section>

        <div className="text-center">
          <Link
            href="/simulator"
            className="inline-block bg-brand-red text-white font-display font-bold text-xs uppercase tracking-wider px-6 py-3 hover:bg-black transition-colors"
          >
            Spin Your Own →
          </Link>
        </div>

        <div className="text-center">
          <Link
            href="/simulator/leaderboard"
            className="text-[11px] font-display font-bold uppercase tracking-wider text-text-muted hover:text-brand-red transition-colors"
          >
            Leaderboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
