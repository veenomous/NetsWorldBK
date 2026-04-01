import TradeMachine from "@/components/TradeMachine";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trade Machine — BK Grit",
  description: "Build trades for the Brooklyn Nets. Real-time salary cap validation and strategic impact analysis.",
};

export default function TradeMachinePage() {
  return <TradeMachine />;
}
