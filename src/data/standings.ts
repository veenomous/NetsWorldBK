// 2025-26 NBA Standings data (static fallback, updated March 29, 2026)
// Live data fetched from ESPN via /api/standings — this is the offline fallback
// Bottom teams relevant for lottery

export interface TeamStanding {
  team: string;
  abbrev: string;
  wins: number;
  losses: number;
  gamesRemaining: number;
  currentPick: number;
  conference: string;
}

// Current standings as of March 29, 2026 (bottom 14 teams for lottery)
// Source: ESPN standings API — sorted by win% (lowest first)
export const lotteryTeams: TeamStanding[] = [
  { team: "Indiana Pacers", abbrev: "IND", wins: 16, losses: 58, gamesRemaining: 8, currentPick: 1, conference: "East" },
  { team: "Brooklyn Nets", abbrev: "BKN", wins: 17, losses: 57, gamesRemaining: 8, currentPick: 2, conference: "East" },
  { team: "Washington Wizards", abbrev: "WAS", wins: 17, losses: 56, gamesRemaining: 9, currentPick: 3, conference: "East" },
  { team: "Sacramento Kings", abbrev: "SAC", wins: 19, losses: 56, gamesRemaining: 7, currentPick: 4, conference: "West" },
  { team: "Utah Jazz", abbrev: "UTA", wins: 21, losses: 53, gamesRemaining: 8, currentPick: 5, conference: "West" },
  { team: "Dallas Mavericks", abbrev: "DAL", wins: 23, losses: 48, gamesRemaining: 11, currentPick: 6, conference: "West" },
  { team: "Memphis Grizzlies", abbrev: "MEM", wins: 24, losses: 49, gamesRemaining: 9, currentPick: 7, conference: "West" },
  { team: "New Orleans Pelicans", abbrev: "NOP", wins: 25, losses: 49, gamesRemaining: 8, currentPick: 8, conference: "West" },
  { team: "Chicago Bulls", abbrev: "CHI", wins: 28, losses: 45, gamesRemaining: 9, currentPick: 9, conference: "East" },
  { team: "Milwaukee Bucks", abbrev: "MIL", wins: 29, losses: 44, gamesRemaining: 9, currentPick: 10, conference: "East" },
  { team: "Golden State Warriors", abbrev: "GSW", wins: 33, losses: 40, gamesRemaining: 9, currentPick: 11, conference: "West" },
  { team: "Portland Trail Blazers", abbrev: "POR", wins: 35, losses: 39, gamesRemaining: 8, currentPick: 12, conference: "West" },
  { team: "Charlotte Hornets", abbrev: "CHA", wins: 37, losses: 37, gamesRemaining: 8, currentPick: 13, conference: "East" },
  { team: "Miami Heat", abbrev: "MIA", wins: 38, losses: 35, gamesRemaining: 9, currentPick: 14, conference: "East" },
];

// NBA Lottery odds by worst record (2019-present system)
// Top 4 picks determined by lottery, remaining by inverse record
export const lotteryOdds: Record<number, number[]> = {
  // [1st pick %, 2nd pick %, 3rd pick %, 4th pick %]
  1:  [14.0, 13.4, 12.7, 12.0],
  2:  [14.0, 13.4, 12.7, 12.0],
  3:  [14.0, 13.4, 12.7, 12.0],
  4:  [12.5, 12.2, 11.9, 11.5],
  5:  [10.5, 10.5, 10.6, 10.5],
  6:  [9.0,  9.2,  9.4,  9.6],
  7:  [7.5,  7.8,  8.1,  8.5],
  8:  [6.0,  6.3,  6.7,  7.2],
  9:  [4.5,  4.8,  5.2,  5.7],
  10: [3.0,  3.3,  3.6,  4.0],
  11: [2.0,  2.2,  2.4,  2.8],
  12: [1.5,  1.7,  1.9,  2.1],
  13: [1.0,  1.1,  1.2,  1.4],
  14: [0.5,  0.6,  0.6,  0.7],
};

// Get Nets data
export function getNetsData() {
  const nets = lotteryTeams.find(t => t.abbrev === "BKN")!;
  const odds = lotteryOdds[nets.currentPick];
  return {
    ...nets,
    top1Odds: odds[0],
    top2Odds: odds[0] + odds[1],
    top3Odds: odds[0] + odds[1] + odds[2],
    top4Odds: odds[0] + odds[1] + odds[2] + odds[3],
  };
}

// 2026 Draft prospect data
// Sources: ESPN, Tankathon, The Ringer big boards (March 2026)
export interface DraftProspect {
  name: string;
  position: string;
  school: string;
  age: number;
  height: string;
  rank: number;
  netsFit: number; // 1-100
  ceiling: string;
  comparison: string;
  stats: string;
}

