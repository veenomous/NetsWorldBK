"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";

const ALLOWED_ADMINS = ["veenomous", "bkgrit"];

interface TweetDraft {
  id: string;
  tweet_text: string;
  article_title: string;
  article_url: string;
  status: string;
  created_at: string;
}

export default function TweetsPage() {
  const { data: session } = useSession();
  const xHandle = (session?.user as { xHandle?: string })?.xHandle || (session?.user?.name || "");
  const isAdmin = ALLOWED_ADMINS.some(h => h.toLowerCase() === xHandle.toLowerCase());

  const [drafts, setDrafts] = useState<TweetDraft[]>([]);
  const [posted, setPosted] = useState<TweetDraft[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"drafts" | "posted">("drafts");

  useEffect(() => {
    supabase.from("tweet_drafts").select("*").eq("status", "draft").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setDrafts(data); });
    supabase.from("tweet_drafts").select("*").eq("status", "posted").order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setPosted(data); });
  }, []);

  async function copyTweet(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function markPosted(id: string) {
    await supabase.from("tweet_drafts").update({ status: "posted" }).eq("id", id);
    const tweet = drafts.find(t => t.id === id);
    setDrafts(prev => prev.filter(t => t.id !== id));
    if (tweet) setPosted(prev => [{ ...tweet, status: "posted" }, ...prev]);
  }

  async function skipTweet(id: string) {
    await supabase.from("tweet_drafts").update({ status: "skipped" }).eq("id", id);
    setDrafts(prev => prev.filter(t => t.id !== id));
  }

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted font-body">Access restricted.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="bg-black text-white px-4 sm:px-8 pt-4 pb-6">
        <div className="max-w-3xl mx-auto">
          <nav className="flex items-center gap-2 text-xs font-body mb-4">
            <Link href="/admin" className="text-white/40 hover:text-white transition-colors">&larr; Admin</Link>
          </nav>
          <h1 className="font-display font-black text-2xl uppercase tracking-tight">
            Tweet <span className="text-brand-red">Queue</span>
          </h1>
          <p className="text-white/40 text-sm font-body mt-1">{drafts.length} drafts ready to post</p>
        </div>
      </div>
      <div className="h-1 bg-brand-red" />

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6">
          <button onClick={() => setTab("drafts")}
            className={`px-4 py-2 font-display font-bold text-xs uppercase tracking-wider ${tab === "drafts" ? "bg-black text-white" : "bg-bg-surface text-text-muted hover:text-text-primary"}`}>
            Drafts ({drafts.length})
          </button>
          <button onClick={() => setTab("posted")}
            className={`px-4 py-2 font-display font-bold text-xs uppercase tracking-wider ${tab === "posted" ? "bg-black text-white" : "bg-bg-surface text-text-muted hover:text-text-primary"}`}>
            Posted ({posted.length})
          </button>
        </div>

        {tab === "drafts" && (
          <div className="space-y-3">
            {drafts.length === 0 ? (
              <p className="text-text-muted text-sm font-body text-center py-8">No drafts. New ones appear after the agent compiles.</p>
            ) : drafts.map(tweet => (
              <div key={tweet.id} className="border border-black/10 p-4">
                <p className="text-text-primary text-sm font-body leading-relaxed mb-3">{tweet.tweet_text}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => copyTweet(tweet.id, tweet.tweet_text)}
                    className={`px-3 py-1.5 font-display font-bold text-[10px] uppercase tracking-wider transition-colors ${
                      copiedId === tweet.id ? "bg-accent-green text-white" : "bg-black text-white hover:bg-brand-red"
                    }`}>
                    {copiedId === tweet.id ? "Copied!" : "Copy"}
                  </button>
                  <button onClick={() => markPosted(tweet.id)}
                    className="px-3 py-1.5 bg-accent-green/10 text-accent-green font-display font-bold text-[10px] uppercase tracking-wider hover:bg-accent-green/20">
                    Mark Posted
                  </button>
                  <button onClick={() => skipTweet(tweet.id)}
                    className="px-3 py-1.5 text-text-muted font-display font-bold text-[10px] uppercase tracking-wider hover:text-brand-red">
                    Skip
                  </button>
                  {tweet.article_url && (
                    <a href={tweet.article_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent-blue hover:underline ml-auto">
                      View Article →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "posted" && (
          <div className="space-y-2">
            {posted.length === 0 ? (
              <p className="text-text-muted text-sm font-body text-center py-8">No posted tweets yet.</p>
            ) : posted.map(tweet => (
              <div key={tweet.id} className="border border-black/5 p-3 opacity-60">
                <p className="text-text-secondary text-xs font-body">{tweet.tweet_text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
