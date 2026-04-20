import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kijbuyyzetkxgcrphtjd.supabase.co";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpamJ1eXl6ZXRreGdjcnBodGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzg2NTksImV4cCI6MjA4OTkxNDY1OX0.8qJe14118lGBo_QsZ5_VAm00NmIbnGraeteQGRiWyeU";

interface SpinRow {
  visitor_id: string;
  x_handle: string | null;
  display_name: string | null;
  nets_pick: number;
  top_4: boolean;
  spun_at: string;
}

interface Entry {
  visitor_id: string;
  display: string;
  is_logged_in: boolean;
  best_pick: number;
  total_spins: number;
  top_4_count: number;
  top_4_rate: number;
  latest_spun_at: string;
}

export async function GET(req: NextRequest) {
  const tab = req.nextUrl.searchParams.get("tab") || "best";
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data, error } = await supabase
    .from("lottery_spins")
    .select("visitor_id, x_handle, display_name, nets_pick, top_4, spun_at")
    .order("spun_at", { ascending: false })
    .limit(5000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const byVisitor = new Map<string, Entry>();
  for (const row of (data ?? []) as SpinRow[]) {
    const existing = byVisitor.get(row.visitor_id);
    const display = row.x_handle
      ? `@${row.x_handle.replace(/^@/, "")}`
      : row.display_name
      ? row.display_name
      : `Visitor ${row.visitor_id.slice(0, 6)}`;
    if (!existing) {
      byVisitor.set(row.visitor_id, {
        visitor_id: row.visitor_id,
        display,
        is_logged_in: !!row.x_handle,
        best_pick: row.nets_pick,
        total_spins: 1,
        top_4_count: row.top_4 ? 1 : 0,
        top_4_rate: row.top_4 ? 1 : 0,
        latest_spun_at: row.spun_at,
      });
    } else {
      existing.total_spins += 1;
      if (row.nets_pick < existing.best_pick) existing.best_pick = row.nets_pick;
      if (row.top_4) existing.top_4_count += 1;
      existing.top_4_rate = existing.top_4_count / existing.total_spins;
      if (!existing.is_logged_in && row.x_handle) {
        existing.is_logged_in = true;
        existing.display = display;
      }
    }
  }

  const rows = Array.from(byVisitor.values());

  let sorted: Entry[];
  if (tab === "luckiest") {
    sorted = rows
      .filter((r) => r.total_spins >= 3)
      .sort((a, b) => b.top_4_rate - a.top_4_rate || b.total_spins - a.total_spins);
  } else if (tab === "most") {
    sorted = rows.sort((a, b) => b.total_spins - a.total_spins);
  } else {
    sorted = rows.sort(
      (a, b) => a.best_pick - b.best_pick || new Date(a.latest_spun_at).getTime() - new Date(b.latest_spun_at).getTime(),
    );
  }

  return NextResponse.json({
    tab,
    entries: sorted.slice(0, 50),
    total_visitors: rows.length,
  });
}
