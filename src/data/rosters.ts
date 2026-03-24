// NBA Roster & Salary Data for Trade Machine
// Salaries from HoopsHype/Spotrac for 2025-26 season
// Nets roster is complete; other teams include key tradeable players

export interface NBAPlayer {
  name: string;
  team: string;
  position: string;
  salary: number;
  age: number;
  stats: string;
}

export interface NBATeam {
  name: string;
  abbrev: string;
  conference: string;
  players: NBAPlayer[];
}

// Full Nets roster (post-trade deadline, no Cam Thomas/Cam Johnson/Highsmith)
const BKN: NBATeam = {
  name: "Brooklyn Nets", abbrev: "BKN", conference: "East",
  players: [
    { name: "Michael Porter Jr.", team: "BKN", position: "SF", salary: 38333050, age: 27, stats: "24.2 PPG / 7.1 RPG" },
    { name: "Nic Claxton", team: "BKN", position: "C", salary: 25352272, age: 26, stats: "11.8 PPG / 7.1 RPG" },
    { name: "Terance Mann", team: "BKN", position: "SG", salary: 15500000, age: 29, stats: "7.3 PPG / 3.2 RPG" },
    { name: "Egor Demin", team: "BKN", position: "PG", salary: 6889200, age: 19, stats: "10.3 PPG / 3.3 APG" },
    { name: "Ochai Agbaji", team: "BKN", position: "SG", salary: 6383525, age: 25, stats: "6.6 PPG / 2.3 RPG" },
    { name: "Day'Ron Sharpe", team: "BKN", position: "C", salary: 6250000, age: 24, stats: "8.7 PPG / 6.7 RPG" },
    { name: "Ziaire Williams", team: "BKN", position: "SF", salary: 6250000, age: 24, stats: "9.9 PPG / 2.4 RPG" },
    { name: "Nolan Traore", team: "BKN", position: "PG", salary: 3811560, age: 19, stats: "8.5 PPG / 3.7 APG" },
    { name: "Noah Clowney", team: "BKN", position: "PF", salary: 3398406, age: 21, stats: "12.5 PPG / 4.1 RPG" },
    { name: "Drake Powell", team: "BKN", position: "SG", salary: 3372240, age: 20, stats: "6.0 PPG / 1.7 RPG" },
    { name: "Ben Saraf", team: "BKN", position: "SG", salary: 2884560, age: 19, stats: "6.3 PPG / 3.1 APG" },
    { name: "Danny Wolf", team: "BKN", position: "PF", salary: 2801280, age: 21, stats: "8.9 PPG / 4.9 RPG" },
    { name: "Josh Minott", team: "BKN", position: "SF", salary: 2378870, age: 23, stats: "9.2 PPG / 2.1 RPG" },
    { name: "Jalen Wilson", team: "BKN", position: "PF", salary: 2221677, age: 25, stats: "5.4 PPG / 1.6 RPG" },
  ],
};

