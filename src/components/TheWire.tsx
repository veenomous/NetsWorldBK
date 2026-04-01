"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession, signIn } from "next-auth/react";
import { supabase, getVisitorId } from "@/lib/supabase";
import CommentSection from "@/components/CommentSection";
import { Tweet } from "react-tweet";

interface Take {
  id: string;
  text: string;
  author: string;
  agrees: number;
  disagrees: number;
  tag: string;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function extractTweetId(text: string): string | null {
  const match = text.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  return match ? match[1] : null;
}

const TAG_COLORS: Record<string, string> = {
  "Hot Take": "bg-brand-red text-white",
  "Draft": "bg-accent-blue text-white",
  "Roster": "bg-accent-blue text-white",
  "Strategy": "bg-black text-white",
  "Trade": "bg-brand-red text-white",
  "Spicy": "bg-brand-red text-white",
  "Take": "bg-black/10 text-black/40",
};

// ─── Take Content ───
function TakeContent({ text }: { text: string }) {
  const tweetId = extractTweetId(text);
  if (tweetId) {
    const cleanText = text.replace(/https?:\/\/(?:twitter\.com|x\.com)\/\w+\/status\/\d+\S*/g, "").trim();
    return (
      <div>
        {cleanText && <h3 className="font-display text-xl sm:text-2xl font-black uppercase leading-tight mb-3">{cleanText}</h3>}
        <div className="overflow-hidden border border-gray-200" data-theme="light">
          <Suspense fallback={<div className="h-20 bg-gray-50 animate-pulse-soft" />}>
            <Tweet id={tweetId} />
          </Suspense>
        </div>
      </div>
    );
  }

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <h3 className="font-display text-xl sm:text-2xl font-black uppercase leading-tight">
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline break-all text-base font-normal normal-case">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </h3>
  );
}

// ─── Thread Card ───
function ThreadCard({ take, onBoost, userBoosted, expanded, onExpand, commentCount }: {
  take: Take;
  onBoost: (id: string) => void;
  userBoosted: boolean;
  expanded: boolean;
  onExpand: () => void;
  commentCount: number;
}) {
  const tagColor = TAG_COLORS[take.tag] || TAG_COLORS["Take"];
  const borderColor = take.tag === "Hot Take" || take.tag === "Spicy" || take.tag === "Trade"
    ? "border-brand-red" : "border-accent-blue";

  return (
    <article className={`bg-white p-5 sm:p-6 border-l-4 ${borderColor} hover:bg-gray-50/50 transition-all cursor-pointer group shadow-sm`}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black flex-shrink-0 flex items-center justify-center text-white font-black text-sm">
          {take.author.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-grow min-w-0">
          {/* Meta */}
          <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
            <span className="font-display font-black uppercase text-xs">{take.author}</span>
            <span className="text-[10px] text-black/25 uppercase tracking-wider">{timeAgo(take.created_at)}</span>
            {take.tag && take.tag !== "Take" && (
              <span className={`${tagColor} px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider`}>{take.tag}</span>
            )}
          </div>

          {/* Content */}
          <div className="mb-3 group-hover:text-accent-blue transition-colors">
            <TakeContent text={take.text} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-5 mt-3">
            <button
              onClick={(e) => { e.stopPropagation(); onExpand(); }}
              className="flex items-center gap-1.5 text-accent-blue font-black text-xs uppercase tracking-wider hover:underline"
            >
              <span className="material-symbols-outlined text-base">forum</span>
              {commentCount > 0 ? commentCount : ""} Replies
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (!userBoosted) onBoost(take.id); }}
              className={`flex items-center gap-1.5 font-black text-xs uppercase tracking-wider transition-colors ${
                userBoosted ? "text-brand-red" : "text-black/25 hover:text-brand-red"
              }`}
            >
              <span className="material-symbols-outlined text-base">rocket_launch</span>
              {take.agrees > 0 ? take.agrees : ""} Boosts
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
          <CommentSection page={`take-${take.id}`} compact />
        </div>
      )}
    </article>
  );
}

