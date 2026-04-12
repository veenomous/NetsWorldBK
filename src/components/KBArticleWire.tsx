"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { supabase, getVisitorId } from "@/lib/supabase";
import Link from "next/link";

interface Take {
  id: string;
  text: string;
  author: string;
  agrees: number;
  disagrees: number;
  tag: string;
  article_slug: string | null;
  article_title: string | null;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function KBArticleWire({
  articleSlug,
  articleTitle,
  category,
}: {
  articleSlug: string;
  articleTitle: string;
  category: string;
}) {
  const { data: session } = useSession();
  const xHandle = (session?.user as { xHandle?: string })?.xHandle;

  const [takes, setTakes] = useState<Take[]>([]);
  const [newTake, setNewTake] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState<Record<string, string>>({});

  const fetchTakes = useCallback(async () => {
    // Get takes tagged to this article + keyword matches
    const { data: tagged } = await supabase
      .from("hot_takes")
      .select("*")
      .eq("article_slug", articleSlug)
      .order("created_at", { ascending: false })
      .limit(20);

    // Also get general takes that mention this topic
    const { data: general } = await supabase
      .from("hot_takes")
      .select("*")
      .is("article_slug", null)
      .order("created_at", { ascending: false })
      .limit(50);

    const keywords = [
      articleTitle.toLowerCase(),
      ...articleTitle.toLowerCase().split(" ").filter(w => w.length > 3),
    ];

    const matched = (general || []).filter(t =>
      keywords.some(kw => t.text.toLowerCase().includes(kw))
    ).slice(0, 5);

    // Combine: article-tagged first, then keyword matches
    const combined = [...(tagged || []), ...matched];
    // Deduplicate
    const seen = new Set<string>();
    const unique = combined.filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });

    setTakes(unique);
    setLoading(false);
  }, [articleSlug, articleTitle]);

  useEffect(() => {
    fetchTakes();
    const interval = setInterval(fetchTakes, 20000);
    return () => clearInterval(interval);
  }, [fetchTakes]);

  // Load votes from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("wire-votes");
      if (stored) setVoted(JSON.parse(stored));
    } catch {}
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newTake.trim() || submitting) return;
    if (!session) { signIn("twitter"); return; }

    setSubmitting(true);
    await supabase.from("hot_takes").insert({
      text: newTake.trim(),
      author: xHandle || "Anonymous",
      tag: "Take",
      article_slug: articleSlug,
      article_title: articleTitle,
      ip_hash: getVisitorId(),
    });
    setNewTake("");
    setSubmitting(false);
    fetchTakes();
  }

  async function handleVote(id: string, type: "agree" | "disagree") {
    if (voted[id]) return;
    const newVoted = { ...voted, [id]: type };
    setVoted(newVoted);
    try { localStorage.setItem("wire-votes", JSON.stringify(newVoted)); } catch {}

    setTakes(prev => prev.map(t =>
      t.id === id
        ? { ...t, agrees: t.agrees + (type === "agree" ? 1 : 0), disagrees: t.disagrees + (type === "disagree" ? 1 : 0) }
        : t
    ));

    const field = type === "agree" ? "agrees" : "disagrees";
    const take = takes.find(t => t.id === id);
    if (take) {
      await supabase.from("hot_takes").update({ [field]: take[field === "agrees" ? "agrees" : "disagrees"] + 1 }).eq("id", id);
    }
  }

  return (
    <div className="mt-8 pt-6 border-t border-black/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-brand-red" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
          Discussion
        </h3>
        <Link href="/wire" className="text-[9px] text-text-muted hover:text-brand-red font-bold uppercase tracking-wider transition-colors">
          The Wire →
        </Link>
      </div>

      {/* Post form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          {session?.user?.image ? (
            <img src={session.user.image} alt="" className="w-8 h-8 shrink-0" />
          ) : (
            <div className="w-8 h-8 bg-black shrink-0 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{(xHandle || "?")[0].toUpperCase()}</span>
            </div>
          )}
          <input
            type="text"
            value={newTake}
            onChange={(e) => setNewTake(e.target.value)}
            placeholder={session ? `Your take on ${articleTitle}...` : "Sign in with X to discuss"}
            maxLength={280}
            className="flex-1 border border-black/10 px-3 py-2 text-sm font-body placeholder:text-text-muted/40 focus:outline-none focus:border-brand-red/30"
            disabled={!session}
            onClick={() => !session && signIn("twitter")}
          />
          <button
            type="submit"
            disabled={!newTake.trim() || submitting || !session}
            className="bg-black text-white px-4 py-2 font-display font-bold text-[10px] uppercase tracking-wider disabled:opacity-20 hover:bg-brand-red transition-colors shrink-0"
          >
            Post
          </button>
        </div>
      </form>

      {/* Takes */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-16 bg-bg-surface animate-pulse-soft" />)}
        </div>
      ) : takes.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-text-muted text-sm font-body">No takes yet. Be the first to weigh in.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {takes.map((take) => {
            const isFromArticle = take.article_slug === articleSlug;
            return (
              <div key={take.id} className={`py-3 border-b border-black/5 last:border-0 ${isFromArticle ? "" : "opacity-70"}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-display font-bold text-xs text-text-primary">@{take.author}</span>
                      <span className="text-text-muted text-[10px]">{timeAgo(take.created_at)}</span>
                      {!isFromArticle && (
                        <span className="text-[8px] text-text-muted/50 uppercase tracking-wider">from wire</span>
                      )}
                    </div>
                    <p className="text-text-secondary text-sm font-body break-words">{take.text}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleVote(take.id, "agree")}
                      disabled={!!voted[take.id]}
                      className={`flex items-center gap-0.5 text-[10px] font-bold transition-colors ${
                        voted[take.id] === "agree" ? "text-accent-green" : "text-text-muted/30 hover:text-accent-green cursor-pointer"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">thumb_up</span>
                      {take.agrees > 0 && take.agrees}
                    </button>
                    <button
                      onClick={() => handleVote(take.id, "disagree")}
                      disabled={!!voted[take.id]}
                      className={`flex items-center gap-0.5 text-[10px] font-bold transition-colors ${
                        voted[take.id] === "disagree" ? "text-brand-red" : "text-text-muted/30 hover:text-brand-red cursor-pointer"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">thumb_down</span>
                      {take.disagrees > 0 && take.disagrees}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!session && takes.length > 0 && (
        <button
          onClick={() => signIn("twitter")}
          className="w-full mt-3 border border-black/10 py-2 text-center text-xs font-body text-text-muted hover:text-brand-red hover:border-brand-red/30 transition-colors"
        >
          Sign in with X to join the discussion
        </button>
      )}
    </div>
  );
}
