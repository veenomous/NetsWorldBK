"use client";

import { useState, useEffect } from "react";
import ShareButton from "@/components/ShareButton";

interface Take {
  id: string;
  text: string;
  author: string;
  agrees: number;
  disagrees: number;
  timeAgo: string;
  tag: string;
}

const seedTakes: Take[] = [
  { id: "1", text: "Cameron Boozer is the perfect pick for this team. We don't need another guard.", author: "BrooklynMike", agrees: 342, disagrees: 87, timeAgo: "2h", tag: "Draft" },
  { id: "2", text: "We should trade this pick for an established star. Enough rebuilding.", author: "NetsLifer", agrees: 156, disagrees: 298, timeAgo: "4h", tag: "Hot Take" },
  { id: "3", text: "MPJ trade was a steal. 24 PPG and a future first? Denver got fleeced.", author: "BKScouting", agrees: 421, disagrees: 134, timeAgo: "5h", tag: "Roster" },
  { id: "4", text: "AJ Dybantsa at 3 would be the steal of the draft. 25 PPG as a freshman.", author: "DraftNerd42", agrees: 267, disagrees: 52, timeAgo: "6h", tag: "Draft" },
  { id: "5", text: "This front office has no plan. We're just tanking with no vision.", author: "BarclaysSad", agrees: 198, disagrees: 245, timeAgo: "8h", tag: "Spicy" },
  { id: "6", text: "The Pacers being worse than us is actually bad. We need the #1 slot.", author: "TankCommander", agrees: 312, disagrees: 88, timeAgo: "10h", tag: "Strategy" },
];

const tagColors: Record<string, string> = {
  "Draft": "tag-blue",
  "Hot Take": "tag-red",
  "Roster": "tag-green",
  "Spicy": "tag-red",
  "Strategy": "tag-purple",
};

export default function HotTakes() {
  const [takes, setTakes] = useState(seedTakes);
  const [userReactions, setUserReactions] = useState<Record<string, "agree" | "disagree">>({});

  useEffect(() => {
    const saved = localStorage.getItem("nw-take-reactions");
    if (saved) setUserReactions(JSON.parse(saved));
  }, []);

  const handleReaction = (id: string, type: "agree" | "disagree") => {
    if (userReactions[id]) return;
    const newReactions = { ...userReactions, [id]: type };
    setUserReactions(newReactions);
    localStorage.setItem("nw-take-reactions", JSON.stringify(newReactions));

    setTakes((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              agrees: t.agrees + (type === "agree" ? 1 : 0),
              disagrees: t.disagrees + (type === "disagree" ? 1 : 0),
            }
          : t
      )
    );
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[15px]">Hot Takes</h3>
          <p className="text-text-muted text-xs mt-0.5">What Nets fans are saying</p>
        </div>
        <span className="tag tag-gold">Today</span>
      </div>

      <div className="space-y-3">
        {takes.map((take) => {
          const total = take.agrees + take.disagrees;
          const agreePercent = Math.round((take.agrees / total) * 100);
          const userReaction = userReactions[take.id];

          return (
            <div key={take.id} className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`tag ${tagColors[take.tag] || "tag-blue"}`}>{take.tag}</span>
                <span className="text-text-muted text-[11px]">@{take.author}</span>
                <span className="text-text-muted text-[11px] ml-auto">{take.timeAgo} ago</span>
              </div>

              {/* Take text */}
              <p className="text-[13px] font-medium leading-snug mb-3">{take.text}</p>

              {/* Reaction bar */}
              {userReaction && (
                <div className="mb-2.5">
                  <div className="h-1.5 rounded-full overflow-hidden flex bg-white/[0.04]">
                    <div
                      className="h-full bg-accent-green rounded-l-full odds-bar"
                      style={{ width: `${agreePercent}%` }}
                    />
                    <div
                      className="h-full bg-accent-red rounded-r-full odds-bar"
                      style={{ width: `${100 - agreePercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReaction(take.id, "agree")}
                  disabled={!!userReaction}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                    userReaction === "agree"
                      ? "bg-accent-green/15 text-accent-green"
                      : "bg-white/[0.04] text-text-secondary hover:bg-accent-green/10 hover:text-accent-green"
                  } ${userReaction ? "cursor-default" : "cursor-pointer"}`}
                >
                  <span>&#128077;</span>
                  <span>{take.agrees}</span>
                </button>
                <button
                  onClick={() => handleReaction(take.id, "disagree")}
                  disabled={!!userReaction}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                    userReaction === "disagree"
                      ? "bg-accent-red/15 text-accent-red"
                      : "bg-white/[0.04] text-text-secondary hover:bg-accent-red/10 hover:text-accent-red"
                  } ${userReaction ? "cursor-default" : "cursor-pointer"}`}
                >
                  <span>&#128078;</span>
                  <span>{take.disagrees}</span>
                </button>
                {userReaction && (
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
    </div>
  );
}
