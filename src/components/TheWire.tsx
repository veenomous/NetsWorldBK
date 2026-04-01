"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { supabase, getVisitorId } from "@/lib/supabase";
import { getNetsTeam } from "@/data/rosters";
import CommentSection from "@/components/CommentSection";
import Link from "next/link";

// ─── Types ───
type PostType = "take" | "article" | "recap";

interface Take {
  _type: "take";
  id: string;
  text: string;
  author: string;
  agrees: number;
  disagrees: number;
  tag: string;
  created_at: string;
}

interface Article {
  _type: "article";
  id: string;
  title: string;
  body: string;
  tag: string;
  created_at: string;
  user: { x_handle: string; x_name: string; x_avatar: string | null };
}

interface Recap {
  _type: "recap";
  id: string;
  headline: string;
  opponent: string;
  nets_score: number;
  opponent_score: number;
  mvp: string;
  rating: number;
  vibe: string;
  summary: string;
  created_at: string;
  user: { x_handle: string; x_name: string; x_avatar: string | null };
}

type WirePost = Take | Article | Recap;

const vibeEmoji: Record<string, string> = {
  hyped: "🔥", solid: "💪", meh: "😐", pain: "😭", tank: "🪖",
};

const NBA_TEAMS = ["ATL","BOS","CHA","CHI","CLE","DAL","DEN","DET","GSW","HOU","IND","LAC","LAL","MEM","MIA","MIL","MIN","NOP","NYK","OKC","ORL","PHI","PHX","POR","SAC","SAS","TOR","UTA","WAS"];
const VIBES = [
  { key: "hyped", label: "Hyped", emoji: "🔥" },
  { key: "solid", label: "Solid W", emoji: "💪" },
  { key: "meh", label: "Meh", emoji: "😐" },
  { key: "pain", label: "Pain", emoji: "😭" },
  { key: "tank", label: "Tank Szn", emoji: "🪖" },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

// ─── Hot Take of the Day ───
function HotTakeOfTheDay({ take }: { take: Take }) {
  const total = take.agrees + take.disagrees;
  const pct = total > 0 ? Math.round((take.agrees / total) * 100) : 50;

  return (
    <div className="border-l-[6px] border-brand-red pl-6 py-4 mb-6">
      <p className="text-[9px] font-black tracking-[0.3em] uppercase text-brand-red mb-2">Hot Take of the Day</p>
      <p className="text-xl sm:text-2xl font-black leading-tight">&ldquo;{take.text}&rdquo;</p>
      <div className="flex items-center gap-4 mt-3">
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-black/30">@{take.author}</span>
        <div className="flex items-center gap-2">
          <div className="h-[3px] w-24 bg-gray-200"><div className="h-[3px] bg-accent-green" style={{ width: `${pct}%` }} /></div>
          <span className="text-xs font-black text-accent-green">{pct}% agree</span>
        </div>
        <span className="text-xs font-bold text-black/30">{total} votes</span>
      </div>
    </div>
  );
}

// ─── Take Card ───
function TakeCard({ take, onVote, userVote, expanded, onExpand }: {
  take: Take;
  onVote: (id: string, type: "agree" | "disagree") => void;
  userVote: string | undefined;
  expanded: boolean;
  onExpand: () => void;
}) {
  const total = take.agrees + take.disagrees;
  const pct = total > 0 ? Math.round((take.agrees / total) * 100) : 50;

  return (
    <div className="py-4 border-b border-gray-100">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-black tracking-[0.2em] uppercase text-brand-red">{take.tag}</span>
            <span className="text-[9px] text-black/20">@{take.author} · {timeAgo(take.created_at)}</span>
          </div>
          <p className="text-[15px] font-medium leading-snug">{take.text}</p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => !userVote && onVote(take.id, "agree")}
              className={`text-xs font-bold transition-colors ${userVote === "agree" ? "text-accent-green" : "text-black/30 hover:text-accent-green"} ${userVote ? "cursor-default" : "cursor-pointer"}`}
            >
              👍 {take.agrees}
            </button>
            <button
              onClick={() => !userVote && onVote(take.id, "disagree")}
              className={`text-xs font-bold transition-colors ${userVote === "disagree" ? "text-brand-red" : "text-black/30 hover:text-brand-red"} ${userVote ? "cursor-default" : "cursor-pointer"}`}
            >
              👎 {take.disagrees}
            </button>
            {userVote && (
              <div className="flex items-center gap-1.5 ml-1">
                <div className="h-[2px] w-16 bg-gray-200"><div className="h-[2px] bg-accent-green" style={{ width: `${pct}%` }} /></div>
                <span className="text-[10px] font-bold text-black/30">{pct}%</span>
              </div>
            )}
            <button onClick={onExpand} className="text-[10px] font-bold uppercase tracking-wider text-black/30 hover:text-brand-red transition-colors ml-auto">
              {expanded ? "Hide" : "Reply"}
            </button>
          </div>
        </div>
      </div>
      {expanded && <CommentSection page={`take-${take.id}`} compact />}
    </div>
  );
}