// ─── Post Form ───
function PostForm({ onPost }: { onPost: () => void }) {
  const { data: session } = useSession();
  const xHandle = (session?.user as { xHandle?: string })?.xHandle;
  const [text, setText] = useState("");
  const [tag, setTag] = useState("Take");
  const [submitting, setSubmitting] = useState(false);
  const TAGS = ["Take", "Hot Take", "Draft", "Roster", "Strategy", "Trade", "Spicy"];

  if (!session) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    await supabase.from("hot_takes").insert({
      text: text.trim(), author: xHandle || "Anonymous", tag, ip_hash: getVisitorId(),
    });
    setText(""); setTag("Take"); setSubmitting(false);
    onPost();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 sm:p-6 border-l-4 border-black shadow-sm mb-4">
      <div className="flex items-center gap-2 mb-3">
        {session.user?.image && <img src={session.user.image} alt="" className="w-8 h-8" />}
        <span className="font-display font-black uppercase text-xs">{xHandle}</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Drop a take, share an X post, start a thread..."
        rows={2}
        maxLength={500}
        className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-black/20 mb-3"
      />
      <div className="flex items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {TAGS.map((t) => (
            <button key={t} type="button" onClick={() => setTag(t)}
              className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider transition-all ${
                tag === t ? (TAG_COLORS[t] || "bg-black text-white") : "bg-gray-100 text-black/25"
              }`}>
              {t}
            </button>
          ))}
        </div>
        <button type="submit" disabled={!text.trim() || submitting}
          className="bg-brand-red text-white px-5 py-2 font-black text-[11px] uppercase tracking-wider disabled:opacity-30 hover:bg-red-700 transition-all">
          {submitting ? "..." : "Post"}
        </button>
      </div>
    </form>
  );
}

// ─── Trending Sidebar ───
function TrendingSidebar({ takes }: { takes: Take[] }) {
  // Get most boosted takes as "trending"
  const trending = [...takes].sort((a, b) => b.agrees - a.agrees).slice(0, 3);
  // Get top authors
  const authorMap: Record<string, number> = {};
  takes.forEach((t) => { authorMap[t.author] = (authorMap[t.author] || 0) + 1; });
  const topVoices = Object.entries(authorMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const trendingHashtags = [
    { tag: "#DraftSZN", color: "text-brand-red italic" },
    { tag: "#TankWatch", color: "text-accent-blue italic" },
    { tag: "#NetsTwitter", color: "text-black/30 italic" },
  ];

  return (
    <div className="space-y-8">
      {/* Trending */}
      <section className="bg-black text-white p-6 sm:p-8 border-t-[6px] border-brand-red">
        <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-3">
          <span className="material-symbols-outlined text-brand-red" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
          <h2 className="font-display font-black text-xl uppercase tracking-tighter">Trending Topics</h2>
        </div>
        <ul className="space-y-6">
          {trending.map((t, i) => (
            <li key={t.id} className="group cursor-pointer">
              <div className={`${trendingHashtags[i]?.color || "text-white/30"} font-black text-[10px] tracking-wider mb-1`}>
                {trendingHashtags[i]?.tag || `#${t.tag.replace(" ", "")}`}
              </div>
              <div className="font-display font-black text-base uppercase leading-tight group-hover:text-accent-blue transition-colors">
                {t.text.length > 60 ? t.text.slice(0, 60) + "..." : t.text}
              </div>
              <div className="text-[9px] text-white/25 mt-1 uppercase font-bold tracking-wider">{t.agrees} Boosts</div>
            </li>
          ))}
        </ul>
      </section>

      {/* Top Voices */}
      <section className="bg-white p-6 sm:p-8 border-t-[6px] border-accent-blue shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b-2 border-black pb-3">
          <span className="material-symbols-outlined text-accent-blue" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
          <h2 className="font-display font-black text-xl uppercase tracking-tighter">Top Voices</h2>
        </div>
        <div className="space-y-5">
          {topVoices.map(([author, count], i) => (
            <div key={author} className="flex items-center gap-3 group cursor-pointer">
              <div className={`w-10 h-10 flex items-center justify-center font-display font-black text-white text-lg ${
                i === 0 ? "bg-brand-red" : i === 1 ? "bg-accent-blue" : "bg-black"
              }`}>
                {i + 1}
              </div>
              <div>
                <div className="font-display font-black uppercase text-sm group-hover:text-brand-red transition-colors">{author}</div>
                <div className="text-[9px] font-bold text-black/25 uppercase tracking-wider">{count} posts</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="bg-brand-red p-6 sm:p-8 text-white">
        <h3 className="font-display font-black text-xl uppercase leading-tight mb-3">Join the Brooklyn Inner Circle</h3>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-5 opacity-70">Share takes, boost threads, and rep Brooklyn.</p>
        <button onClick={() => signIn("twitter")} className="bg-white text-brand-red w-full py-3 font-display font-black uppercase text-xs tracking-wider hover:bg-black hover:text-white transition-colors">
          Sign In with X
        </button>
      </div>
    </div>
  );
}

// ─── Main Wire ───
export default function TheWire({ limit, showForm = true, showHotTake = true, showSidebar = false }: {
  limit?: number;
  showForm?: boolean;
  showHotTake?: boolean;
  showSidebar?: boolean;
}) {
  const [takes, setTakes] = useState<Take[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [sortBy, setSortBy] = useState<"latest" | "top">("latest");

  const fetchAll = useCallback(async () => {
    const visitorId = getVisitorId();
    const [takesRes, votesRes] = await Promise.all([
      supabase.from("hot_takes").select("*").order("created_at", { ascending: false }).limit(limit || 30),
      supabase.from("take_votes").select("take_id, vote_type").eq("visitor_id", visitorId),
    ]);

    const allTakes: Take[] = takesRes.data || [];
    setTakes(allTakes);

    if (votesRes.data) {
      const map: Record<string, string> = {};
      votesRes.data.forEach((v: { take_id: string; vote_type: string }) => { map[v.take_id] = v.vote_type; });
      setUserVotes(map);
    }

    // Comment counts
    const takePages = allTakes.map((t) => `take-${t.id}`);
    if (takePages.length > 0) {
      const { data: commentData } = await supabase.from("comments").select("page").in("page", takePages);
      if (commentData) {
        const counts: Record<string, number> = {};
        for (const c of commentData) {
          const takeId = (c as { page: string }).page.replace("take-", "");
          counts[takeId] = (counts[takeId] || 0) + 1;
        }
        setCommentCounts(counts);
      }
    }

    setLoading(false);
  }, [limit]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleBoost(takeId: string) {
    if (userVotes[takeId]) return;
    const visitorId = getVisitorId();
    setUserVotes((prev) => ({ ...prev, [takeId]: "agree" }));
    setTakes((prev) => prev.map((t) => t.id === takeId ? { ...t, agrees: t.agrees + 1 } : t));
    await supabase.from("take_votes").insert({ take_id: takeId, vote_type: "agree", visitor_id: visitorId });
    const take = takes.find((t) => t.id === takeId);
    if (take) await supabase.from("hot_takes").update({ agrees: (take.agrees || 0) + 1 }).eq("id", takeId);
  }

  const sortedTakes = sortBy === "top"
    ? [...takes].sort((a, b) => b.agrees - a.agrees)
    : takes; // already sorted by created_at desc from Supabase

  const feed = (
    <div className="space-y-3">
      {showForm && <PostForm onPost={fetchAll} />}

      {/* Sort toggle */}
      {!loading && takes.length > 0 && (
        <div className="flex gap-0 mb-2">
          <button onClick={() => setSortBy("latest")}
            className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-colors ${sortBy === "latest" ? "bg-black text-white" : "bg-gray-100 text-black/25 hover:text-black/50"}`}>
            Latest
          </button>
          <button onClick={() => setSortBy("top")}
            className={`px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-colors ${sortBy === "top" ? "bg-brand-red text-white" : "bg-gray-100 text-black/25 hover:text-black/50"}`}>
            Top Boosts
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 border-l-4 border-gray-200 shadow-sm">
              <div className="h-4 w-32 bg-gray-100 animate-pulse-soft mb-3" />
              <div className="h-6 w-full bg-gray-50 animate-pulse-soft mb-2" />
              <div className="h-6 w-3/4 bg-gray-50 animate-pulse-soft" />
            </div>
          ))}
        </div>
      ) : takes.length === 0 ? (
        <div className="bg-white p-10 text-center shadow-sm">
          <p className="text-black/15 font-display font-bold italic uppercase text-lg">Nothing on The Wire yet. Drop the first take.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTakes.map((take) => (
            <ThreadCard
              key={take.id}
              take={take}
              onBoost={handleBoost}
              userBoosted={!!userVotes[take.id]}
              expanded={expandedId === take.id}
              onExpand={() => setExpandedId(expandedId === take.id ? null : take.id)}
              commentCount={commentCounts[take.id] || 0}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (!showSidebar) return feed;

  // Full page layout with sidebar
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-12">
      <div className="md:col-span-8">{feed}</div>
      <div className="md:col-span-4">
        <div className="md:sticky md:top-20">
          <TrendingSidebar takes={takes} />
        </div>
      </div>
    </div>
  );
}
