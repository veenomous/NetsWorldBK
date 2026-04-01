"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { getNetsTeam } from "@/data/rosters";
import CommentSection from "@/components/CommentSection";
import Link from "next/link";

// ─── Types ───
type Category = "Game Recap" | "Game Preview" | "News" | "Opinion";

interface Article {
  id: string;
  title: string;
  body: string;
  tag: string;
  image_url: string | null;
  created_at: string;
  user: { x_handle: string; x_name: string; x_avatar: string | null };
}

interface GameRecap {
  id: string;
  headline: string;
  summary: string;
  opponent: string;
  nets_score: number;
  opponent_score: number;
  mvp: string;
  rating: number;
  vibe: string;
  image_url: string | null;
  created_at: string;
  user: { x_handle: string; x_name: string; x_avatar: string | null };
}

const CATEGORIES: Category[] = ["Game Recap", "Game Preview", "News", "Opinion"];
const NBA_TEAMS = ["ATL","BOS","CHA","CHI","CLE","DAL","DEN","DET","GSW","HOU","IND","LAC","LAL","MEM","MIA","MIL","MIN","NOP","NYK","OKC","ORL","PHI","PHX","POR","SAC","SAS","TOR","UTA","WAS"];
const VIBES = [
  { key: "hyped", emoji: "🔥" }, { key: "solid", emoji: "💪" },
  { key: "meh", emoji: "😐" }, { key: "pain", emoji: "😭" }, { key: "tank", emoji: "🪖" },
];
const vibeEmoji: Record<string, string> = { hyped: "🔥", solid: "💪", meh: "😐", pain: "😭", tank: "🪖" };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

