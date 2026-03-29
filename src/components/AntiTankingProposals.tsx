"use client";

import { useState, useMemo } from "react";
import { useStandings, type LiveTeam } from "@/lib/useStandings";
import { lotteryOdds } from "@/data/standings";

// ─── Current system odds ───
function getCurrentOdds(rank: number): number[] {
  return lotteryOdds[rank] || [0, 0, 0, 0];
}

// ─── Proposal 1: 18-Team Lottery ───
// Bottom 10 (non-play-in) get 8% each = 80%. Remaining 20% split among play-in teams 11-18.
function get18TeamOdds(rank: number): { no1: number; top4: number; inLottery: boolean } {
  if (rank <= 10) return { no1: 8.0, top4: 32.0, inLottery: true };
  if (rank <= 14) {
    // Play-in teams get descending share of remaining 20%
    const playInOdds = [4.0, 3.5, 2.5, 2.0]; // slots 11-14 (we only track 14)
    const idx = rank - 11;
    return { no1: playInOdds[idx] || 1.5, top4: playInOdds[idx] * 3 || 4.5, inLottery: true };
  }
  return { no1: 0, top4: 0, inLottery: false };
}

// ─── Proposal 2: 22-Team Lottery (2-season combined record, 20-win floor) ───
function get22TeamOdds(rank: number): { no1: number; top4: number; inLottery: boolean; note: string } {
  // With 2-season averaging + win floor, the worst teams' odds are diluted
  // Bottom 10 share ~60%, play-in ~25%, first-round losers ~15%
  if (rank <= 3) return { no1: 7.5, top4: 28.0, inLottery: true, note: "Odds diluted by 2-season average" };
  if (rank <= 6) return { no1: 6.0, top4: 22.0, inLottery: true, note: "Win floor may raise effective record" };
  if (rank <= 10) return { no1: 4.5, top4: 16.0, inLottery: true, note: "" };
  if (rank <= 14) return { no1: 2.5, top4: 8.0, inLottery: true, note: "Play-in teams enter lottery" };
  return { no1: 0, top4: 0, inLottery: false, note: "" };
}

// ─── Proposal 3: Double Lottery ───
// 5 worst records get equal odds. First draw = top 5 picks. Second draw = 6-18.
// Worst 5 can't fall below 10th.
function getDoubleLotteryOdds(rank: number): { no1: number; top4: number; floor: number; inLottery: boolean } {
  if (rank <= 5) return { no1: 20.0, top4: 80.0, floor: 10, inLottery: true };
  if (rank <= 10) return { no1: 0, top4: 0, floor: rank + 5, inLottery: true };
  if (rank <= 18) return { no1: 0, top4: 0, floor: rank, inLottery: true };
  return { no1: 0, top4: 0, floor: 0, inLottery: false };
}

type ProposalId = "current" | "18team" | "22team" | "double";

const PROPOSALS: { id: ProposalId; name: string; shortName: string; tagColor: string }[] = [
  { id: "current", name: "Current System", shortName: "Current", tagColor: "tag-blue" },
  { id: "18team", name: "18-Team Lottery", shortName: "18-Team", tagColor: "tag-green" },
  { id: "22team", name: "22-Team Lottery", shortName: "22-Team", tagColor: "tag-purple" },
  { id: "double", name: "Double Lottery", shortName: "Double", tagColor: "tag-gold" },
];

interface ProposalDetail {
  title: string;
  tagColor: string;
  howItWorks: string[];
  pros: string[];
  cons: string[];
  verdict: string;
  verdictType: "positive" | "neutral" | "negative";
}