// Nets need frontcourt/wings — already have guards (Demin, Traore, Powell, Saraf)
export const topProspects: DraftProspect[] = [
  { name: "Cameron Boozer", position: "PF/C", school: "Duke", age: 19, height: "6'9\"", rank: 1, netsFit: 97, ceiling: "Franchise Big", comparison: "Chris Bosh / Karl-Anthony Towns", stats: "22.4 PPG / 10.3 RPG / 4.2 APG" },
  { name: "Darryn Peterson", position: "PG/SG", school: "Kansas", age: 19, height: "6'6\"", rank: 2, netsFit: 75, ceiling: "Elite Offensive Engine", comparison: "Brandon Roy", stats: "20.2 PPG / 4.2 RPG / 1.6 APG" },
  { name: "AJ Dybantsa", position: "SF", school: "BYU", age: 18, height: "6'9\"", rank: 3, netsFit: 95, ceiling: "Franchise Wing", comparison: "Paul George / Brandon Ingram", stats: "25.5 PPG / 6.8 RPG / 3.7 APG" },
  { name: "Caleb Wilson", position: "SF/PF", school: "North Carolina", age: 19, height: "6'10\"", rank: 4, netsFit: 92, ceiling: "Two-Way Forward", comparison: "Scottie Barnes", stats: "19.8 PPG / 9.4 RPG / 2.7 APG" },
  { name: "Kingston Flemings", position: "PG", school: "Houston", age: 19, height: "6'4\"", rank: 5, netsFit: 70, ceiling: "Dynamic Lead Guard", comparison: "Ja Morant", stats: "16.2 PPG / 4.0 RPG / 5.2 APG" },
  { name: "Darius Acuff Jr.", position: "PG", school: "Arkansas", age: 19, height: "6'3\"", rank: 6, netsFit: 68, ceiling: "NBA-Ready Floor General", comparison: "Chris Paul", stats: "23.3 PPG / 3.1 RPG / 6.5 APG" },
  { name: "Keaton Wagler", position: "SG", school: "Illinois", age: 19, height: "6'6\"", rank: 7, netsFit: 78, ceiling: "Sharpshooter Wing", comparison: "Klay Thompson", stats: "17.8 PPG / 4.9 RPG / 4.4 APG" },
  { name: "Nate Ament", position: "SF", school: "Tennessee", age: 19, height: "6'10\"", rank: 8, netsFit: 88, ceiling: "Versatile Two-Way Wing", comparison: "Khris Middleton", stats: "16.9 PPG / 6.4 RPG / 2.3 APG" },
  { name: "Mikel Brown Jr.", position: "PG", school: "Louisville", age: 19, height: "6'5\"", rank: 9, netsFit: 72, ceiling: "Combo Guard Creator", comparison: "Tyrese Haliburton", stats: "18.2 PPG / 3.3 RPG / 4.7 APG" },
  { name: "Brayden Burries", position: "SG", school: "Arizona", age: 19, height: "6'5\"", rank: 10, netsFit: 76, ceiling: "3-and-D Scorer", comparison: "Devin Booker Lite", stats: "16.0 PPG / 5.0 RPG / 2.6 APG" },
];

// Scenario projections for Nets (currently 17-54, #3 in lottery standings)
export interface Scenario {
  description: string;
  resultPick: number;
  probability: string;
}

export const netsScenarios: Scenario[] = [
  { description: "Nets lose remaining games", resultPick: 2, probability: "If Nets go 0-11 (could pass IND)" },
  { description: "Current pace holds (#3 slot)", resultPick: 3, probability: "Most likely — top 3 odds (14%)" },
  { description: "Nets win 3+ more games", resultPick: 4, probability: "If Nets go 3-8 or better" },
  { description: "Win lottery (jump to #1)", resultPick: 1, probability: "14.0% chance" },
  { description: "Land top 4 pick", resultPick: 4, probability: "52.1% cumulative" },
];

// Poll questions
export interface PollQuestion {
  id: string;
  question: string;
  options: string[];
  category: string;
}

export const dailyPolls: PollQuestion[] = [
  { id: "top4", question: "Will the Nets land a top 4 pick?", options: ["Yes, lock it in!", "No, we'll drop to 5-7", "We're getting #1"], category: "Draft" },
  { id: "bestfit", question: "Who's the best fit for the Nets?", options: ["Cameron Boozer", "AJ Dybantsa", "Caleb Wilson", "Darryn Peterson"], category: "Draft" },
  { id: "tank", question: "Rate the Nets' tank job this season", options: ["Elite tank commander", "Decent but messy", "Complete disaster", "What tank? We're trying to win"], category: "Vibes" },
  { id: "rebuild", question: "How many years until Nets contend?", options: ["2-3 years", "4-5 years", "6+ years", "We'll never recover"], category: "Future" },
  { id: "trade", question: "Trade the pick for an established star?", options: ["Never! Keep the pick", "Only for a top 10 player", "Yes, fast-track the rebuild", "Depends who's available"], category: "Strategy" },
  { id: "needposition", question: "What position should the Nets draft?", options: ["Big man (Boozer/Wilson)", "Wing (Dybantsa/Ament)", "Best player available", "Trade down + get more picks"], category: "Strategy" },
];
