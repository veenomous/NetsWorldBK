export interface KBPlayer {
  name: string;
  pos: string;
  stat: string;
  status: string;
  statusColor: string;
  href: string;
}

export const kbPlayers: KBPlayer[] = [
  {
    name: "Michael Porter Jr.",
    pos: "F",
    stat: "24.2 PPG",
    status: "Veteran anchor",
    statusColor: "tag-red",
    href: "/kb/players/michael-porter-jr",
  },
  {
    name: "Egor Demin",
    pos: "G",
    stat: "10.3 PPG",
    status: "Franchise bet",
    statusColor: "tag-orange",
    href: "/kb/draft/2025-nba-draft",
  },
  {
    name: "Nolan Traore",
    pos: "G",
    stat: "8.5 PPG",
    status: "Explosive rookie",
    statusColor: "tag-blue",
    href: "/kb/draft/2025-nba-draft",
  },
  {
    name: "Noah Clowney",
    pos: "F",
    stat: "12.5 PPG",
    status: "Year 2 leap",
    statusColor: "tag-green",
    href: "/kb/seasons/2025-26-season",
  },
  {
    name: "Danny Wolf",
    pos: "F",
    stat: "8.9 PPG",
    status: "Modern big",
    statusColor: "tag-blue",
    href: "/kb/draft/2025-nba-draft",
  },
  {
    name: "Nic Claxton",
    pos: "C",
    stat: "11.8 PPG",
    status: "Interior anchor",
    statusColor: "tag-gold",
    href: "/kb/seasons/2025-26-season",
  },
];
