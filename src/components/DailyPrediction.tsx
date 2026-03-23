"use client";

import { useState, useEffect } from "react";

interface Prediction {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  category: string;
}

const predictions: Prediction[] = [
  { id: "next-game", question: "Nets vs Bulls — Tuesday", optionA: "Nets W", optionB: "Nets L", category: "Game" },
  { id: "lottery-spot", question: "Final lottery position?", optionA: "Top 3", optionB: "#4 or lower", category: "Draft" },
  { id: "cam30", question: "Cam Thomas scores 30+ this week?", optionA: "Yes", optionB: "No", category: "Player" },
  { id: "trade-deadline", question: "Nets make a draft-night trade?", optionA: "Yes", optionB: "No", category: "Trade" },
];

export default function DailyPrediction() {
  const [userPicks, setUserPicks] = useState<Record<string, string>>({});
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("nw-predictions");
    if (saved) setUserPicks(JSON.parse(saved));
    const savedStreak = localStorage.getItem("nw-streak");
    if (savedStreak) setStreak(parseInt(savedStreak));
  }, []);

  const handlePick = (predId: string, option: string) => {
    if (userPicks[predId]) return;
    const newPicks = { ...userPicks, [predId]: option };
    setUserPicks(newPicks);
    localStorage.setItem("nw-predictions", JSON.stringify(newPicks));
  };

  const currentPred = predictions.find((p) => !userPicks[p.id]) || predictions[0];
  const answeredCount = Object.keys(userPicks).length;

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
          <span className="text-[11px] text-text-muted">{answeredCount}/{predictions.length}</span>
        </div>
      </div>

      <div className="space-y-3">
        {predictions.map((pred) => {
          const picked = userPicks[pred.id];
          const tagColor = pred.category === "Game" ? "tag-green" : pred.category === "Draft" ? "tag-blue" : pred.category === "Player" ? "tag-purple" : "tag-gold";

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
    </div>
  );
}