// ─── Article Card ───
function ArticleCard({ article, expanded, onExpand }: { article: Article; expanded: boolean; onExpand: () => void }) {
  return (
    <div className="py-4 border-b border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[9px] font-black tracking-[0.2em] uppercase text-accent-blue">{article.tag}</span>
        <span className="text-[9px] text-black/20">@{article.user?.x_handle} · {timeAgo(article.created_at)}</span>
      </div>
      <Link href={`/community/${article.id}`} className="group">
        <h3 className="text-base font-black uppercase tracking-tight group-hover:text-brand-red transition-colors">{article.title}</h3>
      </Link>
      <p className="text-sm text-black/50 line-clamp-2 mt-1 leading-relaxed">{article.body}</p>
      <div className="flex items-center gap-3 mt-2">
        <Link href={`/community/${article.id}`} className="text-[10px] font-bold uppercase tracking-wider text-brand-red hover:underline">Read More</Link>
        <button onClick={onExpand} className="text-[10px] font-bold uppercase tracking-wider text-black/30 hover:text-brand-red transition-colors ml-auto">
          {expanded ? "Hide" : "Discuss"}
        </button>
      </div>
      {expanded && <CommentSection page={`article-${article.id}`} compact />}
    </div>
  );
}

// ─── Recap Card ───
function RecapCard({ recap, expanded, onExpand }: { recap: Recap; expanded: boolean; onExpand: () => void }) {
  const won = recap.nets_score > recap.opponent_score;
  return (
    <div className="py-4 border-b border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{vibeEmoji[recap.vibe] || "🏀"}</span>
        <span className={`text-xs font-black ${won ? "text-accent-green" : "text-brand-red"}`}>
          BKN {recap.nets_score} - {recap.opponent} {recap.opponent_score}
        </span>
        <span className="text-[9px] text-black/20">@{recap.user?.x_handle} · {timeAgo(recap.created_at)}</span>
      </div>
      <Link href={`/recaps/${recap.id}`} className="group">
        <h3 className="text-base font-black uppercase tracking-tight group-hover:text-brand-red transition-colors">{recap.headline}</h3>
      </Link>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-black/30">MVP: {recap.mvp}</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className={`w-1.5 h-1.5 ${i < recap.rating ? "bg-brand-orange" : "bg-gray-200"}`} />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <Link href={`/recaps/${recap.id}`} className="text-[10px] font-bold uppercase tracking-wider text-brand-red hover:underline">Read More</Link>
        <button onClick={onExpand} className="text-[10px] font-bold uppercase tracking-wider text-black/30 hover:text-brand-red transition-colors ml-auto">
          {expanded ? "Hide" : "Discuss"}
        </button>
      </div>
      {expanded && <CommentSection page={`recap-${recap.id}`} compact />}
    </div>
  );
}

