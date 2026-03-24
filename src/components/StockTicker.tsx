"use client";

import { useState, useEffect } from "react";
import { supabase, getVisitorId } from "@/lib/supabase";

interface PlayerStock {
  name: string;
  role: string;
  category: "roster" | "prospect";
  tagline: string;
  ups: number;
  downs: number;
  trend: number;
  hot: boolean;
}

// Base player data — votes come from Supabase
const PLAYERS: Omit<PlayerStock, "ups" | "downs" | "trend" | "hot">[] = [
  { name: "Michael Porter Jr.", role: "SF", category: "roster", tagline: "24.2 PPG — leading scorer. Best version of MPJ." },
  { name: "Nic Claxton", role: "C", category: "roster", tagline: "11.8 PPG / 7.1 RPG — trade value? Or long-term piece?" },
  { name: "Noah Clowney", role: "PF", category: "roster", tagline: "12.5 PPG — breakout sophomore year. Young core lock." },
  { name: "Egor Demin", role: "PG", category: "roster", tagline: "10.3 PPG / 3.3 APG as a rookie. #8 pick looking good." },
  { name: "Nolan Traore", role: "PG", category: "roster", tagline: "8.5 PPG / 3.7 APG — raw but flashes are real." },
  { name: "Danny Wolf", role: "PF", category: "roster", tagline: "8.9 PPG / 4.9 RPG — solid rookie production." },
  { name: "Day'Ron Sharpe", role: "C", category: "roster", tagline: "8.7 PPG / 6.7 RPG — steady backup big." },
  { name: "Ziaire Williams", role: "SF", category: "roster", tagline: "9.9 PPG — re-signed in the offseason. Flashes potential." },
  { name: "Cameron Boozer", role: "PF — Duke", category: "prospect", tagline: "22.4/10.3/4.2 — ACC POY. Dream fit at the 4." },
  { name: "AJ Dybantsa", role: "SF — BYU", category: "prospect", tagline: "25.5 PPG. Exactly the wing BKN needs." },
  { name: "Darryn Peterson", role: "SG — Kansas", category: "prospect", tagline: "Guard-heavy already. Fit concern." },
  { name: "Caleb Wilson", role: "PF — UNC", category: "prospect", tagline: "Thumb surgery ended his season early." },
];

export default function StockTicker() {
  const [stocks, setStocks] = useState<PlayerStock[]>([]);
  const [filter, setFilter] = useState<"all" | "roster" | "prospect">("all");
  const [userVotes, setUserVotes] = useState<Record<string, "up" | "down">>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const visitorId = getVisitorId();
      const today = new Date().toISOString().split("T")[0];

      // Get today's vote counts per player
      const { data: allVotes } = await supabase
        .from("stock_votes")
        .select("player_name, vote_type");

      // Get this user's votes today
      const { data: myVotes } = await supabase
        .from("stock_votes")
        .select("player_name, vote_type")
        .eq("visitor_id", visitorId)
        .eq("vote_date", today);

      // Aggregate votes
      const voteCounts: Record<string, { ups: number; downs: number }> = {};
      (allVotes || []).forEach((v: any) => {
        if (!voteCounts[v.player_name]) voteCounts[v.player_name] = { ups: 0, downs: 0 };
        if (v.vote_type === "up") voteCounts[v.player_name].ups++;
        else voteCounts[v.player_name].downs++;
      });

      // Build user vote map
      const myVoteMap: Record<string, "up" | "down"> = {};
      (myVotes || []).forEach((v: any) => { myVoteMap[v.player_name] = v.vote_type; });
      setUserVotes(myVoteMap);

      // Build stocks
      const built: PlayerStock[] = PLAYERS.map((p) => {
        const counts = voteCounts[p.name] || { ups: 0, downs: 0 };
        const trend = counts.ups - counts.downs;
        return {
          ...p,
          ups: counts.ups,
          downs: counts.downs,
          trend,
          hot: counts.ups >= 5 && counts.ups > counts.downs * 2,
        };
      });

      // Sort by trend descending
      built.sort((a, b) => b.trend - a.trend);
      setStocks(built);
      setLoading(false);
    }
    load();
  }, []);

  const handleVote = async (name: string, direction: "up" | "down") => {
    if (userVotes[name]) return;
    const visitorId = getVisitorId();
    const today = new Date().toISOString().split("T")[0];

    // Optimistic update
    setUserVotes((prev) => ({ ...prev, [name]: direction }));
    setStocks((prev) =>
      prev.map((s) =>
        s.name === name
          ? {
              ...s,
              ups: s.ups + (direction === "up" ? 1 : 0),
              downs: s.downs + (direction === "down" ? 1 : 0),
              trend: s.trend + (direction === "up" ? 1 : -1),
            }
          : s
      )
    );

    await supabase.from("stock_votes").insert({
      player_name: name,
      vote_type: direction,
      visitor_id: visitorId,
      vote_date: today,
    });
  };

  const filtered = filter === "all" ? stocks : stocks.filter((s) => s.category === filter);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[15px]">Player Stock Ticker</h3>
          <p className="text-text-muted text-xs mt-0.5">Who&apos;s rising, who&apos;s falling? Vote daily.</p>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        {(["all", "roster", "prospect"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
              filter === f ? "bg-white/10 text-white" : "text-text-muted hover:text-text-secondary hover:bg-white/[0.03]"
            }`}
          >
            {f === "all" ? "All" : f === "roster" ? "Roster" : "Prospects"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-white/[0.02] animate-pulse-soft" />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((stock) => {
            const isUp = stock.trend > 0;
            const userVote = userVotes[stock.name];

            return (
              <div
                key={stock.name}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors group"
              >
                <div className={`w-10 text-center font-black text-sm ${
                  stock.trend > 0 ? "text-accent-green" : stock.trend < 0 ? "text-accent-red" : "text-text-muted"
                }`}>
                  {stock.trend > 0 ? "+" : ""}{stock.trend}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm truncate">{stock.name}</span>
                    {stock.hot && <span className="tag tag-red text-[9px]">HOT</span>}
                    <span className="tag tag-blue text-[9px]">{stock.role}</span>
                  </div>
                  <p className="text-text-muted text-[11px] mt-0.5 truncate">{stock.tagline}</p>
                </div>

                <div className="text-[11px] text-text-muted">
                  {stock.ups}↑ {stock.downs}↓
                </div>

                <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleVote(stock.name, "up")}
                    disabled={!!userVote}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                      userVote === "up"
                        ? "bg-accent-green/20 text-accent-green"
                        : "bg-white/[0.04] hover:bg-accent-green/10 text-text-muted hover:text-accent-green"
                    } ${userVote ? "cursor-default" : "cursor-pointer"}`}
                  >
                    &#9650;
                  </button>
                  <button
                    onClick={() => handleVote(stock.name, "down")}
                    disabled={!!userVote}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                      userVote === "down"
                        ? "bg-accent-red/20 text-accent-red"
                        : "bg-white/[0.04] hover:bg-accent-red/10 text-text-muted hover:text-accent-red"
                    } ${userVote ? "cursor-default" : "cursor-pointer"}`}
                  >
                    &#9660;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
