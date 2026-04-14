import AdminDashboard from "@/components/AdminDashboard";
import { getAllArticles, getCategories, getChangelog } from "@/lib/kb";
import fs from "fs";
import path from "path";

export const metadata = { title: "Admin — BK Grit" };
export const dynamic = "force-dynamic";

function countRawFiles(): { total: number; today: number; dirs: Record<string, number> } {
  const rawDir = path.join(process.cwd(), "kb", "raw");
  const today = new Date().toISOString().split("T")[0];
  const dirs: Record<string, number> = {};
  let total = 0;
  let todayCount = 0;

  try {
    for (const sub of fs.readdirSync(rawDir)) {
      const subDir = path.join(rawDir, sub);
      if (!fs.statSync(subDir).isDirectory()) continue;
      const files = fs.readdirSync(subDir).filter(f => f.endsWith(".md"));
      dirs[sub] = files.length;
      total += files.length;
      todayCount += files.filter(f => f.startsWith(today)).length;
    }
  } catch {}

  return { total, today: todayCount, dirs };
}

export default function AdminPage() {
  const articles = getAllArticles();
  const categories = getCategories();
  const changelog = getChangelog();
  const rawStats = countRawFiles();

  return (
    <AdminDashboard
      articleCount={articles.length}
      categories={categories}
      changelog={changelog}
      rawStats={rawStats}
      articles={articles.map(a => ({
        title: a.title,
        category: a.category,
        slug: a.slug,
        confidence: a.confidence,
        last_updated: a.last_updated,
        sources: a.sources,
      }))}
    />
  );
}