const PROPOSAL_DETAILS: Record<Exclude<ProposalId, "current">, ProposalDetail> = {
  "18team": {
    title: "18-Team Lottery",
    tagColor: "tag-green",
    howItWorks: [
      "The 10 teams that miss the play-in tournament PLUS all 8 play-in qualifiers enter the lottery — 18 teams total.",
      "The bottom 10 each get 8% odds at the #1 pick (80% total). The remaining 20% is split among play-in teams in descending order.",
      "All 18 picks are drawn in the lottery. Only the top 6 playoff seeds are excluded.",
    ],
    pros: [
      "Closest to the current system — easy for fans to understand",
      "Flattens odds significantly: no team has more than 8% at #1",
      "Removes the incentive to tank from worst to 2nd-worst (equal odds)",
      "Play-in teams get a shot, rewarding competitive games",
    ],
    cons: [
      "8% odds for the worst team is a big drop from today's 14%",
      "Nets' chances at a top 4 pick drop substantially",
      "Could make rebuilding even harder for the truly bad teams",
      "Play-in teams getting lottery picks could feel unfair to bottom-feeders",
    ],
    verdict: "The league's recommended option. Simplest change, biggest impact on tanking incentives.",
    verdictType: "positive",
  },
  "22team": {
    title: "22-Team Lottery",
    tagColor: "tag-purple",
    howItWorks: [
      "Expands to 22 teams: the 10 non-play-in teams, 8 play-in teams, AND the 4 first-round playoff losers.",
      "Rankings use combined records across TWO seasons instead of one, with a 20-win floor per season (teams below 20 wins are counted as 20-62).",
      "Top 4 picks are still lottery-drawn. The win floor prevents teams from going full tank mode.",
    ],
    pros: [
      "Two-season averaging means one bad year doesn't guarantee a top pick",
      "The 20-win floor punishes extreme tanking — going 8-74 gives no extra benefit over 20-62",
      "Broadest pool of teams, most \"random\" outcome",
    ],
    cons: [
      "Far too complex — casual fans won't understand 2-season combined records with win floors",
      "Opens the door for elite teams to game the system (OKC loses in round 1 due to rest/injuries, gets a lottery pick)",
      "Could extend championship windows for good teams while locking bad teams out",
      "Actively hurts the worst teams in the league — the ones who need help the most",
    ],
    verdict: "Overly complex and could backfire. Helps good teams more than bad ones.",
    verdictType: "negative",
  },
  "double": {
    title: "Double Lottery",
    tagColor: "tag-gold",
    howItWorks: [
      "Same 18-team pool as Proposal 1. The 5 worst-record teams all get EQUAL odds.",
      "First lottery drawing determines picks 1-5 (from the bottom 5 teams only).",
      "Second drawing determines picks 6-18 (from the remaining 13 teams).",
      "Safety net: teams in the bottom 5 cannot fall below the 10th pick if they miss the first drawing.",
    ],
    pros: [
      "Equal odds for worst 5 teams completely kills the incentive to tank from #3 to #1",
      "The 10th-pick floor protects truly bad teams from total disaster",
      "Two separate drawings add drama and excitement to lottery night",
    ],
    cons: [
      "Counterintuitive: the worst team in the NBA could pick 10th overall",
      "Contradicts the league's own parity mission — bad teams stay bad longer",
      "The \"floor\" of 10th pick is cold comfort when you had the worst record",
      "Complex format may confuse fans watching the lottery",
    ],
    verdict: "Interesting concept but the 10th-pick floor undermines the whole point of helping bad teams.",
    verdictType: "neutral",
  },
};

