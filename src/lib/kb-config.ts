export interface KBCategory {
  slug: string;
  label: string;
  icon: string; // Material Symbols icon name
}

export interface KBTeamConfig {
  sport: string;
  teamAbbrev: string;
  teamName: string;
  teamFullName: string;
  wikiDir: string; // relative to project root
  categories: KBCategory[];
  rawSourceTypes: string[];
  brandColor: string;
}

// ─── NBA Category Defaults ───
const NBA_CATEGORIES: KBCategory[] = [
  { slug: "players", label: "Players", icon: "person" },
  { slug: "seasons", label: "Seasons", icon: "calendar_month" },
  { slug: "trades", label: "Trades", icon: "swap_horiz" },
  { slug: "front-office", label: "Front Office", icon: "corporate_fare" },
  { slug: "draft", label: "Draft", icon: "format_list_numbered" },
  { slug: "rivalries", label: "Rivalries", icon: "swords" },
  { slug: "assets", label: "Cap & Assets", icon: "payments" },
  { slug: "strategy", label: "Strategy", icon: "strategy" },
  { slug: "community", label: "Community", icon: "groups" },
  { slug: "rumors", label: "Rumor Mill", icon: "local_fire_department" },
];

const NBA_RAW_TYPES = [
  "transactions",
  "pressers",
  "scouting",
  "beat-reporters",
  "stats",
  "media",
];

// ─── Team Configs ───
export const BKN_CONFIG: KBTeamConfig = {
  sport: "nba",
  teamAbbrev: "BKN",
  teamName: "Nets",
  teamFullName: "Brooklyn Nets",
  wikiDir: "kb/wiki",
  categories: NBA_CATEGORIES,
  rawSourceTypes: NBA_RAW_TYPES,
  brandColor: "#E43C3E",
};

// Default config for the current site
export const DEFAULT_KB_CONFIG = BKN_CONFIG;

// Registry for multi-team support (Phase 5)
export const KB_CONFIGS: Record<string, KBTeamConfig> = {
  bkn: BKN_CONFIG,
  // nyk: NYK_CONFIG,  // Phase 5
  // lal: LAL_CONFIG,  // Future
};

// Helper to get config by team abbreviation
export function getKBConfig(team?: string): KBTeamConfig {
  if (!team) return DEFAULT_KB_CONFIG;
  return KB_CONFIGS[team.toLowerCase()] || DEFAULT_KB_CONFIG;
}
