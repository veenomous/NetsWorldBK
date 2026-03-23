// NBA Draft Lottery Simulation Engine
// Uses the actual NBA lottery system (2019-present)
// 14 ping-pong balls, 1,001 combinations (1 discarded)

import { lotteryTeams, lotteryOdds } from "@/data/standings";

// Combination counts per slot (matches real NBA system)
const combinationsBySlot: Record<number, number> = {
  1: 140, 2: 140, 3: 140, 4: 125,
  5: 105, 6: 90,  7: 75,  8: 60,
  9: 45,  10: 30, 11: 20, 12: 15,
  13: 10, 14: 5,
};

export interface LotteryResult {
  team: string;
  abbrev: string;
  originalSlot: number;
  lotteryPick: number;
  movedUp: boolean;
  movedDown: boolean;
}

export interface SimulationResult {
  results: LotteryResult[];
  netsResult: LotteryResult;
  timestamp: number;
}

export function runLotterySimulation(): SimulationResult {
  const teams = [...lotteryTeams];
  const totalCombos = 1000;

  // Assign combination ranges
  const ranges: { start: number; end: number; slotIndex: number }[] = [];
  let cursor = 0;
  teams.forEach((_, idx) => {
    const combos = combinationsBySlot[idx + 1];
    ranges.push({ start: cursor, end: cursor + combos - 1, slotIndex: idx });
    cursor += combos;
  });

  // Draw top 4 picks
  const drawn: number[] = [];
  const top4Winners: number[] = [];

  for (let pick = 0; pick < 4; pick++) {
    let combo: number;
    let winnerSlot: number;

    do {
      combo = Math.floor(Math.random() * totalCombos);
      winnerSlot = ranges.find(r => combo >= r.start && combo <= r.end)!.slotIndex;
    } while (drawn.includes(winnerSlot));

    drawn.push(winnerSlot);
    top4Winners.push(winnerSlot);
  }

  // Build final results
  const results: LotteryResult[] = [];
  const remaining = teams
    .map((_, idx) => idx)
    .filter(idx => !top4Winners.includes(idx));

  // Top 4 from lottery
  top4Winners.forEach((slotIdx, pickIdx) => {
    results.push({
      team: teams[slotIdx].team,
      abbrev: teams[slotIdx].abbrev,
      originalSlot: slotIdx + 1,
      lotteryPick: pickIdx + 1,
      movedUp: pickIdx + 1 < slotIdx + 1,
      movedDown: pickIdx + 1 > slotIdx + 1,
    });
  });

  // Picks 5-14 go in order of worst record (excluding lottery winners)
  remaining.forEach((slotIdx, idx) => {
    const pick = idx + 5;
    results.push({
      team: teams[slotIdx].team,
      abbrev: teams[slotIdx].abbrev,
      originalSlot: slotIdx + 1,
      lotteryPick: pick,
      movedUp: pick < slotIdx + 1,
      movedDown: pick > slotIdx + 1,
    });
  });

  // Sort by pick number
  results.sort((a, b) => a.lotteryPick - b.lotteryPick);

  const netsResult = results.find(r => r.abbrev === "BKN")!;

  return {
    results,
    netsResult,
    timestamp: Date.now(),
  };
}

// Run multiple simulations and get distribution
export function runBulkSimulation(count: number): Record<number, number> {
  const distribution: Record<number, number> = {};
  for (let i = 1; i <= 14; i++) distribution[i] = 0;

  for (let i = 0; i < count; i++) {
    const result = runLotterySimulation();
    distribution[result.netsResult.lotteryPick]++;
  }

  // Convert to percentages
  for (const key in distribution) {
    distribution[key] = Math.round((distribution[key] / count) * 1000) / 10;
  }

  return distribution;
}
