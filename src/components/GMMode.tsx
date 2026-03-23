"use client";

import { useState } from "react";
import { topProspects, type DraftProspect } from "@/data/standings";

interface GMDecisions {
  draftPick: DraftProspect | null;
  tradeOrKeep: "trade" | "keep" | null;
  tradeTarget: string | null;
  buildStrategy: string | null;
}

interface ScoreResult {
  total: number;
  breakdown: { label: string; score: number; max: number; reason: string }[];
  percentile: number;
  grade: string;
}

const tradeTargets = [
  { name: "Package for top 3 pick", value: 30 },
  { name: "Trade for All-Star wing", value: 20 },
  { name: "Trade for future picks", value: 25 },
  { name: "Trade for young player + pick", value: 22 },
];

const buildStrategies = [
  { name: "Full rebuild — tank + develop", value: 35 },
  { name: "Accelerate — add vets + draft", value: 25 },
  { name: "Swing for the fences — trade for star", value: 15 },
  { name: "Balanced — keep flexibility", value: 30 },
];

export default function GMMode() {
  const [step, setStep] = useState(0);
  const [decisions, setDecisions] = useState<GMDecisions>({
    draftPick: null,
    tradeOrKeep: null,
    tradeTarget: null,
    buildStrategy: null,
  });
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const calculateScore = (): ScoreResult => {
    const breakdown: ScoreResult["breakdown"] = [];

    // Draft pick scoring
    const pick = decisions.draftPick!;
    const draftScore = Math.min(pick.netsFit, 95);
    breakdown.push({
      label: "Draft Selection",
      score: draftScore,
      max: 100,
      reason: `${pick.name} — Nets fit: ${pick.netsFit}/100. ${pick.ceiling}.`,
    });

    // Trade decision scoring
    let tradeScore = 0;
    if (decisions.tradeOrKeep === "keep") {
      tradeScore = pick.rank <= 3 ? 85 : pick.rank <= 6 ? 70 : 50;
      breakdown.push({
        label: "Trade Decision",
        score: tradeScore,
        max: 100,
        reason: `Keeping pick #${pick.rank} — ${pick.rank <= 3 ? "smart move with a top talent" : "solid, develop the young core"}.`,
      });
    } else {
      const target = tradeTargets.find((t) => t.name === decisions.tradeTarget);
      tradeScore = target ? target.value + Math.floor(Math.random() * 30) + 20 : 50;
      breakdown.push({
        label: "Trade Decision",
        score: Math.min(tradeScore, 90),
        max: 100,
        reason: `Trading for: ${decisions.tradeTarget}. ${tradeScore > 60 ? "Bold but could pay off." : "Risky move, hope it works."}`,
      });
    }

    // Strategy scoring
    const strat = buildStrategies.find((s) => s.name === decisions.buildStrategy);
    const stratScore = strat ? strat.value + Math.floor(Math.random() * 25) + 25 : 50;
    breakdown.push({
      label: "Rebuild Strategy",
      score: Math.min(stratScore, 95),
      max: 100,
      reason: `${decisions.buildStrategy}. ${stratScore > 65 ? "Smart long-term thinking." : "Questionable approach."}`,
    });

    const total = Math.round(breakdown.reduce((a, b) => a + b.score, 0) / breakdown.length);
    const percentile = Math.min(Math.round(total * 0.85 + Math.random() * 15), 99);

    const grade =
      total >= 90 ? "A+" :
      total >= 85 ? "A" :
      total >= 80 ? "A-" :
      total >= 75 ? "B+" :
      total >= 70 ? "B" :
      total >= 65 ? "B-" :
      total >= 60 ? "C+" :
      total >= 50 ? "C" : "D";

    return { total, breakdown, percentile, grade };
  };

  const handleSubmit = () => {
    const result = calculateScore();
    setScore(result);
    setShowResults(true);
  };

  const reset = () => {
    setStep(0);
    setDecisions({ draftPick: null, tradeOrKeep: null, tradeTarget: null, buildStrategy: null });
    setScore(null);
    setShowResults(false);
  };

  if (showResults && score) {
    return <GMResults score={score} decisions={decisions} onReset={reset} />;
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {["Draft", "Trade", "Strategy"].map((label, idx) => (
          <div key={label} className="flex-1">
            <div className={`h-1.5 rounded-full transition-colors ${
              idx < step ? "bg-nets-green" : idx === step ? "bg-nets-accent" : "bg-nets-gray-light"
            }`} />
            <p className={`text-xs mt-1 ${idx === step ? "text-white font-bold" : "text-nets-silver"}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Step 1: Draft Pick */}
      {step === 0 && (
        <div className="animate-slide-up">
          <h3 className="text-xl font-black mb-1">Who are you drafting?</h3>
          <p className="text-nets-silver text-sm mb-4">The Nets are on the clock. Make your pick.</p>
          <div className="grid gap-2">
            {topProspects.slice(0, 8).map((prospect) => (
              <button
                key={prospect.name}
                onClick={() => {
                  setDecisions({ ...decisions, draftPick: prospect });
                  setStep(1);
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all hover:scale-[1.01] ${
                  decisions.draftPick?.name === prospect.name
                    ? "border-nets-accent bg-nets-accent/10"
                    : "border-white/5 bg-nets-gray/40 hover:border-white/20 hover:bg-nets-gray-light/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-nets-accent font-black text-lg w-8">#{prospect.rank}</span>
                    <div>
                      <p className="font-bold">{prospect.name}</p>
                      <p className="text-nets-silver text-xs">
                        {prospect.position} · {prospect.school} · {prospect.height}
                      </p>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-nets-silver">{prospect.stats}</p>
                    <p className="text-xs text-nets-blue">Comp: {prospect.comparison}</p>
                  </div>
                </div>
                {/* Nets fit bar */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-nets-silver uppercase tracking-wider">Nets Fit</span>
                  <div className="flex-1 h-1.5 bg-nets-gray rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-nets-accent to-nets-gold odds-bar"
                      style={{ width: `${prospect.netsFit}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold">{prospect.netsFit}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Trade or Keep */}
      {step === 1 && (
        <div className="animate-slide-up">
          <h3 className="text-xl font-black mb-1">Trade or keep the pick?</h3>
          <p className="text-nets-silver text-sm mb-4">
            You selected <span className="text-white font-bold">{decisions.draftPick?.name}</span>. What&apos;s the move?
          </p>

          <div className="grid gap-3 mb-4">
            <button
              onClick={() => {
                setDecisions({ ...decisions, tradeOrKeep: "keep", tradeTarget: null });
                setStep(2);
              }}
              className="w-full text-left p-5 rounded-xl border border-white/5 bg-nets-gray/40 hover:border-nets-green/40 hover:bg-nets-green/5 transition-all"
            >
              <p className="font-bold text-lg">Keep the pick</p>
              <p className="text-nets-silver text-sm">Build around {decisions.draftPick?.name}. Trust the process.</p>
            </button>

            <div className="border border-white/5 rounded-xl bg-nets-gray/40 p-5">
              <p className="font-bold text-lg mb-3">Trade the pick</p>
              <div className="grid gap-2">
                {tradeTargets.map((target) => (
                  <button
                    key={target.name}
                    onClick={() => {
                      setDecisions({ ...decisions, tradeOrKeep: "trade", tradeTarget: target.name });
                      setStep(2);
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg border border-white/5 hover:border-nets-accent/40 hover:bg-nets-accent/5 transition-all text-sm"
                  >
                    {target.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={() => setStep(0)} className="text-sm text-nets-silver hover:text-white transition-colors">
            &larr; Go back
          </button>
        </div>
      )}

      {/* Step 3: Build Strategy */}
      {step === 2 && (
        <div className="animate-slide-up">
          <h3 className="text-xl font-black mb-1">What&apos;s your rebuild strategy?</h3>
          <p className="text-nets-silver text-sm mb-4">How do you build a contender in Brooklyn?</p>

          <div className="grid gap-2">
            {buildStrategies.map((strat) => (
              <button
                key={strat.name}
                onClick={() => {
                  setDecisions({ ...decisions, buildStrategy: strat.name });
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  decisions.buildStrategy === strat.name
                    ? "border-nets-accent bg-nets-accent/10"
                    : "border-white/5 bg-nets-gray/40 hover:border-white/20"
                }`}
              >
                <p className="font-medium">{strat.name}</p>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setStep(1)} className="text-sm text-nets-silver hover:text-white transition-colors">
              &larr; Go back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!decisions.buildStrategy}
              className="px-6 py-3 rounded-xl bg-nets-accent hover:bg-red-700 font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Get My GM Score
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GMResults({
  score,
  decisions,
  onReset,
}: {
  score: ScoreResult;
  decisions: GMDecisions;
  onReset: () => void;
}) {
  return (
    <div className="animate-slide-up space-y-6">
      {/* Score Hero */}
      <div className="text-center py-8">
        <p className="text-nets-silver text-sm uppercase tracking-widest mb-2">Your GM Score</p>
        <div className="inline-flex items-baseline gap-2">
          <span className={`text-8xl font-black ${
            score.total >= 80 ? "text-nets-green" :
            score.total >= 60 ? "text-nets-gold" :
            "text-nets-accent"
          }`}>
            {score.total}
          </span>
          <span className="text-3xl text-nets-silver">/100</span>
        </div>
        <div className="mt-2">
          <span className={`text-xl font-black px-4 py-1 rounded-full ${
            score.total >= 80 ? "bg-nets-green/15 text-nets-green" :
            score.total >= 60 ? "bg-nets-gold/15 text-nets-gold" :
            "bg-nets-accent/15 text-nets-accent"
          }`}>
            Grade: {score.grade}
          </span>
        </div>
        <p className="text-nets-silver mt-3">
          Better than <span className="text-white font-bold">{score.percentile}%</span> of Nets fans
        </p>
      </div>

      {/* Decisions Summary */}
      <div className="glass-card rounded-xl p-5">
        <h4 className="font-bold mb-3">Your Decisions</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-nets-silver">Draft Pick</span>
            <span className="font-bold">{decisions.draftPick?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-nets-silver">Trade Decision</span>
            <span className="font-bold capitalize">{decisions.tradeOrKeep === "keep" ? "Keep the pick" : decisions.tradeTarget}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-nets-silver">Strategy</span>
            <span className="font-bold">{decisions.buildStrategy}</span>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        {score.breakdown.map((item) => (
          <div key={item.label} className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm">{item.label}</span>
              <span className={`font-black ${
                item.score >= 80 ? "text-nets-green" :
                item.score >= 60 ? "text-nets-gold" :
                "text-nets-accent"
              }`}>
                {item.score}/{item.max}
              </span>
            </div>
            <div className="w-full h-2 bg-nets-gray rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full odds-bar ${
                  item.score >= 80 ? "bg-nets-green" :
                  item.score >= 60 ? "bg-nets-gold" :
                  "bg-nets-accent"
                }`}
                style={{ width: `${item.score}%` }}
              />
            </div>
            <p className="text-nets-silver text-xs">{item.reason}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="flex-1 py-3 rounded-xl bg-nets-accent hover:bg-red-700 font-bold transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
