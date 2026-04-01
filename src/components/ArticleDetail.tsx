"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CommentSection from "@/components/CommentSection";
import ShareOnX from "@/components/ShareOnX";
import Link from "next/link";

interface ArticleData {
  id: string;
  title: string;
  body: string;
  tag: string;
  image_url: string | null;
  created_at: string;
  user: { x_handle: string; x_name: string; x_avatar: string | null };
  // Recap-specific
  _isRecap?: boolean;
  opponent?: string;
  nets_score?: number;
  opponent_score?: number;
  mvp?: string;
  rating?: number;
  vibe?: string;
}

const vibeEmoji: Record<string, string> = { hyped: "🔥", solid: "💪", meh: "😐", pain: "😭", tank: "🪖" };

export default function ArticleDetail({ id }: { id: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const currentHandle = (session?.user as { xHandle?: string })?.xHandle || null;

  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      // Check if the ID contains a type prefix: "recap-xxx" or "article-xxx"
      let type: "article" | "recap" = "article";
      let realId = id;

      if (id.startsWith("recap-")) {
        type = "recap";
        realId = id.replace("recap-", "");
      } else if (id.startsWith("article-")) {
        realId = id.replace("article-", "");
      }

      if (type === "recap") {
        const { data } = await supabase
          .from("game_recaps")
          .select("id, headline, summary, opponent, nets_score, opponent_score, mvp, rating, vibe, image_url, created_at, user:users(x_handle, x_name, x_avatar)")
          .eq("id", realId)
          .single();
        if (data) {
          const r = data as any;
          setArticle({
            id: r.id, title: r.headline, body: r.summary, tag: "Game Recap",
            image_url: r.image_url, created_at: r.created_at, user: r.user,
            _isRecap: true, opponent: r.opponent, nets_score: r.nets_score,
            opponent_score: r.opponent_score, mvp: r.mvp, rating: r.rating, vibe: r.vibe,
          });
          setEditTitle(r.headline);
          setEditBody(r.summary);
        }
      } else {
        const { data } = await supabase
          .from("articles")
          .select("id, title, body, tag, image_url, created_at, user:users(x_handle, x_name, x_avatar)")
          .eq("id", realId)
          .single();
        if (data) {
          const a = data as any;
          setArticle({ ...a, _isRecap: false });
          setEditTitle(a.title);
          setEditBody(a.body);
        }
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const isOwner = article && currentHandle === article.user.x_handle;

  async function handleSaveEdit() {
    if (!editTitle.trim() || !editBody.trim() || !article) return;
    setSaving(true);
    if (article._isRecap) {
      await supabase.from("game_recaps").update({ headline: editTitle.trim(), summary: editBody.trim() }).eq("id", article.id);
    } else {
      await supabase.from("articles").update({ title: editTitle.trim(), body: editBody.trim() }).eq("id", article.id);
    }
    setArticle((prev) => prev ? { ...prev, title: editTitle.trim(), body: editBody.trim() } : prev);
    setEditing(false);
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this post? This can't be undone.") || !article) return;
    if (article._isRecap) {
      await supabase.from("game_recaps").delete().eq("id", article.id);
    } else {
      await supabase.from("articles").delete().eq("id", article.id);
    }
    router.push("/community");
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto px-4 py-8">
        <div className="h-8 w-64 bg-gray-100 animate-pulse-soft" />
        <div className="h-4 w-full bg-gray-50 animate-pulse-soft" />
        <div className="h-4 w-3/4 bg-gray-50 animate-pulse-soft" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted text-lg">Post not found.</p>
        <Link href="/community" className="text-brand-orange text-sm font-semibold mt-2 inline-block hover:underline">
          Back to The Press
        </Link>
      </div>
    );
  }

  const date = new Date(article.created_at).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  const commentPage = article._isRecap ? `recap-${article.id}` : `article-${article.id}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link href="/community" className="text-text-muted text-sm hover:text-brand-red transition-colors">
        &larr; Back to The Press
      </Link>

      <article className="border border-gray-200 bg-white">
        {/* Featured image */}
        {article.image_url && (
          <img src={article.image_url} alt="" className="w-full h-64 object-cover" />
        )}

        <div className="p-6 sm:p-8">
          {/* Meta */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-[9px] font-black tracking-[0.15em] uppercase ${article._isRecap ? "text-brand-red" : "text-accent-blue"}`}>
              {article.tag}
            </span>
            <span className="text-[9px] text-black/20">{date}</span>
            {isOwner && !editing && (
              <div className="ml-auto flex items-center gap-3">
                <button onClick={() => setEditing(true)} className="text-[10px] font-bold uppercase tracking-wider text-black/20 hover:text-accent-blue transition-colors">Edit</button>
                <button onClick={handleDelete} className="text-[10px] font-bold uppercase tracking-wider text-black/20 hover:text-brand-red transition-colors">Delete</button>
              </div>
            )}
          </div>

          {/* Recap score */}
          {article._isRecap && article.nets_score !== undefined && (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl">{vibeEmoji[article.vibe || ""] || "🏀"}</span>
              <span className={`text-xl font-black ${(article.nets_score || 0) > (article.opponent_score || 0) ? "text-accent-green" : "text-brand-red"}`}>
                BKN {article.nets_score} - {article.opponent} {article.opponent_score}
              </span>
              <span className="text-[10px] font-bold text-black/20 uppercase">MVP: {article.mvp}</span>
            </div>
          )}

          {/* Title + body */}
          {editing ? (
            <div className="space-y-3 mb-5">
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={150}
                className="w-full text-2xl font-black text-text-primary bg-transparent outline-none border-b border-gray-200 pb-2" />
              <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={10} maxLength={5000}
                className="w-full text-[15px] text-text-secondary bg-transparent outline-none resize-none leading-relaxed" />
              <div className="flex gap-2">
                <button onClick={handleSaveEdit} disabled={saving}
                  className="bg-brand-red text-white px-5 py-2 font-black text-[11px] uppercase tracking-wider hover:bg-red-700 transition-all">
                  {saving ? "Saving..." : "Save"}
                </button>
                <button onClick={() => { setEditing(false); setEditTitle(article.title); setEditBody(article.body); }}
                  className="bg-gray-100 text-black/40 px-5 py-2 font-black text-[11px] uppercase tracking-wider hover:bg-gray-200 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-black text-text-primary leading-tight mb-5 uppercase">
                {article.title}
              </h1>

              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-200">
                {article.user.x_avatar ? (
                  <img src={article.user.x_avatar} alt="" className="w-10 h-10 rounded-full border border-gray-200" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red text-sm font-bold">
                    {article.user.x_handle[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-text-primary">{article.user.x_name}</p>
                  <p className="text-xs text-text-muted">@{article.user.x_handle}</p>
                </div>
              </div>

              <div className="text-text-secondary text-[15px] leading-relaxed whitespace-pre-wrap">
                {article.body}
              </div>
            </>
          )}

          <div className="mt-6 pt-5 border-t border-gray-200">
            <ShareOnX
              text={`"${article.title}" by @${article.user.x_handle} on BK Grit`}
              url={`https://bkgrit.com/community/${article._isRecap ? "recap" : "article"}-${article.id}`}
            />
          </div>
        </div>
      </article>

      <CommentSection page={commentPage} />
    </div>
  );
}
