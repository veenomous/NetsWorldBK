import type { Metadata } from "next";
import AntiTankingProposals from "@/components/AntiTankingProposals";

export const metadata: Metadata = {
  title: "Anti-Tanking Proposals — BK Grit",
  description: "How the NBA's proposed lottery changes would affect the Brooklyn Nets. Compare the 18-Team, 22-Team, and Double Lottery proposals with live standings data.",
};

export default function AntiTankingPage() {
  return <AntiTankingProposals />;
}
