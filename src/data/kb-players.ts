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
    name: "Cameron Johnson",
    pos: "F",
    stat: "19.4 PPG",
    status: "Keep or trade?",
    statusColor: "tag-gold",
    href: "/kb/players/cameron-johnson",
  },
  {
    name: "Cam Thomas",
    pos: "G",
    stat: "24.7 PPG",
    status: "The question mark",
    statusColor: "tag-orange",
    href: "/kb/seasons/2024-25-season",
  },
  {
    name: "Noah Clowney",
    pos: "F",
    stat: "8.2 RPG",
    status: "Developing",
    statusColor: "tag-blue",
    href: "/kb/seasons/2024-25-season",
  },
  {
    name: "Jalen Wilson",
    pos: "F",
    stat: "1.2 STL",
    status: "Developing",
    statusColor: "tag-blue",
    href: "/kb/seasons/2024-25-season",
  },
];
