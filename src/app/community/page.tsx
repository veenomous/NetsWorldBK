import type { Metadata } from "next";
import CommunityFeed from "@/components/CommunityFeed";

export const metadata: Metadata = {
  title: "Community — BK Grit",
  description: "Fan takes, game recaps, draft analysis, and trade talk from the Brooklyn Nets community.",
};

export default function CommunityPage() {
  return <CommunityFeed />;
}