export default function AntiTankingProposals() {
  const { lottery, isLive, isLoading } = useStandings();
  const [activeProposal, setActiveProposal] = useState<ProposalId>("current");
  const [compareMode, setCompareMode] = useState(false);

  // Build comparison data for all teams — must be before any early returns (hooks rules)
  const teamComparisons = useMemo(() => {
    return lottery.map((team, idx) => {
      const rank = idx + 1;
      const currentOdds = getCurrentOdds(rank);
      const currentNo1 = currentOdds[0];
      const currentTop4 = currentOdds[0] + currentOdds[1] + currentOdds[2] + currentOdds[3];

      const p1 = get18TeamOdds(rank);
      const p2 = get22TeamOdds(rank);
      const p3 = getDoubleLotteryOdds(rank);

      return {
        ...team,
        rank,
        current: { no1: currentNo1, top4: currentTop4 },
        "18team": { no1: p1.no1, top4: p1.top4, inLottery: p1.inLottery },
        "22team": { no1: p2.no1, top4: p2.top4, inLottery: p2.inLottery, note: p2.note },
        "double": { no1: p3.no1, top4: p3.top4, floor: p3.floor, inLottery: p3.inLottery },
      };
    });
  }, [lottery]);

  const netsData = teamComparisons.find((t) => t.abbrev === "BKN");
  const netsRank = netsData?.rank || 3;

  function getActiveNo1(team: (typeof teamComparisons)[0]): number {
    if (activeProposal === "current") return team.current.no1;
    return team[activeProposal].no1;
  }

  function getActiveTop4(team: (typeof teamComparisons)[0]): number {
    if (activeProposal === "current") return team.current.top4;
    return team[activeProposal].top4;
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <section className="text-center">
          <div className="h-6 w-32 rounded bg-white/[0.04] animate-pulse-soft mx-auto mb-4" />
          <div className="h-16 w-64 rounded bg-white/[0.04] animate-pulse-soft mx-auto mb-3" />
          <div className="h-4 w-80 rounded bg-white/[0.04] animate-pulse-soft mx-auto" />
        </section>
        <div className="section-divider" />
        <div className="space-y-2">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-pulse-soft" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="tag tag-red">Proposed Changes</span>
          {isLive && <span className="tag tag-green">Live Standings</span>}
        </div>
        <h1 className="heading-xl gradient-text-brand mb-3">Anti-Tanking<br />Proposals</h1>
        <p className="text-text-secondary text-sm max-w-lg mx-auto font-body">
          The NBA is voting on new lottery formats in May 2026 to discourage tanking.
          Here&apos;s how each proposal would change the Nets&apos; odds — and whether they actually fix the problem.
        </p>
      </section>

      <div className="section-divider" />

      {/* Proposal Selector */}
      <section>
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {PROPOSALS.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProposal(p.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeProposal === p.id
                  ? "bg-brand-orange/20 text-brand-orange border border-brand-orange/30"
                  : "bg-white/[0.04] text-text-muted border border-white/[0.06] hover:bg-white/[0.06] hover:text-text-secondary"
              }`}
            >
              {p.shortName}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              compareMode
                ? "bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/25"
                : "bg-white/[0.04] text-text-muted border border-white/[0.06] hover:text-text-secondary"
            }`}
          >
            Compare All
          </button>
        </div>

        {/* Nets Impact Card */}
        {netsData && (
          <div className="card-featured p-5 sm:p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-display text-lg text-brand-orange">BKN Impact</span>
              <span className="text-text-muted text-xs">({netsData.wins}-{netsData.losses}, #{netsRank} worst record)</span>
            </div>

            {compareMode ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PROPOSALS.map((p) => {
                  const no1 = p.id === "current" ? netsData.current.no1 : netsData[p.id].no1;
                  const top4 = p.id === "current" ? netsData.current.top4 : netsData[p.id].top4;
                  const diff = no1 - netsData.current.no1;
                  return (
                    <div key={p.id} className="rounded-xl bg-white/[0.03] p-3 text-center">
                      <span className={`tag ${p.tagColor} text-[9px] mb-2`}>{p.shortName}</span>
                      <div className="mt-2">
                        <span className="font-display text-2xl text-text-primary block">{no1.toFixed(1)}%</span>
                        <span className="text-text-muted text-[10px] uppercase">No.1 Pick</span>
                      </div>
                      <div className="mt-1">
                        <span className="font-display text-lg text-text-data block">{top4.toFixed(1)}%</span>
                        <span className="text-text-muted text-[10px] uppercase">Top 4</span>
                      </div>
                      {p.id !== "current" && (
                        <div className={`mt-1.5 text-xs font-bold ${diff > 0 ? "text-accent-green" : diff < 0 ? "text-accent-red" : "text-text-muted"}`}>
                          {diff > 0 ? "+" : ""}{diff.toFixed(1)}% vs current
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-xl bg-white/[0.03] p-4">
                  <span className="text-text-muted text-[10px] uppercase block mb-1">No. 1 Pick</span>
                  <span className="font-display text-3xl text-brand-orange">
                    {getActiveNo1(netsData).toFixed(1)}%
                  </span>
                  {activeProposal !== "current" && (
                    <span className={`block text-xs font-bold mt-1 ${
                      getActiveNo1(netsData) > netsData.current.no1 ? "text-accent-green" :
                      getActiveNo1(netsData) < netsData.current.no1 ? "text-accent-red" : "text-text-muted"
                    }`}>
                      {getActiveNo1(netsData) > netsData.current.no1 ? "+" : ""}
                      {(getActiveNo1(netsData) - netsData.current.no1).toFixed(1)}% vs current
                    </span>
                  )}
                </div>
                <div className="rounded-xl bg-white/[0.03] p-4">
                  <span className="text-text-muted text-[10px] uppercase block mb-1">Top 4</span>
                  <span className="font-display text-3xl text-accent-gold">
                    {getActiveTop4(netsData).toFixed(1)}%
                  </span>
                  {activeProposal !== "current" && (
                    <span className={`block text-xs font-bold mt-1 ${
                      getActiveTop4(netsData) > netsData.current.top4 ? "text-accent-green" :
                      getActiveTop4(netsData) < netsData.current.top4 ? "text-accent-red" : "text-text-muted"
                    }`}>
                      {getActiveTop4(netsData) > netsData.current.top4 ? "+" : ""}
                      {(getActiveTop4(netsData) - netsData.current.top4).toFixed(1)}% vs current
                    </span>
                  )}
                </div>
                <div className="rounded-xl bg-white/[0.03] p-4">
                  <span className="text-text-muted text-[10px] uppercase block mb-1">Position</span>
                  <span className="font-display text-3xl text-accent-green">#{netsRank}</span>
                  {activeProposal === "double" && netsRank <= 5 && (
                    <span className="block text-xs text-text-muted mt-1">Floor: #10</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Standings Table */}
        <div className="card overflow-hidden">
          <div className={`grid ${compareMode ? "grid-cols-[40px_1fr_70px_70px_70px_70px_70px_70px_70px_70px]" : "grid-cols-[40px_1fr_80px_80px_80px_80px]"} gap-0 px-3 py-2.5 border-b border-white/[0.04] bg-white/[0.02] overflow-x-auto`}>
            <span className="text-text-muted text-[9px] uppercase font-bold">#</span>
            <span className="text-text-muted text-[9px] uppercase font-bold">Team</span>
            {compareMode ? (
              <>
                <span className="text-text-muted text-[9px] uppercase font-bold text-center">Curr #1</span>
                <span className="text-text-muted text-[9px] uppercase font-bold text-center">Curr T4</span>
                <span className="text-accent-green text-[9px] uppercase font-bold text-center">18T #1</span>
                <span className="text-accent-green text-[9px] uppercase font-bold text-center">18T T4</span>
                <span className="text-accent-purple text-[9px] uppercase font-bold text-center">22T #1</span>
                <span className="text-accent-purple text-[9px] uppercase font-bold text-center">22T T4</span>
                <span className="text-accent-gold text-[9px] uppercase font-bold text-center">Dbl #1</span>
                <span className="text-accent-gold text-[9px] uppercase font-bold text-center">Dbl T4</span>
              </>
            ) : (
              <>
                <span className="text-text-muted text-[9px] uppercase font-bold text-center">Record</span>
                <span className="text-text-muted text-[9px] uppercase font-bold text-center">Games Left</span>
                <span className="text-text-muted text-[9px] uppercase font-bold text-center">No.1 %</span>
                <span className="text-text-muted text-[9px] uppercase font-bold text-center">Top 4 %</span>
              </>
            )}
          </div>

          {teamComparisons.map((team, idx) => {
            const isNets = team.abbrev === "BKN";
            return (
              <div
                key={team.abbrev}
                className={`grid ${compareMode ? "grid-cols-[40px_1fr_70px_70px_70px_70px_70px_70px_70px_70px]" : "grid-cols-[40px_1fr_80px_80px_80px_80px]"} gap-0 px-3 py-2.5 border-b border-white/[0.02] transition-all ${
                  isNets ? "bg-brand-orange/[0.06] border-l-2 border-l-brand-orange" : idx % 2 === 0 ? "" : "bg-white/[0.01]"
                }`}
              >
                <span className={`text-sm font-bold tabular-nums ${isNets ? "text-brand-orange" : "text-text-muted"}`}>
                  {team.rank}
                </span>
                <span className={`text-sm font-semibold ${isNets ? "text-brand-orange" : "text-text-primary"}`}>
                  {team.abbrev}
                </span>
                {compareMode ? (
                  <>
                    <span className="text-sm text-center tabular-nums text-text-data">{team.current.no1.toFixed(1)}</span>
                    <span className="text-sm text-center tabular-nums text-text-data">{team.current.top4.toFixed(1)}</span>
                    <span className={`text-sm text-center tabular-nums ${team["18team"].no1 > team.current.no1 ? "text-accent-green font-bold" : team["18team"].no1 < team.current.no1 ? "text-accent-red" : "text-text-data"}`}>
                      {team["18team"].no1.toFixed(1)}
                    </span>
                    <span className={`text-sm text-center tabular-nums ${team["18team"].top4 > team.current.top4 ? "text-accent-green font-bold" : team["18team"].top4 < team.current.top4 ? "text-accent-red" : "text-text-data"}`}>
                      {team["18team"].top4.toFixed(1)}
                    </span>
                    <span className={`text-sm text-center tabular-nums ${team["22team"].no1 > team.current.no1 ? "text-accent-green font-bold" : team["22team"].no1 < team.current.no1 ? "text-accent-red" : "text-text-data"}`}>
                      {team["22team"].no1.toFixed(1)}
                    </span>
                    <span className={`text-sm text-center tabular-nums ${team["22team"].top4 > team.current.top4 ? "text-accent-green font-bold" : team["22team"].top4 < team.current.top4 ? "text-accent-red" : "text-text-data"}`}>
                      {team["22team"].top4.toFixed(1)}
                    </span>
                    <span className={`text-sm text-center tabular-nums ${team["double"].no1 > team.current.no1 ? "text-accent-green font-bold" : team["double"].no1 < team.current.no1 ? "text-accent-red" : "text-text-data"}`}>
                      {team["double"].no1.toFixed(1)}
                    </span>
                    <span className={`text-sm text-center tabular-nums ${team["double"].top4 > team.current.top4 ? "text-accent-green font-bold" : team["double"].top4 < team.current.top4 ? "text-accent-red" : "text-text-data"}`}>
                      {team["double"].top4.toFixed(1)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-center tabular-nums text-text-data">{team.wins}-{team.losses}</span>
                    <span className="text-sm text-center tabular-nums text-text-muted">{team.gamesRemaining}</span>
                    <span className={`text-sm text-center tabular-nums font-bold ${isNets ? "text-brand-orange" : "text-text-data"}`}>
                      {getActiveNo1(team).toFixed(1)}%
                    </span>
                    <span className={`text-sm text-center tabular-nums font-bold ${isNets ? "text-brand-orange-glow" : "text-text-data"}`}>
                      {getActiveTop4(team).toFixed(1)}%
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="section-divider" />

      {/* Proposal Deep Dives */}
      <section>
        <h2 className="heading-lg text-text-secondary mb-5">The Three Proposals</h2>
        <div className="space-y-5">
          {(Object.entries(PROPOSAL_DETAILS) as [Exclude<ProposalId, "current">, ProposalDetail][]).map(([id, detail]) => (
            <div
              key={id}
              className={`card p-5 sm:p-6 transition-all ${activeProposal === id ? "border-brand-orange/20" : ""}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className={`tag ${detail.tagColor}`}>{detail.title}</span>
                {detail.verdictType === "positive" && <span className="tag tag-green">Recommended</span>}
                <button
                  onClick={() => setActiveProposal(id)}
                  className="ml-auto text-[10px] uppercase font-bold text-text-muted hover:text-brand-orange transition-colors tracking-wider"
                >
                  Apply to Table
                </button>
              </div>

              {/* How It Works */}
              <div className="mb-4">
                <h4 className="heading-md text-text-primary mb-2">How It Works</h4>
                <ul className="space-y-1.5">
                  {detail.howItWorks.map((item, i) => (
                    <li key={i} className="text-text-secondary text-sm font-body flex gap-2">
                      <span className="text-text-muted shrink-0">{i + 1}.</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pros and Cons */}
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="rounded-xl bg-accent-green/[0.04] border border-accent-green/10 p-3.5">
                  <h5 className="text-accent-green text-xs font-bold uppercase tracking-wider mb-2">Pros</h5>
                  <ul className="space-y-1.5">
                    {detail.pros.map((pro, i) => (
                      <li key={i} className="text-text-secondary text-xs font-body flex gap-2">
                        <span className="text-accent-green shrink-0 mt-0.5">+</span>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-accent-red/[0.04] border border-accent-red/10 p-3.5">
                  <h5 className="text-accent-red text-xs font-bold uppercase tracking-wider mb-2">Cons</h5>
                  <ul className="space-y-1.5">
                    {detail.cons.map((con, i) => (
                      <li key={i} className="text-text-secondary text-xs font-body flex gap-2">
                        <span className="text-accent-red shrink-0 mt-0.5">-</span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Verdict */}
              <div className={`rounded-xl p-3 text-center ${
                detail.verdictType === "positive" ? "bg-accent-green/[0.06] border border-accent-green/15" :
                detail.verdictType === "negative" ? "bg-accent-red/[0.06] border border-accent-red/15" :
                "bg-accent-gold/[0.06] border border-accent-gold/15"
              }`}>
                <span className={`text-sm font-semibold ${
                  detail.verdictType === "positive" ? "text-accent-green" :
                  detail.verdictType === "negative" ? "text-accent-red" :
                  "text-accent-gold"
                }`}>
                  {detail.verdict}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Nets Fan Perspective */}
      <section className="card-featured p-5 sm:p-6 text-center">
        <h2 className="heading-md gradient-text-brand mb-3">What This Means for Brooklyn</h2>
        <div className="max-w-xl mx-auto space-y-3">
          <p className="text-text-secondary text-sm font-body leading-relaxed">
            Under the <strong className="text-accent-green">18-Team Lottery</strong> (the NBA&apos;s preferred option),
            the Nets&apos; #1 pick odds would drop from <strong className="text-brand-orange">14.0%</strong> to
            <strong className="text-accent-red"> 8.0%</strong> — but every other bottom-10 team takes the same hit.
            The real losers are teams that tanked hardest: going from worst to 3rd-worst no longer matters.
          </p>
          <p className="text-text-secondary text-sm font-body leading-relaxed">
            The good news? These proposals are for <strong className="text-text-primary">future seasons</strong>.
            The NBA vote is in May 2026 and any changes would likely take effect in 2026-27 at the earliest.
            This year&apos;s draft still uses the current system — so the Nets&apos; 14% shot at #1 is safe for now.
          </p>
          <p className="text-text-muted text-xs font-body mt-2">
            Source: Yahoo Sports / Chris Haynes, March 2026
          </p>
        </div>
      </section>
    </div>
  );
}
