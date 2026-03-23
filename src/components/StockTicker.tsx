"use client";

import { useState, useEffect } from "react";

interface PlayerStock {
  name: string;
  role: string;
  category: "roster" | "prospect";
  trend: number; // -100 to +100
  prevTrend: number;
  hot: boolean;
  tagline: string;
}

const initialStocks: PlayerStock[] = [
  // Current Nets roster
  { name: "Cam Thomas", role: "SG", category: "roster", trend: 18, prevTrend: 12, hot: true, tagline: "30-piece again. Trade value climbing." },
  { name: "Nic Claxton", role: "C", category: "roster", trend: -8, prevTrend: 2, hot: false, tagline: "Trade rumors swirling. Where does he fit?" },
  { name: "Ben Simmons", role: "PF", category: "roster", trend: -42, prevTrend: -38, hot: false, tagline: "Barely playing. End of the road?" },
  { name: "Cam Johnson", role: "SF", category: "roster", trend: 6, prevTrend: 10, hot: false, tagline: "Solid vet presence. Valuable trade chip." },
  { name: "D'Angelo Russell", role: "PG", category: "roster", trend: -15, prevTrend: -10, hot: false, tagline: "Back in Brooklyn but for how long?" },
  // Draft prospects
  { name: "Cameron Boozer", role: "PF — Duke", category: "prospect", trend: 32, prevTrend: 24, hot: true, tagline: "ACC POY. Dream fit at the 4." },
  { name: "AJ Dybantsa", role: "SF — BYU", category: "prospect", trend: 25, prevTrend: 30, hot: true, tagline: "25 PPG scorer. Exactly what BKN needs." },
  { name: "Darryn Peterson", role: "SG — Kansas", category: "prospect", trend: 14, prevTrend: 22, hot: false, tagline: "Guard-heavy already. Fit concern." },
  { name: "Caleb Wilson", role: "PF — UNC", category: "prospect", trend: -5, prevTrend: 8, hot: false, tagline: "Thumb surgery ended his season." },
  { name: "Darius Acuff Jr.", role: "PG — Arkansas", category: "prospect", trend: 20, prevTrend: 10, hot: true, tagline: "SEC POY. Most NBA-ready guard." },
];

export default function StockTicker() {
  const [stocks, setStocks] = useState(initialStocks);
  const [filter, setFilter] = useState<"all" | "roster" | "prospect">("all");
  const [userVotes, setUserVotes] = useState<Record<string, "up" | "down">>({});

  useEffect(() => {
    const saved = localStorage.getItem("nw-stock-votes");
    if (saved) setUserVotes(JSON.parse(saved));
  }, []);

  const handleVote = (name: string, direction: "up" | "down") => {
    if (userVotes[name]) return;
    const newVotes = { ...userVotes, [name]: direction };
    setUserVotes(newVotes);
    localStorage.setItem("nw-stock-votes", JSON.stringify(newVotes));

    setStocks((prev) =>
      prev.map((s) =>
        s.name === name
          ? { ...s, trend: s.trend + (direction === "up" ? 3 : -3) }
          : s
      )
    );
  };

  const filtered = filter === "all" ? stocks : stocks.filter((s) => s.category === filter);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[15px]">Player Stock Ticker</h3>
          <p className="text-text-muted text-xs mt-0.5">Who&apos;s rising, who&apos;s falling?</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {(["all", "roster", "prospect"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
              filter === f
                ? "bg-white/10 text-white"
                : "text-text-muted hover:text-text-secondary hover:bg-white/[0.03]"
            }`}
          >
            {f === "all" ? "All" : f === "roster" ? "Roster" : "Prospects"}
          </button>
        ))}
      </div>

      {/* Stock list */}
      <div className="space-y-1">
        {filtered.map((stock) => {
          const isUp = stock.trend > 0;
          const delta = stock.trend - stock.prevTrend;
          const userVote = userVotes[stock.name];

          return (
            <div
              key={stock.name}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors group"
            >
              {/* Trend indicator */}
              <div className={`w-10 text-center font-black text-sm ${
                isUp ? "text-accent-green" : "text-accent-red"
              }`}>
                {isUp ? "+" : ""}{stock.trend}
              </div>

              {/* Player info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm truncate">{stock.name}</span>
                  {stock.hot && <span className="tag tag-red text-[9px]">HOT</span>}
                  <span className="tag tag-blue text-[9px]">{stock.role}</span>
                </div>
                <p className="text-text-muted text-[11px] mt-0.5 truncate">{stock.tagline}</p>
              </div>

              {/* Delta arrow */}
              <div className={`text-[11px] font-bold ${
                delta > 0 ? "text-accent-green" : delta < 0 ? "text-accent-red" : "text-text-muted"
              }`}>
                {delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : "—"}
              </div>

              {/* Vote buttons */}
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
    </div>
  );
}
