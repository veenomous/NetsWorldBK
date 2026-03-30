"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Article {
  id: string;
  title: string;
  body: string;
  tag: string;
  created_at: string;
  user: {
    x_handle: string;
    x_name: string;
    x_avatar: string | null;
  };
}

const TAG_OPTIONS = ["General", "Game Recap", "Draft", "Trade Talk", "Opinion", "News"];

const tagColors: Record<string, string> = {
  General: "tag-blue",
  "Game Recap": "tag-green",
  Draft: "tag-gold",
  "Trade Talk": "tag-purple",
  Opinion: "tag-red",
  News: "tag-orange",
};

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

export default function CommunityFeed() {
  const { data: session } = useSession();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("All");

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("General");
  const [submitting, setSubmitting] = useState(false);

  const fetchArticles = useCallback(async () => {
    const { data } = await supabase
      .from("articles")
      .select("id, title, body, tag, created_at, user:users(x_handle, x_name, x_avatar)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) setArticles(data as unknown as Article[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !session) return;
    setSubmitting(true);

    const xId = (session.user as { xId?: string }).xId;
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("x_id", xId)
      .single();

    if (!userData) { setSubmitting(false); return; }

    const { data } = await supabase
      .from("articles")
      .insert({ title: title.trim(), body: body.trim(), tag, user_id: userData.id })
      .select("id, title, body, tag, created_at, user:users(x_handle, x_name, x_avatar)")
      .single();

    if (data) {
      setArticles((prev) => [data as unknown as Article, ...prev]);
      setTitle("");
      setBody("");
      setTag("General");
      setShowForm(false);
    }
    setSubmitting(false);
  }

  const filtered = filter === "All" ? articles : articles.filter((a) => a.tag === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-lg text-text-primary">Community</h1>
          <p className="text-text-muted text-sm mt-1">Fan takes, recaps, and analysis from Brooklyn.</p>
        </div>
        {session ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 rounded-lg gradient-bg-brand text-white text-sm font-bold hover:opacity-90 transition-opacity"
          >
            {showForm ? "Cancel" : "Write a Post"}
          </button>
        ) : (
          <button
            onClick={() => signIn("twitter")}
            className="px-4 py-2 rounded-lg gradient-bg-brand text-white text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Sign in to Post
          </button>
        )}
      </div>

      {/* Post form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 animate-slide-up">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            maxLength={120}
            className="w-full bg-transparent text-lg font-bold text-text-primary placeholder:text-text-muted/50 outline-none mb-3 border-b border-gray-200 pb-2"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your take, recap, or analysis..."
            rows={6}
            maxLength={3000}
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted/50 outline-none resize-none mb-3 leading-relaxed"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-xs">Tag:</span>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none"
              >
                {TAG_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <span className="text-text-muted text-[11px]">{body.length}/3000</span>
            </div>
            <button
              type="submit"
              disabled={!title.trim() || !body.trim() || submitting}
              className="px-5 py-2 rounded-lg gradient-bg-brand text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {submitting ? "Posting..." : "Publish"}
            </button>
          </div>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {["All", ...TAG_OPTIONS].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
              filter === t
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-text-muted hover:text-text-secondary hover:bg-gray-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Article list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5">
              <div className="h-5 w-48 bg-gray-100 rounded animate-pulse-soft mb-3" />
              <div className="h-3 w-full bg-gray-50 rounded animate-pulse-soft mb-2" />
              <div className="h-3 w-3/4 bg-gray-50 rounded animate-pulse-soft" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-text-muted text-sm">No posts yet{filter !== "All" ? ` in ${filter}` : ""}. Be the first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((article) => (
            <Link
              key={article.id}
              href={`/community/${article.id}`}
              className="card p-5 block hover:border-brand-orange/30 transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`tag ${tagColors[article.tag] || "tag-blue"}`}>{article.tag}</span>
                <span className="text-text-muted text-[11px]">{timeAgo(article.created_at)}</span>
              </div>
              <h2 className="text-lg font-bold text-text-primary group-hover:text-brand-orange transition-colors mb-1.5">
                {article.title}
              </h2>
              <p className="text-text-secondary text-sm line-clamp-2 leading-relaxed">
                {article.body}
              </p>
              <div className="flex items-center gap-2 mt-3">
                {article.user.x_avatar ? (
                  <img src={article.user.x_avatar} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange text-[9px] font-bold">
                    {article.user.x_handle[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-text-muted text-xs font-medium">@{article.user.x_handle}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
