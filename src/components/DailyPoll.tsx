"use client";

import { useState, useEffect } from "react";
import { dailyPolls } from "@/data/standings";

export default function DailyPoll() {
  const [currentPollIndex, setCurrentPollIndex] = useState(0);
  const [votes, setVotes] = useState<Record<string, Record<string, number>>>({});
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [totalVoters, setTotalVoters] = useState(1247);

  const poll = dailyPolls[currentPollIndex];

  // Load saved votes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("nw-user-votes");
    if (saved) setUserVotes(JSON.parse(saved));

    // Seed with fake vote data for engagement feel
    const seeded: Record<string, Record<string, number>> = {};
    dailyPolls.forEach((p) => {
      seeded[p.id] = {};
      p.options.forEach((opt, idx) => {
        // Weighted random so it looks organic
        const weights = [40, 30, 20, 10];
        seeded[p.id][opt] = Math.floor(Math.random() * 300) + (weights[idx] || 15) * 5;
      });
    });
    setVotes(seeded);
  }, []);

  const handleVote = (optionIndex: number) => {
    if (userVotes[poll.id] !== undefined) return;

    const newUserVotes = { ...userVotes, [poll.id]: optionIndex };
    setUserVotes(newUserVotes);
    localStorage.setItem("nw-user-votes", JSON.stringify(newUserVotes));

    setVotes((prev) => {
      const current = { ...prev };
      if (!current[poll.id]) current[poll.id] = {};
      const opt = poll.options[optionIndex];
      current[poll.id][opt] = (current[poll.id][opt] || 0) + 1;
      return current;
    });

    setTotalVoters((v) => v + 1);
  };

  const hasVoted = userVotes[poll.id] !== undefined;
  const pollVotes = votes[poll.id] || {};
  const totalForPoll = Object.values(pollVotes).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-nets-gold" />
            Daily Poll
          </h3>
          <p className="text-nets-silver text-xs">{totalVoters.toLocaleString()} Nets fans have voted</p>
        </div>
        <div className="flex gap-1">
          {dailyPolls.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPollIndex(idx)}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentPollIndex ? "bg-nets-accent" : "bg-nets-gray-light"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Category tag */}
      <div className="mb-3">
        <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-nets-accent/15 text-nets-accent font-bold">
          {poll.category}
        </span>
      </div>

      <p className="text-lg font-bold mb-4">{poll.question}</p>

      <div className="space-y-2">
        {poll.options.map((option, idx) => {
          const voteCount = pollVotes[option] || 0;
          const percentage = Math.round((voteCount / totalForPoll) * 100);
          const isSelected = userVotes[poll.id] === idx;

          return (
            <button
              key={idx}
              onClick={() => handleVote(idx)}
              disabled={hasVoted}
              className={`
                w-full text-left rounded-xl p-3 transition-all relative overflow-hidden
                ${hasVoted
                  ? isSelected
                    ? "border border-nets-accent/50 bg-nets-accent/10"
                    : "border border-white/5 bg-nets-gray/30"
                  : "border border-white/10 hover:border-nets-accent/40 hover:bg-nets-gray-light/30 cursor-pointer"
                }
              `}
            >
              {/* Background bar */}
              {hasVoted && (
                <div
                  className="absolute inset-y-0 left-0 bg-nets-accent/10 odds-bar rounded-xl"
                  style={{ width: `${percentage}%` }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <span className="text-sm font-medium">{option}</span>
                {hasVoted && (
                  <span className="text-sm font-bold text-nets-silver ml-2">
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => setCurrentPollIndex(Math.max(0, currentPollIndex - 1))}
          disabled={currentPollIndex === 0}
          className="text-xs text-nets-silver hover:text-white disabled:opacity-30 transition-colors"
        >
          &larr; Previous
        </button>
        <button
          onClick={() => setCurrentPollIndex(Math.min(dailyPolls.length - 1, currentPollIndex + 1))}
          disabled={currentPollIndex === dailyPolls.length - 1}
          className="text-xs text-nets-silver hover:text-white disabled:opacity-30 transition-colors"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
