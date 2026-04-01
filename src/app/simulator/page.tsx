import LotterySimulator from "@/components/LotterySimulator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lottery Simulator — BK Grit",
  description: "Run the 2026 NBA Draft Lottery. See where the Brooklyn Nets land. Share your result on X.",
};

export default function SimulatorPage() {
  return <LotterySimulator />;
}
