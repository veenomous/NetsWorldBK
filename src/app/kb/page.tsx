import KBDashboard from "@/components/KBDashboard";
import { getAllArticles, getCategories, getChangelog } from "@/lib/kb";

export const metadata = {
  title: "Nets Wiki — BK Grit",
  description:
    "The Brooklyn Nets rebuild war room. Trade trees, pick inventory, player profiles, and front office strategy — all connected.",
};

export default function KBPage() {
  const articles = getAllArticles();
  const categories = getCategories();
  const changelog = getChangelog();

  // Serialize for client component
  const serializedArticles = articles.map((a) => ({
    title: a.title,
    category: a.category,
    slug: a.slug,
    confidence: a.confidence,
    last_updated: a.last_updated,
    tags: a.tags,
  }));

  return (
    <KBDashboard
      articles={serializedArticles}
      categories={categories}
      changelog={changelog}
    />
  );
}
