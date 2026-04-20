import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runLotterySimulation } from "@/lib/lottery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kijbuyyzetkxgcrphtjd.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const DAILY_CAP = 10;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const visitorId = typeof body.visitor_id === "string" ? body.visitor_id.slice(0, 64) : "";
  const xHandle = typeof body.x_handle === "string" ? body.x_handle.slice(0, 60) : null;
  const displayName = typeof body.display_name === "string" ? body.display_name.slice(0, 60) : null;

  if (!visitorId) {
    return NextResponse.json({ error: "visitor_id required" }, { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countErr } = await supabase
    .from("lottery_spins")
    .select("id", { count: "exact", head: true })
    .eq("visitor_id", visitorId)
    .gte("spun_at", sinceIso);

  if (countErr) {
    return NextResponse.json({ error: `cap check failed: ${countErr.message}` }, { status: 500 });
  }

  if ((count ?? 0) >= DAILY_CAP) {
    return NextResponse.json(
      { error: "daily cap reached", cap: DAILY_CAP, reset_at: sinceIso },
      { status: 429 },
    );
  }

  const sim = runLotterySimulation();
  const nets = sim.netsResult;

  const { data: inserted, error: insertErr } = await supabase
    .from("lottery_spins")
    .insert({
      visitor_id: visitorId,
      x_handle: xHandle,
      display_name: displayName,
      nets_pick: nets.lotteryPick,
      top_4: nets.lotteryPick <= 4,
      original_slot: nets.originalSlot,
      spot_change: nets.originalSlot - nets.lotteryPick,
    })
    .select("id, spun_at")
    .single();

  if (insertErr || !inserted) {
    return NextResponse.json({ error: `insert failed: ${insertErr?.message}` }, { status: 500 });
  }

  const remaining = DAILY_CAP - (count ?? 0) - 1;

  return NextResponse.json({
    id: inserted.id,
    spun_at: inserted.spun_at,
    result: sim,
    nets_pick: nets.lotteryPick,
    top_4: nets.lotteryPick <= 4,
    remaining,
    cap: DAILY_CAP,
  });
}