// ─── Post Form ───
function PostForm({ onPost }: { onPost: () => void }) {
  const { data: session } = useSession();
  const xHandle = (session?.user as { xHandle?: string })?.xHandle;
  const netsRoster = getNetsTeam().players.map((p) => p.name);

  const [postType, setPostType] = useState<PostType>("take");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("Hot Take");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // Recap fields
  const [opponent, setOpponent] = useState("ATL");
  const [netsScore, setNetsScore] = useState("");
  const [oppScore, setOppScore] = useState("");
  const [mvp, setMvp] = useState(netsRoster[0] || "");
  const [rating, setRating] = useState(6);
  const [vibe, setVibe] = useState("meh");

  const [submitting, setSubmitting] = useState(false);

  if (!session) {
    return (
      <button onClick={() => signIn("twitter")} className="w-full py-4 bg-gray-50 border border-gray-200 text-sm font-bold text-black/40 uppercase tracking-wider hover:bg-brand-red/5 hover:border-brand-red/20 hover:text-brand-red transition-all mb-4">
        Sign in with X to post
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
    const { data: urlData } = supabase.storage.from("images").getPublicUrl(fileName);
    return urlData.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    // Upload image if selected
    const imageUrl = await uploadImage();

    if (postType === "take") {
      if (!text.trim()) { setSubmitting(false); return; }
      await supabase.from("hot_takes").insert({
        text: text.trim(), author: xHandle || "Anonymous", tag, ip_hash: getVisitorId(),
      });
    } else if (postType === "article") {
      if (!title.trim() || !text.trim()) { setSubmitting(false); return; }
      const xId = (session!.user as { xId?: string }).xId;
      const { data: userData } = await supabase.from("users").select("id").eq("x_id", xId).single();
      if (!userData) { setSubmitting(false); return; }
      await supabase.from("articles").insert({
        title: title.trim(), body: text.trim(), tag, user_id: userData.id,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      });
    } else if (postType === "recap") {
      if (!title.trim() || !text.trim() || !netsScore || !oppScore) { setSubmitting(false); return; }
      const xId = (session!.user as { xId?: string }).xId;
      const { data: userData } = await supabase.from("users").select("id").eq("x_id", xId).single();
      if (!userData) { setSubmitting(false); return; }
      const { error } = await supabase.from("game_recaps").insert({
        headline: title.trim(), summary: text.trim(), opponent,
        nets_score: parseInt(netsScore), opponent_score: parseInt(oppScore),
        mvp, rating, vibe, game_date: new Date().toISOString().slice(0, 10),
        user_id: userData.id,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      });
      if (error) { alert(error.message); setSubmitting(false); return; }
    }

    setText(""); setTitle(""); setNetsScore(""); setOppScore("");
    setImageFile(null); setImagePreview(null);
    setSubmitting(false);
    onPost();
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 border border-gray-200 p-4 sm:p-5">
      {/* Type selector */}
      <div className="flex gap-0 mb-4 border-b border-gray-200">
        {(["take", "article", "recap"] as PostType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setPostType(t)}
            className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-colors ${
              postType === t ? "text-brand-red border-b-2 border-brand-red -mb-[1px]" : "text-black/30 hover:text-black/60"
            }`}
          >
            {t === "take" ? "Quick Take" : t === "article" ? "Article" : "Game Recap"}
          </button>
        ))}
      </div>

      {/* Title (article + recap) */}
      {(postType === "article" || postType === "recap") && (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={postType === "recap" ? "Headline (e.g. Clowney goes off)" : "Title"}
          maxLength={120}
          className="w-full text-lg font-black text-text-primary bg-transparent outline-none border-b border-gray-200 pb-2 mb-3 uppercase placeholder:normal-case placeholder:font-normal placeholder:text-black/20"
        />
      )}

      {/* Recap fields */}
      {postType === "recap" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <select value={opponent} onChange={(e) => setOpponent(e.target.value)} className="bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-text-primary outline-none">
            {NBA_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="number" value={netsScore} onChange={(e) => setNetsScore(e.target.value)} placeholder="BKN" className="bg-gray-50 border border-gray-200 px-3 py-2 text-xs outline-none" />
          <input type="number" value={oppScore} onChange={(e) => setOppScore(e.target.value)} placeholder="OPP" className="bg-gray-50 border border-gray-200 px-3 py-2 text-xs outline-none" />
          <select value={mvp} onChange={(e) => setMvp(e.target.value)} className="bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-text-primary outline-none">
            {netsRoster.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      )}

      {postType === "recap" && (
        <div className="flex items-center gap-3 mb-3">
          <div className="flex gap-1">
            {VIBES.map((v) => (
              <button key={v.key} type="button" onClick={() => setVibe(v.key)}
                className={`px-2 py-1 text-sm transition-all ${vibe === v.key ? "bg-brand-red/10 border border-brand-red/30" : "bg-gray-50 border border-gray-200"}`}>
                {v.emoji}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[9px] uppercase tracking-wider text-black/30">Rating</span>
            <input type="range" min={1} max={10} value={rating} onChange={(e) => setRating(parseInt(e.target.value))} className="w-20" />
            <span className="text-xs font-black text-brand-orange">{rating}</span>
          </div>
        </div>
      )}

      {/* Body */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={postType === "take" ? "Drop your take..." : postType === "recap" ? "Your recap..." : "Write your article..."}
        rows={postType === "take" ? 2 : 4}
        maxLength={postType === "take" ? 280 : 3000}
        className="w-full bg-transparent text-sm text-text-primary outline-none resize-none placeholder:text-black/20"
      />

      {/* Image upload (articles + recaps only) */}
      {postType !== "take" && (
        <div className="mt-3">
          {imagePreview ? (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-24 object-cover border border-gray-200" />
              <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-2 -right-2 bg-brand-red text-white w-5 h-5 flex items-center justify-center text-xs font-bold">×</button>
            </div>
          ) : (
            <label className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-black/30 hover:text-brand-red transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-sm">add_photo_alternate</span>
              Add Image
              <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </label>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {postType === "take" && (
            <select value={tag} onChange={(e) => setTag(e.target.value)} className="bg-gray-50 border border-gray-200 px-2 py-1 text-[10px] uppercase tracking-wider outline-none">
              {["Hot Take", "Draft", "Roster", "Strategy", "Trade"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          <span className="text-[10px] text-black/20">{text.length}/{postType === "take" ? 280 : 3000}</span>
        </div>
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="bg-brand-red text-white px-5 py-2 font-black text-[11px] uppercase tracking-wider disabled:opacity-30 hover:bg-red-700 transition-all"
        >
          {submitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}

// ─── Main Wire Component ───
type FilterType = "all" | "take" | "article" | "recap";

export default function TheWire({ limit, showForm = true, showHotTake = true, showFilters = true }: {
  limit?: number;
  showForm?: boolean;
  showHotTake?: boolean;
  showFilters?: boolean;
}) {
  const [posts, setPosts] = useState<WirePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hotTake, setHotTake] = useState<Take | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  const fetchAll = useCallback(async () => {
    const visitorId = getVisitorId();

    const [takesRes, articlesRes, recapsRes, votesRes] = await Promise.all([
      supabase.from("hot_takes").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("articles").select("id, title, body, tag, created_at, user:users(x_handle, x_name, x_avatar)").order("created_at", { ascending: false }).limit(10),
      supabase.from("game_recaps").select("id, headline, opponent, nets_score, opponent_score, mvp, rating, vibe, summary, created_at, user:users(x_handle, x_name, x_avatar)").order("created_at", { ascending: false }).limit(10),
      supabase.from("take_votes").select("take_id, vote_type").eq("visitor_id", visitorId),
    ]);

    const takes: Take[] = (takesRes.data || []).map((t: any) => ({ ...t, _type: "take" as const }));
    const articles: Article[] = ((articlesRes.data || []) as unknown as Article[]).map((a) => ({ ...a, _type: "article" as const }));
    const recaps: Recap[] = ((recapsRes.data || []) as unknown as Recap[]).map((r) => ({ ...r, _type: "recap" as const }));

    // Hot take of the day: most engaged take from last 24h
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentTakes = takes.filter((t) => new Date(t.created_at).getTime() > oneDayAgo);
    const sorted = [...recentTakes].sort((a, b) => (b.agrees + b.disagrees) - (a.agrees + a.disagrees));
    if (sorted.length > 0 && (sorted[0].agrees + sorted[0].disagrees) >= 1) {
      setHotTake(sorted[0]);
    }

    // Merge all into one feed sorted by date
    const all: WirePost[] = [...takes, ...articles, ...recaps];
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setPosts(limit ? all.slice(0, limit) : all);

    if (votesRes.data) {
      const map: Record<string, string> = {};
      votesRes.data.forEach((v: any) => { map[v.take_id] = v.vote_type; });
      setUserVotes(map);
    }

    setLoading(false);
  }, [limit]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleVote(takeId: string, voteType: "agree" | "disagree") {
    if (userVotes[takeId]) return;
    const visitorId = getVisitorId();

    setUserVotes((prev) => ({ ...prev, [takeId]: voteType }));
    setPosts((prev) =>
      prev.map((p) =>
        p._type === "take" && p.id === takeId
          ? { ...p, agrees: p.agrees + (voteType === "agree" ? 1 : 0), disagrees: p.disagrees + (voteType === "disagree" ? 1 : 0) }
          : p
      )
    );

    await supabase.from("take_votes").insert({ take_id: takeId, vote_type: voteType, visitor_id: visitorId });
    const take = posts.find((p) => p.id === takeId && p._type === "take") as Take | undefined;
    if (take) {
      const field = voteType === "agree" ? "agrees" : "disagrees";
      await supabase.from("hot_takes").update({ [field]: (take[field] || 0) + 1 }).eq("id", takeId);
    }
  }

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "take", label: "Takes" },
    { key: "article", label: "Articles" },
    { key: "recap", label: "Recaps" },
  ];

  const filteredPosts = filter === "all" ? posts : posts.filter((p) => p._type === filter);

  return (
    <div>
      {showForm && <PostForm onPost={fetchAll} />}

      {showHotTake && hotTake && <HotTakeOfTheDay take={hotTake} />}

      {/* Filter buttons */}
      {showFilters && !loading && posts.length > 0 && (
        <div className="flex gap-0 mb-4 border-b border-gray-200">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-colors ${
                filter === f.key
                  ? "text-brand-red border-b-2 border-brand-red -mb-[1px]"
                  : "text-black/30 hover:text-black/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="py-4 border-b border-gray-100">
              <div className="h-3 w-24 bg-gray-100 animate-pulse-soft mb-2" />
              <div className="h-5 w-full bg-gray-50 animate-pulse-soft mb-1" />
              <div className="h-5 w-3/4 bg-gray-50 animate-pulse-soft" />
            </div>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <p className="text-black/30 text-sm text-center py-8">
          {filter === "all" ? "Nothing on The Wire yet. Be the first to post." : `No ${filter}s yet.`}
        </p>
      ) : (
        <div>
          {filteredPosts.map((post) => {
            const isExpanded = expandedId === post.id;
            const toggle = () => setExpandedId(isExpanded ? null : post.id);

            if (post._type === "take") {
              return <TakeCard key={`take-${post.id}`} take={post} onVote={handleVote} userVote={userVotes[post.id]} expanded={isExpanded} onExpand={toggle} />;
            }
            if (post._type === "article") {
              return <ArticleCard key={`art-${post.id}`} article={post} expanded={isExpanded} onExpand={toggle} />;
            }
            if (post._type === "recap") {
              return <RecapCard key={`rec-${post.id}`} recap={post} expanded={isExpanded} onExpand={toggle} />;
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}
