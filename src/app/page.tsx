import KBDashboard from "@/components/KBDashboard";
import { getAllArticles, getCategories, getChangelog } from "@/lib/kb";

export default function Home() {
  const articles = getAllArticles();
  const categories = getCategories();
  const changelog = getChangelog();

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
