"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession, signIn } from "next-auth/react";
import { supabase, getVisitorId } from "@/lib/supabase";
import CommentSection from "@/components/CommentSection";
import { Tweet } from "react-tweet";

// ─── Types ───
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
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function extractTweetId(text: string): string | null {
  const match = text.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  return match ? match[1] : null;
}

// ─── Hot Take of the Day ───
function HotTakeOfTheDay({ take }: { take: Take }) {
  const total = take.agrees + take.disagrees;
  const pct = total > 0 ? Math.round((take.agrees / total) * 100) : 50;

  return (
    <div className="border-l-[6px] border-brand-red pl-6 py-4 mb-6 bg-brand-red/[0.03]">
      <p className="text-[9px] font-black tracking-[0.3em] uppercase text-brand-red mb-2">Hot Take of the Day</p>
      <p className="text-lg sm:text-xl font-black leading-tight">&ldquo;{take.text}&rdquo;</p>
      <div className="flex items-center gap-4 mt-3">
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-black/30">@{take.author}</span>
        <span className="text-xs font-black text-accent-green">{pct}% agree</span>
        <span className="text-[10px] font-bold text-black/20">{total} votes</span>
      </div>
    </div>
  );
}

// ─── Take Content (text + embedded tweets/links) ───
function TakeContent({ text }: { text: string }) {
  const tweetId = extractTweetId(text);

  if (tweetId) {
    const cleanText = text.replace(/https?:\/\/(?:twitter\.com|x\.com)\/\w+\/status\/\d+\S*/g, "").trim();
    return (
      <div>
        {cleanText && <p className="text-[15px] font-medium leading-snug mb-3">{cleanText}</p>}
        <div className="rounded-lg overflow-hidden border border-gray-200" data-theme="light">
          <Suspense fallback={<div className="h-20 bg-gray-50 animate-pulse-soft" />}>
            <Tweet id={tweetId} />
          </Suspense>
        </div>
      </div>
    );
  }

  // Check for any URL and make it a link
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <p className="text-[15px] font-medium leading-snug">
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline break-all">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

// ─── Single Take ───
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
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[9px] font-black tracking-[0.15em] uppercase text-black/20">@{take.author}</span>
        <span className="text-[9px] text-black/15">{timeAgo(take.created_at)}</span>
        <span className="text-[9px] font-black tracking-[0.15em] uppercase text-brand-red">{take.tag}</span>
      </div>
      <TakeContent text={take.text} />
      <div className="flex items-center gap-3 mt-2.5">
        <button
          onClick={() => !userVote && onVote(take.id, "agree")}
          className={`text-xs font-bold transition-colors ${userVote === "agree" ? "text-accent-green" : "text-black/25 hover:text-accent-green"} ${userVote ? "cursor-default" : "cursor-pointer"}`}
        >
          👍 {take.agrees}
        </button>
        <button
          onClick={() => !userVote && onVote(take.id, "disagree")}
          className={`text-xs font-bold transition-colors ${userVote === "disagree" ? "text-brand-red" : "text-black/25 hover:text-brand-red"} ${userVote ? "cursor-default" : "cursor-pointer"}`}
        >
          👎 {take.disagrees}
        </button>
        {userVote && (
          <span className="text-[10px] font-bold text-black/20">{pct}% agree</span>
        )}
        <button onClick={onExpand} className="text-[10px] font-bold uppercase tracking-wider text-black/25 hover:text-brand-red transition-colors ml-auto">
          {expanded ? "Hide" : "Reply"}
        </button>
        {/* Share on X */}
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${take.text.slice(0, 200)}" — via @BKGrit`)}&url=https://bkgrit.com/wire`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-bold uppercase tracking-wider text-black/25 hover:text-accent-blue transition-colors"
        >
          Share
        </a>
      </div>
      {expanded && <CommentSection page={`take-${take.id}`} compact />}
    </div>
  );
}

