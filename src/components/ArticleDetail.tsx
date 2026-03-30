"use client";

import { useState, useEffect } from "react";
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
  user: {
    x_handle: string;
    x_name: string;
    x_avatar: string | null;
  };
}

const tagColors: Record<string, string> = {
  General: "tag-blue",
  "Game Recap": "tag-green",
  Draft: "tag-gold",
  "Trade Talk": "tag-purple",
  Opinion: "tag-red",
  News: "tag-orange",
};

export default function ArticleDetail({ id }: { id: string }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("articles")
        .select("id, title, body, tag, created_at, user:users(x_handle, x_name, x_avatar)")
        .eq("id", id)
        .single();

      if (data) setArticle(data as unknown as Article);
      setLoading(false);
    }
    fetch();
  }, [id]);

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
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <Link href="/community" className="text-text-muted text-sm hover:text-brand-orange transition-colors">
        &larr; Back to Community
      </Link>

      {/* Article */}
      <article className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <span className={`tag ${tagColors[article.tag] || "tag-blue"}`}>{article.tag}</span>
          <span className="text-text-muted text-xs">{date}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-text-primary leading-tight mb-5">
          {article.title}
        </h1>

        {/* Author */}
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

        {/* Body */}
        <div className="text-text-secondary text-[15px] leading-relaxed whitespace-pre-wrap">
          {article.body}
        </div>

        {/* Share */}
        <div className="mt-6 pt-5 border-t border-gray-200 flex items-center justify-between">
          <ShareOnX
            text={`"${article.title}" by @${article.user.x_handle} on BK Grit`}
            url={`https://bkgrit.com/community/${article.id}`}
          />
        </div>
      </article>

      {/* Comments */}
      <CommentSection page={`article-${article.id}`} />
    </div>
  );
}
