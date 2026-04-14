"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";

interface AdminProps {
  articleCount: number;
  categories: { name: string; label: string; count: number }[];
  changelog: { date: string; changes: { article: string; description: string }[] }[];
  rawStats: { total: number; today: number; dirs: Record<string, number> };
  articles: { title: string; category: string; slug: string; confidence: string; last_updated: string; sources: string[] }[];
}

const ALLOWED_ADMINS = ["veenomous", "bkgrit"];

export default function AdminDashboard({ articleCount, categories, changelog, rawStats, articles }: AdminProps) {
  const { data: session } = useSession();
  const xHandle = (session?.user as { xHandle?: string })?.xHandle || (session?.user?.name || "");
  const isAdmin = ALLOWED_ADMINS.some(h => h.toLowerCase() === xHandle.toLowerCase());

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [wireCount, setWireCount] = useState(0);
  const [spacesCount, setSpacesCount] = useState(0);

  useEffect(() => {
    // Fetch live stats from Supabase
    supabase.from("kb_submissions").select("id, url, status, upvotes, created_at").order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setSubmissions(data); });
    supabase.from("hot_takes").select("id", { count: "exact", head: true })
      .then(({ count }) => { if (count) setWireCount(count); });
    supabase.from("spaces").select("id", { count: "exact", head: true })
      .then(({ count }) => { if (count) setSpacesCount(count); });
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted font-body">Sign in to access admin.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted font-body">Access restricted. Signed in as: {xHandle}</p>
      </div>
    );
  }

  // Stale articles (>14 days)
  const staleArticles = articles.filter(a => {
    const days = (Date.now() - new Date(a.last_updated).getTime()) / 86400000;
    return days > 14;
  });

  // Articles with no sources
  const unsourced = articles.filter(a => a.sources.length === 0);

  // Low confidence
  const lowConf = articles.filter(a => a.confidence === "low");

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="bg-black text-white px-4 sm:px-8 pt-4 pb-6">
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center gap-2 text-xs font-body mb-4">
            <Link href="/" className="text-white/40 hover:text-white transition-colors">&larr; Wiki</Link>
          </nav>
          <h1 className="font-display font-black text-2xl uppercase tracking-tight">
            Admin <span className="text-brand-red">Dashboard</span>
          </h1>
          <p className="text-white/40 text-sm font-body mt-1">Pipeline status, content health, and community activity.</p>
        </div>
      </div>
      <div className="h-1 bg-brand-red" />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="border border-black/10 p-4 text-center">
            <p className="font-display font-black text-2xl text-text-primary">{articleCount}</p>
            <p className="text-[10px] text-text-muted tracking-[0.15em] uppercase font-bold mt-1">Wiki Articles</p>
          </div>
          <div className="border border-black/10 p-4 text-center">
            <p className="font-display font-black text-2xl text-accent-blue">{rawStats.total}</p>
            <p className="text-[10px] text-text-muted tracking-[0.15em] uppercase font-bold mt-1">Raw Sources</p>
          </div>
          <div className="border border-black/10 p-4 text-center">
            <p className="font-display font-black text-2xl text-brand-red">{rawStats.today}</p>
            <p className="text-[10px] text-text-muted tracking-[0.15em] uppercase font-bold mt-1">New Today</p>
          </div>
          <div className="border border-black/10 p-4 text-center">
            <p className="font-display font-black text-2xl text-text-primary">{wireCount}</p>
            <p className="text-[10px] text-text-muted tracking-[0.15em] uppercase font-bold mt-1">Wire Posts</p>
          </div>
        </div>

        {/* Health Alerts */}
        <div className="mb-8">
          <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary mb-3">Content Health</h2>
          <div className="space-y-2">
            {staleArticles.length > 0 && (
              <div className="border-l-4 border-l-brand-red border border-black/5 p-3">
                <p className="font-display font-bold text-xs uppercase text-brand-red">{staleArticles.length} Stale Articles (&gt;14 days)</p>
                <p className="text-text-muted text-xs font-body mt-1">
                  {staleArticles.slice(0, 5).map(a => a.title).join(", ")}
                  {staleArticles.length > 5 && ` +${staleArticles.length - 5} more`}
                </p>
              </div>
            )}
            {unsourced.length > 0 && (
              <div className="border-l-4 border-l-accent-blue border border-black/5 p-3">
                <p className="font-display font-bold text-xs uppercase text-accent-blue">{unsourced.length} Articles Without Sources</p>
                <p className="text-text-muted text-xs font-body mt-1">
                  {unsourced.slice(0, 5).map(a => a.title).join(", ")}
                </p>
              </div>
            )}
            {lowConf.length > 0 && (
              <div className="border-l-4 border-l-brand-red border border-black/5 p-3">
                <p className="font-display font-bold text-xs uppercase text-brand-red">{lowConf.length} Low Confidence Articles</p>
                <p className="text-text-muted text-xs font-body mt-1">
                  {lowConf.map(a => a.title).join(", ")}
                </p>
              </div>
            )}
            {staleArticles.length === 0 && unsourced.length === 0 && lowConf.length === 0 && (
              <div className="border-l-4 border-l-accent-green border border-black/5 p-3">
                <p className="font-display font-bold text-xs uppercase text-accent-green">All Clear</p>
                <p className="text-text-muted text-xs font-body mt-1">No health issues detected.</p>
              </div>
            )}
          </div>
        </div>

        {/* Raw Sources by Category */}
        <div className="mb-8">
          <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary mb-3">Raw Source Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(rawStats.dirs).map(([dir, count]) => (
              <div key={dir} className="border border-black/10 p-3">
                <p className="font-display font-bold text-xs uppercase">{dir}</p>
                <p className="text-text-muted text-xs font-body">{count} files</p>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary mb-3">Articles by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {categories.map(cat => (
              <Link key={cat.name} href={`/kb/category/${cat.name}`} className="border border-black/10 p-3 hover:border-brand-red/30 transition-colors">
                <p className="font-display font-bold text-xs uppercase">{cat.label}</p>
                <p className="font-display font-black text-lg text-brand-red">{cat.count}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Fan Submissions */}
        <div className="mb-8">
          <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary mb-3">
            Recent Submissions ({submissions.length})
          </h2>
          {submissions.length === 0 ? (
            <p className="text-text-muted text-xs font-body">No submissions yet.</p>
          ) : (
            <div className="space-y-1">
              {submissions.map(sub => (
                <div key={sub.id} className="flex items-center gap-3 border border-black/5 p-2 text-xs">
                  <span className={`tag ${sub.status === "pending" ? "tag-blue" : sub.status === "approved" ? "tag-green" : "tag-red"}`} style={{ fontSize: "8px", padding: "1px 6px" }}>
                    {sub.status}
                  </span>
                  <span className="text-text-muted font-body truncate flex-1">{sub.url}</span>
                  <span className="text-text-muted">{sub.upvotes} votes</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Changelog */}
        <div className="mb-8">
          <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary mb-3">Recent Agent Activity</h2>
          {changelog.slice(0, 3).map(entry => (
            <div key={entry.date} className="mb-3">
              <p className="font-display font-bold text-xs text-text-muted mb-1">{entry.date}</p>
              {entry.changes.map((c, i) => (
                <p key={i} className="text-xs font-body text-text-secondary ml-3">
                  <span className="font-semibold text-text-primary">{c.article}</span> — {c.description}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary mb-3">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <a href="https://github.com/veenomous/NetsWorldBK/actions" target="_blank" rel="noopener noreferrer"
              className="bg-black text-white px-4 py-2 font-display font-bold text-xs uppercase tracking-wider hover:bg-brand-red transition-colors">
              GitHub Actions
            </a>
            <a href="https://kijbuyyzetkxgcrphtjd.supabase.co" target="_blank" rel="noopener noreferrer"
              className="bg-black text-white px-4 py-2 font-display font-bold text-xs uppercase tracking-wider hover:bg-brand-red transition-colors">
              Supabase
            </a>
            <a href="https://vercel.com/veenomous-projects/netsworld" target="_blank" rel="noopener noreferrer"
              className="bg-black text-white px-4 py-2 font-display font-bold text-xs uppercase tracking-wider hover:bg-brand-red transition-colors">
              Vercel
            </a>
            <Link href="/spaces/upload"
              className="bg-black text-white px-4 py-2 font-display font-bold text-xs uppercase tracking-wider hover:bg-brand-red transition-colors">
              Upload Space
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
