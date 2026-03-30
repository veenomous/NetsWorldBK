"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CommentSection from "@/components/CommentSection";
import ShareOnX from "@/components/ShareOnX";
import Link from "next/link";

interface Article {
  id: string;
  title: string;
  body: string;
  tag: string;
  created_at: string;
  user: { x_handle: string; x_name: string; x_avatar: string | null };
}

const TAG_OPTIONS = ["General", "Game Recap", "Draft", "Trade Talk", "Opinion", "News"];
const tagColors: Record<string, string> = {
  General: "tag-blue", "Game Recap": "tag-green", Draft: "tag-gold",
  "Trade Talk": "tag-purple", Opinion: "tag-red", News: "tag-orange",
};

export default function ArticleDetail({ id }: { id: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const currentHandle = (session?.user as { xHandle?: string })?.xHandle || null;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editTag, setEditTag] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("articles")
        .select("id, title, body, tag, created_at, user:users(x_handle, x_name, x_avatar)")
        .eq("id", id)
        .single();
      if (data) {
        const a = data as unknown as Article;
        setArticle(a);
        setEditTitle(a.title);
        setEditBody(a.body);
        setEditTag(a.tag);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const isOwner = article && currentHandle === article.user.x_handle;

  async function handleSaveEdit() {
    if (!editTitle.trim() || !editBody.trim()) return;
    setSaving(true);
    await supabase.from("articles").update({
      title: editTitle.trim(),
      body: editBody.trim(),
      tag: editTag,
      updated_at: new Date().toISOString(),
    }).eq("id", id);

    setArticle((prev) => prev ? { ...prev, title: editTitle.trim(), body: editBody.trim(), tag: editTag } : prev);
    setEditing(false);
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this post? This can't be undone.")) return;
    await supabase.from("articles").delete().eq("id", id);
    router.push("/community");
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="h-8 w-64 bg-gray-100 rounded animate-pulse-soft" />
        <div className="h-4 w-full bg-gray-50 rounded animate-pulse-soft" />
        <div className="h-4 w-full bg-gray-50 rounded animate-pulse-soft" />
        <div className="h-4 w-3/4 bg-gray-50 rounded animate-pulse-soft" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted text-lg">Post not found.</p>
        <Link href="/community" className="text-brand-orange text-sm font-semibold mt-2 inline-block hover:underline">
          Back to Community
        </Link>
      </div>
    );
  }

  const date = new Date(article.created_at).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/community" className="text-text-muted text-sm hover:text-brand-orange transition-colors">
        &larr; Back to Community
      </Link>

      <article className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          {editing ? (
            <select
              value={editTag}
              onChange={(e) => setEditTag(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs text-text-primary outline-none"
            >
              {TAG_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          ) : (
            <span className={`tag ${tagColors[article.tag] || "tag-blue"}`}>{article.tag}</span>
          )}
          <span className="text-text-muted text-xs">{date}</span>
          {isOwner && !editing && (
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => setEditing(true)} className="text-[11px] font-semibold text-text-muted uppercase tracking-wider hover:text-accent-blue transition-colors">
                Edit
              </button>
              <button onClick={handleDelete} className="text-[11px] font-semibold text-text-muted uppercase tracking-wider hover:text-accent-red transition-colors">
                Delete
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-3 mb-5">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={120}
              className="w-full text-2xl sm:text-3xl font-black text-text-primary bg-transparent outline-none border-b border-gray-200 pb-2"
            />
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={10}
              maxLength={3000}
              className="w-full text-[15px] text-text-secondary bg-transparent outline-none resize-none leading-relaxed"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 py-2 rounded-lg gradient-bg-brand text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => { setEditing(false); setEditTitle(article.title); setEditBody(article.body); setEditTag(article.tag); }}
                className="px-4 py-2 rounded-lg bg-gray-100 text-text-secondary text-sm font-bold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl font-black text-text-primary leading-tight mb-5">
              {article.title}
            </h1>

            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-200">
              {article.user.x_avatar ? (
                <img src={article.user.x_avatar} alt="" className="w-10 h-10 rounded-full border border-gray-200" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange text-sm font-bold">
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

        <div className="mt-6 pt-5 border-t border-gray-200 flex items-center justify-between">
          <ShareOnX
            text={`"${article.title}" by @${article.user.x_handle} on BK Grit`}
            url={`https://bkgrit.com/community/${article.id}`}
          />
        </div>
      </article>

      <CommentSection page={`article-${article.id}`} />
    </div>
  );
}
