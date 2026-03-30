"use client";

import { useState, useEffect } from "react";
import { supabase, getVisitorId } from "@/lib/supabase";

interface Prediction {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  category: string;
}

interface PredictionWithVotes extends Prediction {
  countA: number;
  countB: number;
  totalVotes: number;
}

// Static prediction questions (schedule-based ones added dynamically)
const BASE_PREDICTIONS: Prediction[] = [
  { id: "lottery-spot-2026", question: "Final lottery position?", optionA: "Top 3", optionB: "#4 or lower", category: "Draft" },
  { id: "trade-pick-2026", question: "Nets make a draft-night trade?", optionA: "Yes", optionB: "No", category: "Trade" },
  { id: "mpj-keep", question: "MPJ still a Net next season?", optionA: "Yes", optionB: "No, traded", category: "Roster" },
  { id: "boozer-or-dybantsa", question: "If Nets get #3: Boozer or Dybantsa?", optionA: "Boozer", optionB: "Dybantsa", category: "Draft" },
];

export default function DailyPrediction() {
  const [predictions, setPredictions] = useState<PredictionWithVotes[]>([]);
  const [userPicks, setUserPicks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const visitorId = getVisitorId();

      // Fetch schedule-based predictions
      let schedulePreds: Prediction[] = [];
      try {
        const res = await fetch("/api/schedule");
        const data = await res.json();
        if (data.todayGame) {
          schedulePreds.push({
            id: `game-${data.todayGame.gameId}`,
            question: `Nets vs ${data.todayGame.opponent} — ${data.todayGame.isHome ? "Home" : "Away"} (Today)`,
            optionA: "Nets W",
            optionB: "Nets L",
            category: "Game",
          });
        }
        if (data.upcomingGames?.length > 0) {
          const next = data.todayGame ? data.upcomingGames[1] : data.upcomingGames[0];
          if (next) {
            schedulePreds.push({
              id: `game-${next.date}`,
              question: `Nets vs ${next.opponent} — ${next.isHome ? "Home" : "Away"}`,
              optionA: "Nets W",
              optionB: "Nets L",
              category: "Game",
            });
          }
        }
      } catch {
        // No schedule available
      }

      const allPreds = [...schedulePreds, ...BASE_PREDICTIONS];
      const predIds = allPreds.map((p) => p.id);

      // Fetch all votes for these predictions + this user's picks
      const [allPicksRes, myPicksRes] = await Promise.all([
        supabase.from("prediction_picks").select("prediction_id, picked_option").in("prediction_id", predIds),
        supabase.from("prediction_picks").select("prediction_id, picked_option").eq("visitor_id", visitorId).in("prediction_id", predIds),
      ]);

      // Count votes per prediction per option
      const counts: Record<string, { a: number; b: number }> = {};
      (allPicksRes.data || []).forEach((p: any) => {
        if (!counts[p.prediction_id]) counts[p.prediction_id] = { a: 0, b: 0 };
        // We need to figure out if picked_option matches optionA or optionB
        const pred = allPreds.find((pr) => pr.id === p.prediction_id);
        if (pred) {
          if (p.picked_option === pred.optionA) counts[p.prediction_id].a++;
          else counts[p.prediction_id].b++;
        }
      });

      // User picks
      const myMap: Record<string, string> = {};
      (myPicksRes.data || []).forEach((p: any) => { myMap[p.prediction_id] = p.picked_option; });
      setUserPicks(myMap);

      // Build final list
      const withVotes: PredictionWithVotes[] = allPreds.map((p) => {
        const c = counts[p.id] || { a: 0, b: 0 };
        return { ...p, countA: c.a, countB: c.b, totalVotes: c.a + c.b };
      });

      setPredictions(withVotes);
      setLoading(false);
    }
    load();
  }, []);

  const handlePick = async (predId: string, option: string) => {
    if (userPicks[predId]) return;
    const visitorId = getVisitorId();

    // Optimistic update
    setUserPicks((prev) => ({ ...prev, [predId]: option }));
    setPredictions((prev) =>
      prev.map((p) => {
        if (p.id !== predId) return p;
        const pred = BASE_PREDICTIONS.find((bp) => bp.id === predId) || predictions.find((pp) => pp.id === predId);
        const isA = option === pred?.optionA;
        return { ...p, countA: p.countA + (isA ? 1 : 0), countB: p.countB + (isA ? 0 : 1), totalVotes: p.totalVotes + 1 };
      })
    );

    await supabase.from("prediction_picks").insert({
      prediction_id: predId,
      picked_option: option,
      visitor_id: visitorId,
    });
  };

  const answeredCount = predictions.filter((p) => userPicks[p.id]).length;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[15px]">Daily Predictions</h3>
          <p className="text-text-muted text-xs mt-0.5">Make your call. See what others think.</p>
        </div>
        {predictions.length > 0 && (
          <span className="text-[11px] text-text-muted">{answeredCount}/{predictions.length}</span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3.5 rounded-xl bg-gray-50 animate-pulse-soft h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {predictions.map((pred) => {
            const picked = userPicks[pred.id];
            const tagColor = pred.category === "Game" ? "tag-green" : pred.category === "Draft" ? "tag-blue" : pred.category === "Roster" ? "tag-purple" : "tag-gold";
            const pctA = pred.totalVotes > 0 ? Math.round((pred.countA / pred.totalVotes) * 100) : 50;

            return (
              <div
                key={pred.id}
                className={`p-3.5 rounded-xl transition-all ${
                  picked ? "bg-gray-50" : "bg-gray-100 border border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`tag ${tagColor}`}>{pred.category}</span>
                  <span className="text-[13px] font-semibold">{pred.question}</span>
                </div>

                {/* Vote bar (shown after voting) */}
                {picked && pred.totalVotes > 0 && (
                  <div className="mb-2">
                    <div className="h-1.5 rounded-full overflow-hidden flex bg-gray-100">
                      <div className="h-full bg-accent-green rounded-l-full odds-bar" style={{ width: `${pctA}%` }} />
                      <div className="h-full bg-accent-red rounded-r-full odds-bar" style={{ width: `${100 - pctA}%` }} />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePick(pred.id, pred.optionA)}
                    disabled={!!picked}
                    className={`py-2.5 rounded-lg text-[13px] font-bold transition-all ${
                      picked === pred.optionA
                        ? "bg-accent-green/15 text-accent-green border border-accent-green/30"
                        : picked
                          ? "bg-gray-50 text-text-muted border border-transparent"
                          : "bg-gray-100 text-text-secondary hover:bg-accent-green/10 hover:text-accent-green border border-transparent hover:border-accent-green/20 cursor-pointer"
                    }`}
                  >
                    {pred.optionA}
                    {picked && pred.totalVotes > 0 && (
                      <span className="ml-1 text-[11px] opacity-70">{pctA}%</span>
                    )}
                  </button>
                  <button
                    onClick={() => handlePick(pred.id, pred.optionB)}
                    disabled={!!picked}
                    className={`py-2.5 rounded-lg text-[13px] font-bold transition-all ${
                      picked === pred.optionB
                        ? "bg-accent-red/15 text-accent-red border border-accent-red/30"
                        : picked
                          ? "bg-gray-50 text-text-muted border border-transparent"
                          : "bg-gray-100 text-text-secondary hover:bg-accent-red/10 hover:text-accent-red border border-transparent hover:border-accent-red/20 cursor-pointer"
                    }`}
                  >
                    {pred.optionB}
                    {picked && pred.totalVotes > 0 && (
                      <span className="ml-1 text-[11px] opacity-70">{100 - pctA}%</span>
                    )}
                  </button>
                </div>

                {picked && pred.totalVotes > 0 && (
                  <p className="text-[10px] text-text-muted mt-1.5 text-right">{pred.totalVotes} fan{pred.totalVotes !== 1 ? "s" : ""} voted</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
