"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { getNetsTeam } from "@/data/rosters";
import Link from "next/link";

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

const TAG_COLORS: Record<string, string> = {
  "Game Recap": "bg-brand-red text-white",
  "Game Preview": "bg-accent-blue text-white",
  "News": "bg-accent-blue text-white",
  "Opinion": "bg-black text-white",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }).toUpperCase();
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
  const [opponent, setOpponent] = useState("ATL");
  const [netsScore, setNetsScore] = useState("");
  const [oppScore, setOppScore] = useState("");
  const [mvp, setMvp] = useState(netsRoster[0] || "");
  const [rating, setRating] = useState(6);
  const [vibe, setVibe] = useState("meh");
  const [submitting, setSubmitting] = useState(false);

  if (!session) return null;

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
    if (error) return null;
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
        user_id: userData.id, ...(imageUrl ? { image_url: imageUrl } : {}),
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
    <form onSubmit={handleSubmit} className="border-l-8 border-black pl-8 mb-16">
      {/* Category selector */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {CATEGORIES.map((c) => (
          <button key={c} type="button" onClick={() => setCategory(c)}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-all ${
              category === c ? (TAG_COLORS[c] || "bg-black text-white") : "bg-gray-100 text-black/25 hover:text-black/50"
            }`}>
            {c}
          </button>
        ))}
      </div>

      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Headline..." maxLength={150}
        className="w-full text-3xl sm:text-4xl font-black text-black bg-transparent outline-none border-b-2 border-gray-200 pb-3 mb-4 uppercase tracking-tighter placeholder:normal-case placeholder:font-normal placeholder:text-black/15 font-display" />

      {category === "Game Recap" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <select value={opponent} onChange={(e) => setOpponent(e.target.value)} className="bg-gray-50 border border-gray-200 px-3 py-2.5 text-sm outline-none">
              {NBA_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="number" value={netsScore} onChange={(e) => setNetsScore(e.target.value)} placeholder="BKN" className="bg-gray-50 border border-gray-200 px-3 py-2.5 text-sm outline-none" />
            <input type="number" value={oppScore} onChange={(e) => setOppScore(e.target.value)} placeholder="OPP" className="bg-gray-50 border border-gray-200 px-3 py-2.5 text-sm outline-none" />
            <select value={mvp} onChange={(e) => setMvp(e.target.value)} className="bg-gray-50 border border-gray-200 px-3 py-2.5 text-sm outline-none">
              {netsRoster.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4 mb-4">
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
              <span className="text-sm font-black text-brand-red w-6 text-center">{rating}</span>
            </div>
          </div>
        </>
      )}

      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your piece..."
        rows={8} maxLength={5000}
        className="w-full bg-transparent text-lg leading-relaxed outline-none resize-none placeholder:text-black/15 mb-4" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="" className="h-16 object-cover border border-gray-200" />
              <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-2 -right-2 bg-brand-red text-white w-5 h-5 flex items-center justify-center text-xs font-bold">×</button>
            </div>
          ) : (
            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-black/25 hover:text-brand-red transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-sm">add_photo_alternate</span>
              Add Image
              <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </label>
          )}
          <span className="text-[10px] text-black/15">{body.length}/5000</span>
        </div>
        <button type="submit" disabled={!title.trim() || !body.trim() || submitting}
          className="bg-black text-white px-8 py-3 font-black text-sm uppercase tracking-wider disabled:opacity-20 hover:bg-gray-800 transition-all font-display">
          {submitting ? "Publishing..." : "Publish"}
        </button>
      </div>
    </form>
  );
}

// ─── Press Article Card ───
function PressCard({ type, data }: { type: "article" | "recap"; data: Article | GameRecap }) {
  const isRecap = type === "recap";
  const recap = isRecap ? (data as GameRecap) : null;
  const article = !isRecap ? (data as Article) : null;

  const title = recap?.headline || article?.title || "";
  const body = recap?.summary || article?.body || "";
  const imageUrl = data.image_url;
  const user = data.user;
  const tag = recap ? "Game Recap" : (article?.tag || "News");
  const tagColor = TAG_COLORS[tag] || "bg-black text-white";

  return (
    <article className="group">
      <div className="flex flex-col gap-5">
        {/* Meta */}
        <div className="flex items-center gap-4">
          <span className={`${tagColor} px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase`}>{tag}</span>
          <span className="text-black/30 text-[11px] font-semibold tracking-[0.15em] uppercase">{formatDate(data.created_at)}</span>
        </div>

        {/* Recap score */}
        {recap && (
          <div className="flex items-center gap-3">
            <span className="text-xl">{vibeEmoji[recap.vibe] || "🏀"}</span>
            <span className={`text-lg font-black ${recap.nets_score > recap.opponent_score ? "text-accent-green" : "text-brand-red"}`}>
              BKN {recap.nets_score} - {recap.opponent} {recap.opponent_score}
            </span>
            <span className="text-[10px] font-bold text-black/20 uppercase tracking-wider">MVP: {recap.mvp}</span>
          </div>
        )}

        {/* Title */}
        <Link href={`/press/${type}-${data.id}`}>
          <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tighter leading-tight group-hover:text-brand-red transition-colors cursor-pointer font-display">
            {title}
          </h2>
        </Link>

        {/* Image */}
        {imageUrl && (
          <Link href={`/press/${type}-${data.id}`} className="block w-full aspect-[16/9] bg-gray-100 overflow-hidden">
            <img src={imageUrl} alt="" className="w-full h-full object-cover object-center grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100" />
          </Link>
        )}

        {/* Body preview */}
        <p className="text-base sm:text-lg text-black/60 leading-relaxed max-w-2xl line-clamp-3">{body}</p>

        {/* Author + Read More */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {user.x_avatar && <img src={user.x_avatar} alt="" className="w-5 h-5 rounded-full" />}
            <span className="text-[10px] font-bold text-black/25 uppercase tracking-wider">@{user.x_handle}</span>
          </div>
          <Link href={`/press/${type}-${data.id}`}
            className="inline-flex items-center gap-2 text-brand-red font-bold tracking-tighter uppercase text-sm border-b-2 border-brand-red pb-0.5 hover:gap-3 transition-all">
            Read More
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

// ─── Main Press Component ───
export default function ThePress({ showForm = true }: { showForm?: boolean }) {
  const { data: session } = useSession();
  const [articles, setArticles] = useState<Article[]>([]);
  const [recaps, setRecaps] = useState<GameRecap[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Category>("all");
  const [editorOpen, setEditorOpen] = useState(false);

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
      {/* Write button */}
      {showForm && (
        editorOpen ? (
          <div className="mb-12">
            <div className="flex justify-end mb-4">
              <button onClick={() => setEditorOpen(false)} className="text-[10px] font-bold uppercase tracking-wider text-black/30 hover:text-brand-red transition-colors">
                Close Editor
              </button>
            </div>
            <WriterForm onPublish={() => { fetchAll(); setEditorOpen(false); }} />
          </div>
        ) : (
          <button
            onClick={() => session ? setEditorOpen(true) : signIn("twitter")}
            className="mb-12 bg-black text-white px-8 py-4 font-display font-black text-lg uppercase tracking-tighter hover:bg-gray-800 transition-all flex items-center gap-3 group"
          >
            {session ? "Write an Article" : "Sign in to Write"}
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">edit</span>
          </button>
        )
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-12 flex-wrap">
        {(["all", ...CATEGORIES] as ("all" | Category)[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-all ${
              filter === f ? "bg-black text-white" : "bg-gray-100 text-black/25 hover:text-black/50"
            }`}>
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-16">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-4 w-32 bg-gray-100 animate-pulse-soft mb-4" />
              <div className="h-10 w-full bg-gray-50 animate-pulse-soft mb-3" />
              <div className="h-5 w-3/4 bg-gray-50 animate-pulse-soft" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-black/15 font-display font-bold italic uppercase text-2xl">
            {filter === "all" ? "No articles yet. Be the first to write." : `No ${filter} articles yet.`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-20">
          {filtered.map((item) => (
            <PressCard key={`${item.type}-${item.data.id}`} type={item.type} data={item.data} />
          ))}
        </div>
      )}
    </div>
  );
}
