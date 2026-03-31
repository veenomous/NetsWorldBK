import type { Metadata } from "next";
import GameRecaps from "@/components/GameRecaps";

export const metadata: Metadata = {
  title: "Game Recaps — BK Grit",
  description: "Fan-written Brooklyn Nets post-game recaps. MVP picks, game ratings, and community analysis.",
};

export default function RecapsPage() {
  return <GameRecaps />;
}
