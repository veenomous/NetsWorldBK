// 2024-25 NBA Standings data (updated regularly)
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

// Current standings as of late March 2025 (bottom 14 teams for lottery)
export const lotteryTeams: TeamStanding[] = [
  { team: "Washington Wizards", abbrev: "WAS", wins: 15, losses: 57, gamesRemaining: 10, currentPick: 1, conference: "East" },
  { team: "New Orleans Pelicans", abbrev: "NOP", wins: 18, losses: 53, gamesRemaining: 11, currentPick: 2, conference: "West" },
  { team: "Charlotte Hornets", abbrev: "CHA", wins: 19, losses: 51, gamesRemaining: 12, currentPick: 3, conference: "East" },
  { team: "Philadelphia 76ers", abbrev: "PHI", wins: 20, losses: 50, gamesRemaining: 12, currentPick: 4, conference: "East" },
  { team: "Utah Jazz", abbrev: "UTA", wins: 21, losses: 50, gamesRemaining: 11, currentPick: 5, conference: "West" },
  { team: "Brooklyn Nets", abbrev: "BKN", wins: 22, losses: 49, gamesRemaining: 11, currentPick: 6, conference: "East" },
  { team: "Portland Trail Blazers", abbrev: "POR", wins: 23, losses: 48, gamesRemaining: 11, currentPick: 7, conference: "West" },
  { team: "Toronto Raptors", abbrev: "TOR", wins: 23, losses: 48, gamesRemaining: 11, currentPick: 8, conference: "East" },
  { team: "San Antonio Spurs", abbrev: "SAS", wins: 25, losses: 46, gamesRemaining: 11, currentPick: 9, conference: "West" },
  { team: "Chicago Bulls", abbrev: "CHI", wins: 26, losses: 45, gamesRemaining: 11, currentPick: 10, conference: "East" },
  { team: "Sacramento Kings", abbrev: "SAC", wins: 27, losses: 44, gamesRemaining: 11, currentPick: 11, conference: "West" },
  { team: "Miami Heat", abbrev: "MIA", wins: 28, losses: 42, gamesRemaining: 12, currentPick: 12, conference: "East" },
  { team: "Atlanta Hawks", abbrev: "ATL", wins: 30, losses: 41, gamesRemaining: 11, currentPick: 13, conference: "East" },
  { team: "Indiana Pacers", abbrev: "IND", wins: 31, losses: 39, gamesRemaining: 12, currentPick: 14, conference: "East" },
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
  7:  [7.5,  7.8,  8.1,  8.4],
  8:  [6.0,  6.3,  6.7,  7.1],
  9:  [4.5,  4.8,  5.2,  5.7],
  10: [3.0,  3.3,  3.6,  4.0],
  11: [2.0,  2.2,  2.4,  2.8],
  12: [1.5,  1.6,  1.8,  2.1],
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

// Draft prospect data
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

export const topProspects: DraftProspect[] = [
  { name: "Cooper Flagg", position: "SF/PF", school: "Duke", age: 18, height: "6'9\"", rank: 1, netsFit: 95, ceiling: "Franchise Cornerstone", comparison: "Jayson Tatum", stats: "18.2 PPG / 8.5 RPG / 3.8 APG" },
  { name: "Dylan Harper", position: "SG/PG", school: "Rutgers", age: 19, height: "6'6\"", rank: 2, netsFit: 88, ceiling: "All-Star Guard", comparison: "Dwyane Wade", stats: "22.3 PPG / 5.4 RPG / 4.1 APG" },
  { name: "Ace Bailey", position: "SF/SG", school: "Rutgers", age: 19, height: "6'8\"", rank: 3, netsFit: 85, ceiling: "Elite Two-Way Wing", comparison: "Paul George", stats: "19.1 PPG / 7.2 RPG / 1.8 APG" },
  { name: "VJ Edgecombe", position: "SG", school: "Baylor", age: 19, height: "6'5\"", rank: 4, netsFit: 82, ceiling: "Dynamic Scorer", comparison: "Jalen Green", stats: "17.8 PPG / 4.2 RPG / 3.5 APG" },
  { name: "Kon Knueppel", position: "SG/SF", school: "Duke", age: 20, height: "6'7\"", rank: 5, netsFit: 78, ceiling: "Sharpshooter Wing", comparison: "Klay Thompson", stats: "15.3 PPG / 4.8 RPG / 2.9 APG" },
  { name: "Kasparas Jakucionis", position: "PG", school: "Illinois", age: 19, height: "6'6\"", rank: 6, netsFit: 80, ceiling: "Floor General", comparison: "Luka Doncic Lite", stats: "14.7 PPG / 5.1 RPG / 5.8 APG" },
  { name: "Nolan Traore", position: "PG", school: "France", age: 18, height: "6'5\"", rank: 7, netsFit: 72, ceiling: "Athletic Playmaker", comparison: "De'Aaron Fox", stats: "12.4 PPG / 3.2 RPG / 6.1 APG" },
  { name: "Egor Demin", position: "PG/SG", school: "Russia", age: 18, height: "6'8\"", rank: 8, netsFit: 75, ceiling: "Versatile Creator", comparison: "Shai Gilgeous-Alexander", stats: "11.8 PPG / 3.6 RPG / 4.9 APG" },
  { name: "Jalil Bethea", position: "SG", school: "Miami", age: 19, height: "6'5\"", rank: 9, netsFit: 70, ceiling: "Shot Creator", comparison: "Bradley Beal", stats: "16.2 PPG / 3.8 RPG / 2.4 APG" },
  { name: "Tre Johnson", position: "SG", school: "Texas", age: 19, height: "6'5\"", rank: 10, netsFit: 68, ceiling: "Bucket Getter", comparison: "Devin Booker", stats: "18.9 PPG / 3.1 RPG / 2.7 APG" },
];

// Scenario projections
export interface Scenario {
  description: string;
  resultPick: number;
  probability: string;
}

export const netsScenarios: Scenario[] = [
  { description: "Nets lose remaining games", resultPick: 5, probability: "If Nets go 0-11" },
  { description: "Current pace holds", resultPick: 6, probability: "Most likely outcome" },
  { description: "Nets win 3+ more games", resultPick: 7, probability: "If Nets go 3-8 or better" },
  { description: "Win lottery (jump to #1)", resultPick: 1, probability: "9.0% chance" },
  { description: "Land top 4 pick", resultPick: 4, probability: "37.2% cumulative" },
];

// Poll questions
export interface PollQuestion {
  id: string;
  question: string;
  options: string[];
  category: string;
}

export const dailyPolls: PollQuestion[] = [
  { id: "top4", question: "Will the Nets land a top 4 pick?", options: ["Yes, lock it in!", "No, we'll fall to 5-7", "We're jumping to #1"], category: "Draft" },
  { id: "bestfit", question: "Who's the best fit for the Nets?", options: ["Cooper Flagg", "Dylan Harper", "Ace Bailey", "Kasparas Jakucionis"], category: "Draft" },
  { id: "tank", question: "Rate the Nets' tank job this season", options: ["Elite tank commander", "Decent but messy", "Complete disaster", "What tank? We're trying to win"], category: "Vibes" },
  { id: "rebuild", question: "How many years until Nets contend?", options: ["2-3 years", "4-5 years", "6+ years", "We'll never recover"], category: "Future" },
  { id: "trade", question: "Trade the pick for an established star?", options: ["Never! Keep the pick", "Only for a top 10 player", "Yes, fast-track the rebuild", "Depends who's available"], category: "Strategy" },
  { id: "camthomas", question: "Is Cam Thomas part of the future?", options: ["Absolutely, he's the guy", "Good piece, not the centerpiece", "Trade him while value is high", "Undecided"], category: "Roster" },
];
