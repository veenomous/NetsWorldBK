import KBDashboard from "@/components/KBDashboard";
import { getAllArticles, getCategories, getChangelog } from "@/lib/kb";
import { getRecentEpisodes, getTopHotMoments, getHotMicStats } from "@/lib/podcasts-server";
import { isThrowback } from "@/lib/podcasts";
import { netsPicks, totalFirstRoundPicks, totalSwaps } from "@/data/picks";

export const dynamic = "force-dynamic";

export default async function Home() {
  const articles = getAllArticles();
  const categories = getCategories();
  const changelog = getChangelog();

  let latestEpisode: {
    title: string;
    slug: string;
    show_slug: string;
    show_name: string;
    thumbnail_url: string | null;
    hot_moments_count: number;
  } | null = null;
  let featuredMoment: {
    quote: string;
    topic: string;
    fire_level: number;
    show_name: string;
    show_slug: string;
    episode_slug: string;
    timestamp_ms: number;
  } | null = null;
  let hotMicStats: { shows: number; episodes: number; hotMoments: number } | null = null;

  try {
    const [eps, moments, stats] = await Promise.all([
      getRecentEpisodes(10),
      getTopHotMoments(1),
      getHotMicStats(),
    ]);
    const latest = eps.find((e) => e.podcasts && !isThrowback(e.created_at, e.published_at));
    if (latest && latest.podcasts) {
      latestEpisode = {
        title: latest.title,
        slug: latest.slug,
        show_slug: latest.podcasts.slug,
        show_name: latest.podcasts.name,
        thumbnail_url: latest.thumbnail_url,
        hot_moments_count: Array.isArray(latest.hot_moments) ? latest.hot_moments.length : 0,
      };
    }
    if (moments[0]) {
      featuredMoment = {
        quote: moments[0].quote,
        topic: moments[0].topic,
        fire_level: moments[0].fire_level,
        show_name: moments[0].show_name,
        show_slug: moments[0].show_slug,
        episode_slug: moments[0].episode_slug,
        timestamp_ms: moments[0].timestamp_ms,
      };
    }
    hotMicStats = { shows: stats.shows, episodes: stats.episodes, hotMoments: stats.hotMoments };
  } catch {
    // Silently fall back — sections using these hide their columns/blocks
  }

  const totalPicks = totalFirstRoundPicks + totalSwaps;
  const lastPickYear = netsPicks.length ? netsPicks[netsPicks.length - 1].year : 2032;

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
      latestEpisode={latestEpisode}
      featuredMoment={featuredMoment}
      stats={{
        articles: articles.length,
        picks: totalPicks,
        lastPickYear,
        shows: hotMicStats?.shows ?? 0,
        episodes: hotMicStats?.episodes ?? 0,
        hotMoments: hotMicStats?.hotMoments ?? 0,
      }}
    />
  );
}