// ─── Writer Form ───
function WriterForm({ onPublish }: { onPublish: () => void }) {
  const { data: session } = useSession();
  const netsRoster = getNetsTeam().players.map((p) => p.name);

  const [category, setCategory] = useState<Category>("News");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // Recap-specific
  const [opponent, setOpponent] = useState("ATL");
  const [netsScore, setNetsScore] = useState("");
  const [oppScore, setOppScore] = useState("");
  const [mvp, setMvp] = useState(netsRoster[0] || "");
  const [rating, setRating] = useState(6);
  const [vibe, setVibe] = useState("meh");
  const [submitting, setSubmitting] = useState(false);

  if (!session) {
    return (
      <button onClick={() => signIn("twitter")} className="w-full py-4 bg-gray-50 border border-gray-200 text-sm font-bold text-black/30 uppercase tracking-wider hover:border-brand-red/30 hover:text-brand-red transition-all">
        Sign in with X to write
      </button>
    );
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return null;
    const ext = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("images").upload(fileName, imageFile);
    if (error) { console.error("Upload error:", error); return null; }
    const { data } = supabase.storage.from("images").getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim() || submitting) return;
    setSubmitting(true);

    const xId = (session!.user as { xId?: string }).xId;
    const { data: userData } = await supabase.from("users").select("id").eq("x_id", xId).single();
    if (!userData) { setSubmitting(false); return; }

    const imageUrl = await uploadImage();

    if (category === "Game Recap") {
      if (!netsScore || !oppScore) { alert("Enter both scores"); setSubmitting(false); return; }
      const { error } = await supabase.from("game_recaps").insert({
        headline: title.trim(), summary: body.trim(), opponent,
        nets_score: parseInt(netsScore), opponent_score: parseInt(oppScore),
        mvp, rating, vibe, game_date: new Date().toISOString().slice(0, 10),
        user_id: userData.id,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      });
      if (error) { alert(error.message); setSubmitting(false); return; }
    } else {
      await supabase.from("articles").insert({
        title: title.trim(), body: body.trim(), tag: category, user_id: userData.id,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      });
    }

    setTitle(""); setBody(""); setNetsScore(""); setOppScore("");
    setImageFile(null); setImagePreview(null);
    setSubmitting(false);
    onPublish();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 mb-8">
      {/* Category selector */}
      <div className="flex border-b border-gray-200">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider transition-colors ${
              category === c ? "text-white bg-brand-red" : "text-black/30 hover:text-black/60 bg-gray-50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={category === "Game Recap" ? "Headline — e.g. Clowney goes off in tank-mode W" : "Title"}
          maxLength={150}
          className="w-full text-xl font-black text-text-primary bg-transparent outline-none border-b border-gray-200 pb-3 placeholder:font-normal placeholder:text-black/15"
        />

        {/* Recap-specific fields */}
        {category === "Game Recap" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <select value={opponent} onChange={(e) => setOpponent(e.target.value)} className="bg-gray-50 border border-gray-200 px-3 py-2.5 text-sm outline-none">
                {NBA_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="number" value={netsScore} onChange={(e) => setNetsScore(e.target.value)} placeholder="BKN Score" className="bg-gray-50 border border-gray-200 px-3 py-2.5 text-sm outline-none" />
              <input type="number" value={oppScore} onChange={(e) => setOppScore(e.target.value)} placeholder="OPP Score" className="bg-gray-50 border border-gray-200 px-3 py-2.5 text-sm outline-none" />
              <select value={mvp} onChange={(e) => setMvp(e.target.value)} className="bg-gray-50 border border-gray-200 px-3 py-2.5 text-sm outline-none">
                {netsRoster.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {VIBES.map((v) => (
                  <button key={v.key} type="button" onClick={() => setVibe(v.key)}
                    className={`w-9 h-9 text-lg flex items-center justify-center transition-all ${vibe === v.key ? "bg-brand-red/10 border-2 border-brand-red" : "bg-gray-50 border border-gray-200"}`}>
                    {v.emoji}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[10px] uppercase tracking-wider text-black/30 font-bold">Rating</span>
                <input type="range" min={1} max={10} value={rating} onChange={(e) => setRating(parseInt(e.target.value))} className="w-24" />
                <span className="text-sm font-black text-brand-orange w-6 text-center">{rating}</span>
              </div>
            </div>
          </>
        )}

        {/* Body */}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your piece..."
          rows={10}
          maxLength={5000}
          className="w-full bg-transparent text-[15px] leading-relaxed text-text-primary outline-none resize-none placeholder:text-black/15"
        />

        {/* Image */}
        <div>
          {imagePreview ? (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-32 object-cover rounded-lg border border-gray-200" />
              <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-2 -right-2 bg-brand-red text-white w-5 h-5 flex items-center justify-center text-xs font-bold rounded-full">×</button>
            </div>
          ) : (
            <label className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-black/25 hover:text-brand-red transition-colors cursor-pointer border border-dashed border-gray-300 px-4 py-3 rounded-lg">
              <span className="material-symbols-outlined text-base">add_photo_alternate</span>
              Add Featured Image
              <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-[10px] text-black/15">{body.length}/5000</span>
          <button
            type="submit"
            disabled={!title.trim() || !body.trim() || submitting}
            className="bg-brand-red text-white px-6 py-2.5 font-black text-[11px] uppercase tracking-wider disabled:opacity-30 hover:bg-red-700 transition-all"
          >
            {submitting ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Article Card ───
function PressCard({ type, data }: { type: "article" | "recap"; data: Article | GameRecap }) {
  const isRecap = type === "recap";
  const recap = isRecap ? (data as GameRecap) : null;
  const article = !isRecap ? (data as Article) : null;

  const title = recap?.headline || article?.title || "";
  const body = recap?.summary || article?.body || "";
  const imageUrl = data.image_url;
  const user = data.user;
  const tag = recap ? "Game Recap" : (article?.tag || "News");

  return (
    <div className="border-b border-gray-100 py-5">
      <div className="flex gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[9px] font-black tracking-[0.15em] uppercase ${tag === "Game Recap" ? "text-brand-red" : tag === "Game Preview" ? "text-accent-green" : tag === "Opinion" ? "text-accent-purple" : "text-accent-blue"}`}>
              {tag}
            </span>
            <span className="text-[9px] text-black/15">{timeAgo(data.created_at)}</span>
          </div>

          {recap && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{vibeEmoji[recap.vibe] || "🏀"}</span>
              <span className={`text-sm font-black ${recap.nets_score > recap.opponent_score ? "text-accent-green" : "text-brand-red"}`}>
                BKN {recap.nets_score} - {recap.opponent} {recap.opponent_score}
              </span>
              <span className="text-[9px] font-bold text-black/20">MVP: {recap.mvp}</span>
            </div>
          )}

          <Link href={`/community/${data.id}`} className="group">
            <h3 className="text-base font-black uppercase tracking-tight leading-snug group-hover:text-brand-red transition-colors">
              {title}
            </h3>
          </Link>
          <p className="text-sm text-black/40 line-clamp-2 mt-1 leading-relaxed">{body}</p>

          <div className="flex items-center gap-2 mt-2">
            {user.x_avatar && <img src={user.x_avatar} alt="" className="w-4 h-4 rounded-full" />}
            <span className="text-[9px] font-bold text-black/25 uppercase tracking-wider">@{user.x_handle}</span>
          </div>
        </div>

        {imageUrl && (
          <Link href={`/community/${data.id}`} className="shrink-0">
            <img src={imageUrl} alt="" className="w-28 h-28 object-cover rounded-lg" />
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Main Press Component ───
export default function ThePress({ showForm = true }: { showForm?: boolean }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [recaps, setRecaps] = useState<GameRecap[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Category>("all");

  const fetchAll = useCallback(async () => {
    const [articlesRes, recapsRes] = await Promise.all([
      supabase.from("articles").select("id, title, body, tag, image_url, created_at, user:users(x_handle, x_name, x_avatar)").order("created_at", { ascending: false }).limit(20),
      supabase.from("game_recaps").select("id, headline, summary, opponent, nets_score, opponent_score, mvp, rating, vibe, image_url, created_at, user:users(x_handle, x_name, x_avatar)").order("created_at", { ascending: false }).limit(20),
    ]);
    if (articlesRes.data) setArticles(articlesRes.data as unknown as Article[]);
    if (recapsRes.data) setRecaps(recapsRes.data as unknown as GameRecap[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Merge and sort
  type PressItem = { type: "article" | "recap"; data: Article | GameRecap; date: number };
  const allItems: PressItem[] = [
    ...articles.map((a) => ({ type: "article" as const, data: a, date: new Date(a.created_at).getTime() })),
    ...recaps.map((r) => ({ type: "recap" as const, data: r as unknown as GameRecap, date: new Date(r.created_at).getTime() })),
  ].sort((a, b) => b.date - a.date);

  const filtered = filter === "all" ? allItems : allItems.filter((item) => {
    if (filter === "Game Recap") return item.type === "recap";
    if (item.type === "article") return (item.data as Article).tag === filter;
    return false;
  });

  return (
    <div>
      {showForm && <WriterForm onPublish={fetchAll} />}

      {/* Filter */}
      <div className="flex gap-0 mb-4 border-b border-gray-200">
        {(["all", ...CATEGORIES] as ("all" | Category)[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-colors ${
              filter === f ? "text-brand-red border-b-2 border-brand-red -mb-[1px]" : "text-black/25 hover:text-black/50"
            }`}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="py-5 border-b border-gray-100">
              <div className="h-3 w-20 bg-gray-100 animate-pulse-soft mb-2" />
              <div className="h-5 w-3/4 bg-gray-50 animate-pulse-soft mb-1" />
              <div className="h-4 w-full bg-gray-50 animate-pulse-soft" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-black/20 text-sm text-center py-10">No articles yet{filter !== "all" ? ` in ${filter}` : ""}. Be the first to write.</p>
      ) : (
        <div>
          {filtered.map((item) => (
            <PressCard key={`${item.type}-${item.data.id}`} type={item.type} data={item.data} />
          ))}
        </div>
      )}
    </div>
  );
}
