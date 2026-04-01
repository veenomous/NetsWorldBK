import GMMode from "@/components/GMMode";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "War Room — BK Grit",
  description: "Draft Night Command Center. Build your mock draft, explore prospects, and manage Brooklyn's assets.",
};

export default function GMModePage() {
  return <GMMode />;
}
