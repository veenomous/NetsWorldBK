"use client";

import { useState, useEffect } from "react";

interface GameInfo {
  opponent: string;
  opponentAbbrev: string;
  date: string;
  isHome: boolean;
}

interface Prediction {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  category: string;
}

function getDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function DailyPrediction() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [userPicks, setUserPicks] = useState<Record<string, string>>({});
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("nw-predictions-v2");
    if (saved) setUserPicks(JSON.parse(saved));
    const savedStreak = localStorage.getItem("nw-streak");
    if (savedStreak) setStreak(parseInt(savedStreak));

    // Fetch real schedule
    fetchSchedule();
  }, []);

  async function fetchSchedule() {
    try {
      const res = await fetch("/api/schedule");
      const data = await res.json();

      const preds: Prediction[] = [];

      // Build predictions from real games
      if (data.todayGame) {
        const g = data.todayGame;
        preds.push({
          id: `game-today-${g.gameId}`,
          question: `Nets vs ${g.opponent} — ${g.isHome ? "Home" : "Away"} (Today)`,
          optionA: "Nets W",
          optionB: "Nets L",
          category: "Game",
        });
      }

      if (data.upcomingGames?.length > 0) {
        // Add next 1-2 upcoming games (skip today if already added)
        const upcoming = data.todayGame
          ? data.upcomingGames.slice(1, 3)
          : data.upcomingGames.slice(0, 2);

        for (const g of upcoming) {
          const label = getDateLabel(g.date);
          preds.push({
            id: `game-${g.date}-${g.gameId}`,
            question: `Nets vs ${g.opponent} — ${g.isHome ? "Home" : "Away"} (${label})`,
            optionA: "Nets W",
            optionB: "Nets L",
            category: "Game",
          });
        }
      }

      // Always include these evergreen predictions
      preds.push(
        { id: "lottery-spot-2026", question: "Final lottery position?", optionA: "Top 3", optionB: "#4 or lower", category: "Draft" },
        { id: "trade-pick-2026", question: "Nets make a draft-night trade?", optionA: "Yes", optionB: "No", category: "Trade" },
      );

      // If no live games found, add fallback game predictions
      if (preds.length <= 2) {
        preds.unshift(
          { id: "next-win", question: "Nets win their next game?", optionA: "Yes", optionB: "No", category: "Game" },
          { id: "mpj-25", question: "MPJ scores 25+ this week?", optionA: "Yes", optionB: "No", category: "Player" },
        );
      }

      setPredictions(preds);
    } catch {
      // Fallback predictions if API fails
      setPredictions([
        { id: "next-win", question: "Nets win their next game?", optionA: "Yes", optionB: "No", category: "Game" },
        { id: "mpj-25", question: "MPJ scores 25+ this week?", optionA: "Yes", optionB: "No", category: "Player" },
        { id: "lottery-spot-2026", question: "Final lottery position?", optionA: "Top 3", optionB: "#4 or lower", category: "Draft" },
        { id: "trade-pick-2026", question: "Nets make a draft-night trade?", optionA: "Yes", optionB: "No", category: "Trade" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const handlePick = (predId: string, option: string) => {
    if (userPicks[predId]) return;
    const newPicks = { ...userPicks, [predId]: option };
    setUserPicks(newPicks);
    localStorage.setItem("nw-predictions-v2", JSON.stringify(newPicks));
  };

  const answeredCount = predictions.filter((p) => userPicks[p.id]).length;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[15px]">Daily Predictions</h3>
          <p className="text-text-muted text-xs mt-0.5">Make your call. Track your streak.</p>
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-orange/10">
              <span className="text-[11px] font-bold text-accent-orange">{streak} streak</span>
            </div>
          )}
          {predictions.length > 0 && (
            <span className="text-[11px] text-text-muted">{answeredCount}/{predictions.length}</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3.5 rounded-xl bg-white/[0.02] animate-pulse-soft h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {predictions.map((pred) => {
            const picked = userPicks[pred.id];
            const tagColor =
              pred.category === "Game" ? "tag-green" :
              pred.category === "Draft" ? "tag-blue" :
              pred.category === "Player" ? "tag-purple" : "tag-gold";

            return (
              <div
                key={pred.id}
                className={`p-3.5 rounded-xl transition-all ${
                  picked ? "bg-white/[0.02]" : "bg-white/[0.03] border border-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`tag ${tagColor}`}>{pred.category}</span>
                  <span className="text-[13px] font-semibold">{pred.question}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePick(pred.id, pred.optionA)}
                    disabled={!!picked}
                    className={`py-2.5 rounded-lg text-[13px] font-bold transition-all ${
                      picked === pred.optionA
                        ? "bg-accent-green/15 text-accent-green border border-accent-green/30"
                        : picked
                          ? "bg-white/[0.02] text-text-muted border border-transparent"
                          : "bg-white/[0.04] text-text-secondary hover:bg-accent-green/10 hover:text-accent-green border border-transparent hover:border-accent-green/20 cursor-pointer"
                    }`}
                  >
                    {pred.optionA}
                  </button>
                  <button
                    onClick={() => handlePick(pred.id, pred.optionB)}
                    disabled={!!picked}
                    className={`py-2.5 rounded-lg text-[13px] font-bold transition-all ${
                      picked === pred.optionB
                        ? "bg-accent-red/15 text-accent-red border border-accent-red/30"
                        : picked
                          ? "bg-white/[0.02] text-text-muted border border-transparent"
                          : "bg-white/[0.04] text-text-secondary hover:bg-accent-red/10 hover:text-accent-red border border-transparent hover:border-accent-red/20 cursor-pointer"
                    }`}
                  >
                    {pred.optionB}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
