"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { getNetsTeam } from "@/data/rosters";
import CommentSection from "@/components/CommentSection";
import ShareOnX from "@/components/ShareOnX";
import Link from "next/link";

interface Recap {
  id: string;
  opponent: string;
  game_date: string;
  nets_score: number;
  opponent_score: number;
  mvp: string;
  rating: number;
  headline: string;
  summary: string;
  vibe: string;
  created_at: string;
  user: { x_handle: string; x_name: string; x_avatar: string | null };
}

const VIBES = [
  { key: "hyped", label: "Hyped", emoji: "🔥" },
  { key: "solid", label: "Solid W", emoji: "💪" },
  { key: "meh", label: "Meh", emoji: "😐" },
  { key: "pain", label: "Pain", emoji: "😭" },
  { key: "tank", label: "Tank Szn", emoji: "🪖" },
];

const NBA_TEAMS = [
  "ATL", "BOS", "CHA", "CHI", "CLE", "DAL", "DEN", "DET", "GSW", "HOU",
  "IND", "LAC", "LAL", "MEM", "MIA", "MIL", "MIN", "NOP", "NYK", "OKC",
  "ORL", "PHI", "PHX", "POR", "SAC", "SAS", "TOR", "UTA", "WAS",
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function vibeEmoji(vibe: string): string {
  return VIBES.find((v) => v.key === vibe)?.emoji || "🏀";
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-sm ${
            i < rating ? "bg-brand-orange" : "bg-gray-200"
          }`}
        />
      ))}
      <span className="text-text-muted text-xs ml-1.5">{rating}/10</span>
    </div>
  );
}

export default function GameRecaps() {
  const { data: session } = useSession();
  const netsRoster = getNetsTeam().players.map((p) => p.name);

  const [recaps, setRecaps] = useState<Recap[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);

  // Form state
  const [opponent, setOpponent] = useState("ATL");
  const [gameDate, setGameDate] = useState(new Date().toISOString().slice(0, 10));
  const [netsScore, setNetsScore] = useState("");
  const [oppScore, setOppScore] = useState("");
  const [mvp, setMvp] = useState(netsRoster[0] || "");
  const [rating, setRating] = useState(5);
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [vibe, setVibe] = useState("meh");
  const [submitting, setSubmitting] = useState(false);

  const fetchRecaps = useCallback(async () => {
    const { data } = await supabase
      .from("game_recaps")
      .select("*, user:users(x_handle, x_name, x_avatar)")
      .order("game_date", { ascending: false })
      .limit(30);
    if (data) setRecaps(data as unknown as Recap[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRecaps(); }, [fetchRecaps]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!headline.trim() || !summary.trim() || !netsScore || !oppScore || !session) return;
    setSubmitting(true);

    const xId = (session.user as { xId?: string }).xId;
    const { data: userData } = await supabase.from("users").select("id").eq("x_id", xId).single();
    if (!userData) { setSubmitting(false); return; }

    const { data, error } = await supabase
      .from("game_recaps")
      .insert({
        opponent, game_date: gameDate,
        nets_score: parseInt(netsScore), opponent_score: parseInt(oppScore),
        mvp, rating, headline: headline.trim(), summary: summary.trim(),
        vibe, user_id: userData.id,
      })
      .select("*, user:users(x_handle, x_name, x_avatar)")
      .single();

    if (error) {
      alert(`Error: ${error.message}`);
      setSubmitting(false);
      return;
    }

    if (data) {
      setRecaps((prev) => [data as unknown as Recap, ...prev]);
      setShowForm(false);
      setHeadline(""); setSummary(""); setNetsScore(""); setOppScore("");
    }
    setSubmitting(false);
  }

  const netsWon = (r: Recap) => r.nets_score > r.opponent_score;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-lg text-text-primary">Game Recaps</h1>
          <p className="text-text-muted text-sm mt-1">Fan-written post-game breakdowns.</p>
        </div>
        {session ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 rounded-lg gradient-bg-brand text-white text-sm font-bold hover:opacity-90 transition-opacity"
          >
            {showForm ? "Cancel" : "Write Recap"}
          </button>
        ) : (
          <button onClick={() => signIn("twitter")} className="px-4 py-2 rounded-lg gradient-bg-brand text-white text-sm font-bold hover:opacity-90 transition-opacity">
            Sign in to Write
          </button>
        )}
      </div>

      {/* Recap Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 sm:p-6 animate-slide-up space-y-4">
          <h3 className="text-lg font-black text-text-primary">Post-Game Recap</h3>

          {/* Game info row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-text-muted text-[11px] uppercase tracking-wider font-bold block mb-1">Opponent</label>
              <select value={opponent} onChange={(e) => setOpponent(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary outline-none">
                {NBA_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-text-muted text-[11px] uppercase tracking-wider font-bold block mb-1">Date</label>
              <input type="date" value={gameDate} onChange={(e) => setGameDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary outline-none" />
            </div>
            <div>
              <label className="text-text-muted text-[11px] uppercase tracking-wider font-bold block mb-1">BKN Score</label>
              <input type="number" value={netsScore} onChange={(e) => setNetsScore(e.target.value)} placeholder="0" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary outline-none" />
            </div>
            <div>
              <label className="text-text-muted text-[11px] uppercase tracking-wider font-bold block mb-1">{opponent} Score</label>
              <input type="number" value={oppScore} onChange={(e) => setOppScore(e.target.value)} placeholder="0" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary outline-none" />
            </div>
          </div>

          {/* MVP + Rating */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-text-muted text-[11px] uppercase tracking-wider font-bold block mb-1">Game MVP</label>
              <select value={mvp} onChange={(e) => setMvp(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary outline-none">
                {netsRoster.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-text-muted text-[11px] uppercase tracking-wider font-bold block mb-1">Game Rating</label>
              <div className="flex items-center gap-2">
                <input type="range" min={1} max={10} value={rating} onChange={(e) => setRating(parseInt(e.target.value))} className="flex-1" />
                <span className="text-sm font-bold text-brand-orange w-8 text-center">{rating}</span>
              </div>
            </div>
          </div>

          {/* Vibe */}
          <div>
            <label className="text-text-muted text-[11px] uppercase tracking-wider font-bold block mb-2">Vibe Check</label>
            <div className="flex gap-2">
              {VIBES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setVibe(v.key)}
                  className={`flex-1 py-2 rounded-lg text-center transition-all ${
                    vibe === v.key
                      ? "bg-brand-orange/15 border border-brand-orange/30 text-brand-orange"
                      : "bg-gray-50 border border-gray-200 text-text-secondary hover:border-brand-orange/20"
                  }`}
                >
                  <span className="text-lg block">{v.emoji}</span>
                  <span className="text-[10px] font-bold">{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Headline + Summary */}
          <div>
            <label className="text-text-muted text-[11px] uppercase tracking-wider font-bold block mb-1">Headline</label>
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Clowney goes off in tank-mode W"
              maxLength={100}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary outline-none font-bold"
            />
          </div>
          <div>
            <label className="text-text-muted text-[11px] uppercase tracking-wider font-bold block mb-1">Your Recap</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What happened? Key moments, player performances, takeaways..."
              rows={5}
              maxLength={2000}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none resize-none leading-relaxed"
            />
            <span className="text-text-muted text-[11px]">{summary.length}/2000</span>
          </div>

          <button
            type="submit"
            disabled={!headline.trim() || !summary.trim() || !netsScore || !oppScore || submitting}
            className="w-full py-3 rounded-lg gradient-bg-brand text-white font-bold text-base disabled:opacity-30 hover:opacity-90 transition-opacity cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting ? "Posting..." : "Publish Recap"}
          </button>
        </form>
      )}

      {/* Recap Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5">
              <div className="h-5 w-48 bg-gray-100 rounded animate-pulse-soft mb-3" />
              <div className="h-4 w-full bg-gray-50 rounded animate-pulse-soft mb-2" />
              <div className="h-4 w-3/4 bg-gray-50 rounded animate-pulse-soft" />
            </div>
          ))}
        </div>
      ) : recaps.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-3xl mb-2">🏀</p>
          <p className="text-text-muted text-sm">No recaps yet. Write the first one after tonight&apos;s game.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recaps.map((recap) => (
            <div key={recap.id} className="card p-5">
              {/* Score banner */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${netsWon(recap) ? "bg-accent-green/8" : "bg-accent-red/8"}`}>
                  <span className="text-sm font-black text-brand-orange">BKN</span>
                  <span className={`text-lg font-black ${netsWon(recap) ? "text-accent-green" : "text-text-primary"}`}>
                    {recap.nets_score}
                  </span>
                  <span className="text-text-muted text-sm">-</span>
                  <span className={`text-lg font-black ${!netsWon(recap) ? "text-accent-red" : "text-text-primary"}`}>
                    {recap.opponent_score}
                  </span>
                  <span className="text-sm font-black text-text-secondary">{recap.opponent}</span>
                </div>
                <span className="text-text-muted text-xs">
                  {new Date(recap.game_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className="text-lg">{vibeEmoji(recap.vibe)}</span>
              </div>

              {/* Headline */}
              <Link href={`/recaps/${recap.id}`} className="group">
                <h2 className="text-lg font-black text-text-primary group-hover:text-brand-orange transition-colors mb-1">
                  {recap.headline}
                </h2>
              </Link>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="tag tag-gold">MVP: {recap.mvp}</span>
                <RatingStars rating={recap.rating} />
              </div>

              {/* Summary preview */}
              <p className="text-text-secondary text-sm line-clamp-2 leading-relaxed mb-3">
                {recap.summary}
              </p>

              {/* Footer */}
              <div className="flex items-center gap-3">
                {recap.user.x_avatar && (
                  <img src={recap.user.x_avatar} alt="" className="w-5 h-5 rounded-full" />
                )}
                <span className="text-text-muted text-xs font-medium">@{recap.user.x_handle}</span>
                <span className="text-text-muted text-xs">{timeAgo(recap.created_at)}</span>
                <div className="ml-auto flex items-center gap-3">
                  <button
                    onClick={() => setExpandedComments(expandedComments === recap.id ? null : recap.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                      expandedComments === recap.id ? "text-brand-orange" : "text-text-muted hover:text-brand-orange"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Discuss
                  </button>
                  <Link href={`/recaps/${recap.id}`} className="text-brand-orange text-xs font-semibold hover:underline">
                    Read More
                  </Link>
                </div>
              </div>

              {expandedComments === recap.id && (
                <CommentSection page={`recap-${recap.id}`} compact />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