// Other teams — key tradeable players
const otherTeams: NBATeam[] = [
  { name: "Los Angeles Lakers", abbrev: "LAL", conference: "West", players: [
    { name: "LeBron James", team: "LAL", position: "SF", salary: 52627153, age: 41, stats: "23.5 PPG / 7.8 RPG" },
    { name: "Luka Doncic", team: "LAL", position: "PG", salary: 45999660, age: 27, stats: "28.1 PPG / 8.3 RPG" },
    { name: "Austin Reaves", team: "LAL", position: "SG", salary: 16120000, age: 27, stats: "18.2 PPG / 5.1 APG" },
    { name: "Rui Hachimura", team: "LAL", position: "PF", salary: 17000000, age: 27, stats: "13.4 PPG / 4.8 RPG" },
  ]},
  { name: "Golden State Warriors", abbrev: "GSW", conference: "West", players: [
    { name: "Stephen Curry", team: "GSW", position: "PG", salary: 59606817, age: 38, stats: "22.1 PPG / 6.2 APG" },
    { name: "Jimmy Butler", team: "GSW", position: "SF", salary: 54126450, age: 36, stats: "17.8 PPG / 5.5 RPG" },
    { name: "Andrew Wiggins", team: "GSW", position: "SF", salary: 26289608, age: 30, stats: "14.3 PPG / 4.5 RPG" },
    { name: "Jonathan Kuminga", team: "GSW", position: "PF", salary: 8000000, age: 23, stats: "16.8 PPG / 5.2 RPG" },
  ]},
  { name: "Boston Celtics", abbrev: "BOS", conference: "East", players: [
    { name: "Jayson Tatum", team: "BOS", position: "SF", salary: 54126450, age: 28, stats: "27.4 PPG / 8.1 RPG" },
    { name: "Jaylen Brown", team: "BOS", position: "SG", salary: 53142264, age: 29, stats: "24.2 PPG / 5.9 RPG" },
    { name: "Derrick White", team: "BOS", position: "PG", salary: 20250000, age: 31, stats: "15.2 PPG / 4.8 APG" },
    { name: "Robert Williams", team: "BOS", position: "C", salary: 12415862, age: 28, stats: "8.1 PPG / 7.4 RPG" },
  ]},
  { name: "New York Knicks", abbrev: "NYK", conference: "East", players: [
    { name: "Karl-Anthony Towns", team: "NYK", position: "C", salary: 53142264, age: 30, stats: "25.1 PPG / 13.4 RPG" },
    { name: "OG Anunoby", team: "NYK", position: "SF", salary: 39568966, age: 28, stats: "16.8 PPG / 5.0 RPG" },
    { name: "Jalen Brunson", team: "NYK", position: "PG", salary: 34944001, age: 29, stats: "26.3 PPG / 7.5 APG" },
    { name: "Mikal Bridges", team: "NYK", position: "SF", salary: 27000000, age: 29, stats: "17.2 PPG / 3.5 RPG" },
  ]},
  { name: "Houston Rockets", abbrev: "HOU", conference: "West", players: [
    { name: "Kevin Durant", team: "HOU", position: "SF", salary: 53282608, age: 37, stats: "25.8 PPG / 6.5 RPG" },
    { name: "Alperen Sengun", team: "HOU", position: "C", salary: 33944954, age: 23, stats: "19.2 PPG / 9.8 RPG" },
    { name: "Jalen Green", team: "HOU", position: "SG", salary: 33584499, age: 23, stats: "21.1 PPG / 3.8 RPG" },
    { name: "Amen Thompson", team: "HOU", position: "SF", salary: 8872920, age: 22, stats: "14.5 PPG / 7.2 RPG" },
  ]},
  { name: "Dallas Mavericks", abbrev: "DAL", conference: "West", players: [
    { name: "Anthony Davis", team: "DAL", position: "PF", salary: 54126450, age: 33, stats: "24.1 PPG / 12.3 RPG" },
    { name: "Kyrie Irving", team: "DAL", position: "PG", salary: 36566002, age: 34, stats: "22.8 PPG / 5.1 APG" },
    { name: "Klay Thompson", team: "DAL", position: "SG", salary: 16000000, age: 36, stats: "12.4 PPG / 3.1 RPG" },
    { name: "Dereck Lively", team: "DAL", position: "C", salary: 5989800, age: 21, stats: "10.5 PPG / 8.1 RPG" },
  ]},
  { name: "San Antonio Spurs", abbrev: "SAS", conference: "West", players: [
    { name: "De'Aaron Fox", team: "SAS", position: "PG", salary: 37096620, age: 28, stats: "25.2 PPG / 6.8 APG" },
    { name: "Victor Wembanyama", team: "SAS", position: "C", salary: 14068200, age: 21, stats: "24.4 PPG / 10.5 RPG" },
    { name: "Jeremy Sochan", team: "SAS", position: "PF", salary: 6860520, age: 22, stats: "12.1 PPG / 6.8 RPG" },
    { name: "Stephon Castle", team: "SAS", position: "PG", salary: 7964400, age: 20, stats: "11.8 PPG / 3.9 APG" },
  ]},
  { name: "Oklahoma City Thunder", abbrev: "OKC", conference: "West", players: [
    { name: "Shai Gilgeous-Alexander", team: "OKC", position: "PG", salary: 38333050, age: 27, stats: "31.2 PPG / 5.5 RPG" },
    { name: "Chet Holmgren", team: "OKC", position: "PF", salary: 12165480, age: 23, stats: "16.8 PPG / 9.1 RPG" },
    { name: "Jalen Williams", team: "OKC", position: "SG", salary: 5293080, age: 24, stats: "20.5 PPG / 5.8 RPG" },
    { name: "Lu Dort", team: "OKC", position: "SG", salary: 16000000, age: 26, stats: "11.4 PPG / 4.1 RPG" },
  ]},
  { name: "Cleveland Cavaliers", abbrev: "CLE", conference: "East", players: [
    { name: "Donovan Mitchell", team: "CLE", position: "SG", salary: 46394100, age: 29, stats: "24.8 PPG / 4.5 APG" },
    { name: "Evan Mobley", team: "CLE", position: "PF", salary: 46394100, age: 24, stats: "18.2 PPG / 9.4 RPG" },
    { name: "Darius Garland", team: "CLE", position: "PG", salary: 39446090, age: 26, stats: "21.3 PPG / 6.8 APG" },
    { name: "Jarrett Allen", team: "CLE", position: "C", salary: 22000000, age: 28, stats: "14.1 PPG / 10.8 RPG" },
  ]},
  { name: "Phoenix Suns", abbrev: "PHX", conference: "West", players: [
    { name: "Devin Booker", team: "PHX", position: "SG", salary: 53142264, age: 29, stats: "26.4 PPG / 4.8 APG" },
    { name: "Bradley Beal", team: "PHX", position: "SG", salary: 30000000, age: 32, stats: "16.1 PPG / 4.2 APG" },
    { name: "Jalen Green", team: "PHX", position: "SG", salary: 33584499, age: 23, stats: "21.1 PPG / 3.8 RPG" },
  ]},
  { name: "Miami Heat", abbrev: "MIA", conference: "East", players: [
    { name: "Bam Adebayo", team: "MIA", position: "C", salary: 37096620, age: 28, stats: "19.8 PPG / 10.4 RPG" },
    { name: "Tyler Herro", team: "MIA", position: "SG", salary: 28000000, age: 26, stats: "23.4 PPG / 5.2 APG" },
    { name: "Terry Rozier", team: "MIA", position: "PG", salary: 24800000, age: 32, stats: "14.2 PPG / 4.8 APG" },
  ]},
  { name: "Philadelphia 76ers", abbrev: "PHI", conference: "East", players: [
    { name: "Joel Embiid", team: "PHI", position: "C", salary: 55224526, age: 32, stats: "27.1 PPG / 11.0 RPG" },
    { name: "Paul George", team: "PHI", position: "SF", salary: 51666090, age: 35, stats: "18.5 PPG / 5.8 RPG" },
    { name: "Tyrese Maxey", team: "PHI", position: "PG", salary: 37958760, age: 25, stats: "26.7 PPG / 6.2 APG" },
  ]},
  { name: "Chicago Bulls", abbrev: "CHI", conference: "East", players: [
    { name: "Coby White", team: "CHI", position: "PG", salary: 18000000, age: 25, stats: "18.1 PPG / 5.8 APG" },
    { name: "Nikola Vucevic", team: "CHI", position: "C", salary: 20000000, age: 35, stats: "17.8 PPG / 10.2 RPG" },
    { name: "Josh Giddey", team: "CHI", position: "PG", salary: 8500000, age: 23, stats: "14.2 PPG / 6.5 APG" },
  ]},
  { name: "Toronto Raptors", abbrev: "TOR", conference: "East", players: [
    { name: "Scottie Barnes", team: "TOR", position: "PF", salary: 38661750, age: 24, stats: "21.4 PPG / 8.2 RPG" },
    { name: "Brandon Ingram", team: "TOR", position: "SF", salary: 38095238, age: 28, stats: "22.1 PPG / 5.3 RPG" },
    { name: "Immanuel Quickley", team: "TOR", position: "PG", salary: 32500000, age: 26, stats: "18.6 PPG / 6.1 APG" },
  ]},
  { name: "Milwaukee Bucks", abbrev: "MIL", conference: "East", players: [
    { name: "Giannis Antetokounmpo", team: "MIL", position: "PF", salary: 54126450, age: 31, stats: "30.2 PPG / 11.8 RPG" },
    { name: "Khris Middleton", team: "MIL", position: "SF", salary: 33296296, age: 34, stats: "14.1 PPG / 4.5 RPG" },
    { name: "Brook Lopez", team: "MIL", position: "C", salary: 23000000, age: 38, stats: "11.4 PPG / 5.2 RPG" },
  ]},
];

export const allTeams: NBATeam[] = [BKN, ...otherTeams];

export function getTeam(abbrev: string): NBATeam | undefined {
  return allTeams.find(t => t.abbrev === abbrev);
}

export function getNetsTeam(): NBATeam {
  return BKN;
}

export function getOtherTeams(): NBATeam[] {
  return otherTeams;
}

export function formatSalary(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
}
