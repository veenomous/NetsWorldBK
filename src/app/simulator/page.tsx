import type { Metadata } from "next";
import { Suspense } from "react";
import LotterySimulator from "@/components/LotterySimulator";

export const metadata: Metadata = {
  title: "Lottery Simulator — BK Grit",
  description: "Run the 2026 NBA Draft Lottery. See where the Brooklyn Nets land. Share your result on X.",
};

export default function SimulatorPage() {
  return (
    <Suspense>
      <LotterySimulator />
    </Suspense>
  );
}
