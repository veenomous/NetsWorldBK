import type { Metadata } from "next";
import TiebreakerScenarios from "@/components/TiebreakerScenarios";

export const metadata: Metadata = {
  title: "Tiebreaker Scenarios — BK Grit",
  description: "Interactive breakdown of NBA draft lottery tiebreaker scenarios for the Brooklyn Nets. See how wins/losses affect draft position and odds.",
};

export default function TiebreakerPage() {
  return <TiebreakerScenarios />;
}
