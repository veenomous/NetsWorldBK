"use client";

import { useState, useEffect } from "react";
import { supabase, getVisitorId } from "@/lib/supabase";

// Rotating daily polls — one shown per day based on day of year
const POLLS = [
  { id: "poll-top3-2026", question: "Will the Nets land a top 3 pick?", optionA: "Top 3", optionB: "Nah, we drop", category: "Draft" },
  { id: "poll-boozer-dybantsa", question: "If Nets get #3: Boozer or Dybantsa?", optionA: "Boozer", optionB: "Dybantsa", category: "Draft" },
  { id: "poll-mpj-keep", question: "Is MPJ part of the long-term plan?", optionA: "Build around him", optionB: "Trade asset", category: "Roster" },
  { id: "poll-trade-pick", question: "Trade the pick for a star?", optionA: "Keep it", optionB: "Trade for a star", category: "Strategy" },
  { id: "poll-rebuild-years", question: "How many years until we contend?", optionA: "2-3 years", optionB: "4+ years", category: "Future" },
  { id: "poll-clowney-core", question: "Is Noah Clowney a long-term starter?", optionA: "Yes, core piece", optionB: "Solid role player", category: "Roster" },
  { id: "poll-demin-potential", question: "Egor Demin's ceiling?", optionA: "All-Star", optionB: "Good starter", category: "Roster" },
];

function getTodaysPoll() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return POLLS[dayOfYear % POLLS.length];
}

const categoryColors: Record<string, string> = {
  Draft: "tag-blue",
  Roster: "tag-green",
  Strategy: "tag-purple",
  Future: "tag-gold",
};

export default function DailyPoll() {
  const poll = getTodaysPoll();
  const [picked, setPicked] = useState<string | null>(null);
  const [countA, setCountA] = useState(0);
  const [countB, setCountB] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const visitorId = getVisitorId();

      const [allRes, myRes] = await Promise.all([
        supabase.from("prediction_picks").select("picked_option").eq("prediction_id", poll.id),
        supabase.from("prediction_picks").select("picked_option").eq("prediction_id", poll.id).eq("visitor_id", visitorId),
      ]);

      if (allRes.data) {
        setCountA(allRes.data.filter((r: any) => r.picked_option === poll.optionA).length);
        setCountB(allRes.data.filter((r: any) => r.picked_option === poll.optionB).length);
      }
      if (myRes.data && myRes.data.length > 0) {
        setPicked(myRes.data[0].picked_option);
      }
      setLoading(false);
    }
    load();
  }, [poll.id, poll.optionA, poll.optionB]);

  const handleVote = async (option: string) => {
    if (picked) return;
    const visitorId = getVisitorId();

    setPicked(option);
    if (option === poll.optionA) setCountA((c) => c + 1);
    else setCountB((c) => c + 1);

    await supabase.from("prediction_picks").insert({
      prediction_id: poll.id,
      picked_option: option,
      visitor_id: visitorId,
    });
  };

  const total = countA + countB;
  const pctA = total > 0 ? Math.round((countA / total) * 100) : 50;
  const pctB = 100 - pctA;

  return (
    <div className="card-featured p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className={`tag ${categoryColors[poll.category] || "tag-blue"}`}>{poll.category}</span>
        <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Daily Poll</span>
      </div>

      <h3 className="heading-md text-text-primary mb-4">{poll.question}</h3>

      {loading ? (
        <div className="space-y-2">
          <div className="h-12 rounded-xl bg-white/[0.03] animate-pulse-soft" />
          <div className="h-12 rounded-xl bg-white/[0.03] animate-pulse-soft" />
        </div>
      ) : (
        <div className="space-y-2">
          <PollOption
            label={poll.optionA}
            pct={pctA}
            isSelected={picked === poll.optionA}
            isRevealed={!!picked}
            isWinning={countA >= countB}
            onClick={() => handleVote(poll.optionA)}
          />
          <PollOption
            label={poll.optionB}
            pct={pctB}
            isSelected={picked === poll.optionB}
            isRevealed={!!picked}
            isWinning={countB > countA}
            onClick={() => handleVote(poll.optionB)}
          />
        </div>
      )}

      {picked && total > 0 && (
        <p className="text-[11px] text-text-muted mt-3 text-right">
          {total} fan{total !== 1 ? "s" : ""} voted
        </p>
      )}
    </div>
  );
}

function PollOption({
  label, pct, isSelected, isRevealed, isWinning, onClick,
}: {
  label: string; pct: number; isSelected: boolean; isRevealed: boolean; isWinning: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isRevealed}
      className={`w-full relative overflow-hidden rounded-xl p-3.5 text-left transition-all ${
        isRevealed
          ? isSelected
            ? "border border-brand-orange/30 bg-brand-orange/8"
            : "border border-white/[0.04] bg-white/[0.02]"
          : "border border-white/[0.06] bg-white/[0.03] hover:border-brand-orange/20 hover:bg-white/[0.05] cursor-pointer"
      }`}
    >
      {/* Background fill bar */}
      {isRevealed && (
        <div
          className={`absolute inset-y-0 left-0 rounded-xl transition-all duration-700 ${
            isWinning ? "bg-brand-orange/10" : "bg-white/[0.02]"
          }`}
          style={{ width: `${pct}%` }}
        />
      )}

      <div className="relative flex items-center justify-between">
        <span className={`text-[14px] font-semibold ${isSelected ? "text-brand-orange" : ""}`}>
          {label}
        </span>
        {isRevealed && (
          <span className={`text-[14px] font-bold tabular-nums ${isWinning ? "text-brand-orange" : "text-text-muted"}`}>
            {pct}%
          </span>
        )}
      </div>
    </button>
  );
}
