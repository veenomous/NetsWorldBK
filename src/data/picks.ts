export interface NetsPick {
  label: string;
  source: "own" | "suns" | "knicks" | "rockets" | "mavs";
  note: string;
  href: string;
  isSwap?: boolean;
}

export interface NetsPickYear {
  year: number;
  picks: NetsPick[];
}

export const netsPicks: NetsPickYear[] = [
  {
    year: 2025,
    picks: [
      { label: "OWN", source: "own", note: "Lottery", href: "/kb/draft/2025-nba-draft" },
      { label: "PHX", source: "suns", note: "Unprotected", href: "/kb/trades/kevin-durant-trade-tree" },
      { label: "NYK", source: "knicks", note: "Late 1st", href: "/kb/trades/kevin-durant-trade-tree" },
      { label: "HOU", source: "rockets", note: "Top-4 prot.", href: "/kb/trades/kevin-durant-trade-tree" },
    ],
  },
  {
    year: 2027,
    picks: [
      { label: "PHX", source: "suns", note: "Unprotected", href: "/kb/trades/kevin-durant-trade-tree" },
      { label: "NYK", source: "knicks", note: "Unprotected", href: "/kb/trades/kevin-durant-trade-tree" },
      { label: "DAL", source: "mavs", note: "From Kyrie", href: "/kb/trades/kevin-durant-trade-tree" },
    ],
  },
  {
    year: 2028,
    picks: [
      { label: "PHX", source: "suns", note: "Swap", href: "/kb/trades/kevin-durant-trade-tree", isSwap: true },
      { label: "NYK", source: "knicks", note: "Swap", href: "/kb/trades/kevin-durant-trade-tree", isSwap: true },
    ],
  },
  {
    year: 2029,
    picks: [
      { label: "PHX", source: "suns", note: "Unprotected", href: "/kb/trades/kevin-durant-trade-tree" },
      { label: "NYK", source: "knicks", note: "Unprotected", href: "/kb/trades/kevin-durant-trade-tree" },
    ],
  },
  {
    year: 2031,
    picks: [
      { label: "NYK", source: "knicks", note: "Unprotected", href: "/kb/trades/kevin-durant-trade-tree" },
    ],
  },
];

// Total counts for display
export const totalFirstRoundPicks = netsPicks.reduce(
  (sum, y) => sum + y.picks.filter((p) => !p.isSwap).length,
  0
);
export const totalSwaps = netsPicks.reduce(
  (sum, y) => sum + y.picks.filter((p) => p.isSwap).length,
  0
);
