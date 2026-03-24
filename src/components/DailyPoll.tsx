"use client";

import { useState, useEffect } from "react";
import { supabase, getVisitorId } from "@/lib/supabase";

interface Poll {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  category: string;
}

const ALL_POLLS: Poll[] = [
  { id: "poll-top3-2026", question: "Will the Nets land a top 3 pick?", optionA: "Top 3", optionB: "Nah, we drop", category: "Draft" },
  { id: "poll-boozer-dybantsa", question: "If Nets get #3: Boozer or Dybantsa?", optionA: "Boozer", optionB: "Dybantsa", category: "Draft" },
  { id: "poll-mpj-keep", question: "Is MPJ part of the long-term plan?", optionA: "Build around him", optionB: "Trade asset", category: "Roster" },
  { id: "poll-trade-pick", question: "Trade the pick for a star?", optionA: "Keep it", optionB: "Trade for a star", category: "Strategy" },
  { id: "poll-rebuild-years", question: "How many years until we contend?", optionA: "2-3 years", optionB: "4+ years", category: "Future" },
  { id: "poll-clowney-core", question: "Is Noah Clowney a long-term starter?", optionA: "Yes, core piece", optionB: "Solid role player", category: "Roster" },
  { id: "poll-demin-potential", question: "Egor Demin's ceiling?", optionA: "All-Star", optionB: "Good starter", category: "Roster" },
];

const categoryColors: Record<string, string> = {
  Draft: "tag-blue",
  Roster: "tag-green",
  Strategy: "tag-purple",
  Future: "tag-gold",
};

function getFeaturedIndex() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return dayOfYear % ALL_POLLS.length;
}

export default function DailyPoll() {
  const featuredIdx = getFeaturedIndex();
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState<Record<string, { a: number; b: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const visitorId = getVisitorId();
      const pollIds = ALL_POLLS.map((p) => p.id);

      const [allRes, myRes] = await Promise.all([
        supabase.from("prediction_picks").select("prediction_id, picked_option").in("prediction_id", pollIds),
        supabase.from("prediction_picks").select("prediction_id, picked_option").eq("visitor_id", visitorId).in("prediction_id", pollIds),
      ]);

      const c: Record<string, { a: number; b: number }> = {};
      (allRes.data || []).forEach((r: any) => {
        if (!c[r.prediction_id]) c[r.prediction_id] = { a: 0, b: 0 };
        const poll = ALL_POLLS.find((p) => p.id === r.prediction_id);
        if (poll) {
          if (r.picked_option === poll.optionA) c[r.prediction_id].a++;
          else c[r.prediction_id].b++;
        }
      });
      setCounts(c);

      const myMap: Record<string, string> = {};
      (myRes.data || []).forEach((r: any) => { myMap[r.prediction_id] = r.picked_option; });
      setPicks(myMap);
      setLoading(false);
    }
    load();
  }, []);

  const handleVote = async (pollId: string, option: string) => {
    if (picks[pollId]) return;
    const visitorId = getVisitorId();

    setPicks((prev) => ({ ...prev, [pollId]: option }));
    setCounts((prev) => {
      const poll = ALL_POLLS.find((p) => p.id === pollId);
      const cur = prev[pollId] || { a: 0, b: 0 };
      const isA = option === poll?.optionA;
      return { ...prev, [pollId]: { a: cur.a + (isA ? 1 : 0), b: cur.b + (isA ? 0 : 1) } };
    });

    await supabase.from("prediction_picks").insert({
      prediction_id: pollId,
      picked_option: option,
      visitor_id: visitorId,
    });
  };

  // Featured poll first, then the rest
  const featured = ALL_POLLS[featuredIdx];
  const others = ALL_POLLS.filter((_, i) => i !== featuredIdx);

  const answeredCount = ALL_POLLS.filter((p) => picks[p.id]).length;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="heading-md">Polls</h3>
          <p className="text-text-muted text-[11px] mt-0.5">Vote daily. See what fans think.</p>
        </div>
        <span className="text-[11px] text-text-muted">{answeredCount}/{ALL_POLLS.length}</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-white/[0.02] animate-pulse-soft" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Featured poll — slightly bigger */}
          <PollCard
            poll={featured}
            picked={picks[featured.id]}
            counts={counts[featured.id] || { a: 0, b: 0 }}
            onVote={handleVote}
            featured
          />

          {/* Other polls */}
          {others.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              picked={picks[poll.id]}
              counts={counts[poll.id] || { a: 0, b: 0 }}
              onVote={handleVote}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PollCard({
  poll, picked, counts, onVote, featured = false,
}: {
  poll: Poll; picked?: string; counts: { a: number; b: number }; onVote: (id: string, opt: string) => void; featured?: boolean;
}) {
  const total = counts.a + counts.b;
  const pctA = total > 0 ? Math.round((counts.a / total) * 100) : 50;
  const pctB = 100 - pctA;

  return (
    <div className={`rounded-xl p-3 ${featured ? "bg-brand-orange/[0.04] border border-brand-orange/10" : "bg-white/[0.02]"}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`tag ${categoryColors[poll.category] || "tag-blue"}`}>{poll.category}</span>
        <span className="text-[12px] font-semibold">{poll.question}</span>
      </div>

      {/* Vote result bar */}
      {picked && total > 0 && (
        <div className="h-1 rounded-full overflow-hidden flex bg-white/[0.04] mb-2">
          <div className="h-full bg-brand-orange/40 rounded-l-full odds-bar" style={{ width: `${pctA}%` }} />
          <div className="h-full bg-white/10 rounded-r-full odds-bar" style={{ width: `${pctB}%` }} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onVote(poll.id, poll.optionA)}
          disabled={!!picked}
          className={`py-2 rounded-lg text-[12px] font-bold transition-all ${
            picked === poll.optionA
              ? "bg-brand-orange/15 text-brand-orange border border-brand-orange/25"
              : picked
                ? "bg-white/[0.02] text-text-muted border border-transparent"
                : "bg-white/[0.04] text-text-secondary hover:bg-brand-orange/10 hover:text-brand-orange border border-transparent hover:border-brand-orange/15 cursor-pointer"
          }`}
        >
          {poll.optionA}
          {picked && total > 0 && <span className="ml-1 text-[10px] opacity-70">{pctA}%</span>}
        </button>
        <button
          onClick={() => onVote(poll.id, poll.optionB)}
          disabled={!!picked}
          className={`py-2 rounded-lg text-[12px] font-bold transition-all ${
            picked === poll.optionB
              ? "bg-accent-red/15 text-accent-red border border-accent-red/25"
              : picked
                ? "bg-white/[0.02] text-text-muted border border-transparent"
                : "bg-white/[0.04] text-text-secondary hover:bg-accent-red/10 hover:text-accent-red border border-transparent hover:border-accent-red/15 cursor-pointer"
          }`}
        >
          {poll.optionB}
          {picked && total > 0 && <span className="ml-1 text-[10px] opacity-70">{pctB}%</span>}
        </button>
      </div>

      {picked && total > 0 && (
        <p className="text-[10px] text-text-muted mt-1.5 text-right">{total} voted</p>
      )}
    </div>
  );
}