// ─── Post Form ───
function PostForm({ onPost }: { onPost: () => void }) {
  const { data: session } = useSession();
  const xHandle = (session?.user as { xHandle?: string })?.xHandle;

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!session) {
    return (
      <button onClick={() => signIn("twitter")} className="w-full py-4 bg-gray-50 border border-gray-200 text-sm font-bold text-black/30 uppercase tracking-wider hover:border-brand-red/30 hover:text-brand-red transition-all mb-4">
        Sign in with X to post
      </button>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);

    await supabase.from("hot_takes").insert({
      text: text.trim(), author: xHandle || "Anonymous", tag: "Take", ip_hash: getVisitorId(),
    });

    setText("");
    setSubmitting(false);
    onPost();
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        {session.user?.image && (
          <img src={session.user.image} alt="" className="w-7 h-7 rounded-full border border-gray-200" />
        )}
        <span className="text-[10px] font-bold text-black/30 uppercase tracking-wider">@{xHandle}</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Drop a take, share an X post, paste a link..."
        rows={2}
        maxLength={500}
        className="w-full bg-transparent text-sm text-text-primary outline-none resize-none placeholder:text-black/20"
      />
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <span className="text-[10px] text-black/15">{text.length}/500</span>
        <button
          type="submit"
          disabled={!text.trim() || submitting}
          className="bg-brand-red text-white px-5 py-1.5 font-black text-[11px] uppercase tracking-wider disabled:opacity-30 hover:bg-red-700 transition-all"
        >
          {submitting ? "..." : "Post"}
        </button>
      </div>
    </form>
  );
}

// ─── Main Wire Component ───
export default function TheWire({ limit, showForm = true, showHotTake = true }: {
  limit?: number;
  showForm?: boolean;
  showHotTake?: boolean;
}) {
  const [takes, setTakes] = useState<Take[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hotTake, setHotTake] = useState<Take | null>(null);

  const fetchAll = useCallback(async () => {
    const visitorId = getVisitorId();

    const [takesRes, votesRes] = await Promise.all([
      supabase.from("hot_takes").select("*").order("created_at", { ascending: false }).limit(limit || 30),
      supabase.from("take_votes").select("take_id, vote_type").eq("visitor_id", visitorId),
    ]);

    const allTakes: Take[] = takesRes.data || [];
    setTakes(allTakes);

    // Hot take of the day: most engaged from last 24h
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recent = allTakes.filter((t) => new Date(t.created_at).getTime() > oneDayAgo);
    const sorted = [...recent].sort((a, b) => (b.agrees + b.disagrees) - (a.agrees + a.disagrees));
    if (sorted.length > 0 && (sorted[0].agrees + sorted[0].disagrees) >= 1) {
      setHotTake(sorted[0]);
    }

    if (votesRes.data) {
      const map: Record<string, string> = {};
      votesRes.data.forEach((v: { take_id: string; vote_type: string }) => { map[v.take_id] = v.vote_type; });
      setUserVotes(map);
    }

    setLoading(false);
  }, [limit]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleVote(takeId: string, voteType: "agree" | "disagree") {
    if (userVotes[takeId]) return;
    const visitorId = getVisitorId();

    setUserVotes((prev) => ({ ...prev, [takeId]: voteType }));
    setTakes((prev) =>
      prev.map((t) =>
        t.id === takeId
          ? { ...t, agrees: t.agrees + (voteType === "agree" ? 1 : 0), disagrees: t.disagrees + (voteType === "disagree" ? 1 : 0) }
          : t
      )
    );

    await supabase.from("take_votes").insert({ take_id: takeId, vote_type: voteType, visitor_id: visitorId });
    const take = takes.find((t) => t.id === takeId);
    if (take) {
      const field = voteType === "agree" ? "agrees" : "disagrees";
      await supabase.from("hot_takes").update({ [field]: (take[field] || 0) + 1 }).eq("id", takeId);
    }
  }

  return (
    <div>
      {showForm && <PostForm onPost={fetchAll} />}
      {showHotTake && hotTake && <HotTakeOfTheDay take={hotTake} />}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="py-4 border-b border-gray-100">
              <div className="h-3 w-20 bg-gray-100 animate-pulse-soft mb-2" />
              <div className="h-5 w-full bg-gray-50 animate-pulse-soft mb-1" />
              <div className="h-5 w-3/4 bg-gray-50 animate-pulse-soft" />
            </div>
          ))}
        </div>
      ) : takes.length === 0 ? (
        <p className="text-black/25 text-sm text-center py-8">Nothing on The Wire yet. Drop the first take.</p>
      ) : (
        <div>
          {takes.map((take) => (
            <TakeCard
              key={take.id}
              take={take}
              onVote={handleVote}
              userVote={userVotes[take.id]}
              expanded={expandedId === take.id}
              onExpand={() => setExpandedId(expandedId === take.id ? null : take.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
