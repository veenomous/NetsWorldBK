"use client";

import { useState, useEffect } from "react";
import { supabase, getVisitorId } from "@/lib/supabase";
import ShareButton from "@/components/ShareButton";

interface Take {
  id: string;
  text: string;
  author: string;
  agrees: number;
  disagrees: number;
  tag: string;
  created_at: string;
}

const tagColors: Record<string, string> = {
  "Draft": "tag-blue",
  "Hot Take": "tag-red",
  "Roster": "tag-green",
  "Spicy": "tag-red",
  "Strategy": "tag-purple",
  "Trade": "tag-gold",
};

const TAG_OPTIONS = ["Hot Take", "Draft", "Roster", "Strategy", "Spicy"];

export default function HotTakes() {
  const [takes, setTakes] = useState<Take[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTake, setNewTake] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newTag, setNewTag] = useState("Hot Take");
  const [submitting, setSubmitting] = useState(false);

  // Fetch takes + user's existing votes
  useEffect(() => {
    async function load() {
      const visitorId = getVisitorId();

      const [takesRes, votesRes] = await Promise.all([
        supabase.from("hot_takes").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("take_votes").select("take_id, vote_type").eq("visitor_id", visitorId),
      ]);

      if (takesRes.data) setTakes(takesRes.data);
      if (votesRes.data) {
        const map: Record<string, string> = {};
        votesRes.data.forEach((v: any) => { map[v.take_id] = v.vote_type; });
        setUserVotes(map);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleVote = async (takeId: string, voteType: "agree" | "disagree") => {
    if (userVotes[takeId]) return;
    const visitorId = getVisitorId();

    // Optimistic update
    setUserVotes((prev) => ({ ...prev, [takeId]: voteType }));
    setTakes((prev) =>
      prev.map((t) =>
        t.id === takeId
          ? { ...t, agrees: t.agrees + (voteType === "agree" ? 1 : 0), disagrees: t.disagrees + (voteType === "disagree" ? 1 : 0) }
          : t
      )
    );

    // Save vote
    await supabase.from("take_votes").insert({ take_id: takeId, vote_type: voteType, visitor_id: visitorId });

    // Update count on the take
    const take = takes.find((t) => t.id === takeId);
    if (take) {
      const field = voteType === "agree" ? "agrees" : "disagrees";
      await supabase.from("hot_takes").update({ [field]: (take[field] || 0) + 1 }).eq("id", takeId);
    }
  };

  const handleSubmit = async () => {
    if (!newTake.trim() || newTake.length < 10) return;
    setSubmitting(true);

    const visitorId = getVisitorId();
    const author = newAuthor.trim() || "Anonymous";

    const { data, error } = await supabase
      .from("hot_takes")
      .insert({ text: newTake.trim(), author, tag: newTag, ip_hash: visitorId })
      .select()
      .single();

    if (data && !error) {
      setTakes((prev) => [data, ...prev]);
      setNewTake("");
      setNewAuthor("");
      setShowForm(false);
    }
    setSubmitting(false);
  };

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[15px]">Hot Takes</h3>
          <p className="text-text-muted text-xs mt-0.5">What Nets fans are saying</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="tag tag-gold cursor-pointer hover:opacity-80 transition-opacity"
        >
          {showForm ? "Cancel" : "+ Add Take"}
        </button>
      </div>

      {/* Submit form */}
      {showForm && (
        <div className="mb-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-slide-up">
          <textarea
            value={newTake}
            onChange={(e) => setNewTake(e.target.value)}
            placeholder="Drop your take..."
            maxLength={280}
            rows={2}
            className="w-full bg-transparent text-[13px] text-white placeholder:text-text-muted outline-none resize-none mb-2"
          />
          <div className="flex items-center gap-2 mb-2">
            <input
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              placeholder="Your name (optional)"
              maxLength={20}
              className="flex-1 bg-white/[0.04] rounded-lg px-3 py-1.5 text-[12px] text-white placeholder:text-text-muted outline-none"
            />
            <select
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="bg-white/[0.04] rounded-lg px-3 py-1.5 text-[12px] text-white outline-none"
            >
              {TAG_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-muted">{newTake.length}/280</span>
            <button
              onClick={handleSubmit}
              disabled={submitting || newTake.trim().length < 10}
              className="px-4 py-1.5 rounded-lg gradient-bg-brand text-white text-[12px] font-bold disabled:opacity-30 transition-all hover:opacity-90"
            >
              {submitting ? "Posting..." : "Post Take"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-white/[0.02] animate-pulse-soft" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {takes.map((take) => {
            const total = take.agrees + take.disagrees;
            const agreePercent = total > 0 ? Math.round((take.agrees / total) * 100) : 50;
            const userVote = userVotes[take.id];

            return (
              <div key={take.id} className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`tag ${tagColors[take.tag] || "tag-blue"}`}>{take.tag}</span>
                  <span className="text-text-muted text-[11px]">@{take.author}</span>
                  <span className="text-text-muted text-[11px] ml-auto">{timeAgo(take.created_at)}</span>
                </div>

                <p className="text-[13px] font-medium leading-snug mb-3">{take.text}</p>

                {userVote && (
                  <div className="mb-2.5">
                    <div className="h-1.5 rounded-full overflow-hidden flex bg-white/[0.04]">
                      <div className="h-full bg-accent-green rounded-l-full odds-bar" style={{ width: `${agreePercent}%` }} />
                      <div className="h-full bg-accent-red rounded-r-full odds-bar" style={{ width: `${100 - agreePercent}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVote(take.id, "agree")}
                    disabled={!!userVote}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                      userVote === "agree"
                        ? "bg-accent-green/15 text-accent-green"
                        : "bg-white/[0.04] text-text-secondary hover:bg-accent-green/10 hover:text-accent-green"
                    } ${userVote ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <span>&#128077;</span>
                    <span>{take.agrees}</span>
                  </button>
                  <button
                    onClick={() => handleVote(take.id, "disagree")}
                    disabled={!!userVote}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                      userVote === "disagree"
                        ? "bg-accent-red/15 text-accent-red"
                        : "bg-white/[0.04] text-text-secondary hover:bg-accent-red/10 hover:text-accent-red"
                    } ${userVote ? "cursor-default" : "cursor-pointer"}`}
                  >
                    <span>&#128078;</span>
                    <span>{take.disagrees}</span>
                  </button>
                  {userVote && (
                    <>
                      <span className="text-[11px] text-text-muted ml-auto mr-2">
                        {agreePercent}% agree
                      </span>
                      <ShareButton text={`"${take.text}" — ${agreePercent}% of Nets fans agree. What do you think?`} />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
