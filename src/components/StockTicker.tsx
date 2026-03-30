"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { supabase, getVisitorId } from "@/lib/supabase";

interface RosterPlayer {
  name: string;
  position: string;
  age: number;
  salary: string;
  contract: string;
  stats: { ppg: number; rpg: number; apg: number };
  trend: "up" | "down" | "steady";
  category: "core" | "young" | "vet";
}

interface PlayerTake {
  id: string;
  text: string;
  author: string;
  created_at: string;
}

interface RatingCounts {
  star: number;
  starter: number;
  role_player: number;
  trade_him: number;
  total: number;
}

const ROSTER: RosterPlayer[] = [
  { name: "Michael Porter Jr.", position: "SF", age: 27, salary: "$38.3M", contract: "2yr left", stats: { ppg: 24.2, rpg: 7.1, apg: 3.0 }, trend: "up", category: "core" },
  { name: "Nic Claxton", position: "C", age: 26, salary: "$25.4M", contract: "3yr left", stats: { ppg: 11.8, rpg: 7.1, apg: 3.8 }, trend: "steady", category: "core" },
  { name: "Noah Clowney", position: "PF", age: 21, salary: "$3.4M", contract: "Rookie", stats: { ppg: 12.5, rpg: 4.1, apg: 1.7 }, trend: "up", category: "young" },
  { name: "Egor Demin", position: "PG", age: 19, salary: "$6.9M", contract: "Rookie", stats: { ppg: 10.3, rpg: 3.2, apg: 3.3 }, trend: "up", category: "young" },
  { name: "Nolan Traore", position: "PG", age: 19, salary: "$3.8M", contract: "Rookie", stats: { ppg: 8.5, rpg: 1.6, apg: 3.7 }, trend: "steady", category: "young" },
  { name: "Danny Wolf", position: "PF", age: 21, salary: "$2.8M", contract: "Rookie", stats: { ppg: 8.9, rpg: 4.9, apg: 2.2 }, trend: "up", category: "young" },
  { name: "Ziaire Williams", position: "SF", age: 24, salary: "$6.3M", contract: "1yr left", stats: { ppg: 9.9, rpg: 2.4, apg: 1.0 }, trend: "steady", category: "vet" },
  { name: "Day'Ron Sharpe", position: "C", age: 24, salary: "$6.3M", contract: "2yr left", stats: { ppg: 8.7, rpg: 6.7, apg: 2.3 }, trend: "steady", category: "vet" },
  { name: "Josh Minott", position: "SF", age: 23, salary: "$2.4M", contract: "1yr left", stats: { ppg: 9.2, rpg: 2.1, apg: 0.8 }, trend: "up", category: "vet" },
  { name: "Terance Mann", position: "SG", age: 29, salary: "$15.5M", contract: "2yr left", stats: { ppg: 7.3, rpg: 3.2, apg: 3.1 }, trend: "down", category: "vet" },
  { name: "Ben Saraf", position: "SG", age: 19, salary: "$2.9M", contract: "Rookie", stats: { ppg: 6.3, rpg: 1.6, apg: 3.1 }, trend: "steady", category: "young" },
  { name: "Drake Powell", position: "SG", age: 20, salary: "$3.4M", contract: "Rookie", stats: { ppg: 6.0, rpg: 1.7, apg: 1.5 }, trend: "steady", category: "young" },
];

const RATING_OPTIONS = [
  { key: "star", label: "Star", emoji: "⭐" },
  { key: "starter", label: "Starter", emoji: "✅" },
  { key: "role_player", label: "Role Player", emoji: "🔄" },
  { key: "trade_him", label: "Trade Him", emoji: "📦" },
] as const;

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "core", label: "Core" },
  { key: "young", label: "Young Core" },
  { key: "vet", label: "Vets" },
];

const trendIcon = { up: "▲", down: "▼", steady: "—" };
const trendColor = { up: "text-accent-green", down: "text-accent-red", steady: "text-text-muted" };

