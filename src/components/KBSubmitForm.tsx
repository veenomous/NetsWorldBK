"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase, getVisitorId } from "@/lib/supabase";
import { useSession } from "next-auth/react";

const SOURCE_TYPES = [
  { value: "article", label: "Article / Blog Post" },
  { value: "tweet", label: "Tweet / X Post" },
  { value: "video", label: "Video / Podcast" },
  { value: "scouting", label: "Scouting Report" },
  { value: "rumor", label: "Trade Rumor / Insider" },
  { value: "stats", label: "Stats / Data" },
  { value: "other", label: "Other" },
];

interface Submission {
  id: string;
  url: string;
  note: string;
  source_type: string;
  submitted_by: string;
  status: string;
  upvotes: number;
  created_at: string;
}

export default function KBSubmitForm() {
  const { data: session } = useSession();
  const xHandle = (session?.user as { xHandle?: string })?.xHandle;

  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [sourceType, setSourceType] = useState("article");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [recent, setRecent] = useState<Submission[]>([]);
  const [voted, setVoted] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("kb-votes");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  // Load recent submissions
  useEffect(() => {
    supabase
      .from("kb_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15)
      .then(({ data }) => {
        if (data) setRecent(data);
      });
  }, [submitted]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setSubmitting(true);
    setError("");

    const { error: err } = await supabase.from("kb_submissions").insert({
      url: url.trim(),
      note: note.trim() || null,
      source_type: sourceType,
      submitted_by: xHandle || "anonymous",
      visitor_id: getVisitorId(),
    });

    if (err) {
      setError("Failed to submit. Try again.");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
    setUrl("");
    setNote("");

    // Reset after 3 seconds
    setTimeout(() => setSubmitted(false), 3000);
  }

  async function handleUpvote(id: string) {
    if (voted.has(id)) return;
    const newVoted = new Set(voted).add(id);
    setVoted(newVoted);
    try { localStorage.setItem("kb-votes", JSON.stringify([...newVoted])); } catch {}
    setRecent((prev) =>
      prev.map((s) => (s.id === id ? { ...s, upvotes: s.upvotes + 1 } : s))
    );
    const current = recent.find((s) => s.id === id);
    if (current) {
      await supabase
        .from("kb_submissions")
        .update({ upvotes: current.upvotes + 1 })
        .eq("id", id);
    }
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="bg-black text-white px-4 sm:px-8 pt-4 pb-6">
        <div className="max-w-3xl mx-auto">
          <nav className="flex items-center gap-2 text-xs font-body mb-4">
            <Link href="/" className="text-white/40 hover:text-white transition-colors">
              &larr; KB
            </Link>
          </nav>
          <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight">
            Submit a <span className="text-brand-red">Source</span>
          </h1>
          <p className="text-white/40 text-sm font-body mt-2 max-w-lg">
            Found something Nets-related? Drop the link. The best submissions get compiled into the wiki by our AI agent.
          </p>
        </div>
      </div>
      <div className="h-1 bg-brand-red" />

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
        {/* Submit form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-10">
          {/* URL */}
          <div>
            <label className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted mb-1.5 block">
              URL *
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-black/10 px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-brand-red/50 transition-colors"
            />
          </div>

          {/* Source type */}
          <div>
            <label className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted mb-1.5 block">
              Source Type
            </label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full border border-black/10 px-4 py-3 font-body text-sm text-text-primary focus:outline-none focus:border-brand-red/50 transition-colors bg-white"
            >
              {SOURCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted mb-1.5 block">
              Note <span className="text-text-muted/50">(optional — what&apos;s important about this?)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Key takeaway, why it matters for the Nets..."
              rows={3}
              maxLength={500}
              className="w-full border border-black/10 px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-brand-red/50 transition-colors resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting || !url.trim()}
              className="bg-black text-white font-display font-bold text-xs uppercase tracking-wider px-8 py-3 hover:bg-brand-red transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : submitted ? "Submitted!" : "Submit Source"}
            </button>
            {submitted && (
              <span className="text-accent-green text-xs font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Added to the queue
              </span>
            )}
            {error && (
              <span className="text-brand-red text-xs font-bold">{error}</span>
            )}
          </div>

          {xHandle ? (
            <p className="text-text-muted text-[10px] font-body">Submitting as <span className="font-bold text-text-primary">@{xHandle}</span></p>
          ) : (
            <p className="text-text-muted text-[10px] font-body">Submitting anonymously. <Link href="#" className="text-brand-red">Sign in with X</Link> for credit.</p>
          )}
        </form>

        {/* Recent submissions */}
        {recent.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-brand-red text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
              <h2 className="font-display font-black text-sm tracking-[0.1em] uppercase text-text-secondary">Recent Submissions</h2>
            </div>
            <div className="space-y-2">
              {recent.map((sub) => (
                <div key={sub.id} className="card p-4 flex gap-3">
                  {/* Upvote */}
                  <button
                    onClick={() => handleUpvote(sub.id)}
                    disabled={voted.has(sub.id)}
                    className={`flex flex-col items-center shrink-0 w-10 pt-1 transition-colors ${
                      voted.has(sub.id) ? "text-brand-red" : "text-text-muted hover:text-brand-red cursor-pointer"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: voted.has(sub.id) ? "'FILL' 1" : "" }}>
                      arrow_upward
                    </span>
                    <span className="text-xs font-bold">{sub.upvotes}</span>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <a
                      href={sub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-body text-accent-blue hover:underline break-all line-clamp-1"
                    >
                      {sub.url}
                    </a>
                    {sub.note && (
                      <p className="text-text-secondary text-xs font-body mt-1">{sub.note}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="tag tag-blue" style={{ fontSize: "8px", padding: "1px 6px" }}>
                        {SOURCE_TYPES.find((t) => t.value === sub.source_type)?.label || sub.source_type}
                      </span>
                      <span className="text-text-muted text-[10px]">
                        @{sub.submitted_by} · {timeAgo(sub.created_at)}
                      </span>
                      {sub.status === "approved" && (
                        <span className="tag tag-green" style={{ fontSize: "8px", padding: "1px 6px" }}>compiled</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back */}
        <div className="mt-8">
          <Link href="/" className="text-sm text-brand-red hover:underline font-body flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Knowledge Base
          </Link>
        </div>
      </div>
    </div>
  );
}
