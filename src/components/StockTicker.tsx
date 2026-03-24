"use client";

import { useState } from "react";

interface RosterPlayer {
  name: string;
  position: string;
  age: number;
  salary: string;
  contract: string; // e.g. "2yr / $50M"
  stats: { ppg: number; rpg: number; apg: number };
  trend: "up" | "down" | "steady";
  note: string;
  category: "core" | "young" | "vet" | "prospect";
}

const ROSTER: RosterPlayer[] = [
  { name: "Michael Porter Jr.", position: "SF", age: 27, salary: "$38.3M", contract: "2yr left", stats: { ppg: 24.2, rpg: 7.1, apg: 3.0 }, trend: "up", note: "Best scorer since KD. Trade deadline acquisition paying off.", category: "core" },
  { name: "Nic Claxton", position: "C", age: 26, salary: "$25.4M", contract: "3yr left", stats: { ppg: 11.8, rpg: 7.1, apg: 3.8 }, trend: "steady", note: "Rim protector. Trade asset or long-term piece?", category: "core" },
  { name: "Noah Clowney", position: "PF", age: 21, salary: "$3.4M", contract: "Rookie", stats: { ppg: 12.5, rpg: 4.1, apg: 1.7 }, trend: "up", note: "Breakout sophomore year. Untouchable in trades.", category: "young" },
  { name: "Egor Demin", position: "PG", age: 19, salary: "$6.9M", contract: "Rookie", stats: { ppg: 10.3, rpg: 3.2, apg: 3.3 }, trend: "up", note: "#8 pick delivering. Vision and feel improving fast.", category: "young" },
  { name: "Nolan Traore", position: "PG", age: 19, salary: "$3.8M", contract: "Rookie", stats: { ppg: 8.5, rpg: 1.6, apg: 3.7 }, trend: "steady", note: "Raw athleticism. Flashes of elite passing.", category: "young" },
  { name: "Danny Wolf", position: "PF", age: 21, salary: "$2.8M", contract: "Rookie", stats: { ppg: 8.9, rpg: 4.9, apg: 2.2 }, trend: "up", note: "Stretch big with IQ. Nice find at #27.", category: "young" },
  { name: "Ziaire Williams", position: "SF", age: 24, salary: "$6.3M", contract: "1yr left", stats: { ppg: 9.9, rpg: 2.4, apg: 1.0 }, trend: "steady", note: "Athletic wing. Needs consistent 3-point shot.", category: "vet" },
  { name: "Day'Ron Sharpe", position: "C", age: 24, salary: "$6.3M", contract: "2yr left", stats: { ppg: 8.7, rpg: 6.7, apg: 2.3 }, trend: "steady", note: "Reliable backup big. Does the dirty work.", category: "vet" },
  { name: "Josh Minott", position: "SF", age: 23, salary: "$2.4M", contract: "1yr left", stats: { ppg: 9.2, rpg: 2.1, apg: 0.8 }, trend: "up", note: "Deadline pickup. Athletic project with upside.", category: "vet" },
  { name: "Ben Saraf", position: "SG", age: 19, salary: "$2.9M", contract: "Rookie", stats: { ppg: 6.3, rpg: 1.6, apg: 3.1 }, trend: "steady", note: "Crafty intl guard. #26 pick developing.", category: "young" },
  { name: "Terance Mann", position: "SG", age: 29, salary: "$15.5M", contract: "2yr left", stats: { ppg: 7.3, rpg: 3.2, apg: 3.1 }, trend: "down", note: "Overpaid but solid glue guy. Trade candidate.", category: "vet" },
  { name: "Drake Powell", position: "SG", age: 20, salary: "$3.4M", contract: "Rookie", stats: { ppg: 6.0, rpg: 1.7, apg: 1.5 }, trend: "steady", note: "#22 pick. Raw two-way wing developing.", category: "young" },
];

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "core", label: "Core" },
  { key: "young", label: "Young Core" },
  { key: "vet", label: "Vets" },
];

const trendIcon = { up: "&#9650;", down: "&#9660;", steady: "&#8212;" };
const trendColor = { up: "text-accent-green", down: "text-accent-red", steady: "text-text-muted" };

export default function StockTicker() {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? ROSTER : ROSTER.filter((p) => p.category === filter);

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="heading-md">Roster</h3>
          <p className="text-text-secondary text-xs mt-0.5">2025-26 Brooklyn Nets</p>
        </div>
        <span className="text-text-muted text-xs">{ROSTER.length} players</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              filter === c.key ? "bg-white/10 text-white" : "text-text-muted hover:text-text-secondary hover:bg-white/[0.03]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Player cards */}
      <div className="space-y-2">
        {filtered.map((player) => (
          <div key={player.name} className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            {/* Top row: name + trend + salary */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold ${trendColor[player.trend]}`}
                  dangerouslySetInnerHTML={{ __html: trendIcon[player.trend] }}
                />
                <span className="font-bold text-sm text-text-primary">{player.name}</span>
                <span className="tag tag-blue text-[9px]">{player.position}</span>
              </div>
              <span className="text-text-data text-xs font-medium">{player.salary}</span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 mb-1.5">
              <StatPill label="PPG" value={player.stats.ppg} />
              <StatPill label="RPG" value={player.stats.rpg} />
              <StatPill label="APG" value={player.stats.apg} />
              <span className="text-text-muted text-[11px] ml-auto">Age {player.age} · {player.contract}</span>
            </div>

            {/* Note */}
            <p className="text-text-secondary text-xs leading-snug">{player.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-text-muted text-[10px] uppercase">{label}</span>
      <span className="text-text-primary text-sm font-bold tabular-nums">{value.toFixed(1)}</span>
    </div>
  );
}