export default function StockTicker() {
  const { data: session } = useSession();
  const xHandle = (session?.user as { xHandle?: string })?.xHandle;

  const [filter, setFilter] = useState("all");
  const [ratings, setRatings] = useState<Record<string, RatingCounts>>({});
  const [myRatings, setMyRatings] = useState<Record<string, string>>({});
  const [takes, setTakes] = useState<Record<string, PlayerTake[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newTake, setNewTake] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const visitorId = getVisitorId();
      const playerNames = ROSTER.map((p) => p.name);

      const [ratingsRes, myRatingsRes, takesRes] = await Promise.all([
        supabase.from("player_ratings").select("player_name, rating").in("player_name", playerNames),
        supabase.from("player_ratings").select("player_name, rating").eq("visitor_id", visitorId).in("player_name", playerNames),
        supabase.from("player_takes").select("*").in("player_name", playerNames).order("created_at", { ascending: false }).limit(50),
      ]);

      // Aggregate ratings
      const rMap: Record<string, RatingCounts> = {};
      (ratingsRes.data || []).forEach((r: any) => {
        if (!rMap[r.player_name]) rMap[r.player_name] = { star: 0, starter: 0, role_player: 0, trade_him: 0, total: 0 };
        rMap[r.player_name][r.rating as keyof Omit<RatingCounts, "total">]++;
        rMap[r.player_name].total++;
      });
      setRatings(rMap);

      // My ratings
      const myMap: Record<string, string> = {};
      (myRatingsRes.data || []).forEach((r: any) => { myMap[r.player_name] = r.rating; });
      setMyRatings(myMap);

      // Group takes by player
      const tMap: Record<string, PlayerTake[]> = {};
      (takesRes.data || []).forEach((t: any) => {
        if (!tMap[t.player_name]) tMap[t.player_name] = [];
        tMap[t.player_name].push(t);
      });
      setTakes(tMap);

      setLoading(false);
    }
    load();
  }, []);

  const handleRate = async (playerName: string, rating: string) => {
    if (myRatings[playerName]) return;
    const visitorId = getVisitorId();

    setMyRatings((prev) => ({ ...prev, [playerName]: rating }));
    setRatings((prev) => {
      const cur = prev[playerName] || { star: 0, starter: 0, role_player: 0, trade_him: 0, total: 0 };
      return { ...prev, [playerName]: { ...cur, [rating]: (cur[rating as keyof Omit<RatingCounts, "total">] || 0) + 1, total: cur.total + 1 } };
    });

    await supabase.from("player_ratings").insert({ player_name: playerName, rating, visitor_id: visitorId });
  };

  const handleSubmitTake = async (playerName: string) => {
    if (!newTake.trim() || newTake.length < 5 || submitting) return;
    setSubmitting(true);
    const visitorId = getVisitorId();
    const author = xHandle || newAuthor.trim() || "Anonymous";

    const { data } = await supabase
      .from("player_takes")
      .insert({ player_name: playerName, text: newTake.trim(), author, visitor_id: visitorId })
      .select()
      .single();

    if (data) {
      setTakes((prev) => ({
        ...prev,
        [playerName]: [data, ...(prev[playerName] || [])],
      }));
      setNewTake("");
    }
    setSubmitting(false);
  };

  const filtered = filter === "all" ? ROSTER : ROSTER.filter((p) => p.category === filter);

  function getTopRating(playerName: string): string | null {
    const r = ratings[playerName];
    if (!r || r.total === 0) return null;
    const entries = [
      { key: "star", count: r.star, label: "Star" },
      { key: "starter", count: r.starter, label: "Starter" },
      { key: "role_player", count: r.role_player, label: "Role Player" },
      { key: "trade_him", count: r.trade_him, label: "Trade Him" },
    ];
    const top = entries.sort((a, b) => b.count - a.count)[0];
    if (top.count === 0) return null;
    const pct = Math.round((top.count / r.total) * 100);
    return `${top.label} (${pct}%)`;
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="heading-md">Roster</h3>
          <p className="text-text-secondary text-xs mt-0.5">Stats · Contracts · Fan Takes</p>
        </div>
      </div>

      <div className="flex gap-1 mb-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              filter === c.key ? "bg-gray-900 text-white" : "text-text-muted hover:text-text-secondary hover:bg-gray-100"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-xl bg-gray-50 animate-pulse-soft" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((player) => {
            const isExpanded = expanded === player.name;
            const playerTakes = takes[player.name] || [];
            const latestTake = playerTakes[0];
            const topRating = getTopRating(player.name);
            const myRating = myRatings[player.name];
            const r = ratings[player.name];

            return (
              <div key={player.name} className="rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden">
                {/* Main card — always visible */}
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : player.name)}
                >
                  {/* Row 1: name + salary */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${trendColor[player.trend]}`}>{trendIcon[player.trend]}</span>
                      <span className="font-bold text-sm text-text-primary">{player.name}</span>
                      <span className="tag tag-blue text-[9px]">{player.position}</span>
                    </div>
                    <span className="text-text-data text-xs font-medium">{player.salary}</span>
                  </div>

                  {/* Row 2: stats */}
                  <div className="flex items-center gap-4 mb-1.5">
                    <StatPill label="PPG" value={player.stats.ppg} />
                    <StatPill label="RPG" value={player.stats.rpg} />
                    <StatPill label="APG" value={player.stats.apg} />
                    <span className="text-text-muted text-[11px] ml-auto">Age {player.age} · {player.contract}</span>
                  </div>

                  {/* Row 3: consensus + latest take */}
                  <div className="flex items-center gap-2">
                    {topRating && (
                      <span className="tag tag-orange text-[9px]">Fan consensus: {topRating}</span>
                    )}
                    {latestTake && !topRating && (
                      <p className="text-text-secondary text-xs truncate">&ldquo;{latestTake.text}&rdquo; — @{latestTake.author}</p>
                    )}
                    {!topRating && !latestTake && (
                      <p className="text-text-muted text-xs">Tap to rate & discuss</p>
                    )}
                    <span className="text-text-muted text-[10px] ml-auto">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Expanded section */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-gray-200 animate-slide-up">
                    {/* Rating buttons */}
                    <p className="text-text-muted text-[11px] uppercase tracking-wider font-bold mb-2">
                      {myRating ? "You rated" : "What's their role on a contending Nets team?"}
                    </p>
                    <div className="grid grid-cols-4 gap-1.5 mb-3">
                      {RATING_OPTIONS.map((opt) => {
                        const count = r?.[opt.key] || 0;
                        const pct = r && r.total > 0 ? Math.round((count / r.total) * 100) : 0;
                        const isMyRating = myRating === opt.key;

                        return (
                          <button
                            key={opt.key}
                            onClick={(e) => { e.stopPropagation(); handleRate(player.name, opt.key); }}
                            disabled={!!myRating}
                            className={`py-2 rounded-lg text-center transition-all ${
                              isMyRating
                                ? "bg-brand-orange/15 border border-brand-orange/30 text-brand-orange"
                                : myRating
                                  ? "bg-gray-50 border border-transparent text-text-muted"
                                  : "bg-gray-100 border border-transparent text-text-secondary hover:border-brand-orange/20 hover:text-brand-orange cursor-pointer"
                            }`}
                          >
                            <span className="text-sm">{opt.emoji}</span>
                            <p className="text-[11px] font-bold mt-0.5">{opt.label}</p>
                            {myRating && r && r.total > 0 && (
                              <p className="text-[10px] mt-0.5 opacity-70">{pct}%</p>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Fan takes */}
                    {playerTakes.length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        <p className="text-text-muted text-[11px] uppercase tracking-wider font-bold">Fan Takes</p>
                        {playerTakes.slice(0, 3).map((t) => (
                          <div key={t.id} className="flex items-start gap-2 text-xs">
                            <span className="text-text-secondary leading-snug">&ldquo;{t.text}&rdquo;</span>
                            <span className="text-text-muted whitespace-nowrap">@{t.author} · {timeAgo(t.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add take */}
                    <div className="flex gap-2">
                      <input
                        value={newTake}
                        onChange={(e) => setNewTake(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder={`Your take on ${player.name.split(" ").pop()}...`}
                        maxLength={140}
                        className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none"
                      />
                      {xHandle ? (
                        <span className="flex items-center px-2 text-[11px] text-brand-orange font-semibold">@{xHandle}</span>
                      ) : (
                        <input
                          value={newAuthor}
                          onChange={(e) => setNewAuthor(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Name"
                          maxLength={15}
                          className="w-20 bg-gray-100 rounded-lg px-2 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none"
                        />
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSubmitTake(player.name); }}
                        disabled={submitting || newTake.trim().length < 5}
                        className="px-3 py-2 rounded-lg gradient-bg-brand text-white text-xs font-bold disabled:opacity-30 transition-all cursor-pointer"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
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
