"use client";

import { useState, useEffect } from "react";

const moods = [
  { emoji: "🔥", label: "Hyped", color: "text-accent-orange" },
  { emoji: "😤", label: "Frustrated", color: "text-accent-red" },
  { emoji: "🙏", label: "Hopeful", color: "text-accent-green" },
  { emoji: "😭", label: "Pain", color: "text-accent-purple" },
  { emoji: "🧊", label: "Numb", color: "text-accent-blue" },
  { emoji: "😈", label: "Tank Mode", color: "text-nets-red" },
];

// Seed realistic fan vote distribution
function seedVotes(): Record<string, number> {
  return {
    "Hyped": 142,
    "Frustrated": 287,
    "Hopeful": 334,
    "Pain": 198,
    "Numb": 156,
    "Tank Mode": 421,
  };
}

export default function VibeCheck() {
  const [votes, setVotes] = useState<Record<string, number>>(seedVotes);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [justVoted, setJustVoted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("nw-vibe-vote");
    if (saved) setUserVote(saved);
  }, []);

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const topMood = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];

  const handleVote = (label: string) => {
    if (userVote) return;
    setUserVote(label);
    setJustVoted(true);
    localStorage.setItem("nw-vibe-vote", label);
    setVotes((prev) => ({ ...prev, [label]: (prev[label] || 0) + 1 }));
    setTimeout(() => setJustVoted(false), 2000);
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[15px]">Vibe Check</h3>
          <p className="text-text-muted text-xs mt-0.5">How are Nets fans feeling today?</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-text-muted">{totalVotes.toLocaleString()} fans voted</p>
        </div>
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {moods.map((mood) => {
          const isSelected = userVote === mood.label;
          const pct = Math.round(((votes[mood.label] || 0) / totalVotes) * 100);

          return (
            <button
              key={mood.label}
              onClick={() => handleVote(mood.label)}
              disabled={!!userVote}
              className={`
                relative flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all
                ${isSelected
                  ? "bg-gray-100 border border-gray-300 scale-105"
                  : userVote
                    ? "bg-gray-50 border border-transparent opacity-60"
                    : "bg-gray-100 border border-transparent hover:bg-gray-100 hover:scale-105 cursor-pointer"
                }
              `}
            >
              <span className={`text-2xl ${justVoted && isSelected ? "animate-bounce-in" : ""}`}>
                {mood.emoji}
              </span>
              <span className="text-[11px] font-semibold text-text-secondary">{mood.label}</span>
              {userVote && (
                <span className={`text-[11px] font-bold ${isSelected ? mood.color : "text-text-muted"}`}>
                  {pct}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Result banner */}
      {userVote && (
        <div className="animate-slide-up rounded-xl bg-gray-100 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{moods.find(m => m.label === topMood[0])?.emoji}</span>
            <div>
              <p className="text-xs font-bold">Top vibe: {topMood[0]}</p>
              <p className="text-[11px] text-text-muted">{Math.round((topMood[1] / totalVotes) * 100)}% of fans</p>
            </div>
          </div>
          <span className="tag tag-red">March 23</span>
        </div>
      )}
    </div>
  );
}
